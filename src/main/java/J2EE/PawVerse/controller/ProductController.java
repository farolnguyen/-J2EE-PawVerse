package J2EE.PawVerse.controller;

import J2EE.PawVerse.dto.ApiResponse;
import J2EE.PawVerse.dto.product.*;
import J2EE.PawVerse.service.ExcelImportService;
import J2EE.PawVerse.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class ProductController {
    
    private final ProductService productService;
    private final ExcelImportService excelImportService;
    
    @GetMapping("/public/products")
    public ResponseEntity<ApiResponse<Page<ProductDTO>>> searchProducts(@ModelAttribute ProductSearchRequest request) {
        try {
            Page<ProductDTO> products = productService.searchProducts(request);
            return ResponseEntity.ok(ApiResponse.success(products));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/public/products/{id}")
    public ResponseEntity<ApiResponse<ProductDTO>> getProductById(@PathVariable Long id) {
        try {
            log.info("GET /api/public/products/{}", id);
            
            ProductDTO product = productService.getProductById(id);
            log.debug("Retrieved product: {}", product.getTenProduct());
            
            return ResponseEntity.ok(ApiResponse.success(product));
        } catch (Exception e) {
            log.error("Error getting product {}", id, e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/public/products/category/{categoryId}")
    public ResponseEntity<ApiResponse<Page<ProductDTO>>> getProductsByCategory(
            @PathVariable Long categoryId,
            @ModelAttribute ProductSearchRequest request) {
        try {
            log.info("GET /api/public/products/category/{}", categoryId);
            
            request.setCategoryId(categoryId);
            Page<ProductDTO> products = productService.searchProducts(request);
            
            log.debug("Retrieved {} products for category {}", products.getContent().size(), categoryId);
            
            return ResponseEntity.ok(ApiResponse.success(products));
        } catch (Exception e) {
            log.error("Error getting products for category {}", categoryId, e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/public/products/brand/{brandId}")
    public ResponseEntity<ApiResponse<Page<ProductDTO>>> getProductsByBrand(
            @PathVariable Long brandId,
            @ModelAttribute ProductSearchRequest request) {
        try {
            log.info("GET /api/public/products/brand/{}", brandId);
            
            request.setBrandId(brandId);
            Page<ProductDTO> products = productService.searchProducts(request);
            
            log.debug("Retrieved {} products for brand {}", products.getContent().size(), brandId);
            
            return ResponseEntity.ok(ApiResponse.success(products));
        } catch (Exception e) {
            log.error("Error getting products for brand {}", brandId, e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/public/products/featured")
    public ResponseEntity<ApiResponse<List<ProductDTO>>> getFeaturedProducts() {
        try {
            List<ProductDTO> products = productService.getFeaturedProducts();
            return ResponseEntity.ok(ApiResponse.success(products));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/public/products/top-selling")
    public ResponseEntity<ApiResponse<List<ProductDTO>>> getTopSellingProducts(@RequestParam(defaultValue = "10") int limit) {
        try {
            List<ProductDTO> products = productService.getTopSellingProducts(limit);
            return ResponseEntity.ok(ApiResponse.success(products));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/admin/products")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Page<ProductDTO>>> getAllProductsForAdmin(@ModelAttribute ProductSearchRequest request) {
        try {
            log.info("GET /api/admin/products - Page: {}, Size: {}, Keyword: {}", 
                request.getPage(), request.getSize(), request.getKeyword());
            
            Page<ProductDTO> products = productService.searchProductsForAdmin(request);
            
            log.debug("Retrieved {} products for admin/staff", products.getContent().size());
            
            return ResponseEntity.ok(ApiResponse.success(products));
        } catch (Exception e) {
            log.error("Error getting products for admin/staff", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/admin/products")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<ProductDTO>> createProduct(@Valid @RequestBody ProductCreateRequest request) {
        try {
            ProductDTO product = productService.createProduct(request);
            return ResponseEntity.ok(ApiResponse.success(product, "Tạo sản phẩm thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/admin/products/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<ProductDTO>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductUpdateRequest request) {
        try {
            ProductDTO product = productService.updateProduct(id, request);
            return ResponseEntity.ok(ApiResponse.success(product, "Cập nhật sản phẩm thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @DeleteMapping("/admin/products/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        try {
            productService.deleteProduct(id);
            return ResponseEntity.ok(ApiResponse.success(null, "Xóa sản phẩm thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/admin/products/import/template")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<byte[]> downloadImportTemplate() {
        try {
            byte[] template = excelImportService.generateTemplate();
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"mau-import-san-pham.xlsx\"")
                    .body(template);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/admin/products/import/preview")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<ExcelImportPreviewResponse>> previewImport(@RequestParam("file") MultipartFile file) {
        try {
            ExcelImportPreviewResponse preview = excelImportService.parseAndPreview(file);
            return ResponseEntity.ok(ApiResponse.success(preview));
        } catch (Exception e) {
            log.error("Error previewing Excel import", e);
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi xử lý file: " + e.getMessage()));
        }
    }
    
    @PostMapping("/admin/products/import/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<ExcelImportPreviewResponse>> confirmImport(@RequestParam("file") MultipartFile file) {
        try {
            ExcelImportPreviewResponse result = excelImportService.executeImport(file);
            if (!result.getGlobalErrors().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error(String.join("; ", result.getGlobalErrors())));
            }
            String msg = String.format("Import thành công: %d sản phẩm mới, %d sản phẩm cập nhật",
                    result.getNewProducts(), result.getExistingProducts());
            return ResponseEntity.ok(ApiResponse.success(result, msg));
        } catch (Exception e) {
            log.error("Error executing Excel import", e);
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi import: " + e.getMessage()));
        }
    }
}
