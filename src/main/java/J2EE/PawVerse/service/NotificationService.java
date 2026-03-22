package J2EE.PawVerse.service;

import J2EE.PawVerse.dto.notification.NotificationDTO;
import J2EE.PawVerse.entity.Notification;
import J2EE.PawVerse.entity.User;
import J2EE.PawVerse.repository.NotificationRepository;
import J2EE.PawVerse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<NotificationDTO> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdUserOrderByCreatedAtDesc(userId, pageable)
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông báo"));
        if (!notification.getUser().getIdUser().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền truy cập thông báo này");
        }
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    /**
     * Create an in-app notification for a user.
     * Called from other services when events occur (order status change, staff reply, etc.)
     */
    @Transactional
    public void createNotification(Long userId, String subject, String content,
                                   Notification.NotificationType type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = Notification.builder()
                .user(user)
                .email(user.getEmail())
                .subject(subject)
                .content(content)
                .notificationType(type)
                .build();

        notificationRepository.save(notification);
        log.info("Notification created for user {}: {} ({})", userId, subject, type);
    }

    private NotificationDTO convertToDTO(Notification n) {
        return NotificationDTO.builder()
                .idNotification(n.getIdNotification())
                .subject(n.getSubject())
                .content(n.getContent())
                .notificationType(n.getNotificationType().name())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
