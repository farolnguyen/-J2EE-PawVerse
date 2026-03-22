package J2EE.PawVerse.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    
    private Long idUser;
    private String username;
    private String email;
    private String fullName;
    private String soDienThoai;
    private String diaChi;
    private String phuongXa;
    private String quanHuyen;
    private String tinhThanhPho;
    private LocalDate ngaySinh;
    private String gioiTinh;
    private String avatar;
    private String roleName;
    private Boolean isLocked;
    private Integer lockTimeHours;
    private LocalDateTime lockedUntil;
    private Integer failedLoginAttempts;
    private Boolean emailVerified;
    private String oauthProvider;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isFirstAdmin;
}
