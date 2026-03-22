package J2EE.PawVerse.service;

import J2EE.PawVerse.dto.user.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

public interface UserService {
    
    UserDTO getUserProfile(Long userId);
    
    UserDTO updateProfile(Long userId, UpdateProfileRequest request);
    
    void changePassword(Long userId, ChangePasswordRequest request);
    
    String uploadAvatar(Long userId, MultipartFile file);
    
    void deleteAvatar(Long userId);
    
    Page<UserDTO> getAllUsers(String search, String role, String status, Pageable pageable);
    
    UserDTO updateUserRole(Long userId, String role);
    
    void lockUser(Long userId, LockUserRequest request);
    
    void unlockUser(Long userId);
    
    void toggleUserStatus(Long userId);
    
    void deleteUser(Long userId);
    
    Map<String, Object> getUserStats();
}
