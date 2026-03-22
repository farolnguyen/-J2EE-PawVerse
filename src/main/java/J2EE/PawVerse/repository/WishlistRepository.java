package J2EE.PawVerse.repository;

import J2EE.PawVerse.entity.Product;
import J2EE.PawVerse.entity.User;
import J2EE.PawVerse.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    
    List<Wishlist> findByUserIdUser(Long userId);
    
    Optional<Wishlist> findByUserIdUserAndProductIdProduct(Long userId, Long productId);
    
    boolean existsByUserIdUserAndProductIdProduct(Long userId, Long productId);
    
    void deleteByUserIdUserAndProductIdProduct(Long userId, Long productId);
    
    boolean existsByUserAndProduct(User user, Product product);
    
    List<Wishlist> findByUserOrderByNgayTaoDesc(User user);
    
    Optional<Wishlist> findByUserAndProduct(User user, Product product);
    
    void deleteByUserIdUser(Long userId);
    
    void deleteByProductIdProduct(Long productId);
}
