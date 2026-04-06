package J2EE.PawVerse.repository;

import J2EE.PawVerse.entity.Product;
import J2EE.PawVerse.entity.Review;
import J2EE.PawVerse.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    List<Review> findByProductIdProductAndIsDeletedFalse(Long productId);
    
    Page<Review> findByProductIdProductAndIsDeletedFalse(Long productId, Pageable pageable);
    
    Optional<Review> findByUserIdUserAndProductIdProductAndOrderIdOrder(Long userId, Long productId, Long orderId);
    
    boolean existsByUserIdUserAndProductIdProductAndOrderIdOrder(Long userId, Long productId, Long orderId);
    
    // One review per product per user
    boolean existsByUserIdUserAndProductIdProductAndIsDeletedFalse(Long userId, Long productId);

    Optional<Review> findByUserIdUserAndProductIdProductAndIsDeletedFalse(Long userId, Long productId);
    
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.idProduct = :productId AND r.isDeleted = false")
    Double calculateAverageRating(@Param("productId") Long productId);
    
    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.idProduct = :productId AND r.isDeleted = false")
    long countByProductId(@Param("productId") Long productId);
    
    boolean existsByUserAndProduct(User user, Product product);
    
    Page<Review> findByProductOrderByNgayTaoDesc(Product product, Pageable pageable);
    
    Page<Review> findByUserOrderByNgayTaoDesc(User user, Pageable pageable);
    
    List<Review> findByProduct(Product product);

    // Product reviews with rating filter
    @Query("SELECT r FROM Review r WHERE r.product.idProduct = :productId AND r.isDeleted = false " +
           "AND (:rating IS NULL OR r.rating = :rating) ORDER BY r.ngayTao DESC")
    Page<Review> findByProductWithRatingFilter(
        @Param("productId") Long productId,
        @Param("rating") Integer rating,
        Pageable pageable
    );

    // Rating distribution for a product
    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.product.idProduct = :productId AND r.isDeleted = false GROUP BY r.rating")
    List<Object[]> getRatingDistribution(@Param("productId") Long productId);

    // Check if user purchased this product via a delivered order
    @Query("SELECT CASE WHEN COUNT(oi) > 0 THEN true ELSE false END FROM OrderItem oi " +
           "WHERE oi.product.idProduct = :productId AND oi.order.user.idUser = :userId " +
           "AND oi.order.trangThaiOrder = 'DELIVERED'")
    boolean hasUserPurchasedAndDelivered(@Param("userId") Long userId, @Param("productId") Long productId);

    // Check if user has any delivered order for this product that hasn't been reviewed yet
    @Query("SELECT CASE WHEN COUNT(o) > 0 THEN true ELSE false END FROM Order o " +
           "JOIN o.orderItems oi WHERE o.user.idUser = :userId " +
           "AND oi.product.idProduct = :productId AND o.trangThaiOrder = 'DELIVERED' " +
           "AND NOT EXISTS (SELECT r FROM Review r WHERE r.order.idOrder = o.idOrder " +
           "  AND r.user.idUser = :userId AND r.product.idProduct = :productId AND r.isDeleted = false)")
    boolean hasUnreviewedDeliveredPurchase(@Param("userId") Long userId, @Param("productId") Long productId);

    @Modifying
    @Query(value = "UPDATE reviews SET id_staff_reply_user = NULL WHERE id_staff_reply_user = :userId", nativeQuery = true)
    void nullifyStaffReplyUser(@Param("userId") Long userId);
}
