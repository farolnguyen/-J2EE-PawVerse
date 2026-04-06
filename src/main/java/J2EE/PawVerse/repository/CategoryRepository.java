package J2EE.PawVerse.repository;

import J2EE.PawVerse.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    
    Optional<Category> findByTenCategory(String tenCategory);
    
    List<Category> findByTrangThai(String trangThai);
    
    @Query("SELECT c FROM Category c WHERE c.trangThai = 'Hoạt động'")
    List<Category> findAllActive();
    
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Product p WHERE p.category.idCategory = :categoryId")
    boolean hasProducts(@Param("categoryId") Long categoryId);

    @Modifying
    @Query(value = "UPDATE products SET id_category = :defaultId WHERE id_category = :oldId", nativeQuery = true)
    void reassignProductsToCategory(@Param("oldId") Long oldId, @Param("defaultId") Long defaultId);

    @Modifying
    @Query(value = "UPDATE vouchers SET id_category = NULL WHERE id_category = :categoryId", nativeQuery = true)
    void nullifyVoucherCategory(@Param("categoryId") Long categoryId);
}
