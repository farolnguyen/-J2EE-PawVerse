package J2EE.PawVerse.dto.category;

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
public class CategoryRequest {
    
    @NotBlank(message = "Tên category không được để trống")
    @Size(max = 100, message = "Tên category không được quá 100 ký tự")
    private String tenCategory;
    
    private String moTa;
    private String hinhAnh;
    private String trangThai = "Hoạt động";
}
