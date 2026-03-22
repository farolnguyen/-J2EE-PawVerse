package J2EE.PawVerse.repository;

import J2EE.PawVerse.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    
    Optional<Voucher> findByMaVoucher(String maVoucher);
    
    List<Voucher> findByIsActiveTrue();
    
    @Query("SELECT v FROM Voucher v WHERE v.maVoucher = :code AND v.ngayBatDau <= CURRENT_TIMESTAMP AND v.ngayKetThuc >= CURRENT_TIMESTAMP")
    Optional<Voucher> findValidVoucherByCode(@Param("code") String code);
    
    Optional<Voucher> findByMaVoucherAndIsActiveTrue(String maVoucher);
    
    default Optional<Voucher> findByCodeAndIsActiveTrue(String code) {
        return findByMaVoucherAndIsActiveTrue(code);
    }
}
