package J2EE.PawVerse.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetConfirmRequest {
    
    @NotBlank(message = "OTP không được để trống")
    private String otp;
    
    @NotBlank(message = "Password mới không được để trống")
    @Size(min = 6, message = "Password phải có ít nhất 6 ký tự")
    private String newPassword;
}
