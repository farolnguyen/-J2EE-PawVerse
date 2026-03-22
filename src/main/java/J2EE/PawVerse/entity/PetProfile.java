package J2EE.PawVerse.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "pet_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PetProfile extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pet")
    private Long idPet;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_user", nullable = false)
    private User user;
    
    @Column(name = "ten_pet", nullable = false)
    private String tenPet;
    
    @Column(name = "loai_pet", nullable = false)
    private String loaiPet;
    
    @Column(name = "giong")
    private String giong;
    
    @Column(name = "tuoi")
    private Integer tuoi;
    
    @Column(name = "gioi_tinh")
    private String gioiTinh;
    
    @Column(name = "can_nang", precision = 5, scale = 2)
    private BigDecimal canNang;
    
    @Column(name = "anh_pet")
    private String anhPet;
}
