package J2EE.PawVerse.service;

import J2EE.PawVerse.dto.booking.CreateBookingRequest;
import J2EE.PawVerse.dto.booking.ServiceBookingDTO;
import J2EE.PawVerse.entity.PetProfile;
import J2EE.PawVerse.entity.ServiceBooking;
import J2EE.PawVerse.entity.User;
import J2EE.PawVerse.repository.PetProfileRepository;
import J2EE.PawVerse.repository.ServiceBookingRepository;
import J2EE.PawVerse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServiceBookingService {

    private final ServiceBookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final PetProfileRepository petProfileRepository;
    private final EmailService emailService;

    private static final DateTimeFormatter VN_FORMATTER = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    @Transactional
    public ServiceBookingDTO createBooking(Long userId, CreateBookingRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        ServiceBooking.ServiceType serviceType;
        try {
            serviceType = ServiceBooking.ServiceType.valueOf(request.getServiceType());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Loại dịch vụ không hợp lệ: " + request.getServiceType());
        }

        if (serviceType == ServiceBooking.ServiceType.HOME_SERVICE && 
            (request.getDiaChi() == null || request.getDiaChi().isBlank())) {
            throw new RuntimeException("Dịch vụ tận nhà yêu cầu nhập địa chỉ");
        }

        PetProfile pet = null;
        if (request.getPetId() != null) {
            pet = petProfileRepository.findById(request.getPetId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thú cưng"));
            if (!pet.getUser().getIdUser().equals(userId)) {
                throw new RuntimeException("Thú cưng không thuộc về bạn");
            }
        }

        ServiceBooking booking = ServiceBooking.builder()
                .user(user)
                .hoTen(request.getHoTen())
                .soDienThoai(request.getSoDienThoai())
                .email(request.getEmail())
                .serviceType(serviceType)
                .ngayGioDat(request.getNgayGioDat())
                .location(request.getLocation())
                .diaChi(request.getDiaChi())
                .ghiChu(request.getGhiChu())
                .petIdSnapshot(pet != null ? pet.getIdPet() : null)
                .petName(pet != null ? pet.getTenPet() : null)
                .bookingStatus(ServiceBooking.BookingStatus.PENDING)
                .paymentStatus(ServiceBooking.PaymentStatus.UNPAID)
                .isVerified(false)
                .build();

        booking = bookingRepository.save(booking);
        log.info("Created booking id={} for userId: {}, service: {}", booking.getIdBooking(), userId, serviceType);

        // Send confirmation email
        try {
            String packageInfo = request.getGhiChu() != null ? request.getGhiChu() : "N/A";
            String dateStr = request.getNgayGioDat() != null ? request.getNgayGioDat().format(VN_FORMATTER) : "N/A";
            emailService.sendBookingConfirmation(
                    request.getEmail(), request.getHoTen(),
                    serviceType.name(), packageInfo, dateStr, request.getLocation()
            );
        } catch (Exception e) {
            log.error("Failed to send booking confirmation email for booking id={}", booking.getIdBooking(), e);
        }

        return toDTO(booking);
    }

    @Transactional(readOnly = true)
    public List<ServiceBookingDTO> getMyBookings(Long userId) {
        return bookingRepository.findByUserIdUserOrderByNgayTaoDesc(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ServiceBookingDTO cancelBooking(Long userId, Long bookingId) {
        ServiceBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking"));
        if (!booking.getUser().getIdUser().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền hủy booking này");
        }
        ServiceBooking.BookingStatus status = booking.getBookingStatus();
        if (status == ServiceBooking.BookingStatus.COMPLETED || 
            status == ServiceBooking.BookingStatus.CANCELLED ||
            status == ServiceBooking.BookingStatus.CONTACT_SUCCESS) {
            throw new RuntimeException("Không thể hủy booking ở trạng thái này");
        }
        booking.setBookingStatus(ServiceBooking.BookingStatus.CANCELLED);
        booking = bookingRepository.save(booking);
        log.info("Cancelled booking id={} for userId: {}", bookingId, userId);
        return toDTO(booking);
    }

    // ===== STAFF METHODS =====

    @Transactional(readOnly = true)
    public ServiceBookingDTO getBookingById(Long bookingId) {
        ServiceBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking với id=" + bookingId));
        return toDTO(booking);
    }

    @Transactional(readOnly = true)
    public List<ServiceBookingDTO> getAllBookings(String status, String serviceType, String search) {
        List<ServiceBooking> bookings = bookingRepository.findAllByOrderByNgayTaoDesc();

        if (status != null && !status.isBlank()) {
            try {
                ServiceBooking.BookingStatus bs = ServiceBooking.BookingStatus.valueOf(status);
                bookings = bookings.stream().filter(b -> b.getBookingStatus() == bs).collect(Collectors.toList());
            } catch (IllegalArgumentException ignored) {}
        }

        if (serviceType != null && !serviceType.isBlank()) {
            try {
                ServiceBooking.ServiceType st = ServiceBooking.ServiceType.valueOf(serviceType);
                bookings = bookings.stream().filter(b -> b.getServiceType() == st).collect(Collectors.toList());
            } catch (IllegalArgumentException ignored) {}
        }

        if (search != null && !search.isBlank()) {
            String s = search.toLowerCase();
            bookings = bookings.stream().filter(b ->
                    (b.getHoTen() != null && b.getHoTen().toLowerCase().contains(s)) ||
                    (b.getEmail() != null && b.getEmail().toLowerCase().contains(s)) ||
                    (b.getSoDienThoai() != null && b.getSoDienThoai().contains(s))
            ).collect(Collectors.toList());
        }

        return bookings.stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * Main status flow: PENDING → CONFIRMED → CONTACTING → CONTACT_SUCCESS → COMPLETED
     * Branching at CONTACTING:
     *   - "CONTACT_SUCCESS" → moves to CONTACT_SUCCESS (unlocks COMPLETED)
     *   - "CONTACT_FAIL"    → stays at CONTACTING, increments contactFailCount, sends reminder email
     *   - If contactFailCount >= 3 → auto-cancels
     * CANCELLED is allowed from any non-final status.
     */
    @Transactional
    public ServiceBookingDTO updateBookingStatus(Long bookingId, String newStatus) {
        ServiceBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking"));

        if (booking.getBookingStatus() == ServiceBooking.BookingStatus.COMPLETED ||
            booking.getBookingStatus() == ServiceBooking.BookingStatus.CANCELLED) {
            throw new RuntimeException("Không thể thay đổi trạng thái booking đã hoàn thành hoặc đã hủy");
        }

        // Handle special CONTACT_FAIL action (not a real status, just increments counter)
        if ("CONTACT_FAIL".equals(newStatus)) {
            if (booking.getBookingStatus() != ServiceBooking.BookingStatus.CONTACTING) {
                throw new RuntimeException("Chỉ có thể ghi nhận liên hệ thất bại khi đang ở trạng thái Liên hệ");
            }
            int failCount = (booking.getContactFailCount() != null ? booking.getContactFailCount() : 0) + 1;
            booking.setContactFailCount(failCount);
            
            if (failCount >= 3) {
                booking.setBookingStatus(ServiceBooking.BookingStatus.CANCELLED);
                booking = bookingRepository.save(booking);
                log.info("Auto-cancelled booking id={} after {} contact failures", bookingId, failCount);
                // Send cancellation email
                try {
                    emailService.sendBookingStatusUpdate(
                            booking.getEmail(), booking.getHoTen(),
                            booking.getServiceType().name(), "CANCELLED"
                    );
                } catch (Exception e) {
                    log.error("Failed to send auto-cancel email for booking id={}", bookingId, e);
                }
                return toDTO(booking);
            }
            
            booking = bookingRepository.save(booking);
            log.info("Contact fail #{} for booking id={}", failCount, bookingId);
            // Send contact failure reminder email
            try {
                emailService.sendContactFailureReminder(
                        booking.getEmail(), booking.getHoTen(),
                        booking.getServiceType().name(), failCount
                );
            } catch (Exception e) {
                log.error("Failed to send contact failure reminder for booking id={}", bookingId, e);
            }
            return toDTO(booking);
        }

        // Parse target status
        ServiceBooking.BookingStatus targetStatus;
        try {
            targetStatus = ServiceBooking.BookingStatus.valueOf(newStatus);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái không hợp lệ: " + newStatus);
        }

        // Enforce valid transitions
        if (targetStatus != ServiceBooking.BookingStatus.CANCELLED) {
            java.util.List<ServiceBooking.BookingStatus> statusFlow = java.util.List.of(
                    ServiceBooking.BookingStatus.PENDING,
                    ServiceBooking.BookingStatus.CONFIRMED,
                    ServiceBooking.BookingStatus.CONTACTING,
                    ServiceBooking.BookingStatus.CONTACT_SUCCESS,
                    ServiceBooking.BookingStatus.COMPLETED
            );
            int currentIdx = statusFlow.indexOf(booking.getBookingStatus());
            int targetIdx = statusFlow.indexOf(targetStatus);
            if (targetIdx <= currentIdx) {
                throw new RuntimeException("Chỉ được chuyển trạng thái tiến lên, không được lui về");
            }
            // COMPLETED only allowed from CONTACT_SUCCESS
            if (targetStatus == ServiceBooking.BookingStatus.COMPLETED &&
                booking.getBookingStatus() != ServiceBooking.BookingStatus.CONTACT_SUCCESS) {
                throw new RuntimeException("Chỉ có thể hoàn thành sau khi liên hệ thành công");
            }
            // CONTACT_SUCCESS only allowed from CONTACTING
            if (targetStatus == ServiceBooking.BookingStatus.CONTACT_SUCCESS &&
                booking.getBookingStatus() != ServiceBooking.BookingStatus.CONTACTING) {
                throw new RuntimeException("Chỉ có thể chuyển sang liên hệ thành công từ trạng thái Liên hệ");
            }
        }

        booking.setBookingStatus(targetStatus);
        booking = bookingRepository.save(booking);
        log.info("Staff updated booking id={} to status: {}", bookingId, newStatus);

        // Send status update email
        try {
            emailService.sendBookingStatusUpdate(
                    booking.getEmail(), booking.getHoTen(),
                    booking.getServiceType().name(), newStatus
            );
        } catch (Exception e) {
            log.error("Failed to send status update email for booking id={}", bookingId, e);
        }

        return toDTO(booking);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getBookingStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        long total = bookingRepository.count();
        stats.put("total", total);
        for (ServiceBooking.BookingStatus status : ServiceBooking.BookingStatus.values()) {
            stats.put(status.name().toLowerCase(), bookingRepository.countByStatus(status));
        }
        return stats;
    }

    private ServiceBookingDTO toDTO(ServiceBooking b) {
        return ServiceBookingDTO.builder()
                .idBooking(b.getIdBooking())
                .userId(b.getUser() != null ? b.getUser().getIdUser() : null)
                .hoTen(b.getHoTen())
                .soDienThoai(b.getSoDienThoai())
                .email(b.getEmail())
                .serviceType(b.getServiceType().name())
                .ngayGioDat(b.getNgayGioDat())
                .location(b.getLocation())
                .diaChi(b.getDiaChi())
                .ghiChu(b.getGhiChu())
                .petId(b.getPetIdSnapshot())
                .petName(b.getPetName())
                .bookingStatus(b.getBookingStatus().name())
                .contactFailCount(b.getContactFailCount())
                .giaDichVu(b.getGiaDichVu())
                .paymentStatus(b.getPaymentStatus().name())
                .isVerified(b.getIsVerified())
                .ngayTao(b.getNgayTao())
                .build();
    }
}
