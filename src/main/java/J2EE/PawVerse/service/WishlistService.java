package J2EE.PawVerse.service;

import J2EE.PawVerse.dto.wishlist.*;
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
public class WishlistService {
    
    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductImageRepository productImageRepository;
    
    @Transactional
    public WishlistDTO addToWishlist(Long userId, AddToWishlistRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
        
        // Check if already in wishlist
        if (wishlistRepository.existsByUserAndProduct(user, product)) {
            throw new RuntimeException("Sản phẩm đã có trong danh sách yêu thích");
        }

        long currentCount = wishlistRepository.findByUserOrderByNgayTaoDesc(user).size();
        if (currentCount >= 50) {
            throw new RuntimeException("Danh sách yêu thích tối đa 50 sản phẩm");
        }
        
        Wishlist wishlist = Wishlist.builder()
                .user(user)
                .product(product)
                .build();
        
        wishlist = wishlistRepository.save(wishlist);
        return convertToDTO(wishlist);
    }
    
    @Transactional(readOnly = true)
    public List<WishlistDTO> getUserWishlist(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        
        List<Wishlist> wishlists = wishlistRepository.findByUserOrderByNgayTaoDesc(user);
        return wishlists.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public void removeFromWishlist(Long wishlistId, Long userId) {
        Wishlist wishlist = wishlistRepository.findById(wishlistId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy wishlist item"));
        
        if (!wishlist.getUser().getIdUser().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền xóa item này");
        }
        
        wishlistRepository.delete(wishlist);
    }
    
    @Transactional
    public void removeProductFromWishlist(Long userId, Long productId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
        
        Wishlist wishlist = wishlistRepository.findByUserAndProduct(user, product)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không có trong wishlist"));
        
        wishlistRepository.delete(wishlist);
    }
    
    @Transactional(readOnly = true)
    public boolean isInWishlist(Long userId, Long productId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
        
        return wishlistRepository.existsByUserAndProduct(user, product);
    }
    
    private WishlistDTO convertToDTO(Wishlist wishlist) {
        Product product = wishlist.getProduct();
        
        List<ProductImage> images = productImageRepository
                .findByProductIdProductOrderByDisplayOrderAsc(product.getIdProduct());
        ProductImage thumbnail = images.stream()
                .filter(ProductImage::getIsThumbnail)
                .findFirst()
                .orElse(images.isEmpty() ? null : images.get(0));
        
        BigDecimal price = product.getGiaBan();
        BigDecimal salePrice = product.getGiaKhuyenMai();
        
        return WishlistDTO.builder()
                .wishlistId(wishlist.getIdWishlist())
                .productId(product.getIdProduct())
                .productName(product.getTenProduct())
                .productImage(thumbnail != null ? thumbnail.getImageUrl() : null)
                .price(price)
                .salePrice(salePrice)
                .inStock(product.getSoLuongTonKho() > 0)
                .addedAt(wishlist.getNgayTao())
                .build();
    }
}
