package J2EE.PawVerse.dto.pet;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PetProfileDTO {
    private Long idPet;
    private String tenPet;
    private String loaiPet;
    private String giong;
    private Integer tuoi;
    private String gioiTinh;
    private BigDecimal canNang;
    private String anhPet;
    private LocalDateTime ngayTao;
    private LocalDateTime ngayCapNhat;
}
