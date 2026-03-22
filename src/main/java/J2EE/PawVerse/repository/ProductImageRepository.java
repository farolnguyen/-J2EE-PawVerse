package J2EE.PawVerse.repository;

import J2EE.PawVerse.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    
    List<ProductImage> findByProductIdProductOrderByDisplayOrderAsc(Long productId);
    
    Optional<ProductImage> findByProductIdProductAndIsThumbnailTrue(Long productId);
    
    void deleteByProductIdProduct(Long productId);
}
