package J2EE.PawVerse.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

@Entity
@Table(name = "vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_voucher")
    private Long idVoucher;
    
    @Column(name = "ma_voucher", nullable = false, unique = true)
    private String maVoucher;
    
    @Column(name = "ten_voucher", nullable = false)
    private String tenVoucher;
    
    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;
    
    @Column(name = "voucher_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private VoucherType voucherType;
    
    @Column(name = "discount_value", precision = 18, scale = 2)
    private BigDecimal discountValue;
    
    @Column(name = "discount_percentage")
    private Integer discountPercentage;
    
    @Column(name = "max_discount_amount", precision = 18, scale = 2)
    private BigDecimal maxDiscountAmount;
    
    @Column(name = "min_order_amount", precision = 18, scale = 2)
    private BigDecimal minOrderAmount;
    
    @Column(name = "max_usage")
    private Integer maxUsage;
    
    @Column(name = "used_count", nullable = false)
    private Integer usedCount = 0;
    
    @Column(name = "ngay_bat_dau", nullable = false)
    private LocalDate ngayBatDau;
    
    @Column(name = "ngay_ket_thuc", nullable = false)
    private LocalDate ngayKetThuc;
    
    @Column(name = "is_first_time_only", nullable = false)
    private Boolean isFirstTimeOnly = false;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_category")
    private Category category;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_brand")
    private Brand brand;
    
    @OneToMany(mappedBy = "voucher")
    private Set<Order> orders;
    
    public enum VoucherType {
        PERCENTAGE,
        FIXED_AMOUNT,
        FREE_SHIPPING
    }
}
