package J2EE.PawVerse.dto.brand;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrandDTO {
    
    private Long idBrand;
    private String tenBrand;
    private String moTa;
    private String logo;
    private String trangThai;
    private Long productCount;
}
