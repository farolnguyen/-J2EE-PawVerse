package J2EE.PawVerse.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.Set;

@Entity
@Table(name = "brands")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Brand extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_brand")
    private Long idBrand;
    
    @Column(name = "ten_brand", nullable = false)
    private String tenBrand;
    
    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;
    
    @Column(name = "logo")
    private String logo;
    
    @Column(name = "trang_thai", nullable = false)
    private String trangThai = "Hoạt động";
    
    @OneToMany(mappedBy = "brand")
    private Set<Product> products;
}
