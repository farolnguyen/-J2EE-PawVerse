package J2EE.PawVerse.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDTO {
    
    private Long reviewId;
    private Long productId;
    private String productName;
    private String productThumbnail;
    private Long userId;
    private String userName;
    private String userFullName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isVerifiedPurchase;

    // Content moderation
    private String contentWarningLevel;
    private Boolean isHidden;

    // Edit tracking
    private Integer editCount;

    // Staff reply
    private String staffReply;
    private String staffReplyUserName;
    private LocalDateTime staffReplyDate;
}
