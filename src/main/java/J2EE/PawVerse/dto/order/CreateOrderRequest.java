package J2EE.PawVerse.dto.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {
    
    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 100, message = "Họ tên không được quá 100 ký tự")
    private String fullName;
    
    @NotBlank(message = "Email không được để trống")
    private String email;
    
    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^[0-9]{10,11}$", message = "Số điện thoại không hợp lệ")
    private String phone;
    
    @NotBlank(message = "Địa chỉ không được để trống")
    private String shippingAddress;
    
    @NotBlank(message = "Phường/Xã không được để trống")
    private String shippingWard;
    
    @NotBlank(message = "Quận/Huyện không được để trống")
    private String shippingDistrict;
    
    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    private String shippingCity;
    
    @NotNull(message = "Phương thức thanh toán không được để trống")
    private String paymentMethod; // COD, MOMO, VNPAY
    
    private String voucherCode;
    private String note;
}
