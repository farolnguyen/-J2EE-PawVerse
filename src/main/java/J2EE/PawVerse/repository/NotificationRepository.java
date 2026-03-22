package J2EE.PawVerse.repository;

import J2EE.PawVerse.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findByUserIdUserOrderByCreatedAtDesc(Long userId);

    Page<Notification> findByUserIdUserOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    List<Notification> findByIsSentFalse();
    
    @Query("SELECT n FROM Notification n WHERE n.isSent = false ORDER BY n.createdAt ASC")
    List<Notification> findPendingNotifications();
    
    List<Notification> findByNotificationType(Notification.NotificationType type);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.idUser = :userId AND n.isRead = false")
    long countUnreadByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.idUser = :userId AND n.isRead = false")
    void markAllAsReadByUserId(@Param("userId") Long userId);
}
