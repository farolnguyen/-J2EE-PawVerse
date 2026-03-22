package J2EE.PawVerse.controller;

import J2EE.PawVerse.dto.ApiResponse;
import J2EE.PawVerse.dto.user.*;
import J2EE.PawVerse.repository.UserRepository;
import J2EE.PawVerse.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import J2EE.PawVerse.util.ImageValidator;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN', 'STAFF')")
@Slf4j
public class UserController {
    
    private final UserService userService;
    private final UserRepository userRepository;
    
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserDTO>> getProfile(Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            log.info("GET /api/user/profile - UserId: {}", userId);
            
            UserDTO user = userService.getUserProfile(userId);
            log.debug("Retrieved profile for userId: {}", userId);
            
            return ResponseEntity.ok(ApiResponse.success(user));
        } catch (Exception e) {
            log.error("Error getting profile for userId: {}", authentication.getName(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserDTO>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            log.info("PUT /api/user/profile - UserId: {}", userId);
            
            UserDTO user = userService.updateProfile(userId, request);
            log.info("Successfully updated profile for userId: {}", userId);
            
            return ResponseEntity.ok(ApiResponse.success(user, "Cập nhật thông tin thành công"));
        } catch (Exception e) {
            log.error("Error updating profile for userId: {}", authentication.getName(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            log.info("PUT /api/user/change-password - UserId: {}", userId);
            
            userService.changePassword(userId, request);
            log.info("Successfully changed password for userId: {}", userId);
            
            return ResponseEntity.ok(ApiResponse.success(null, "Đổi mật khẩu thành công"));
        } catch (Exception e) {
            log.error("Error changing password for userId: {}", authentication.getName(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/avatar")
    public ResponseEntity<ApiResponse<String>> uploadAvatar(
            @RequestParam("avatar") MultipartFile file,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            log.info("POST /api/user/avatar - UserId: {}, FileSize: {} bytes", userId, file.getSize());
            
            try {
                ImageValidator.validate(file);
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
            }
            
            String avatarUrl = userService.uploadAvatar(userId, file);
            log.info("Successfully uploaded avatar for userId: {}, URL: {}", userId, avatarUrl);
            
            return ResponseEntity.ok(ApiResponse.success(avatarUrl, "Tải ảnh đại diện thành công"));
        } catch (Exception e) {
            log.error("Error uploading avatar for userId: {}", authentication.getName(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @DeleteMapping("/avatar")
    public ResponseEntity<ApiResponse<Void>> deleteAvatar(Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            log.info("DELETE /api/user/avatar - UserId: {}", userId);
            
            userService.deleteAvatar(userId);
            log.info("Successfully deleted avatar for userId: {}", userId);
            
            return ResponseEntity.ok(ApiResponse.success(null, "Xóa ảnh đại diện thành công"));
        } catch (Exception e) {
            log.error("Error deleting avatar for userId: {}", authentication.getName(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
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
