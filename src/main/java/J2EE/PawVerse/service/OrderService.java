package J2EE.PawVerse.service;

import J2EE.PawVerse.dto.order.*;
import J2EE.PawVerse.entity.*;
import J2EE.PawVerse.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final VoucherRepository voucherRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductService productService;
    private final EmailService emailService;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;
    
    @Transactional
    public OrderDTO createOrder(Long userId, CreateOrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        
        Cart cart = cartRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Giỏ hàng trống"));
        
        List<CartItem> cartItems = cartItemRepository.findByCart(cart);
        if (cartItems.isEmpty()) {
            throw new RuntimeException("Giỏ hàng trống");
        }
        
        // Validate stock
        for (CartItem item : cartItems) {
            Product product = item.getProduct();
            if (!product.getIsEnabled()) {
                throw new RuntimeException("Sản phẩm " + product.getTenProduct() + " không còn bán");
            }
            if (product.getSoLuongTonKho() < item.getSoLuong()) {
                throw new RuntimeException("Sản phẩm " + product.getTenProduct() + " không đủ hàng");
            }
        }
        
        // Calculate total
        BigDecimal totalAmount = cartItems.stream()
                .map(item -> {
                    BigDecimal price = item.getProduct().getGiaKhuyenMai() != null 
                            ? item.getProduct().getGiaKhuyenMai() 
                            : item.getProduct().getGiaBan();
                    return price.multiply(BigDecimal.valueOf(item.getSoLuong()));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal shippingFee = calculateShippingFee(request.getLatitude(), request.getLongitude(), request.getShippingCity());
        BigDecimal discountAmount = BigDecimal.ZERO;
        Voucher voucher = null;
        
        // Apply voucher if provided
        if (request.getVoucherCode() != null && !request.getVoucherCode().trim().isEmpty()) {
            voucher = voucherRepository.findByCodeAndIsActiveTrue(request.getVoucherCode())
                    .orElseThrow(() -> new RuntimeException("Mã giảm giá không hợp lệ"));
            
            java.time.LocalDate today = java.time.LocalDate.now();
            if (voucher.getNgayBatDau().isAfter(today) || 
                voucher.getNgayKetThuc().isBefore(today)) {
                throw new RuntimeException("Mã giảm giá đã hết hạn");
            }
            
            if (voucher.getUsedCount() >= voucher.getMaxUsage()) {
                throw new RuntimeException("Mã giảm giá đã hết lượt sử dụng");
            }
            
            if (totalAmount.compareTo(voucher.getMinOrderAmount()) < 0) {
                throw new RuntimeException("Đơn hàng chưa đủ giá trị tối thiểu để áp dụng voucher");
            }
            
            // Calculate discount
            if (voucher.getVoucherType() == J2EE.PawVerse.entity.Voucher.VoucherType.PERCENTAGE) {
                discountAmount = totalAmount.multiply(BigDecimal.valueOf(voucher.getDiscountPercentage())).divide(BigDecimal.valueOf(100));
                if (voucher.getMaxDiscountAmount() != null && discountAmount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                    discountAmount = voucher.getMaxDiscountAmount();
                }
            } else if (voucher.getVoucherType() == J2EE.PawVerse.entity.Voucher.VoucherType.FIXED_AMOUNT) {
                discountAmount = voucher.getDiscountValue();
            }
        }
        
        BigDecimal finalAmount = totalAmount.add(shippingFee).subtract(discountAmount);
        
        // Create order
        String orderNumber = "ORD" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        Order order = Order.builder()
                .maOrder(orderNumber)
                .user(user)
                .tenKhachHang(request.getFullName())
                .hoTen(request.getFullName())
                .email(request.getEmail())
                .soDienThoai(request.getPhone())
                .diaChiGiaoHang(request.getShippingAddress())
                .phuongXa(request.getShippingWard())
                .quanHuyen(request.getShippingDistrict())
                .tinhThanhPho(request.getShippingCity())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .trangThaiOrder("PENDING")
                .phuongThucThanhToan(request.getPaymentMethod())
                .trangThaiThanhToan("UNPAID")
                .tongTienSanPham(totalAmount)
                .tongTien(totalAmount)
                .phiVanChuyen(shippingFee)
                .tienGiamGia(discountAmount)
                .tongTienCuoiCung(finalAmount)
                .ghiChu(request.getNote())
                .voucher(voucher)
                .ngayDatHang(LocalDateTime.now())
                .ngayGiaoHangDuKien(LocalDateTime.now().plusDays(3))
                .build();
        
        order = orderRepository.save(order);
        
        // Create order items and update stock
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            BigDecimal price = product.getGiaKhuyenMai() != null 
                    ? product.getGiaKhuyenMai() 
                    : product.getGiaBan();
            
            // Get product thumbnail image
            List<ProductImage> images = productImageRepository
                    .findByProductIdProductOrderByDisplayOrderAsc(product.getIdProduct());
            ProductImage thumbnail = images.stream()
                    .filter(ProductImage::getIsThumbnail)
                    .findFirst()
                    .orElse(images.isEmpty() ? null : images.get(0));
            String imageUrl = thumbnail != null ? thumbnail.getImageUrl() : null;
            
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .tenProduct(product.getTenProduct())
                    .hinhAnh(imageUrl)
                    .soLuong(cartItem.getSoLuong())
                    .donGia(price)
                    .thanhTien(price.multiply(BigDecimal.valueOf(cartItem.getSoLuong())))
                    .build();
            
            orderItemRepository.save(orderItem);
            
            // Update product stock
            productService.updateProductStock(product.getIdProduct(), cartItem.getSoLuong());
        }
        
        // Update voucher usage
        if (voucher != null) {
            voucher.setUsedCount(voucher.getUsedCount() + 1);
            voucherRepository.save(voucher);
        }
        
        // Clear cart
        cartItemRepository.deleteByCart(cart);
        
        // Send order confirmation email (only for verified emails)
        try {
            if (user.getEmailVerified() && user.getEmail() != null && !user.getEmail().endsWith(".oauth")) {
                emailService.sendOrderConfirmation(
                    user.getEmail(),
                    order.getMaOrder(),
                    finalAmount.toBigInteger().toString() + " đ"
                );
            }
        } catch (Exception e) {
            // Don't fail order creation if email fails
        }
        
        return convertToDTO(order);
    }
    
    @Transactional(readOnly = true)
    public OrderDTO getOrderById(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        
        if (!order.getUser().getIdUser().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền xem đơn hàng này");
        }
        
        return convertToDTO(order);
    }
    
    @Transactional(readOnly = true)
    public OrderDTO getOrderByIdForAdmin(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        return convertToDTO(order);
    }
    
    @Transactional(readOnly = true)
    public Page<OrderDTO> getUserOrders(Long userId, String status, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        
        Page<Order> orders;
        if (status != null && !status.trim().isEmpty()) {
            orders = orderRepository.findByUserAndTrangThaiOrderOrderByNgayTaoDesc(user, status.toUpperCase(), pageable);
        } else {
            orders = orderRepository.findByUserOrderByNgayTaoDesc(user, pageable);
        }
        
        return orders.map(this::convertToDTO);
    }
    
    @Transactional(readOnly = true)
    public Page<OrderDTO> getAllOrders(String status, Pageable pageable) {
        Page<Order> orders;
        if (status != null && !status.trim().isEmpty()) {
            orders = orderRepository.findByTrangThaiOrderOrderByNgayDatHangDesc(status, pageable);
        } else {
            orders = orderRepository.findAllByOrderByNgayDatHangDesc(pageable);
        }
        return orders.map(this::convertToDTO);
    }
    
    private static final List<String> STATUS_FLOW = List.of("PENDING", "CONFIRMED", "SHIPPING", "DELIVERED");

    @Transactional
    public OrderDTO updateOrderStatus(Long orderId, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        
        String currentStatus = order.getTrangThaiOrder();
        String newStatus = request.getStatus();
        
        // Cannot change final statuses
        if ("DELIVERED".equals(currentStatus) || "CANCELLED".equals(currentStatus)) {
            throw new RuntimeException("Không thể thay đổi trạng thái đơn hàng đã hoàn thành hoặc đã hủy");
        }
        
        // Staff can cancel at any non-final status
        if (!"CANCELLED".equals(newStatus)) {
            // Prevent status downgrade
            int currentIdx = STATUS_FLOW.indexOf(currentStatus);
            int newIdx = STATUS_FLOW.indexOf(newStatus);
            if (newIdx <= currentIdx) {
                throw new RuntimeException("Không thể hạ trạng thái đơn hàng");
            }
        }
        
        order.setTrangThaiOrder(newStatus);
        
        if ("DELIVERED".equals(request.getStatus())) {
            order.setNgayGiaoHangThucTe(LocalDateTime.now());
            order.setTrangThaiThanhToan("PAID");
        } else if ("CANCELLED".equals(request.getStatus())) {
            // Restore stock (skip deleted products — product == null)
            List<OrderItem> items = orderItemRepository.findByOrder(order);
            for (OrderItem item : items) {
                Product product = item.getProduct();
                if (product != null) {
                    product.setSoLuongTonKho(product.getSoLuongTonKho() + item.getSoLuong());
                    product.setSoLuongDaBan(product.getSoLuongDaBan() - item.getSoLuong());
                    productRepository.save(product);
                }
            }
        }
        
        order = orderRepository.save(order);

        // Log activity
        try {
            activityLogService.logActivity(
                    order.getUser().getIdUser(),
                    ActivityLog.Action.UPDATE,
                    "Order",
                    order.getIdOrder(),
                    currentStatus,
                    newStatus
            );
        } catch (Exception ignored) {}

        // Create in-app notification for user
        try {
            String statusLabel = getStatusLabel(newStatus);
            notificationService.createNotification(
                    order.getUser().getIdUser(),
                    "Đơn hàng #" + order.getMaOrder() + " - " + statusLabel,
                    "Đơn hàng của bạn đã được cập nhật sang trạng thái: " + statusLabel,
                    Notification.NotificationType.ORDER_STATUS_UPDATE
            );
        } catch (Exception ignored) {}

        return convertToDTO(order);
    }
    
    @Transactional
    public void cancelOrder(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        
        if (!order.getUser().getIdUser().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền hủy đơn hàng này");
        }
        
        if (!"PENDING".equals(order.getTrangThaiOrder())) {
            throw new RuntimeException("Không thể hủy đơn hàng đang xử lý");
        }
        
        order.setTrangThaiOrder("CANCELLED");
        
        // Restore stock (skip deleted products — product == null)
        List<OrderItem> items = orderItemRepository.findByOrder(order);
        for (OrderItem item : items) {
            Product product = item.getProduct();
            if (product != null) {
                product.setSoLuongTonKho(product.getSoLuongTonKho() + item.getSoLuong());
                product.setSoLuongDaBan(product.getSoLuongDaBan() - item.getSoLuong());
                productRepository.save(product);
            }
        }
        
        orderRepository.save(order);
    }

    // Shop PawVerse coordinates: 10/80c Song Hành Xá Lộ Hà Nội, Tăng Nhơn Phú, Thủ Đức, HCM
    private static final double SHOP_LAT = 10.8231;
    private static final double SHOP_LNG = 106.7625;

    private BigDecimal calculateShippingFee(Double latitude, Double longitude, String city) {
        if (latitude != null && longitude != null) {
            double distance = haversineDistance(SHOP_LAT, SHOP_LNG, latitude, longitude);
            if (distance < 3.0) {
                return BigDecimal.ZERO;
            } else if (distance <= 8.0) {
                return BigDecimal.valueOf(20000);
            } else {
                return BigDecimal.valueOf(30000);
            }
        }
        if (city != null && (city.contains("Hồ Chí Minh") || city.contains("Hà Nội"))) {
            return BigDecimal.valueOf(30000);
        }
        return BigDecimal.valueOf(30000);
    }

    private double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    
    private OrderDTO convertToDTO(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrder(order);
        
        List<OrderItemDTO> itemDTOs = items.stream()
                .map(this::convertItemToDTO)
                .collect(Collectors.toList());
        
        return OrderDTO.builder()
                .orderId(order.getIdOrder())
                .orderNumber(order.getMaOrder())
                .userId(order.getUser().getIdUser())
                .customerName(order.getHoTen())
                .customerEmail(order.getEmail())
                .customerPhone(order.getSoDienThoai())
                .shippingAddress(order.getDiaChiGiaoHang())
                .shippingWard(order.getPhuongXa())
                .shippingDistrict(order.getQuanHuyen())
                .shippingCity(order.getTinhThanhPho())
                .orderStatus(order.getTrangThaiOrder())
                .paymentMethod(order.getPhuongThucThanhToan())
                .paymentStatus(order.getTrangThaiThanhToan())
                .totalAmount(order.getTongTien())
                .shippingFee(order.getPhiVanChuyen())
                .discountAmount(order.getTienGiamGia())
                .finalAmount(order.getTongTienCuoiCung())
                .voucherCode(order.getVoucher() != null ? order.getVoucher().getMaVoucher() : null)
                .orderNote(order.getGhiChu())
                .items(itemDTOs)
                .orderDate(order.getNgayDatHang())
                .estimatedDelivery(order.getNgayGiaoHangDuKien())
                .actualDelivery(order.getNgayGiaoHangThucTe())
                .build();
    }
    
    private OrderItemDTO convertItemToDTO(OrderItem item) {
        Product product = item.getProduct();
        
        // Product may be null if it was deleted — use snapshot fields from OrderItem
        Long productId = product != null ? product.getIdProduct() : null;
        String productName = product != null ? product.getTenProduct() : item.getTenProduct();
        String productImage = item.getHinhAnh();
        
        if (product != null) {
            List<ProductImage> images = productImageRepository
                    .findByProductIdProductOrderByDisplayOrderAsc(product.getIdProduct());
            ProductImage thumbnail = images.stream()
                    .filter(ProductImage::getIsThumbnail)
                    .findFirst()
                    .orElse(images.isEmpty() ? null : images.get(0));
            productImage = thumbnail != null ? thumbnail.getImageUrl() : item.getHinhAnh();
        }
        
        return OrderItemDTO.builder()
                .orderItemId(item.getIdOrderItem())
                .productId(productId)
                .productName(productName)
                .productImage(productImage)
                .price(item.getDonGia())
                .quantity(item.getSoLuong())
                .total(item.getThanhTien())
                .build();
    }

    private String getStatusLabel(String status) {
        return switch (status) {
            case "PENDING" -> "Chờ xác nhận";
            case "CONFIRMED" -> "Đã xác nhận";
            case "SHIPPING" -> "Đang giao hàng";
            case "DELIVERED" -> "Đã giao hàng";
            case "CANCELLED" -> "Đã hủy";
            default -> status;
        };
    }
}
