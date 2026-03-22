package J2EE.PawVerse.dto.review;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffReplyRequest {
    
    @NotBlank(message = "Nội dung phản hồi không được để trống")
    @Size(min = 5, max = 1000, message = "Nội dung phản hồi phải từ 5 đến 1000 ký tự")
    private String reply;
}
