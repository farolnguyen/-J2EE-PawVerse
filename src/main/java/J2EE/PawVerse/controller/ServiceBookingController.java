package J2EE.PawVerse.controller;

import J2EE.PawVerse.dto.ApiResponse;
import J2EE.PawVerse.dto.booking.CreateBookingRequest;
import J2EE.PawVerse.dto.booking.ServiceBookingDTO;
import J2EE.PawVerse.entity.User;
import J2EE.PawVerse.repository.UserRepository;
import J2EE.PawVerse.service.ServiceBookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/bookings")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN', 'STAFF')")
@Slf4j
public class ServiceBookingController {

    private final ServiceBookingService bookingService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<ServiceBookingDTO>> createBooking(
            Authentication authentication, @Valid @RequestBody CreateBookingRequest request) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            ServiceBookingDTO booking = bookingService.createBooking(userId, request);
            return ResponseEntity.ok(ApiResponse.success(booking));
        } catch (Exception e) {
            log.error("Error creating booking", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceBookingDTO>>> getMyBookings(Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            List<ServiceBookingDTO> bookings = bookingService.getMyBookings(userId);
            return ResponseEntity.ok(ApiResponse.success(bookings));
        } catch (Exception e) {
            log.error("Error getting bookings", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{bookingId}/cancel")
    public ResponseEntity<ApiResponse<ServiceBookingDTO>> cancelBooking(
            Authentication authentication, @PathVariable Long bookingId) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            ServiceBookingDTO booking = bookingService.cancelBooking(userId, bookingId);
            return ResponseEntity.ok(ApiResponse.success(booking));
        } catch (Exception e) {
            log.error("Error cancelling booking", e);
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
