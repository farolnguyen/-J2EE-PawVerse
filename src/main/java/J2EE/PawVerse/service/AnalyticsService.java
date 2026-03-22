package J2EE.PawVerse.service;

import J2EE.PawVerse.dto.analytics.*;
import J2EE.PawVerse.entity.Category;
import J2EE.PawVerse.entity.Order;
import J2EE.PawVerse.entity.Product;
import J2EE.PawVerse.entity.ProductImage;
import J2EE.PawVerse.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {
    
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductImageRepository productImageRepository;
    
    @Transactional(readOnly = true)
    public DashboardStatsDTO getDashboardStats() {
        Long totalOrders = orderRepository.count();
        Long totalUsers = userRepository.count();
        Long totalProducts = productRepository.count();
        
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue();
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }
        
        Long pendingOrders = orderRepository.countByTrangThaiOrder("PENDING");
        Long processingOrders = orderRepository.countByTrangThaiOrder("PROCESSING");
        Long shippingOrders = orderRepository.countByTrangThaiOrder("SHIPPING");
        Long deliveredOrders = orderRepository.countByTrangThaiOrder("DELIVERED");
        Long cancelledOrders = orderRepository.countByTrangThaiOrder("CANCELLED");
        
        Long lowStockProducts = productRepository.countByStockLessThan(10);
        
        // Revenue last 7 days
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minusDays(6).toLocalDate().atStartOfDay();
        List<RevenueByPeriodDTO> revenueLast7Days = getRevenueLast7Days(start, end);
        
        // Top 5 selling products
        List<TopProductDTO> topProducts = getTopSellingProducts(5);
        
        // Category stats
        List<DashboardStatsDTO.CategoryStatsDTO> categoryStats = getCategoryStats();
        
        // Recent 5 orders
        List<DashboardStatsDTO.RecentOrderDTO> recentOrders = getRecentOrders(5);
        
        return DashboardStatsDTO.builder()
                .totalOrders(totalOrders)
                .totalUsers(totalUsers)
                .totalProducts(totalProducts)
                .totalRevenue(totalRevenue)
                .pendingOrders(pendingOrders)
                .processingOrders(processingOrders)
                .shippingOrders(shippingOrders)
                .deliveredOrders(deliveredOrders)
                .cancelledOrders(cancelledOrders)
                .lowStockProducts(lowStockProducts)
                .revenueLast7Days(revenueLast7Days)
                .topProducts(topProducts)
                .categoryStats(categoryStats)
                .recentOrders(recentOrders)
                .build();
    }
    
    private List<RevenueByPeriodDTO> getRevenueLast7Days(LocalDateTime start, LocalDateTime end) {
        List<Object[]> results = orderRepository.findRevenueByDay(start, end);
        
        // Build a map of existing data
        java.util.Map<String, RevenueByPeriodDTO> dataMap = new java.util.LinkedHashMap<>();
        for (Object[] r : results) {
            String period = r[0].toString();
            BigDecimal revenue = r[1] != null ? (BigDecimal) r[1] : BigDecimal.ZERO;
            Long count = ((Number) r[2]).longValue();
            dataMap.put(period, RevenueByPeriodDTO.builder().period(period).revenue(revenue).orderCount(count).build());
        }
        
        // Fill in missing days with 0
        List<RevenueByPeriodDTO> result = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        for (int i = 0; i < 7; i++) {
            String day = start.toLocalDate().plusDays(i).format(fmt);
            result.add(dataMap.getOrDefault(day,
                    RevenueByPeriodDTO.builder().period(day).revenue(BigDecimal.ZERO).orderCount(0L).build()));
        }
        return result;
    }
    
    private List<DashboardStatsDTO.CategoryStatsDTO> getCategoryStats() {
        List<Category> categories = categoryRepository.findAllActive();
        List<DashboardStatsDTO.CategoryStatsDTO> stats = new ArrayList<>();
        
        for (Category cat : categories) {
            long productCount = cat.getProducts() != null ? cat.getProducts().size() : 0;
            
            // Sum revenue from delivered order items for this category's products
            BigDecimal revenue = BigDecimal.ZERO;
            if (cat.getProducts() != null) {
                for (Product p : cat.getProducts()) {
                    // Approximate revenue = giaBan * soLuongDaBan
                    if (p.getGiaBan() != null && p.getSoLuongDaBan() != null && p.getSoLuongDaBan() > 0) {
                        revenue = revenue.add(p.getGiaBan().multiply(BigDecimal.valueOf(p.getSoLuongDaBan())));
                    }
                }
            }
            
            stats.add(DashboardStatsDTO.CategoryStatsDTO.builder()
                    .categoryId(cat.getIdCategory())
                    .categoryName(cat.getTenCategory())
                    .productCount(productCount)
                    .revenue(revenue)
                    .build());
        }
        
        return stats;
    }
    
    private List<DashboardStatsDTO.RecentOrderDTO> getRecentOrders(int limit) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        return orderRepository.findAllByOrderByNgayTaoDesc(PageRequest.of(0, limit))
                .getContent().stream()
                .map(o -> DashboardStatsDTO.RecentOrderDTO.builder()
                        .orderId(o.getIdOrder())
                        .orderNumber(o.getMaOrder())
                        .customerName(o.getHoTen() != null ? o.getHoTen() : o.getTenKhachHang())
                        .finalAmount(o.getTongTienCuoiCung() != null ? o.getTongTienCuoiCung() : o.getTongTien())
                        .orderStatus(o.getTrangThaiOrder() != null ? o.getTrangThaiOrder() : "PENDING")
                        .ngayTao(o.getNgayTao() != null ? o.getNgayTao().format(fmt) : "")
                        .build())
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<RevenueByPeriodDTO> getRevenueByPeriod(String period, LocalDateTime startDate, LocalDateTime endDate) {
        List<Object[]> results = switch (period.toUpperCase()) {
            case "DAY" -> orderRepository.findRevenueByDay(startDate, endDate);
            case "MONTH" -> orderRepository.findRevenueByMonth(startDate, endDate);
            case "YEAR" -> orderRepository.findRevenueByYear(startDate, endDate);
            default -> new ArrayList<>();
        };
        
        List<RevenueByPeriodDTO> revenueList = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        
        for (Object[] result : results) {
            String periodLabel = result[0].toString();
            BigDecimal revenue = (BigDecimal) result[1];
            Long orderCount = ((Number) result[2]).longValue();
            
            revenueList.add(RevenueByPeriodDTO.builder()
                    .period(periodLabel)
                    .revenue(revenue)
                    .orderCount(orderCount)
                    .build());
        }
        
        return revenueList;
    }
    
    @Transactional(readOnly = true)
    public List<TopProductDTO> getTopSellingProducts(int limit) {
        List<Object[]> results = orderItemRepository.findTopSellingProducts(PageRequest.of(0, limit));
        
        List<TopProductDTO> topProducts = new ArrayList<>();
        
        for (Object[] result : results) {
            Long productId = ((Number) result[0]).longValue();
            Long totalSold = ((Number) result[1]).longValue();
            BigDecimal revenue = (BigDecimal) result[2];
            
            Product product = productRepository.findById(productId).orElse(null);
            if (product != null) {
                List<ProductImage> images = productImageRepository
                        .findByProductIdProductOrderByDisplayOrderAsc(productId);
                ProductImage thumbnail = images.stream()
                        .filter(ProductImage::getIsThumbnail)
                        .findFirst()
                        .orElse(images.isEmpty() ? null : images.get(0));
                
                topProducts.add(TopProductDTO.builder()
                        .productId(productId)
                        .productName(product.getTenProduct())
                        .imageUrl(thumbnail != null ? thumbnail.getImageUrl() : null)
                        .totalSold(totalSold)
                        .revenue(revenue)
                        .build());
            }
        }
        
        return topProducts;
    }
}
