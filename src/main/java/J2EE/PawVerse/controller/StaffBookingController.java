package J2EE.PawVerse.controller;

import J2EE.PawVerse.dto.ApiResponse;
import J2EE.PawVerse.dto.booking.ServiceBookingDTO;
import J2EE.PawVerse.service.ServiceBookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff/bookings")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
@Slf4j
public class StaffBookingController {

    private final ServiceBookingService bookingService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceBookingDTO>>> getAllBookings(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String serviceType,
            @RequestParam(required = false) String search) {
        try {
            List<ServiceBookingDTO> bookings = bookingService.getAllBookings(status, serviceType, search);
            return ResponseEntity.ok(ApiResponse.success(bookings));
        } catch (Exception e) {
            log.error("Error getting all bookings", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{bookingId}/status")
    public ResponseEntity<ApiResponse<ServiceBookingDTO>> updateBookingStatus(
            @PathVariable Long bookingId,
            @RequestBody Map<String, String> body) {
        try {
            String newStatus = body.get("status");
            if (newStatus == null || newStatus.isBlank()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Trạng thái không được để trống"));
            }
            ServiceBookingDTO booking = bookingService.updateBookingStatus(bookingId, newStatus);
            return ResponseEntity.ok(ApiResponse.success(booking));
        } catch (Exception e) {
            log.error("Error updating booking status", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<ApiResponse<ServiceBookingDTO>> getBookingById(@PathVariable Long bookingId) {
        try {
            ServiceBookingDTO booking = bookingService.getBookingById(bookingId);
            return ResponseEntity.ok(ApiResponse.success(booking));
        } catch (Exception e) {
            log.error("Error getting booking by id={}", bookingId, e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBookingStats() {
        try {
            Map<String, Object> stats = bookingService.getBookingStats();
            return ResponseEntity.ok(ApiResponse.success(stats));
        } catch (Exception e) {
            log.error("Error getting booking stats", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
