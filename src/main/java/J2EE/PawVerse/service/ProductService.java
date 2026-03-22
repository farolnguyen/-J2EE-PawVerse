package J2EE.PawVerse.service;

import J2EE.PawVerse.dto.product.*;
import J2EE.PawVerse.entity.Brand;
import J2EE.PawVerse.entity.Category;
import J2EE.PawVerse.entity.Product;
import J2EE.PawVerse.entity.ProductImage;
import J2EE.PawVerse.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {
    
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final ProductImageRepository productImageRepository;
    private final ReviewRepository reviewRepository;
    private final WishlistRepository wishlistRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderItemRepository orderItemRepository;
    
    @Transactional(readOnly = true)
    public Page<ProductDTO> searchProductsForAdmin(ProductSearchRequest request) {
        Pageable pageable = PageRequest.of(
                request.getPage(),
                request.getSize(),
                Sort.by(Sort.Direction.fromString(request.getSortDirection()), request.getSortBy())
        );
        Page<Product> products = productRepository.searchAllProductsForAdmin(
                request.getKeyword(),
                request.getCategoryId(),
                request.getBrandId(),
                null,
                pageable
        );
        return products.map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<ProductDTO> searchProducts(ProductSearchRequest request) {
        Pageable pageable = PageRequest.of(
                request.getPage(),
                request.getSize(),
                Sort.by(Sort.Direction.fromString(request.getSortDirection()), request.getSortBy())
        );
        
        // Use combined filter method that applies all filters simultaneously
        Page<Product> products = productRepository.searchProductsWithFilters(
                request.getKeyword(),
                request.getCategoryId(),
                request.getBrandId(),
                request.getMinPrice(),
                request.getMaxPrice(),
                pageable
        );
        
        return products.map(this::convertToDTO);
    }
    
    @Transactional(readOnly = true)
    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + id));
        return convertToDTO(product);
    }
    
    @Transactional(readOnly = true)
    public List<ProductDTO> getFeaturedProducts() {
        return productRepository.findFeaturedProducts().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProductDTO> getTopSellingProducts(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return productRepository.findTopSellingProducts(pageable).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ProductDTO createProduct(ProductCreateRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy category"));
        
        Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy brand"));
        
        Product product = Product.builder()
                .tenProduct(request.getTenProduct())
                .moTa(request.getMoTa())
                .giaBan(request.getGiaBan())
                .giaGoc(request.getGiaGoc())
                .soLuongTonKho(request.getSoLuongTonKho())
                .soLuongDaBan(0)
                .soLanXem(0)
                .avgRating(0.0)
                .totalReviews(0)
                .isEnabled(true)
                .isFeatured(request.getIsFeatured())
                .category(category)
                .brand(brand)
                .build();
        
        product = productRepository.save(product);
        
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            List<String> urls = request.getImageUrls();
            for (int i = 0; i < urls.size() && i < 5; i++) {
                String url = urls.get(i);
                if (url != null && !url.isBlank()) {
                    ProductImage img = ProductImage.builder()
                            .product(product)
                            .imageUrl(url.trim())
                            .isThumbnail(i == 0)
                            .displayOrder(i)
                            .build();
                    productImageRepository.save(img);
                }
            }
        }
        
        return convertToDTO(product);
    }
    
    @Transactional
    public ProductDTO updateProduct(Long id, ProductUpdateRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
        
        if (request.getTenProduct() != null) {
            product.setTenProduct(request.getTenProduct());
        }
        if (request.getMoTa() != null) {
            product.setMoTa(request.getMoTa());
        }
        if (request.getGiaBan() != null) {
            product.setGiaBan(request.getGiaBan());
        }
        if (request.getGiaGoc() != null) {
            product.setGiaGoc(request.getGiaGoc());
        }
        if (request.getSoLuongTonKho() != null) {
            product.setSoLuongTonKho(request.getSoLuongTonKho());
        }
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy category"));
            product.setCategory(category);
        }
        if (request.getBrandId() != null) {
            Brand brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy brand"));
            product.setBrand(brand);
        }
        if (request.getIsEnabled() != null) {
            product.setIsEnabled(request.getIsEnabled());
        }
        if (request.getIsFeatured() != null) {
            product.setIsFeatured(request.getIsFeatured());
        }
        
        if (request.getImageUrls() != null) {
            productImageRepository.deleteAll(
                productImageRepository.findByProductIdProductOrderByDisplayOrderAsc(id)
            );
            List<String> urls = request.getImageUrls();
            for (int i = 0; i < urls.size() && i < 5; i++) {
                String url = urls.get(i);
                if (url != null && !url.isBlank()) {
                    ProductImage img = ProductImage.builder()
                            .product(product)
                            .imageUrl(url.trim())
                            .isThumbnail(i == 0)
                            .displayOrder(i)
                            .build();
                    productImageRepository.save(img);
                }
            }
        }
        
        product = productRepository.save(product);
        return convertToDTO(product);
    }
    
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
        
        // Remove from wishlists
        wishlistRepository.deleteByProductIdProduct(id);
        
        // Remove from cart items
        cartItemRepository.deleteByProductIdProduct(id);
        
        // Remove reviews
        reviewRepository.deleteAll(reviewRepository.findByProduct(product));
        
        // Remove product images
        productImageRepository.deleteByProductIdProduct(id);
        
        // Null out FK in order_items before deletion — snapshot data (tenProduct, hinhAnh, donGia) preserved
        orderItemRepository.clearProductReference(id);
        
        // Finally delete the product
        productRepository.delete(product);
    }
    
    @Transactional
    public void updateProductStock(Long productId, Integer quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
        
        int newStock = product.getSoLuongTonKho() - quantity;
        if (newStock < 0) {
            throw new RuntimeException("Không đủ hàng trong kho");
        }
        
        product.setSoLuongTonKho(newStock);
        product.setSoLuongDaBan(product.getSoLuongDaBan() + quantity);
        productRepository.save(product);
    }
    
    @Transactional
    public void updateProductRating(Long productId) {
        Double avgRating = reviewRepository.calculateAverageRating(productId);
        long totalReviews = reviewRepository.countByProductId(productId);
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
        
        product.setAvgRating(avgRating != null ? avgRating : 0.0);
        product.setTotalReviews((int) totalReviews);
        productRepository.save(product);
    }
    
    private ProductDTO convertToDTO(Product product) {
        List<ProductImage> images = productImageRepository.findByProductIdProductOrderByDisplayOrderAsc(product.getIdProduct());
        
        ProductImage thumbnail = images.stream()
                .filter(ProductImage::getIsThumbnail)
                .findFirst()
                .orElse(images.isEmpty() ? null : images.get(0));
        
        return ProductDTO.builder()
                .idProduct(product.getIdProduct())
                .tenProduct(product.getTenProduct())
                .moTa(product.getMoTa())
                .giaBan(product.getGiaBan())
                .giaGoc(product.getGiaGoc())
                .soLuongTonKho(product.getSoLuongTonKho())
                .soLuongDaBan(product.getSoLuongDaBan())
                .avgRating(product.getAvgRating())
                .totalReviews(product.getTotalReviews())
                .isEnabled(product.getIsEnabled())
                .isFeatured(product.getIsFeatured())
                .thumbnailUrl(thumbnail != null ? thumbnail.getImageUrl() : null)
                .imageUrls(images.stream().map(ProductImage::getImageUrl).collect(Collectors.toList()))
                .categoryId(product.getCategory().getIdCategory())
                .categoryName(product.getCategory().getTenCategory())
                .brandId(product.getBrand().getIdBrand())
                .brandName(product.getBrand().getTenBrand())
                .ngayTao(product.getNgayTao())
                .build();
    }
}
