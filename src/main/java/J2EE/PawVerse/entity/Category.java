package J2EE.PawVerse.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.Set;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_category")
    private Long idCategory;
    
    @Column(name = "ten_category", nullable = false)
    private String tenCategory;
    
    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;
    
    @Column(name = "hinh_anh")
    private String hinhAnh;
    
    @Column(name = "trang_thai", nullable = false)
    private String trangThai = "Hoạt động";
    
    @OneToMany(mappedBy = "category")
    private Set<Product> products;
}
