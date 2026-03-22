package J2EE.PawVerse.service;

import J2EE.PawVerse.dto.cart.*;
import J2EE.PawVerse.entity.*;
import J2EE.PawVerse.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {
    
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductImageRepository productImageRepository;
    
    @Transactional
    public CartDTO getCart(Long userId) {
        Cart cart = getOrCreateCart(userId);
        return convertToDTO(cart);
    }
    
    @Transactional
    public CartDTO addToCart(Long userId, AddToCartRequest request) {
        Cart cart = getOrCreateCart(userId);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
        
        if (!product.getIsEnabled()) {
            throw new RuntimeException("Sản phẩm không còn bán");
        }
        
        if (product.getSoLuongTonKho() < request.getQuantity()) {
            throw new RuntimeException("Không đủ hàng trong kho");
        }
        
        CartItem existingItem = cartItemRepository.findByCartAndProduct(cart, product);

        if (existingItem == null) {
            long distinctItems = cartItemRepository.findByCart(cart).size();
            if (distinctItems >= 30) {
                throw new RuntimeException("Giỏ hàng tối đa 30 sản phẩm khác nhau");
            }
        }

        if (existingItem != null) {
            int newQuantity = existingItem.getSoLuong() + request.getQuantity();
            if (product.getSoLuongTonKho() < newQuantity) {
                throw new RuntimeException("Không đủ hàng trong kho");
            }
            existingItem.setSoLuong(newQuantity);
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .soLuong(request.getQuantity())
                    .build();
            cartItemRepository.save(newItem);
        }
        
        return convertToDTO(cart);
    }
    
    @Transactional
    public CartDTO updateCartItem(Long userId, Long cartItemId, UpdateCartItemRequest request) {
        Cart cart = getOrCreateCart(userId);
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy item trong giỏ hàng"));
        
        if (!cartItem.getCart().getIdCart().equals(cart.getIdCart())) {
            throw new RuntimeException("Bạn không có quyền cập nhật item này");
        }
        
        Product product = cartItem.getProduct();
        if (product.getSoLuongTonKho() < request.getQuantity()) {
            throw new RuntimeException("Không đủ hàng trong kho");
        }
        
        cartItem.setSoLuong(request.getQuantity());
        cartItemRepository.save(cartItem);
        
        return convertToDTO(cart);
    }
    
    @Transactional
    public CartDTO removeCartItem(Long userId, Long cartItemId) {
        Cart cart = getOrCreateCart(userId);
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy item trong giỏ hàng"));
        
        if (!cartItem.getCart().getIdCart().equals(cart.getIdCart())) {
            throw new RuntimeException("Bạn không có quyền xóa item này");
        }
        
        cartItemRepository.delete(cartItem);
        return convertToDTO(cart);
    }
    
    @Transactional
    public void clearCart(Long userId) {
        Cart cart = getOrCreateCart(userId);
        cartItemRepository.deleteByCart(cart);
    }
    
    private Cart getOrCreateCart(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        
        return cartRepository.findByUser(user)
                .orElseGet(() -> {
                    Cart newCart = Cart.builder()
                            .user(user)
                            .build();
                    return cartRepository.save(newCart);
                });
    }
    
    private CartDTO convertToDTO(Cart cart) {
        List<CartItem> items = cartItemRepository.findByCart(cart);
        
        List<CartItemDTO> itemDTOs = items.stream()
                .map(this::convertItemToDTO)
                .collect(Collectors.toList());
        
        BigDecimal totalAmount = itemDTOs.stream()
                .map(CartItemDTO::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        int totalItems = itemDTOs.stream()
                .mapToInt(CartItemDTO::getQuantity)
                .sum();
        
        return CartDTO.builder()
                .cartId(cart.getIdCart())
                .userId(cart.getUser().getIdUser())
                .items(itemDTOs)
                .totalAmount(totalAmount)
                .totalItems(totalItems)
                .build();
    }
    
    private CartItemDTO convertItemToDTO(CartItem item) {
        Product product = item.getProduct();
        
        List<ProductImage> images = productImageRepository
                .findByProductIdProductOrderByDisplayOrderAsc(product.getIdProduct());
        ProductImage thumbnail = images.stream()
                .filter(ProductImage::getIsThumbnail)
                .findFirst()
                .orElse(images.isEmpty() ? null : images.get(0));
        
        BigDecimal price = product.getGiaKhuyenMai() != null 
                ? product.getGiaKhuyenMai() 
                : product.getGiaBan();
        
        BigDecimal subtotal = price.multiply(BigDecimal.valueOf(item.getSoLuong()));
        
        return CartItemDTO.builder()
                .cartItemId(item.getIdCartItem())
                .productId(product.getIdProduct())
                .productName(product.getTenProduct())
                .productImage(thumbnail != null ? thumbnail.getImageUrl() : null)
                .price(price)
                .quantity(item.getSoLuong())
                .subtotal(subtotal)
                .availableStock(product.getSoLuongTonKho())
                .build();
    }
}
