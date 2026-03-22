package J2EE.PawVerse.repository;

import J2EE.PawVerse.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    
    Optional<Role> findByTenRole(String tenRole);
    
    boolean existsByTenRole(String tenRole);
}
