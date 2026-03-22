package J2EE.PawVerse.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews", uniqueConstraints = {
    @UniqueConstraint(name = "uq_review_user_product_order", columnNames = {"id_user", "id_product", "id_order"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_review")
    private Long idReview;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_user", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_product", nullable = false)
    private Product product;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_order", nullable = false)
    private Order order;
    
    @Column(name = "rating", nullable = false)
    private Integer rating;
    
    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;
    
    @Column(name = "is_verified_purchase")
    @Builder.Default
    private Boolean isVerifiedPurchase = false;
    
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    // Content moderation: NONE, MILD (auto-hidden), SEVERE (blocked)
    @Column(name = "content_warning_level")
    @Builder.Default
    private String contentWarningLevel = "NONE";

    // Hidden reviews (due to mild profanity) — user can choose to reveal
    @Column(name = "is_hidden", nullable = false)
    @Builder.Default
    private Boolean isHidden = false;

    // Track edit count — user can edit max 2 times
    @Column(name = "edit_count", nullable = false)
    @Builder.Default
    private Integer editCount = 0;

    // Staff reply fields
    @Column(name = "staff_reply", columnDefinition = "TEXT")
    private String staffReply;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_staff_reply_user")
    private User staffReplyUser;

    @Column(name = "staff_reply_date")
    private LocalDateTime staffReplyDate;
}
