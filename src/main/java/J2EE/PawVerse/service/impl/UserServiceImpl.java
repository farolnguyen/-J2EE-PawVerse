package J2EE.PawVerse.service.impl;

import J2EE.PawVerse.dto.user.*;
import J2EE.PawVerse.entity.Role;
import J2EE.PawVerse.entity.User;
import J2EE.PawVerse.repository.ReviewRepository;
import J2EE.PawVerse.repository.RoleRepository;
import J2EE.PawVerse.repository.UserRepository;
import J2EE.PawVerse.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;
    
    private static final String UPLOAD_DIR = "uploads/avatars/";
    
    @Override
    public UserDTO getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        return mapToDTO(user);
    }
    
    @Override
    @Transactional
    public UserDTO updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email đã được sử dụng");
            }
            user.setEmail(request.getEmail());
        }
        
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        
        if (request.getSoDienThoai() != null) {
            user.setSoDienThoai(request.getSoDienThoai());
        }
        
        if (request.getDiaChi() != null) {
            user.setDiaChi(request.getDiaChi());
        }
        
        if (request.getPhuongXa() != null) {
            user.setPhuongXa(request.getPhuongXa());
        }
        
        if (request.getQuanHuyen() != null) {
            user.setQuanHuyen(request.getQuanHuyen());
        }
        
        if (request.getTinhThanhPho() != null) {
            user.setTinhThanhPho(request.getTinhThanhPho());
        }
        
        if (request.getNgaySinh() != null) {
            user.setNgaySinh(request.getNgaySinh());
        }
        
        if (request.getGioiTinh() != null) {
            user.setGioiTinh(request.getGioiTinh());
        }
        
        user = userRepository.save(user);
        log.info("Updated profile for userId: {}", userId);
        
        return mapToDTO(user);
    }
    
    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu hiện tại không đúng");
        }
        
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Mật khẩu xác nhận không khớp");
        }
        
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        
        log.info("Changed password for userId: {}", userId);
    }
    
    @Override
    @Transactional
    public String uploadAvatar(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            String originalFilename = file.getOriginalFilename();
            String fileExtension = originalFilename != null && originalFilename.contains(".") 
                    ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                    : "";
            
            String filename = UUID.randomUUID().toString() + fileExtension;
            Path filePath = uploadPath.resolve(filename);
            
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            if (user.getAvatar() != null && !user.getAvatar().isEmpty()) {
                deleteAvatarFile(user.getAvatar());
            }
            
            String avatarUrl = "/uploads/avatars/" + filename;
            user.setAvatar(avatarUrl);
            userRepository.save(user);
            
            log.info("Uploaded avatar for userId: {}, filename: {}", userId, filename);
            
            return avatarUrl;
            
        } catch (IOException e) {
            log.error("Error uploading avatar for userId: {}", userId, e);
            throw new RuntimeException("Lỗi khi tải lên ảnh đại diện: " + e.getMessage());
        }
    }
    
    @Override
    @Transactional
    public void deleteAvatar(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        if (user.getAvatar() != null && !user.getAvatar().isEmpty()) {
            deleteAvatarFile(user.getAvatar());
            user.setAvatar(null);
            userRepository.save(user);
            
            log.info("Deleted avatar for userId: {}", userId);
        }
    }
    
    @Override
    public Page<UserDTO> getAllUsers(String search, String role, String status, Pageable pageable) {
        Page<User> users;
        boolean hasSearch = search != null && !search.trim().isEmpty();
        boolean hasRole = role != null && !role.trim().isEmpty();
        boolean hasStatus = status != null && !status.trim().isEmpty();
        
        if (hasStatus) {
            boolean locked = "locked".equalsIgnoreCase(status);
            if (hasSearch) {
                users = userRepository.findByLockedStatusAndSearch(locked, search, pageable);
            } else {
                users = userRepository.findByLockedStatus(locked, pageable);
            }
        } else if (hasRole) {
            if (hasSearch) {
                users = userRepository.findByRoleAndSearch(role, search, pageable);
            } else {
                users = userRepository.findByRoleTenRole(role, pageable);
            }
        } else if (hasSearch) {
            users = userRepository.findByUsernameContainingOrEmailContainingOrFullNameContaining(
                    search, search, search, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }
        
        return users.map(this::mapToDTO);
    }
    
    @Override
    @Transactional
    public UserDTO updateUserRole(Long userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        if (isFirstAdmin(user)) {
            throw new RuntimeException("Không thể thay đổi vai trò của Admin đầu tiên");
        }
        
        Role role = roleRepository.findByTenRole(roleName)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vai trò: " + roleName));
        
        user.setRole(role);
        user = userRepository.save(user);
        
        log.info("Updated role for userId: {} to {}", userId, roleName);
        
        return mapToDTO(user);
    }
    
    @Override
    @Transactional
    public void lockUser(Long userId, LockUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        if (isFirstAdmin(user)) {
            throw new RuntimeException("Không thể khóa tài khoản Admin đầu tiên");
        }
        
        user.setIsLocked(true);
        
        Integer hours = request != null ? request.getLockTimeHours() : null;
        if (hours == null || hours <= 0) {
            hours = 999;
        }
        user.setLockTimeHours(hours);
        
        if (hours == 999) {
            user.setLockedUntil(null);
        } else {
            user.setLockedUntil(LocalDateTime.now().plusHours(hours));
        }
        
        user.setRefreshToken(null);
        user.setRefreshTokenExpiry(null);
        
        userRepository.save(user);
        log.info("Locked userId: {} for {} hours", userId, hours);
    }
    
    @Override
    @Transactional
    public void unlockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        user.setIsLocked(false);
        user.setLockTimeHours(null);
        user.setLockedUntil(null);
        user.setFailedLoginAttempts(0);
        
        userRepository.save(user);
        log.info("Unlocked userId: {}", userId);
    }
    
    @Override
    @Transactional
    public void toggleUserStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        if (isFirstAdmin(user)) {
            throw new RuntimeException("Không thể thay đổi trạng thái Admin đầu tiên");
        }
        
        if (user.getIsLocked()) {
            unlockUser(userId);
        } else {
            lockUser(userId, LockUserRequest.builder().lockTimeHours(999).build());
        }
    }
    
    @Override
    public Map<String, Object> getUserStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalAdmins", userRepository.countByRoleName("ADMIN"));
        stats.put("totalStaff", userRepository.countByRoleName("STAFF"));
        stats.put("totalCustomers", userRepository.countByRoleName("USER"));
        stats.put("lockedUsers", userRepository.countByIsLocked(true));
        return stats;
    }
    
    @Override
    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (isFirstAdmin(user)) {
            throw new RuntimeException("Không thể xóa tài khoản Admin đầu tiên");
        }

        if (user.getAvatar() != null && !user.getAvatar().isEmpty()) {
            deleteAvatarFile(user.getAvatar());
        }

        // Nullify staff_reply_user FK in reviews before deleting (other users' reviews)
        reviewRepository.nullifyStaffReplyUser(userId);

        // CascadeType.ALL on User handles: orders, order_items, wishlists, reviews, petProfiles, cart
        userRepository.delete(user);
        log.info("Deleted userId: {}", userId);
    }
    
    private void deleteAvatarFile(String avatarUrl) {
        try {
            String filename = avatarUrl.substring(avatarUrl.lastIndexOf("/") + 1);
            Path filePath = Paths.get(UPLOAD_DIR).resolve(filename);
            
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.debug("Deleted avatar file: {}", filename);
            }
        } catch (IOException e) {
            log.error("Error deleting avatar file: {}", avatarUrl, e);
        }
    }
    
    private boolean isFirstAdmin(User user) {
        if (!"ADMIN".equals(user.getRole().getTenRole())) return false;
        List<User> admins = userRepository.findByRoleNameOrderByIdUserAsc("ADMIN");
        return !admins.isEmpty() && admins.get(0).getIdUser().equals(user.getIdUser());
    }
    
    private UserDTO mapToDTO(User user) {
        return UserDTO.builder()
                .idUser(user.getIdUser())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .soDienThoai(user.getSoDienThoai())
                .diaChi(user.getDiaChi())
                .phuongXa(user.getPhuongXa())
                .quanHuyen(user.getQuanHuyen())
                .tinhThanhPho(user.getTinhThanhPho())
                .ngaySinh(user.getNgaySinh())
                .gioiTinh(user.getGioiTinh())
                .avatar(user.getAvatar())
                .roleName(user.getRole().getTenRole())
                .isLocked(user.getIsLocked())
                .lockTimeHours(user.getLockTimeHours())
                .lockedUntil(user.getLockedUntil())
                .failedLoginAttempts(user.getFailedLoginAttempts())
                .emailVerified(user.getEmailVerified())
                .oauthProvider(user.getOauthProvider())
                .createdAt(user.getNgayTao())
                .updatedAt(user.getNgayCapNhat())
                .isFirstAdmin(isFirstAdmin(user))
                .build();
    }
}
