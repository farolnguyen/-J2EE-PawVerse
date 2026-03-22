package J2EE.PawVerse.repository;

import J2EE.PawVerse.entity.Order;
import J2EE.PawVerse.entity.OrderItem;
import J2EE.PawVerse.entity.Product;
import J2EE.PawVerse.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    
    List<OrderItem> findByOrderIdOrder(Long orderId);
    
    List<OrderItem> findByOrder(Order order);
    
    @Query("SELECT oi FROM OrderItem oi WHERE oi.product.idProduct = :productId")
    List<OrderItem> findByProductId(@Param("productId") Long productId);
    
    @Query("SELECT CASE WHEN COUNT(oi) > 0 THEN true ELSE false END FROM OrderItem oi WHERE oi.product = :product AND oi.order.user = :user")
    boolean existsByProductAndOrderUser(@Param("product") Product product, @Param("user") User user);

    @Modifying
    @Query(value = "UPDATE order_items SET id_product = NULL WHERE id_product = :productId", nativeQuery = true)
    void clearProductReference(@Param("productId") Long productId);
    
    @Query(value = "SELECT oi.id_product, SUM(oi.so_luong) as totalSold, SUM(oi.don_gia * oi.so_luong) as revenue " +
           "FROM order_items oi " +
           "JOIN orders o ON oi.id_order = o.id_order " +
           "WHERE o.trang_thai_order = 'DELIVERED' AND oi.id_product IS NOT NULL " +
           "GROUP BY oi.id_product ORDER BY totalSold DESC", 
           nativeQuery = true)
    List<Object[]> findTopSellingProducts(org.springframework.data.domain.Pageable pageable);
}
