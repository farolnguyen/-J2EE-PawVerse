package J2EE.PawVerse.repository;

import J2EE.PawVerse.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByOauthProviderAndOauthProviderId(String oauthProvider, String oauthProviderId);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    @Query("SELECT u FROM User u WHERE u.role.tenRole = :roleName")
    List<User> findByRoleName(@Param("roleName") String roleName);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.ngayTao >= :startDate")
    Long countNewUsers(@Param("startDate") LocalDateTime startDate);
    
    Page<User> findByUsernameContainingOrEmailContainingOrFullNameContaining(
            String username, String email, String fullName, Pageable pageable);
    
    List<User> findByIsLocked(Boolean isLocked);
    
    @Query("SELECT u FROM User u WHERE u.role.tenRole = :roleName ORDER BY u.idUser ASC")
    List<User> findByRoleNameOrderByIdUserAsc(@Param("roleName") String roleName);
    
    @Query("SELECT u FROM User u WHERE u.role.tenRole = :role")
    Page<User> findByRoleTenRole(@Param("role") String role, Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE u.role.tenRole = :role AND (u.username LIKE %:search% OR u.email LIKE %:search% OR u.fullName LIKE %:search%)")
    Page<User> findByRoleAndSearch(@Param("role") String role, @Param("search") String search, Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE u.isLocked = :locked")
    Page<User> findByLockedStatus(@Param("locked") Boolean locked, Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE u.isLocked = :locked AND (u.username LIKE %:search% OR u.email LIKE %:search% OR u.fullName LIKE %:search%)")
    Page<User> findByLockedStatusAndSearch(@Param("locked") Boolean locked, @Param("search") String search, Pageable pageable);
    
    long countByIsLocked(Boolean isLocked);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role.tenRole = :roleName")
    long countByRoleName(@Param("roleName") String roleName);
}
