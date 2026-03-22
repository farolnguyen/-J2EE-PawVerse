package J2EE.PawVerse.dto.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long idNotification;
    private String subject;
    private String content;
    private String notificationType;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
