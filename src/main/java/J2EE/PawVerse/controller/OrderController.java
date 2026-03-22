package J2EE.PawVerse.controller;

import J2EE.PawVerse.dto.ApiResponse;
import J2EE.PawVerse.dto.order.*;
import J2EE.PawVerse.repository.UserRepository;
import J2EE.PawVerse.service.InvoiceService;
import J2EE.PawVerse.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class OrderController {
    
    private final OrderService orderService;
    private final InvoiceService invoiceService;
    private final UserRepository userRepository;
    
    @PostMapping("/user/orders")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<OrderDTO>> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            log.info("POST /api/user/orders - UserId: {}", userId);
            
            OrderDTO order = orderService.createOrder(userId, request);
            log.info("Successfully created order for userId: {}", userId);
            
            return ResponseEntity.ok(ApiResponse.success(order, "Đặt hàng thành công"));
        } catch (Exception e) {
            log.error("Error creating order for userId: {}", authentication.getName(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/user/orders/{orderId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<OrderDTO>> getOrderById(
            @PathVariable Long orderId,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            OrderDTO order = orderService.getOrderById(orderId, userId);
            return ResponseEntity.ok(ApiResponse.success(order));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/user/orders")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Page<OrderDTO>>> getUserOrders(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            Pageable pageable = PageRequest.of(page, size);
            Page<OrderDTO> orders = orderService.getUserOrders(userId, status, pageable);
            return ResponseEntity.ok(ApiResponse.success(orders));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/admin/orders/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<OrderDTO>> getOrderByIdForAdmin(
            @PathVariable Long orderId) {
        try {
            OrderDTO order = orderService.getOrderByIdForAdmin(orderId);
            return ResponseEntity.ok(ApiResponse.success(order));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/admin/orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Page<OrderDTO>>> getAllOrders(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<OrderDTO> orders = orderService.getAllOrders(status, pageable);
            return ResponseEntity.ok(ApiResponse.success(orders));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/admin/orders/{orderId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<OrderDTO>> updateOrderStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        try {
            OrderDTO order = orderService.updateOrderStatus(orderId, request);
            return ResponseEntity.ok(ApiResponse.success(order, "Cập nhật trạng thái thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/user/orders/{orderId}/invoice")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'STAFF')")
    public ResponseEntity<byte[]> downloadInvoiceForUser(
            @PathVariable Long orderId,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            OrderDTO order = orderService.getOrderById(orderId, userId);
            byte[] pdf = invoiceService.generateInvoice(order);
            String filename = "hoadon-" + (order.getOrderNumber() != null ? order.getOrderNumber() : orderId) + ".pdf";
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/admin/orders/{orderId}/invoice")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<byte[]> downloadInvoiceForAdmin(@PathVariable Long orderId) {
        try {
            OrderDTO order = orderService.getOrderByIdForAdmin(orderId);
            byte[] pdf = invoiceService.generateInvoice(order);
            String filename = "hoadon-" + (order.getOrderNumber() != null ? order.getOrderNumber() : orderId) + ".pdf";
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/user/orders/{orderId}/cancel")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> cancelOrder(
            @PathVariable Long orderId,
            Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            orderService.cancelOrder(orderId, userId);
            return ResponseEntity.ok(ApiResponse.success(null, "Hủy đơn hàng thành công"));
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
