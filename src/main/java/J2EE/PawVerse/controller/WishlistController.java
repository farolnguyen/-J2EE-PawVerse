package J2EE.PawVerse.controller;

import J2EE.PawVerse.dto.ApiResponse;
import J2EE.PawVerse.dto.wishlist.*;
import J2EE.PawVerse.repository.UserRepository;
import J2EE.PawVerse.service.WishlistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/wishlist")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN', 'STAFF')")
@Slf4j
public class WishlistController {
    
    private final WishlistService wishlistService;
    private final UserRepository userRepository;
    
    @PostMapping
    public ResponseEntity<ApiResponse<WishlistDTO>> addToWishlist(
            @Valid @RequestBody AddToWishlistRequest request,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            log.info("POST /api/user/wishlist - UserId: {}, ProductId: {}", userId, request.getProductId());
            
            WishlistDTO wishlist = wishlistService.addToWishlist(userId, request);
            log.debug("Successfully added product to wishlist for userId: {}", userId);
            
            return ResponseEntity.ok(ApiResponse.success(wishlist, "Đã thêm vào danh sách yêu thích"));
        } catch (Exception e) {
            log.error("Error adding to wishlist for userId: {}", authentication.getName(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/add")
    public ResponseEntity<ApiResponse<WishlistDTO>> addToWishlistAlias(
            @Valid @RequestBody AddToWishlistRequest request,
            Authentication authentication) {
        return addToWishlist(request, authentication);
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<WishlistDTO>>> getWishlist(
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            List<WishlistDTO> wishlist = wishlistService.getUserWishlist(userId);
            return ResponseEntity.ok(ApiResponse.success(wishlist));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{wishlistId}")
    public ResponseEntity<ApiResponse<Void>> removeFromWishlist(
            @PathVariable Long wishlistId,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            log.info("DELETE /api/user/wishlist/{} - UserId: {}", wishlistId, userId);
            
            wishlistService.removeFromWishlist(wishlistId, userId);
            log.debug("Successfully removed from wishlist for userId: {}", userId);
            
            return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa khỏi danh sách yêu thích"));
        } catch (Exception e) {
            log.error("Error removing from wishlist {} for userId: {}", wishlistId, authentication.getName(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @DeleteMapping("/items/{wishlistId}")
    public ResponseEntity<ApiResponse<Void>> removeFromWishlistAlias(
            @PathVariable Long wishlistId,
            Authentication authentication) {
        return removeFromWishlist(wishlistId, authentication);
    }
    
    @DeleteMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<Void>> removeProductFromWishlist(
            @PathVariable Long productId,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            wishlistService.removeProductFromWishlist(userId, productId);
            return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa khỏi danh sách yêu thích"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/check/{productId}")
    public ResponseEntity<ApiResponse<Boolean>> checkInWishlist(
            @PathVariable Long productId,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            boolean inWishlist = wishlistService.isInWishlist(userId, productId);
            return ResponseEntity.ok(ApiResponse.success(inWishlist));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    private Long getUserIdFromAuth(Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String username = userDetails.getUsername();
            
            log.debug("Extracting userId for username: {}", username);
            
            Long userId = userRepository.findByUsername(username)
                    .map(user -> {
                        log.debug("Found user with ID: {} for username: {}", user.getIdUser(), username);
                        return user.getIdUser();
                    })
                    .orElseThrow(() -> {
                        log.error("User not found for username: {}", username);
                        return new RuntimeException("User not found: " + username);
                    });
            
            return userId;
        } catch (Exception e) {
            log.error("Error extracting userId from authentication", e);
            throw new RuntimeException("Failed to extract user information", e);
        }
    }
}
