package J2EE.PawVerse.controller;

import J2EE.PawVerse.dto.ApiResponse;
import J2EE.PawVerse.dto.cart.*;
import J2EE.PawVerse.repository.UserRepository;
import J2EE.PawVerse.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/cart")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN', 'STAFF')")
@Slf4j
public class CartController {
    
    private final CartService cartService;
    private final UserRepository userRepository;
    
    @GetMapping
    public ResponseEntity<ApiResponse<CartDTO>> getCart(Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            log.info("GET /api/user/cart - UserId: {}", userId);
            
            CartDTO cart = cartService.getCart(userId);
            log.debug("Retrieved cart with {} items for userId: {}", 
                    cart.getItems() != null ? cart.getItems().size() : 0, userId);
            
            return ResponseEntity.ok(ApiResponse.success(cart));
        } catch (Exception e) {
            log.error("Error getting cart", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/add")
    public ResponseEntity<ApiResponse<CartDTO>> addToCart(
            @Valid @RequestBody AddToCartRequest request,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            log.info("POST /api/user/cart/add - UserId: {}, ProductId: {}, Quantity: {}", 
                    userId, request.getProductId(), request.getQuantity());
            
            CartDTO cart = cartService.addToCart(userId, request);
            log.debug("Successfully added product to cart for userId: {}", userId);
            
            return ResponseEntity.ok(ApiResponse.success(cart, "Đã thêm vào giỏ hàng"));
        } catch (Exception e) {
            log.error("Error adding to cart - UserId: {}, ProductId: {}", 
                    authentication.getName(), request.getProductId(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/items/{cartItemId}")
    public ResponseEntity<ApiResponse<CartDTO>> updateCartItem(
            @PathVariable Long cartItemId,
            @Valid @RequestBody UpdateCartItemRequest request,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            log.info("PUT /api/user/cart/items/{} - UserId: {}, NewQuantity: {}", 
                    cartItemId, userId, request.getQuantity());
            
            CartDTO cart = cartService.updateCartItem(userId, cartItemId, request);
            log.debug("Successfully updated cart item {} for userId: {}", cartItemId, userId);
            
            return ResponseEntity.ok(ApiResponse.success(cart, "Cập nhật giỏ hàng thành công"));
        } catch (Exception e) {
            log.error("Error updating cart item {} for userId: {}", cartItemId, authentication.getName(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<ApiResponse<CartDTO>> removeCartItem(
            @PathVariable Long cartItemId,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            log.info("DELETE /api/user/cart/items/{} - UserId: {}", cartItemId, userId);
            
            CartDTO cart = cartService.removeCartItem(userId, cartItemId);
            log.debug("Successfully removed cart item {} for userId: {}", cartItemId, userId);
            
            return ResponseEntity.ok(ApiResponse.success(cart, "Đã xóa khỏi giỏ hàng"));
        } catch (Exception e) {
            log.error("Error removing cart item {} for userId: {}", cartItemId, authentication.getName(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @DeleteMapping("/clear")
    public ResponseEntity<ApiResponse<Void>> clearCart(Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            log.info("DELETE /api/user/cart/clear - UserId: {}", userId);
            
            cartService.clearCart(userId);
            log.debug("Successfully cleared cart for userId: {}", userId);
            
            return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa toàn bộ giỏ hàng"));
        } catch (Exception e) {
            log.error("Error clearing cart for userId: {}", authentication.getName(), e);
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
