package J2EE.PawVerse.service;

import J2EE.PawVerse.dto.pet.CreatePetProfileRequest;
import J2EE.PawVerse.dto.pet.PetProfileDTO;
import J2EE.PawVerse.entity.PetProfile;
import J2EE.PawVerse.entity.User;
import J2EE.PawVerse.repository.PetProfileRepository;
import J2EE.PawVerse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PetProfileService {

    private final PetProfileRepository petProfileRepository;
    private final UserRepository userRepository;

    private static final String PET_UPLOAD_DIR = "uploads/pets/";

    @Transactional(readOnly = true)
    public List<PetProfileDTO> getMyPets(Long userId) {
        return petProfileRepository.findByUserIdUser(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PetProfileDTO getPetById(Long userId, Long petId) {
        PetProfile pet = petProfileRepository.findById(petId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thú cưng"));
        if (!pet.getUser().getIdUser().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền xem thú cưng này");
        }
        return toDTO(pet);
    }

    @Transactional
    public PetProfileDTO createPet(Long userId, CreatePetProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        PetProfile pet = PetProfile.builder()
                .user(user)
                .tenPet(request.getTenPet())
                .loaiPet(request.getLoaiPet())
                .giong(request.getGiong())
                .tuoi(request.getTuoi())
                .gioiTinh(request.getGioiTinh())
                .canNang(request.getCanNang())
                .anhPet(request.getAnhPet())
                .build();

        pet = petProfileRepository.save(pet);
        log.info("Created pet profile '{}' for userId: {}", pet.getTenPet(), userId);
        return toDTO(pet);
    }

    @Transactional
    public PetProfileDTO updatePet(Long userId, Long petId, CreatePetProfileRequest request) {
        PetProfile pet = petProfileRepository.findById(petId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thú cưng"));
        if (!pet.getUser().getIdUser().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa thú cưng này");
        }

        pet.setTenPet(request.getTenPet());
        pet.setLoaiPet(request.getLoaiPet());
        pet.setGiong(request.getGiong());
        pet.setTuoi(request.getTuoi());
        pet.setGioiTinh(request.getGioiTinh());
        pet.setCanNang(request.getCanNang());
        if (request.getAnhPet() != null) {
            pet.setAnhPet(request.getAnhPet());
        }

        pet = petProfileRepository.save(pet);
        log.info("Updated pet profile '{}' (id={}) for userId: {}", pet.getTenPet(), petId, userId);
        return toDTO(pet);
    }

    @Transactional
    public void deletePet(Long userId, Long petId) {
        PetProfile pet = petProfileRepository.findById(petId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thú cưng"));
        if (!pet.getUser().getIdUser().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền xóa thú cưng này");
        }
        petProfileRepository.delete(pet);
        log.info("Deleted pet profile id={} for userId: {}", petId, userId);
    }

    @Transactional
    public String uploadPetAvatar(Long userId, Long petId, MultipartFile file) {
        PetProfile pet = petProfileRepository.findById(petId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thú cưng"));
        if (!pet.getUser().getIdUser().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa thú cưng này");
        }

        try {
            Path uploadPath = Paths.get(PET_UPLOAD_DIR);
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

            if (pet.getAnhPet() != null && !pet.getAnhPet().isEmpty()) {
                deletePetAvatarFile(pet.getAnhPet());
            }

            String avatarUrl = "/uploads/pets/" + filename;
            pet.setAnhPet(avatarUrl);
            petProfileRepository.save(pet);
            log.info("Uploaded pet avatar for petId={}, userId={}", petId, userId);
            return avatarUrl;
        } catch (IOException e) {
            log.error("Error uploading pet avatar for petId={}", petId, e);
            throw new RuntimeException("Lỗi khi tải lên ảnh thú cưng: " + e.getMessage());
        }
    }

    @Transactional
    public void deletePetAvatar(Long userId, Long petId) {
        PetProfile pet = petProfileRepository.findById(petId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thú cưng"));
        if (!pet.getUser().getIdUser().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa thú cưng này");
        }
        if (pet.getAnhPet() != null && !pet.getAnhPet().isEmpty()) {
            deletePetAvatarFile(pet.getAnhPet());
            pet.setAnhPet(null);
            petProfileRepository.save(pet);
            log.info("Deleted pet avatar for petId={}, userId={}", petId, userId);
        }
    }

    private void deletePetAvatarFile(String avatarUrl) {
        try {
            String filename = avatarUrl.replace("/uploads/pets/", "");
            Path filePath = Paths.get(PET_UPLOAD_DIR).resolve(filename);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.warn("Failed to delete pet avatar file: {}", avatarUrl, e);
        }
    }

    private PetProfileDTO toDTO(PetProfile pet) {
        return PetProfileDTO.builder()
                .idPet(pet.getIdPet())
                .tenPet(pet.getTenPet())
                .loaiPet(pet.getLoaiPet())
                .giong(pet.getGiong())
                .tuoi(pet.getTuoi())
                .gioiTinh(pet.getGioiTinh())
                .canNang(pet.getCanNang())
                .anhPet(pet.getAnhPet())
                .ngayTao(pet.getNgayTao())
                .ngayCapNhat(pet.getNgayCapNhat())
                .build();
    }
}
