package J2EE.PawVerse.repository;

import J2EE.PawVerse.entity.PetProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PetProfileRepository extends JpaRepository<PetProfile, Long> {
    
    List<PetProfile> findByUserIdUser(Long userId);
    
    List<PetProfile> findByUserIdUserAndLoaiPet(Long userId, String loaiPet);
}
