package J2EE.PawVerse.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_order")
    private Long idOrder;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_user", nullable = false)
    private User user;
    
    @Column(name = "ma_order", unique = true)
    private String maOrder;
    
    @Column(name = "ten_khach_hang", nullable = false)
    private String tenKhachHang;
    
    @Column(name = "ho_ten", nullable = false)
    private String hoTen;
    
    @Column(name = "email", nullable = false)
    private String email;
    
    @Column(name = "so_dien_thoai", nullable = false)
    private String soDienThoai;
    
    @Column(name = "dia_chi_giao_hang", nullable = false)
    private String diaChiGiaoHang;
    
    @Column(name = "phuong_xa")
    private String phuongXa;
    
    @Column(name = "quan_huyen")
    private String quanHuyen;
    
    @Column(name = "tinh_thanh_pho")
    private String tinhThanhPho;
    
    @Column(name = "latitude")
    private Double latitude;
    
    @Column(name = "longitude")
    private Double longitude;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_voucher")
    private Voucher voucher;
    
    @Column(name = "phi_van_chuyen", nullable = false, precision = 18, scale = 2)
    private BigDecimal phiVanChuyen;
    
    @Column(name = "tong_tien_san_pham", nullable = false, precision = 18, scale = 2)
    private BigDecimal tongTienSanPham;
    
    @Column(name = "tong_tien", nullable = false, precision = 18, scale = 2)
    private BigDecimal tongTien;
    
    @Column(name = "tien_giam_gia", precision = 18, scale = 2)
    private BigDecimal tienGiamGia;
    
    @Column(name = "tong_tien_cuoi_cung", precision = 18, scale = 2)
    private BigDecimal tongTienCuoiCung;
    
    @Column(name = "trang_thai_order")
    private String trangThaiOrder;
    
    @Column(name = "phuong_thuc_thanh_toan")
    private String phuongThucThanhToan;
    
    @Column(name = "trang_thai_thanh_toan")
    private String trangThaiThanhToan;
    
    @Column(name = "ngay_dat_hang")
    private LocalDateTime ngayDatHang;
    
    @Column(name = "ngay_giao_hang_thuc_te")
    private LocalDateTime ngayGiaoHangThucTe;
    
    @Column(name = "tracking_number")
    private String trackingNumber;
    
    @Column(name = "ngay_giao_hang_du_kien")
    private LocalDateTime ngayGiaoHangDuKien;
    
    @Column(name = "ngay_huy")
    private LocalDateTime ngayHuy;
    
    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<OrderItem> orderItems;
    
}
