package J2EE.PawVerse.service;

import J2EE.PawVerse.dto.auth.*;
import J2EE.PawVerse.entity.Role;
import J2EE.PawVerse.entity.User;
import J2EE.PawVerse.repository.RoleRepository;
import J2EE.PawVerse.repository.UserRepository;
import J2EE.PawVerse.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final CaptchaService captchaService;
    private final ReCaptchaVerificationService reCaptchaVerificationService;
    private static final int CAPTCHA_THRESHOLD = 3;
    private final Map<String, String> otpStorage = new HashMap<>();
    private final Map<String, LocalDateTime> otpExpiryStorage = new HashMap<>();
    private final Map<String, Integer> otpAttemptStorage = new HashMap<>();
    private static final int MAX_OTP_ATTEMPTS = 5;
    
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username đã tồn tại");
        }
        
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã tồn tại");
        }
        
        Role userRole = roleRepository.findByTenRole("USER")
                .orElseThrow(() -> new RuntimeException("Role USER không tồn tại"));
        
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .soDienThoai(request.getSoDienThoai())
                .role(userRole)
                .isLocked(false)
                .failedLoginAttempts(0)
                .emailVerified(false)
                .build();
        
        user = userRepository.save(user);
        
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getIdUser());
        claims.put("role", user.getRole().getTenRole());
        
        String accessToken = jwtUtil.generateToken(user.getUsername(), claims);
        String refreshToken = generateRefreshToken();
        
        user.setRefreshToken(refreshToken);
        user.setRefreshTokenExpiry(LocalDateTime.now().plusDays(7));
        userRepository.save(user);
        
        log.info("User registered: {}", user.getUsername());
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getIdUser())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getTenRole())
                .build();
    }
    
    @Transactional(noRollbackFor = RuntimeException.class)
    public AuthResponse login(LoginRequest request) {
        // Verify Google reCAPTCHA token first (before any DB query)
        if (request.getRecaptchaToken() != null && !request.getRecaptchaToken().isBlank()) {
            try {
                reCaptchaVerificationService.verify(request.getRecaptchaToken());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException(e.getMessage());
            }
        }

        User user = userRepository.findByUsername(request.getUsernameOrEmail())
                .orElseGet(() -> userRepository.findByEmail(request.getUsernameOrEmail())
                        .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại")));
        
        int currentFails = user.getFailedLoginAttempts() != null ? user.getFailedLoginAttempts() : 0;
        if (currentFails >= CAPTCHA_THRESHOLD) {
            if (request.getCaptchaToken() == null || request.getCaptchaAnswer() == null) {
                CaptchaService.CaptchaChallenge challenge = captchaService.generateChallenge();
                return AuthResponse.builder()
                        .requiresCaptcha(true)
                        .captchaToken(challenge.captchaToken())
                        .captchaQuestion(challenge.question())
                        .build();
            }
            try {
                captchaService.validate(request.getCaptchaToken(), request.getCaptchaAnswer());
            } catch (IllegalArgumentException ex) {
                CaptchaService.CaptchaChallenge newChallenge = captchaService.generateChallenge();
                throw new RuntimeException(ex.getMessage() + "|captcha|" + newChallenge.captchaToken() + "|" + newChallenge.question());
            }
        }

        if (Boolean.TRUE.equals(user.getIsLocked())) {
            if (user.getLockedUntil() != null && user.getLockedUntil().isBefore(LocalDateTime.now())) {
                user.setIsLocked(false);
                user.setLockedUntil(null);
                user.setLockTimeHours(null);
                user.setFailedLoginAttempts(0);
                userRepository.save(user);
            } else if (user.getLockedUntil() != null) {
                throw new RuntimeException("Tài khoản đã bị khóa đến " + user.getLockedUntil());
            } else {
                throw new RuntimeException("Tài khoản đã bị khóa");
            }
        }
        
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            user.getUsername(),
                            request.getPassword()
                    )
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            user.setFailedLoginAttempts(0);
            userRepository.save(user);
            
            Map<String, Object> claims = new HashMap<>();
            claims.put("userId", user.getIdUser());
            claims.put("role", user.getRole().getTenRole());
            
            String accessToken = jwtUtil.generateToken(user.getUsername(), claims);
            String refreshToken = generateRefreshToken();
            
            user.setRefreshToken(refreshToken);
            user.setRefreshTokenExpiry(LocalDateTime.now().plusDays(7));
            userRepository.save(user);
            
            log.info("User logged in: {}", user.getUsername());
            
            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .tokenType("Bearer")
                    .userId(user.getIdUser())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .role(user.getRole().getTenRole())
                    .build();
            
        } catch (LockedException le) {
            throw new RuntimeException(le.getMessage());
        } catch (Exception e) {
            int remaining = handleFailedLogin(user);
            if (remaining <= 0) {
                throw new RuntimeException("Tài khoản đã bị khóa 1 tiếng do nhập sai mật khẩu quá 7 lần");
            }

            int newFails = user.getFailedLoginAttempts() != null ? user.getFailedLoginAttempts() : 0;
            String baseMsg = remaining <= 3
                    ? "Mật khẩu không đúng. Còn " + remaining + " lần thử trước khi tài khoản bị khóa"
                    : "Username hoặc mật khẩu không đúng";

            if (newFails >= CAPTCHA_THRESHOLD) {
                CaptchaService.CaptchaChallenge challenge = captchaService.generateChallenge();
                throw new RuntimeException(baseMsg + "|captcha|"
                        + challenge.captchaToken() + "|" + challenge.question());
            }

            throw new RuntimeException(baseMsg);
        }
    }
    
    private int handleFailedLogin(User user) {
        int failedAttempts = (user.getFailedLoginAttempts() != null ? user.getFailedLoginAttempts() : 0) + 1;
        user.setFailedLoginAttempts(failedAttempts);
        
        if (failedAttempts >= 7) {
            user.setIsLocked(true);
            user.setLockTimeHours(1);
            user.setLockedUntil(LocalDateTime.now().plusHours(1));
            user.setRefreshToken(null);
            user.setRefreshTokenExpiry(null);
            userRepository.save(user);
            log.warn("Account locked for 1 hour due to {} failed login attempts: {}", failedAttempts, user.getUsername());
            return 0;
        }
        
        userRepository.save(user);
        return 7 - failedAttempts;
    }
    
    public void requestPasswordReset(PasswordResetRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email không tồn tại trong hệ thống"));
        
        String otp = generateOTP();
        otpStorage.put(user.getEmail(), otp);
        otpExpiryStorage.put(user.getEmail(), LocalDateTime.now().plusMinutes(10));
        
        // Send OTP via real email
        try {
            emailService.sendOtpEmail(user.getEmail(), otp);
            log.info("OTP email sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send OTP email to: {}", user.getEmail(), e);
            // Still store OTP so user can retry
            log.warn("OTP email delivery failed for: {} (check email config)", user.getEmail());
        }
    }
    
    @Transactional
    public void confirmPasswordReset(String email, PasswordResetConfirmRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại"));
        
        String storedOtp = otpStorage.get(email);
        LocalDateTime expiry = otpExpiryStorage.get(email);

        if (storedOtp == null) {
            throw new RuntimeException("OTP không tồn tại. Vui lòng yêu cầu OTP mới");
        }

        if (expiry == null || LocalDateTime.now().isAfter(expiry)) {
            otpStorage.remove(email);
            otpExpiryStorage.remove(email);
            otpAttemptStorage.remove(email);
            throw new RuntimeException("OTP đã hết hạn. Vui lòng yêu cầu OTP mới");
        }

        int attempts = otpAttemptStorage.getOrDefault(email, 0) + 1;
        if (!storedOtp.equals(request.getOtp())) {
            if (attempts >= MAX_OTP_ATTEMPTS) {
                otpStorage.remove(email);
                otpExpiryStorage.remove(email);
                otpAttemptStorage.remove(email);
                throw new RuntimeException("OTP bị hủy sau " + MAX_OTP_ATTEMPTS + " lần nhập sai. Vui lòng yêu cầu OTP mới");
            }
            otpAttemptStorage.put(email, attempts);
            int remaining = MAX_OTP_ATTEMPTS - attempts;
            throw new RuntimeException("OTP không hợp lệ. Còn " + remaining + " lần thử");
        }
        
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setFailedLoginAttempts(0);
        user.setIsLocked(false);
        user.setLockedUntil(null);
        userRepository.save(user);
        
        otpStorage.remove(email);
        otpExpiryStorage.remove(email);
        otpAttemptStorage.remove(email);
    }
    
    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        User user = userRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new RuntimeException("Refresh token không hợp lệ"));
        
        if (user.getRefreshTokenExpiry() == null || 
            user.getRefreshTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Refresh token đã hết hạn");
        }
        
        if (user.getIsLocked()) {
            throw new RuntimeException("Tài khoản đã bị khóa");
        }
        
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getIdUser());
        claims.put("role", user.getRole().getTenRole());
        
        String newAccessToken = jwtUtil.generateToken(user.getUsername(), claims);
        String newRefreshToken = generateRefreshToken();
        
        user.setRefreshToken(newRefreshToken);
        user.setRefreshTokenExpiry(LocalDateTime.now().plusDays(7));
        userRepository.save(user);
        
        log.info("Refreshed token for user: {}", user.getUsername());
        
        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .userId(user.getIdUser())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getTenRole())
                .build();
    }
    
    @Transactional
    public void logout(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        user.setRefreshToken(null);
        user.setRefreshTokenExpiry(null);
        userRepository.save(user);
        
        SecurityContextHolder.clearContext();
        
        log.info("User logged out: {}", user.getUsername());
    }
    
    public void sendEmailVerification(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        if (user.getEmailVerified()) {
            throw new RuntimeException("Email đã được xác thực");
        }
        
        String email = user.getEmail();
        
        // Don't send to fake OAuth emails
        if (email.endsWith(".oauth")) {
            throw new RuntimeException("Email OAuth không hợp lệ. Vui lòng cập nhật email thật trong hồ sơ trước khi xác thực.");
        }
        
        String otp = generateOTP();
        otpStorage.put("verify_" + email, otp);
        otpExpiryStorage.put("verify_" + email, LocalDateTime.now().plusMinutes(10));
        
        try {
            emailService.sendEmailVerificationOtp(email, otp);
            log.info("Email verification OTP sent to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send verification email to: {}", email, e);
            log.warn("Verification email delivery failed for: {} (check email config)", email);
            throw new RuntimeException("Gửi email xác thực thất bại. Vui lòng thử lại.");
        }
    }
    
    @Transactional
    public void confirmEmailVerification(Long userId, String otp) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        String email = user.getEmail();
        String key = "verify_" + email;
        
        String storedOtp = otpStorage.get(key);
        LocalDateTime expiry = otpExpiryStorage.get(key);
        
        if (storedOtp == null || !storedOtp.equals(otp)) {
            throw new RuntimeException("Mã OTP không hợp lệ");
        }
        
        if (expiry == null || LocalDateTime.now().isAfter(expiry)) {
            otpStorage.remove(key);
            otpExpiryStorage.remove(key);
            throw new RuntimeException("Mã OTP đã hết hạn");
        }
        
        user.setEmailVerified(true);
        userRepository.save(user);
        
        otpStorage.remove(key);
        otpExpiryStorage.remove(key);
        
        log.info("Email verified for userId: {}", userId);
    }
    
    private String generateRefreshToken() {
        return UUID.randomUUID().toString();
    }
    
    private String generateOTP() {
        SecureRandom secureRandom = new SecureRandom();
        int otp = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(otp);
    }
}
