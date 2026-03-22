package J2EE.PawVerse.dto.voucher;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CreateVoucherRequest {

    @NotBlank(message = "Mã voucher không được để trống")
    private String maVoucher;

    @NotBlank(message = "Tên voucher không được để trống")
    private String tenVoucher;

    private String moTa;

    @NotNull(message = "Loại voucher không được để trống")
    private String voucherType;

    private BigDecimal discountValue;
    private Integer discountPercentage;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minOrderAmount;

    @NotNull(message = "Số lượt sử dụng tối đa không được để trống")
    private Integer maxUsage;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate ngayBatDau;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDate ngayKetThuc;

    private Boolean isFirstTimeOnly;
    private Long categoryId;
    private Long brandId;
}
