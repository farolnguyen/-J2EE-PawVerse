package J2EE.PawVerse.util;

import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

/**
 * Validates uploaded image files for allowed MIME types and maximum size.
 */
public class ImageValidator {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    private static final long MAX_SIZE_BYTES = 5L * 1024 * 1024; // 5 MB

    private ImageValidator() {}

    /**
     * Validate a MultipartFile as an image.
     * @throws IllegalArgumentException with a user-friendly message if invalid.
     */
    public static void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File ảnh không được để trống");
        }

        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException(
                "Kích thước ảnh không được vượt quá 5MB (hiện tại: "
                + String.format("%.2f", file.getSize() / (1024.0 * 1024.0)) + "MB)"
            );
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                "Định dạng ảnh không hợp lệ. Chỉ chấp nhận: JPG, PNG, WebP, GIF"
            );
        }
    }
}
