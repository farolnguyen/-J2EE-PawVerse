package J2EE.PawVerse.service;

import J2EE.PawVerse.dto.activitylog.ActivityLogDTO;
import J2EE.PawVerse.entity.ActivityLog;
import J2EE.PawVerse.entity.User;
import J2EE.PawVerse.repository.ActivityLogRepository;
import J2EE.PawVerse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<ActivityLogDTO> getAllLogs(Pageable pageable) {
        return activityLogRepository.findAllByOrderByTimestampDesc(pageable)
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<ActivityLogDTO> getLogsByAction(ActivityLog.Action action, Pageable pageable) {
        return activityLogRepository.findByActionOrderByTimestampDesc(action, pageable)
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<ActivityLogDTO> getLogsByUser(Long userId, Pageable pageable) {
        return activityLogRepository.findByUserIdUserOrderByTimestampDesc(userId, pageable)
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<ActivityLogDTO> getLogsByEntityType(String entityType, Pageable pageable) {
        return activityLogRepository.findByEntityTypeOrderByTimestampDesc(entityType, pageable)
                .map(this::convertToDTO);
    }

    /**
     * Log an activity. Can be called from any service to record admin/staff actions.
     */
    @Transactional
    public void logActivity(Long userId, ActivityLog.Action action, String entityType, Long entityId,
                            String oldValue, String newValue) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ActivityLog logEntry = ActivityLog.builder()
                .user(user)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .oldValue(oldValue)
                .newValue(newValue)
                .timestamp(LocalDateTime.now())
                .build();

        activityLogRepository.save(logEntry);
        log.info("Activity logged: {} {} {} #{} by user #{}", action, entityType, entityId, userId);
    }

    private ActivityLogDTO convertToDTO(ActivityLog log) {
        return ActivityLogDTO.builder()
                .idLog(log.getIdLog())
                .userId(log.getUser().getIdUser())
                .username(log.getUser().getUsername())
                .userFullName(log.getUser().getFullName())
                .action(log.getAction().name())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .oldValue(log.getOldValue())
                .newValue(log.getNewValue())
                .timestamp(log.getTimestamp())
                .build();
    }
}
