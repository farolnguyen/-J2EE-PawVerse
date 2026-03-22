package J2EE.PawVerse.controller;

import J2EE.PawVerse.dto.ApiResponse;
import J2EE.PawVerse.dto.brand.BrandDTO;
import J2EE.PawVerse.dto.brand.BrandRequest;
import J2EE.PawVerse.service.BrandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BrandController {
    
    private final BrandService brandService;
    
    @GetMapping("/public/brands")
    public ResponseEntity<ApiResponse<List<BrandDTO>>> getAllBrands() {
        try {
            List<BrandDTO> brands = brandService.getActiveBrands();
            return ResponseEntity.ok(ApiResponse.success(brands));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/admin/brands")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<List<BrandDTO>>> getAllBrandsAdmin() {
        try {
            List<BrandDTO> brands = brandService.getAllBrands();
            return ResponseEntity.ok(ApiResponse.success(brands));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/public/brands/{id}")
    public ResponseEntity<ApiResponse<BrandDTO>> getBrandById(@PathVariable Long id) {
        try {
            BrandDTO brand = brandService.getBrandById(id);
            return ResponseEntity.ok(ApiResponse.success(brand));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/admin/brands")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<BrandDTO>> createBrand(@Valid @RequestBody BrandRequest request) {
        try {
            BrandDTO brand = brandService.createBrand(request);
            return ResponseEntity.ok(ApiResponse.success(brand, "Tạo brand thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/admin/brands/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<BrandDTO>> updateBrand(
            @PathVariable Long id,
            @Valid @RequestBody BrandRequest request) {
        try {
            BrandDTO brand = brandService.updateBrand(id, request);
            return ResponseEntity.ok(ApiResponse.success(brand, "Cập nhật brand thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @DeleteMapping("/admin/brands/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> deleteBrand(@PathVariable Long id) {
        try {
            brandService.deleteBrand(id);
            return ResponseEntity.ok(ApiResponse.success(null, "Xóa brand thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
