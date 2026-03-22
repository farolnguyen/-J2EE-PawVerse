package J2EE.PawVerse.repository;

import J2EE.PawVerse.entity.Cart;
import J2EE.PawVerse.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    
    Optional<Cart> findByUserIdUser(Long userId);
    
    Optional<Cart> findByUser(User user);
    
    void deleteByUserIdUser(Long userId);
    void deleteByUser(User user);
}
