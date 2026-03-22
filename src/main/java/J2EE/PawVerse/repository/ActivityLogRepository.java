package J2EE.PawVerse.repository;

import J2EE.PawVerse.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    
    List<ActivityLog> findByUserIdUserOrderByTimestampDesc(Long userId);

    Page<ActivityLog> findByUserIdUserOrderByTimestampDesc(Long userId, Pageable pageable);
    
    Page<ActivityLog> findAllByOrderByTimestampDesc(Pageable pageable);
    
    List<ActivityLog> findByEntityTypeAndEntityId(String entityType, Long entityId);

    Page<ActivityLog> findByEntityTypeOrderByTimestampDesc(String entityType, Pageable pageable);
    
    @Query("SELECT al FROM ActivityLog al WHERE al.timestamp >= :startDate ORDER BY al.timestamp DESC")
    List<ActivityLog> findRecentLogs(@Param("startDate") LocalDateTime startDate);
    
    Page<ActivityLog> findByActionOrderByTimestampDesc(ActivityLog.Action action, Pageable pageable);
}
