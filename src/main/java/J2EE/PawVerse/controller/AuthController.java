package J2EE.PawVerse.controller;

import J2EE.PawVerse.dto.ApiResponse;
import J2EE.PawVerse.dto.auth.*;
import J2EE.PawVerse.dto.user.ChangePasswordRequest;
import J2EE.PawVerse.dto.user.UserDTO;
import J2EE.PawVerse.repository.UserRepository;
import J2EE.PawVerse.service.AuthService;
import J2EE.PawVerse.service.CaptchaService;
import J2EE.PawVerse.service.UserService;
import java.util.Map;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    
    private final AuthService authService;
    private final UserService userService;
    private final UserRepository userRepository;
    private final CaptchaService captchaService;
    
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        try {
            log.info("POST /api/auth/register - Email: {}", request.getEmail());
            
            AuthResponse response = authService.register(request);
            log.info("Successfully registered user with email: {}", request.getEmail());
            
            return ResponseEntity.ok(ApiResponse.success(response, "Đăng ký thành công"));
        } catch (Exception e) {
            log.error("Error registering user with email: {}", request.getEmail(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/captcha")
    public ResponseEntity<ApiResponse<Map<String, String>>> getCaptcha() {
        CaptchaService.CaptchaChallenge challenge = captchaService.generateChallenge();
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("captchaToken", challenge.captchaToken(), "captchaQuestion", challenge.question())
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        try {
            log.info("POST /api/auth/login - UsernameOrEmail: {}", request.getUsernameOrEmail());

            AuthResponse response = authService.login(request);

            if (Boolean.TRUE.equals(response.getRequiresCaptcha())) {
                return ResponseEntity.ok(ApiResponse.success(response, "captcha_required"));
            }

            log.info("Successfully logged in user: {}", request.getUsernameOrEmail());
            return ResponseEntity.ok(ApiResponse.success(response, "Đăng nhập thành công"));
        } catch (Exception e) {
            String msg = e.getMessage();
            if (msg != null && msg.contains("|captcha|")) {
                String[] parts = msg.split("\\|captcha\\|");
                String errorMsg = parts[0];
                String captchaData = parts.length > 1 ? parts[1] : "";
                String[] captchaParts = captchaData.split("\\|", 2);
                AuthResponse captchaResponse = AuthResponse.builder()
                        .requiresCaptcha(true)
                        .captchaToken(captchaParts.length > 0 ? captchaParts[0] : null)
                        .captchaQuestion(captchaParts.length > 1 ? captchaParts[1] : null)
                        .build();
                return ResponseEntity.badRequest().body(
                        new J2EE.PawVerse.dto.ApiResponse<>(false, errorMsg, captchaResponse));
            }
            log.error("Error logging in user: {}", request.getUsernameOrEmail(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        try {
            authService.requestPasswordReset(request);
            return ResponseEntity.ok(ApiResponse.success(null, "OTP đã được gửi đến email của bạn"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/reset-password/{email}")
    public ResponseEntity<ApiResponse<Void>> confirmPasswordReset(
            @PathVariable String email,
            @Valid @RequestBody PasswordResetConfirmRequest request) {
        try {
            authService.confirmPasswordReset(email, request);
            return ResponseEntity.ok(ApiResponse.success(null, "Đặt lại mật khẩu thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        try {
            log.info("POST /api/auth/refresh - Refreshing access token");
            
            AuthResponse response = authService.refreshToken(request.getRefreshToken());
            log.debug("Successfully refreshed access token");
            
            return ResponseEntity.ok(ApiResponse.success(response, "Refresh token thành công"));
        } catch (Exception e) {
            log.error("Error refreshing token", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/logout")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> logout(Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            log.info("POST /api/auth/logout - UserId: {}", userId);
            
            authService.logout(userId);
            log.info("Successfully logged out userId: {}", userId);
            
            return ResponseEntity.ok(ApiResponse.success(null, "Đăng xuất thành công"));
        } catch (Exception e) {
            log.error("Error logging out user: {}", authentication.getName(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<UserDTO>> getCurrentUser(Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            log.info("GET /api/auth/me - UserId: {}", userId);
            
            UserDTO user = userService.getUserProfile(userId);
            log.debug("Retrieved current user profile for userId: {}", userId);
            
            return ResponseEntity.ok(ApiResponse.success(user));
        } catch (Exception e) {
            log.error("Error getting current user: {}", authentication.getName(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/change-password")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            log.info("POST /api/auth/change-password - UserId: {}", userId);
            
            userService.changePassword(userId, request);
            log.info("Successfully changed password for userId: {}", userId);
            
            return ResponseEntity.ok(ApiResponse.success(null, "Đổi mật khẩu thành công"));
        } catch (Exception e) {
            log.error("Error changing password for userId: {}", authentication.getName(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/email/send-verification")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> sendEmailVerification(Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            log.info("POST /api/auth/email/send-verification - UserId: {}", userId);
            
            authService.sendEmailVerification(userId);
            return ResponseEntity.ok(ApiResponse.success(null, "Mã xác thực đã được gửi đến email của bạn"));
        } catch (Exception e) {
            log.error("Error sending email verification", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/email/confirm-verification")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> confirmEmailVerification(
            @RequestBody java.util.Map<String, String> request,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            String otp = request.get("otp");
            log.info("POST /api/auth/email/confirm-verification - UserId: {}", userId);
            
            authService.confirmEmailVerification(userId, otp);
            return ResponseEntity.ok(ApiResponse.success(null, "Xác thực email thành công! Bạn sẽ nhận được phiếu giảm giá cho lần mua đầu tiên."));
        } catch (Exception e) {
            log.error("Error confirming email verification", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Auth API is working!");
    }
    
    private Long getUserIdFromAuth(Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String username = userDetails.getUsername();
            
            log.debug("Extracting userId for username: {}", username);
            
            Long userId = userRepository.findByUsername(username)
                    .map(user -> {
                        log.debug("Found user with ID: {} for username: {}", user.getIdUser(), username);
                        return user.getIdUser();
                    })
                    .orElseThrow(() -> {
                        log.error("User not found for username: {}", username);
                        return new RuntimeException("User not found: " + username);
                    });
            
            return userId;
        } catch (Exception e) {
            log.error("Error extracting userId from authentication", e);
            throw new RuntimeException("Failed to extract user information", e);
        }
    }
}
