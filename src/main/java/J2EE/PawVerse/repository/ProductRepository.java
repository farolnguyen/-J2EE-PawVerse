package J2EE.PawVerse.repository;

import J2EE.PawVerse.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    Page<Product> findByIsEnabledTrue(Pageable pageable);
    
    Page<Product> findByCategoryIdCategoryAndIsEnabledTrue(Long categoryId, Pageable pageable);
    
    Page<Product> findByBrandIdBrandAndIsEnabledTrue(Long brandId, Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE p.isEnabled = true AND p.isFeatured = true")
    List<Product> findFeaturedProducts();
    
    @Query("SELECT p FROM Product p WHERE p.isEnabled = true ORDER BY p.soLuongDaBan DESC")
    Page<Product> findTopSellingProducts(Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE p.isEnabled = true AND " +
           "(LOWER(p.tenProduct) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.moTa) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> searchProducts(@Param("keyword") String keyword, Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE p.isEnabled = true AND " +
           "p.giaBan BETWEEN :minPrice AND :maxPrice")
    Page<Product> findByPriceRange(@Param("minPrice") BigDecimal minPrice, 
                                    @Param("maxPrice") BigDecimal maxPrice, 
                                    Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE p.isEnabled = true AND p.avgRating >= :minRating")
    Page<Product> findByMinRating(@Param("minRating") Double minRating, Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE p.soLuongTonKho < :threshold")
    List<Product> findLowStockProducts(@Param("threshold") Integer threshold);
    
    @Query("SELECT p FROM Product p WHERE p.soLuongTonKho = 0")
    List<Product> findOutOfStockProducts();
    
    @Query("SELECT COUNT(p) FROM Product p WHERE p.soLuongTonKho < :threshold")
    Long countByStockLessThan(@Param("threshold") int threshold);
    
    @Query("SELECT p FROM Product p WHERE p.isEnabled = true " +
           "AND (:keyword IS NULL OR :keyword = '' OR LOWER(p.tenProduct) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.moTa) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:categoryId IS NULL OR p.category.idCategory = :categoryId) " +
           "AND (:brandId IS NULL OR p.brand.idBrand = :brandId) " +
           "AND (:minPrice IS NULL OR p.giaBan >= :minPrice) " +
           "AND (:maxPrice IS NULL OR p.giaBan <= :maxPrice)")
    Page<Product> searchProductsWithFilters(
        @Param("keyword") String keyword,
        @Param("categoryId") Long categoryId,
        @Param("brandId") Long brandId,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice,
        Pageable pageable
    );

    @Query("SELECT p FROM Product p WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(p.tenProduct) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.moTa) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:categoryId IS NULL OR p.category.idCategory = :categoryId) " +
           "AND (:brandId IS NULL OR p.brand.idBrand = :brandId) " +
           "AND (:isEnabled IS NULL OR p.isEnabled = :isEnabled)")
    Page<Product> searchAllProductsForAdmin(
        @Param("keyword") String keyword,
        @Param("categoryId") Long categoryId,
        @Param("brandId") Long brandId,
        @Param("isEnabled") Boolean isEnabled,
        Pageable pageable
    );
}
