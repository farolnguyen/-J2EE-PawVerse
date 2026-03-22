package J2EE.PawVerse.controller;

import J2EE.PawVerse.dto.ApiResponse;
import J2EE.PawVerse.dto.pet.CreatePetProfileRequest;
import J2EE.PawVerse.dto.pet.PetProfileDTO;
import J2EE.PawVerse.entity.User;
import J2EE.PawVerse.repository.UserRepository;
import J2EE.PawVerse.service.PetProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import J2EE.PawVerse.util.ImageValidator;

import java.util.List;

@RestController
@RequestMapping("/api/user/pets")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN', 'STAFF')")
@Slf4j
public class PetProfileController {

    private final PetProfileService petProfileService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PetProfileDTO>>> getMyPets(Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            List<PetProfileDTO> pets = petProfileService.getMyPets(userId);
            return ResponseEntity.ok(ApiResponse.success(pets));
        } catch (Exception e) {
            log.error("Error getting pets", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{petId}")
    public ResponseEntity<ApiResponse<PetProfileDTO>> getPetById(
            Authentication authentication, @PathVariable Long petId) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            PetProfileDTO pet = petProfileService.getPetById(userId, petId);
            return ResponseEntity.ok(ApiResponse.success(pet));
        } catch (Exception e) {
            log.error("Error getting pet", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PetProfileDTO>> createPet(
            Authentication authentication, @Valid @RequestBody CreatePetProfileRequest request) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            PetProfileDTO pet = petProfileService.createPet(userId, request);
            return ResponseEntity.ok(ApiResponse.success(pet));
        } catch (Exception e) {
            log.error("Error creating pet", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{petId}")
    public ResponseEntity<ApiResponse<PetProfileDTO>> updatePet(
            Authentication authentication, @PathVariable Long petId,
            @Valid @RequestBody CreatePetProfileRequest request) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            PetProfileDTO pet = petProfileService.updatePet(userId, petId, request);
            return ResponseEntity.ok(ApiResponse.success(pet));
        } catch (Exception e) {
            log.error("Error updating pet", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{petId}")
    public ResponseEntity<ApiResponse<Void>> deletePet(
            Authentication authentication, @PathVariable Long petId) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            petProfileService.deletePet(userId, petId);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            log.error("Error deleting pet", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{petId}/avatar")
    public ResponseEntity<ApiResponse<String>> uploadPetAvatar(
            Authentication authentication, @PathVariable Long petId,
            @RequestParam("avatar") MultipartFile file) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            try {
                ImageValidator.validate(file);
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
            }
            String avatarUrl = petProfileService.uploadPetAvatar(userId, petId, file);
            return ResponseEntity.ok(ApiResponse.success(avatarUrl, "Tải ảnh thú cưng thành công"));
        } catch (Exception e) {
            log.error("Error uploading pet avatar", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{petId}/avatar")
    public ResponseEntity<ApiResponse<Void>> deletePetAvatar(
            Authentication authentication, @PathVariable Long petId) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            petProfileService.deletePetAvatar(userId, petId);
            return ResponseEntity.ok(ApiResponse.success(null, "Xóa ảnh thú cưng thành công"));
        } catch (Exception e) {
            log.error("Error deleting pet avatar", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    private Long getUserIdFromAuth(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        return user.getIdUser();
    }
}
