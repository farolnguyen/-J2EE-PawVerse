package J2EE.PawVerse.dto.booking;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBookingRequest {

    @NotBlank(message = "Họ tên không được để trống")
    private String hoTen;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String soDienThoai;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Loại dịch vụ không được để trống")
    private String serviceType;

    @NotNull(message = "Ngày giờ đặt không được để trống")
    private LocalDateTime ngayGioDat;

    @NotBlank(message = "Địa điểm không được để trống")
    private String location;

    private String diaChi;

    private String ghiChu;

    private Long petId;
}
