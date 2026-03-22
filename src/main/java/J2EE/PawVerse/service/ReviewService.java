package J2EE.PawVerse.service;

import J2EE.PawVerse.dto.review.*;
import J2EE.PawVerse.entity.*;
import J2EE.PawVerse.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {
    
    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ProfanityFilterService profanityFilterService;
    
    @Transactional
    public ReviewDTO createReview(Long userId, CreateReviewRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        // Check product is still enabled (not deleted)
        if (!product.getIsEnabled()) {
            throw new RuntimeException("Sản phẩm này đã bị xóa, không thể đánh giá");
        }

        // Find unreviewed delivered orders for this product (most recent first)
        // Each delivered order that hasn't been reviewed yet is eligible for a new review
        List<Order> unreviewedOrders = orderRepository.findUnreviewedDeliveredOrdersForUserProduct(userId, request.getProductId());
        if (unreviewedOrders.isEmpty()) {
            // Check if the user has purchased at all — give a more helpful error
            if (!reviewRepository.hasUserPurchasedAndDelivered(userId, request.getProductId())) {
                throw new RuntimeException("Bạn chỉ có thể đánh giá sản phẩm từ đơn hàng đã giao thành công");
            }
            throw new RuntimeException("Bạn đã đánh giá tất cả các lần mua sản phẩm này rồi");
        }
        Order order = unreviewedOrders.get(0);

        // Guard against race condition: same order already reviewed
        if (reviewRepository.existsByUserIdUserAndProductIdProductAndOrderIdOrder(
                userId, request.getProductId(), order.getIdOrder())) {
            throw new RuntimeException("Đơn hàng này đã được đánh giá rồi");
        }

        // Profanity check
        String warningLevel = profanityFilterService.analyzeContent(request.getComment());
        if ("SEVERE".equals(warningLevel)) {
            throw new RuntimeException("Bình luận chứa nội dung không phù hợp và vi phạm quy tắc cộng đồng. Vui lòng chỉnh sửa lại nội dung.");
        }
        
        boolean isHidden = "MILD".equals(warningLevel);
        
        Review review = Review.builder()
                .user(user)
                .product(product)
                .order(order)
                .rating(request.getRating())
                .comment(request.getComment())
                .isVerifiedPurchase(true)
                .contentWarningLevel(warningLevel)
                .isHidden(isHidden)
                .build();
        
        review = reviewRepository.save(review);
        updateProductRating(product);
        
        log.info("User {} created review for product {} (warning: {})", userId, request.getProductId(), warningLevel);
        return convertToDTO(review);
    }

    @Transactional
    public ReviewDTO updateReview(Long reviewId, Long userId, UpdateReviewRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá"));
        
        if (!review.getUser().getIdUser().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa đánh giá này");
        }

        if (review.getIsDeleted()) {
            throw new RuntimeException("Đánh giá đã bị xóa");
        }

        if (review.getEditCount() >= 2) {
            throw new RuntimeException("Bạn đã chỉnh sửa đánh giá tối đa 2 lần");
        }

        // Profanity check on new content
        String warningLevel = profanityFilterService.analyzeContent(request.getComment());
        if ("SEVERE".equals(warningLevel)) {
            throw new RuntimeException("Bình luận chứa nội dung không phù hợp và vi phạm quy tắc cộng đồng. Vui lòng chỉnh sửa lại nội dung.");
        }

        boolean isHidden = "MILD".equals(warningLevel);

        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setEditCount(review.getEditCount() + 1);
        review.setContentWarningLevel(warningLevel);
        review.setIsHidden(isHidden);

        review = reviewRepository.save(review);
        updateProductRating(review.getProduct());

        log.info("User {} updated review {} (edit #{}, warning: {})", userId, reviewId, review.getEditCount(), warningLevel);
        return convertToDTO(review);
    }
    
    @Transactional
    public void deleteReview(Long reviewId, Long userId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá"));
        
        if (!review.getUser().getIdUser().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền xóa đánh giá này");
        }

        if (review.getIsDeleted()) {
            throw new RuntimeException("Đánh giá đã bị xóa");
        }
        
        // Soft delete
        review.setIsDeleted(true);
        reviewRepository.save(review);
        
        updateProductRating(review.getProduct());
        log.info("User {} deleted review {}", userId, reviewId);
    }

    @Transactional
    public ReviewDTO addStaffReply(Long reviewId, Long staffUserId, StaffReplyRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá"));

        if (review.getIsDeleted()) {
            throw new RuntimeException("Không thể phản hồi đánh giá đã xóa");
        }

        if (review.getStaffReply() != null && !review.getStaffReply().isBlank()) {
            throw new RuntimeException("Đánh giá này đã được phản hồi rồi");
        }

        User staffUser = userRepository.findById(staffUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên"));

        // Profanity check on staff reply too
        String warningLevel = profanityFilterService.analyzeContent(request.getReply());
        if ("SEVERE".equals(warningLevel)) {
            throw new RuntimeException("Phản hồi chứa nội dung không phù hợp.");
        }

        review.setStaffReply(request.getReply());
        review.setStaffReplyUser(staffUser);
        review.setStaffReplyDate(LocalDateTime.now());

        review = reviewRepository.save(review);
        log.info("Staff {} replied to review {}", staffUserId, reviewId);
        return convertToDTO(review);
    }

    @Transactional(readOnly = true)
    public Page<ReviewDTO> getProductReviews(Long productId, Integer ratingFilter, Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByProductWithRatingFilter(productId, ratingFilter, pageable);
        return reviews.map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getRatingDistribution(Long productId) {
        List<Object[]> raw = reviewRepository.getRatingDistribution(productId);
        Map<Integer, Long> distribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) distribution.put(i, 0L);
        long total = 0;
        double sum = 0;
        for (Object[] row : raw) {
            Integer rating = (Integer) row[0];
            Long count = (Long) row[1];
            distribution.put(rating, count);
            total += count;
            sum += rating * count;
        }
        Map<String, Object> result = new HashMap<>();
        result.put("distribution", distribution);
        result.put("totalReviews", total);
        result.put("avgRating", total > 0 ? Math.round((sum / total) * 10.0) / 10.0 : 0.0);
        return result;
    }
    
    @Transactional(readOnly = true)
    public Page<ReviewDTO> getUserReviews(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        Page<Review> reviews = reviewRepository.findByUserOrderByNgayTaoDesc(user, pageable);
        return reviews.map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public boolean canUserReviewProduct(Long userId, Long productId) {
        // True if there is at least one delivered order for this product that hasn't been reviewed yet
        return reviewRepository.hasUnreviewedDeliveredPurchase(userId, productId);
    }
    
    private void updateProductRating(Product product) {
        Double avgRating = reviewRepository.calculateAverageRating(product.getIdProduct());
        long totalReviews = reviewRepository.countByProductId(product.getIdProduct());
        
        product.setAvgRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0);
        product.setTotalReviews((int) totalReviews);
        productRepository.save(product);
    }
    
    private ReviewDTO convertToDTO(Review review) {
        return ReviewDTO.builder()
                .reviewId(review.getIdReview())
                .productId(review.getProduct().getIdProduct())
                .productName(review.getProduct().getTenProduct())
                .productThumbnail(null)
                .userId(review.getUser().getIdUser())
                .userName(review.getUser().getUsername())
                .userFullName(review.getUser().getFullName())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getNgayTao())
                .updatedAt(review.getNgayCapNhat())
                .isVerifiedPurchase(review.getIsVerifiedPurchase())
                .contentWarningLevel(review.getContentWarningLevel())
                .isHidden(review.getIsHidden())
                .editCount(review.getEditCount())
                .staffReply(review.getStaffReply())
                .staffReplyUserName(review.getStaffReplyUser() != null ? review.getStaffReplyUser().getFullName() : null)
                .staffReplyDate(review.getStaffReplyDate())
                .build();
    }
}
