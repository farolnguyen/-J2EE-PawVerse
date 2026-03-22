package J2EE.PawVerse.dto.pet;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePetProfileRequest {
    
    @NotBlank(message = "Tên thú cưng không được để trống")
    private String tenPet;
    
    @NotBlank(message = "Loại thú cưng không được để trống")
    private String loaiPet;
    
    private String giong;
    private Integer tuoi;
    private String gioiTinh;
    private BigDecimal canNang;
    private String anhPet;
}
