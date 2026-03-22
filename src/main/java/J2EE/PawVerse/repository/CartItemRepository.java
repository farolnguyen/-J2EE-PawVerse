package J2EE.PawVerse.repository;

import J2EE.PawVerse.entity.Cart;
import J2EE.PawVerse.entity.CartItem;
import J2EE.PawVerse.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    
    List<CartItem> findByCartIdCart(Long cartId);
    
    Optional<CartItem> findByCartIdCartAndProductIdProduct(Long cartId, Long productId);
    
    List<CartItem> findByCart(Cart cart);
    
    CartItem findByCartAndProduct(Cart cart, Product product);
    
    void deleteByCartIdCart(Long cartId);
    
    void deleteByProductIdProduct(Long productId);
    
    void deleteByCart(Cart cart);
    
    void deleteByProduct(Product product);
}
