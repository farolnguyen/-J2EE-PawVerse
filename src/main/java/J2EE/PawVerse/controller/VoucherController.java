package J2EE.PawVerse.controller;

import J2EE.PawVerse.dto.ApiResponse;
import J2EE.PawVerse.dto.voucher.CreateVoucherRequest;
import J2EE.PawVerse.dto.voucher.UpdateVoucherRequest;
import J2EE.PawVerse.dto.voucher.VoucherDTO;
import J2EE.PawVerse.service.VoucherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/staff/vouchers")
@RequiredArgsConstructor
@Slf4j
public class VoucherController {

    private final VoucherService voucherService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<VoucherDTO>>> getAllVouchers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<VoucherDTO> vouchers = voucherService.getAllVouchers(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "ngayTao")));
        return ResponseEntity.ok(ApiResponse.success(vouchers));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VoucherDTO>> getVoucherById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(voucherService.getVoucherById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<VoucherDTO>> createVoucher(
            @Valid @RequestBody CreateVoucherRequest request) {
        VoucherDTO voucher = voucherService.createVoucher(request);
        return ResponseEntity.ok(ApiResponse.success(voucher, "Tạo voucher thành công"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VoucherDTO>> updateVoucher(
            @PathVariable Long id,
            @RequestBody UpdateVoucherRequest request) {
        VoucherDTO voucher = voucherService.updateVoucher(id, request);
        return ResponseEntity.ok(ApiResponse.success(voucher, "Cập nhật voucher thành công"));
    }

    @PutMapping("/{id}/toggle-active")
    public ResponseEntity<ApiResponse<Void>> toggleActive(@PathVariable Long id) {
        voucherService.toggleVoucherActive(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã thay đổi trạng thái voucher"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVoucher(@PathVariable Long id) {
        voucherService.deleteVoucher(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa voucher"));
    }
}
