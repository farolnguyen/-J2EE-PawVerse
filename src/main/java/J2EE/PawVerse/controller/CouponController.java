package J2EE.PawVerse.controller;

import J2EE.PawVerse.dto.ApiResponse;
import J2EE.PawVerse.dto.voucher.VoucherDTO;
import J2EE.PawVerse.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final VoucherService voucherService;

    @PostMapping("/apply")
    public ResponseEntity<ApiResponse<VoucherDTO>> applyCoupon(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        if (code == null || code.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Vui lòng nhập mã giảm giá"));
        }
        try {
            VoucherDTO voucher = voucherService.validateVoucher(code.trim().toUpperCase());
            return ResponseEntity.ok(ApiResponse.success(voucher, "Mã giảm giá hợp lệ"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}
