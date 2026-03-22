package J2EE.PawVerse.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRoleRequest {
    
    @NotBlank(message = "Vai trò không được để trống")
    @Pattern(regexp = "^(USER|ADMIN|STAFF)$", message = "Vai trò phải là USER, ADMIN hoặc STAFF")
    private String role;
}
