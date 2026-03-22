package J2EE.PawVerse.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_product")
    private Long idProduct;
    
    @Column(name = "ten_product", nullable = false)
    private String tenProduct;
    
    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_category", nullable = false)
    private Category category;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_brand", nullable = false)
    private Brand brand;
    
    @Column(name = "gia_ban", nullable = false, precision = 18, scale = 2)
    private BigDecimal giaBan;
    
    @Column(name = "gia_goc", precision = 18, scale = 2)
    private BigDecimal giaGoc;
    
    @Column(name = "gia_khuyen_mai", precision = 18, scale = 2)
    private BigDecimal giaKhuyenMai;
    
    @Column(name = "so_luong_ton_kho", nullable = false)
    private Integer soLuongTonKho = 0;
    
    @Column(name = "so_luong_da_ban", nullable = false)
    private Integer soLuongDaBan = 0;
    
    @Column(name = "trong_luong")
    private String trongLuong;
    
    @Column(name = "mau_sac")
    private String mauSac;
    
    @Column(name = "xuat_xu")
    private String xuatXu;
    
    @Column(name = "ngay_san_xuat")
    private LocalDateTime ngaySanXuat;
    
    @Column(name = "han_su_dung")
    private LocalDateTime hanSuDung;
    
    @Column(name = "is_featured", nullable = false)
    private Boolean isFeatured = false;
    
    @Column(name = "is_enabled", nullable = false)
    private Boolean isEnabled = true;
    
    @Column(name = "so_lan_xem", nullable = false)
    private Integer soLanXem = 0;
    
    @Column(name = "avg_rating")
    private Double avgRating = 0.0;
    
    @Column(name = "total_reviews")
    private Integer totalReviews = 0;
    
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ProductImage> productImages;
    
    @OneToMany(mappedBy = "product")
    private Set<Review> reviews;
    
    @OneToMany(mappedBy = "product")
    private Set<Wishlist> wishlists;
    
    @OneToMany(mappedBy = "product")
    private Set<CartItem> cartItems;
    
    @OneToMany(mappedBy = "product")
    private Set<OrderItem> orderItems;
}
