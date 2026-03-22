package J2EE.PawVerse.controller;

import J2EE.PawVerse.dto.ApiResponse;
import J2EE.PawVerse.dto.activitylog.ActivityLogDTO;
import J2EE.PawVerse.entity.ActivityLog;
import J2EE.PawVerse.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/activity-logs")
@RequiredArgsConstructor
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ActivityLogDTO>>> getAllLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String entityType) {

        Pageable pageable = PageRequest.of(page, size);
        Page<ActivityLogDTO> logs;

        if (action != null && !action.isBlank()) {
            logs = activityLogService.getLogsByAction(ActivityLog.Action.valueOf(action.toUpperCase()), pageable);
        } else if (userId != null) {
            logs = activityLogService.getLogsByUser(userId, pageable);
        } else if (entityType != null && !entityType.isBlank()) {
            logs = activityLogService.getLogsByEntityType(entityType, pageable);
        } else {
            logs = activityLogService.getAllLogs(pageable);
        }

        return ResponseEntity.ok(ApiResponse.success(logs));
    }
}
