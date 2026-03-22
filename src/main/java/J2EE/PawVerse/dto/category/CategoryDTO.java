package J2EE.PawVerse.dto.category;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDTO {
    
    private Long idCategory;
    private String tenCategory;
    private String moTa;
    private String hinhAnh;
    private String trangThai;
    private Long productCount;
}
