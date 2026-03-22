package J2EE.PawVerse.dto.voucher;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherDTO {
    private Long idVoucher;
    private String maVoucher;
    private String tenVoucher;
    private String moTa;
    private String voucherType;
    private BigDecimal discountValue;
    private Integer discountPercentage;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minOrderAmount;
    private Integer maxUsage;
    private Integer usedCount;
    private LocalDate ngayBatDau;
    private LocalDate ngayKetThuc;
    private Boolean isFirstTimeOnly;
    private Boolean isActive;
    private Long categoryId;
    private String categoryName;
    private Long brandId;
    private String brandName;
    private String status;
}
