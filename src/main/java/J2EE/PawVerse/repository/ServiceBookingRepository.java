package J2EE.PawVerse.repository;

import J2EE.PawVerse.entity.ServiceBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceBookingRepository extends JpaRepository<ServiceBooking, Long> {
    
    List<ServiceBooking> findByUserIdUser(Long userId);
    
    List<ServiceBooking> findByUserIdUserOrderByNgayTaoDesc(Long userId);
    
    List<ServiceBooking> findAllByOrderByNgayTaoDesc();
    
    List<ServiceBooking> findByBookingStatus(ServiceBooking.BookingStatus status);
    
    Optional<ServiceBooking> findByVerificationToken(String token);
    
    @Query("SELECT sb FROM ServiceBooking sb WHERE sb.ngayGioDat BETWEEN :start AND :end")
    List<ServiceBooking> findBookingsBetweenDates(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT sb FROM ServiceBooking sb WHERE sb.bookingStatus = 'CONFIRMED' AND sb.ngayGioDat BETWEEN :start AND :end")
    List<ServiceBooking> findUpcomingBookings(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT COUNT(sb) FROM ServiceBooking sb WHERE sb.bookingStatus = :status")
    long countByStatus(@Param("status") ServiceBooking.BookingStatus status);
}
