package J2EE.PawVerse.repository;

import J2EE.PawVerse.entity.Order;
import J2EE.PawVerse.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    List<Order> findByUserIdUser(Long userId);
    
    Page<Order> findByUserIdUser(Long userId, Pageable pageable);
    
    List<Order> findByTrangThaiOrder(String status);
    
    @Query("SELECT COUNT(o) FROM Order o WHERE o.trangThaiOrder = :status")
    long countByTrangThaiOrder(@Param("status") String status);
    
    @Query(value = "SELECT SUM(tong_tien) FROM orders WHERE trang_thai_order = 'DELIVERED' AND ngay_tao >= :startDate AND ngay_tao <= :endDate", nativeQuery = true)
    BigDecimal calculateRevenue(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query(value = "SELECT COALESCE(SUM(tong_tien), 0) FROM orders WHERE trang_thai_order = 'DELIVERED'", nativeQuery = true)
    BigDecimal calculateTotalRevenue();
    
    @Query(value = "SELECT DATE(ngay_tao) as period, SUM(tong_tien) as revenue, COUNT(*) as orderCount " +
           "FROM orders WHERE trang_thai_order = 'DELIVERED' AND ngay_tao BETWEEN :startDate AND :endDate " +
           "GROUP BY DATE(ngay_tao) ORDER BY period DESC", nativeQuery = true)
    List<Object[]> findRevenueByDay(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query(value = "SELECT DATE_FORMAT(ngay_tao, '%Y-%m') as period, SUM(tong_tien) as revenue, COUNT(*) as orderCount " +
           "FROM orders WHERE trang_thai_order = 'DELIVERED' AND ngay_tao BETWEEN :startDate AND :endDate " +
           "GROUP BY DATE_FORMAT(ngay_tao, '%Y-%m') ORDER BY period DESC", nativeQuery = true)
    List<Object[]> findRevenueByMonth(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query(value = "SELECT YEAR(ngay_tao) as period, SUM(tong_tien) as revenue, COUNT(*) as orderCount " +
           "FROM orders WHERE trang_thai_order = 'DELIVERED' AND ngay_tao BETWEEN :startDate AND :endDate " +
           "GROUP BY YEAR(ngay_tao) ORDER BY period DESC", nativeQuery = true)
    List<Object[]> findRevenueByYear(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    Page<Order> findByUserOrderByNgayDatHangDesc(User user, Pageable pageable);
    
    Page<Order> findByTrangThaiOrderOrderByNgayDatHangDesc(String status, Pageable pageable);
    
    Page<Order> findAllByOrderByNgayDatHangDesc(Pageable pageable);
    
    Page<Order> findByUserOrderByNgayTaoDesc(User user, Pageable pageable);
    
    Page<Order> findByUserAndTrangThaiOrderOrderByNgayTaoDesc(User user, String status, Pageable pageable);
    
    Page<Order> findByTrangThaiOrderOrderByNgayTaoDesc(String status, Pageable pageable);
    
    Page<Order> findAllByOrderByNgayTaoDesc(Pageable pageable);
    
    @Query("SELECT o FROM Order o WHERE o.ngayTao >= :startDate ORDER BY o.ngayTao DESC")
    List<Order> findRecentOrders(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT o FROM Order o JOIN o.orderItems oi WHERE o.user.idUser = :userId " +
           "AND oi.product.idProduct = :productId AND o.trangThaiOrder = 'DELIVERED' " +
           "ORDER BY o.ngayTao DESC")
    List<Order> findDeliveredOrdersForUserProduct(@Param("userId") Long userId, @Param("productId") Long productId);

    @Query("SELECT o FROM Order o JOIN o.orderItems oi WHERE o.user.idUser = :userId " +
           "AND oi.product.idProduct = :productId AND o.trangThaiOrder = 'DELIVERED' " +
           "AND NOT EXISTS (SELECT r FROM Review r WHERE r.order.idOrder = o.idOrder " +
           "  AND r.user.idUser = :userId AND r.product.idProduct = :productId AND r.isDeleted = false) " +
           "ORDER BY o.ngayTao DESC")
    List<Order> findUnreviewedDeliveredOrdersForUserProduct(@Param("userId") Long userId, @Param("productId") Long productId);
}
