package J2EE.PawVerse.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceBooking extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_booking")
    private Long idBooking;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_user")
    private User user;
    
    @Column(name = "ho_ten", nullable = false)
    private String hoTen;
    
    @Column(name = "so_dien_thoai", nullable = false)
    private String soDienThoai;
    
    @Column(name = "email", nullable = false)
    private String email;
    
    @Column(name = "service_type", nullable = false, columnDefinition = "VARCHAR(50)")
    @Enumerated(EnumType.STRING)
    private ServiceType serviceType;
    
    @Column(name = "ngay_gio_dat", nullable = false)
    private LocalDateTime ngayGioDat;
    
    @Column(name = "location", nullable = false)
    private String location;
    
    @Column(name = "dia_chi")
    private String diaChi;
    
    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_pet")
    private PetProfile petProfile;
    
    @Column(name = "booking_status", nullable = false, columnDefinition = "VARCHAR(50)")
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private BookingStatus bookingStatus = BookingStatus.PENDING;
    
    @Column(name = "contact_fail_count", nullable = false)
    @Builder.Default
    private Integer contactFailCount = 0;
    
    @Column(name = "gia_dich_vu", precision = 18, scale = 2)
    private BigDecimal giaDichVu;
    
    @Column(name = "payment_status", nullable = false, columnDefinition = "VARCHAR(50)")
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;
    
    @Column(name = "verification_token")
    private String verificationToken;
    
    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private Boolean isVerified = false;
    
    public enum ServiceType {
        PET_HOTEL,
        SPA_GROOMING,
        HOME_SERVICE
    }
    
    public enum BookingStatus {
        PENDING,
        CONFIRMED,
        CONTACTING,
        CONTACT_SUCCESS,
        COMPLETED,
        CANCELLED
    }
    
    public enum PaymentStatus {
        UNPAID,
        PAID,
        REFUNDED
    }
}
