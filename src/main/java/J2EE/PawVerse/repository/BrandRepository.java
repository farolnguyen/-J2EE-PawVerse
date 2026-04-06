package J2EE.PawVerse.repository;

import J2EE.PawVerse.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Long> {
    
    Optional<Brand> findByTenBrand(String tenBrand);
    
    List<Brand> findByTrangThai(String trangThai);
    
    @Query("SELECT b FROM Brand b WHERE b.trangThai = 'Hoạt động'")
    List<Brand> findAllActive();
    
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Product p WHERE p.brand.idBrand = :brandId")
    boolean hasProducts(@Param("brandId") Long brandId);

    @Modifying
    @Query(value = "UPDATE products SET id_brand = :defaultId WHERE id_brand = :oldId", nativeQuery = true)
    void reassignProductsToBrand(@Param("oldId") Long oldId, @Param("defaultId") Long defaultId);

    @Modifying
    @Query(value = "UPDATE vouchers SET id_brand = NULL WHERE id_brand = :brandId", nativeQuery = true)
    void nullifyVoucherBrand(@Param("brandId") Long brandId);
}
