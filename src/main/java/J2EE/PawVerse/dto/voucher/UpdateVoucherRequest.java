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
public class UpdateVoucherRequest {
    private String tenVoucher;
    private String moTa;
    private String voucherType;
    private BigDecimal discountValue;
    private Integer discountPercentage;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minOrderAmount;
    private Integer maxUsage;
    private LocalDate ngayBatDau;
    private LocalDate ngayKetThuc;
    private Boolean isFirstTimeOnly;
    private Boolean isActive;
    private Long categoryId;
    private Long brandId;
}
