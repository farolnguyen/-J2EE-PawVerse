package J2EE.PawVerse.dto.brand;

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
public class BrandRequest {
    
    @NotBlank(message = "Tên brand không được để trống")
    @Size(max = 100, message = "Tên brand không được quá 100 ký tự")
    private String tenBrand;
    
    private String moTa;
    private String logo;
    private String trangThai = "Hoạt động";
}
