package J2EE.PawVerse.dto.booking;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceBookingDTO {
    private Long idBooking;
    private Long userId;
    private String hoTen;
    private String soDienThoai;
    private String email;
    private String serviceType;
    private LocalDateTime ngayGioDat;
    private String location;
    private String diaChi;
    private String ghiChu;
    private Long petId;
    private String petName;
    private String bookingStatus;
    private Integer contactFailCount;
    private BigDecimal giaDichVu;
    private String paymentStatus;
    private Boolean isVerified;
    private LocalDateTime ngayTao;
}
