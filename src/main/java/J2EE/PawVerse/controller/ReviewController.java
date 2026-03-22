package J2EE.PawVerse.controller;

import J2EE.PawVerse.dto.ApiResponse;
import J2EE.PawVerse.dto.review.*;
import J2EE.PawVerse.entity.User;
import J2EE.PawVerse.repository.UserRepository;
import J2EE.PawVerse.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class ReviewController {
    
    private final ReviewService reviewService;
    private final UserRepository userRepository;
    
    @PostMapping("/user/reviews")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<ReviewDTO>> createReview(
            @Valid @RequestBody CreateReviewRequest request,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            ReviewDTO review = reviewService.createReview(userId, request);
            return ResponseEntity.ok(ApiResponse.success(review, "Đánh giá thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/user/reviews/{reviewId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<ReviewDTO>> updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody UpdateReviewRequest request,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            ReviewDTO review = reviewService.updateReview(reviewId, userId, request);
            return ResponseEntity.ok(ApiResponse.success(review, "Cập nhật đánh giá thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/user/reviews/{reviewId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long reviewId,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            reviewService.deleteReview(reviewId, userId);
            return ResponseEntity.ok(ApiResponse.success(null, "Xóa đánh giá thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/public/products/{productId}/reviews")
    public ResponseEntity<ApiResponse<Page<ReviewDTO>>> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<ReviewDTO> reviews = reviewService.getProductReviews(productId, rating, pageable);
            return ResponseEntity.ok(ApiResponse.success(reviews));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/public/products/{productId}/reviews/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRatingDistribution(
            @PathVariable Long productId) {
        try {
            Map<String, Object> stats = reviewService.getRatingDistribution(productId);
            return ResponseEntity.ok(ApiResponse.success(stats));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/user/reviews/can-review/{productId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Boolean>> canUserReviewProduct(
            @PathVariable Long productId,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            boolean canReview = reviewService.canUserReviewProduct(userId, productId);
            return ResponseEntity.ok(ApiResponse.success(canReview));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/user/reviews")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Page<ReviewDTO>>> getUserReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            Pageable pageable = PageRequest.of(page, size);
            Page<ReviewDTO> reviews = reviewService.getUserReviews(userId, pageable);
            return ResponseEntity.ok(ApiResponse.success(reviews));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Staff reply endpoint
    @PostMapping("/staff/reviews/{reviewId}/reply")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<ApiResponse<ReviewDTO>> addStaffReply(
            @PathVariable Long reviewId,
            @Valid @RequestBody StaffReplyRequest request,
            Authentication authentication) {
        try {
            Long staffUserId = getUserIdFromAuth(authentication);
            ReviewDTO review = reviewService.addStaffReply(reviewId, staffUserId, request);
            return ResponseEntity.ok(ApiResponse.success(review, "Phản hồi thành công"));
        } catch (Exception e) {
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
