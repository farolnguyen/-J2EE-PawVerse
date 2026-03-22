package J2EE.PawVerse.controller;

import J2EE.PawVerse.dto.ApiResponse;
import J2EE.PawVerse.dto.analytics.*;
import J2EE.PawVerse.service.AnalyticsService;
import J2EE.PawVerse.service.ExcelExportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
@Slf4j
public class AnalyticsController {
    
    private final AnalyticsService analyticsService;
    private final ExcelExportService excelExportService;
    
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStatsDTO>> getDashboardStats() {
        try {
            DashboardStatsDTO stats = analyticsService.getDashboardStats();
            return ResponseEntity.ok(ApiResponse.success(stats));
        } catch (Exception e) {
            log.error("getDashboardStats error: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Lỗi lấy thống kê: " + e.getMessage()));
        }
    }
    
    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<List<RevenueByPeriodDTO>>> getRevenue(
            @RequestParam(defaultValue = "MONTH") String period,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        try {
            List<RevenueByPeriodDTO> revenue = analyticsService.getRevenueByPeriod(period, startDate, endDate);
            return ResponseEntity.ok(ApiResponse.success(revenue));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Lỗi lấy doanh thu: " + e.getMessage()));
        }
    }
    
    @GetMapping("/top-products")
    public ResponseEntity<ApiResponse<List<TopProductDTO>>> getTopProducts(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            List<TopProductDTO> topProducts = analyticsService.getTopSellingProducts(limit);
            return ResponseEntity.ok(ApiResponse.success(topProducts));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Lỗi lấy sản phẩm bán chạy: " + e.getMessage()));
        }
    }
    
    @GetMapping("/export/columns")
    public ResponseEntity<ApiResponse<Map<String, Map<String, String>>>> getExportColumns() {
        Map<String, Map<String, String>> columns = Map.of(
                "PRODUCTS", ExcelExportService.PRODUCT_COLUMNS,
                "ORDERS", ExcelExportService.ORDER_COLUMNS,
                "CUSTOMERS", ExcelExportService.CUSTOMER_COLUMNS,
                "REVENUE", ExcelExportService.REVENUE_COLUMNS
        );
        return ResponseEntity.ok(ApiResponse.success(columns));
    }
    
    @PostMapping("/export")
    public ResponseEntity<byte[]> exportReport(@RequestBody ExportRequest request) {
        try {
            byte[] data = excelExportService.exportReport(request);
            String filename = "bao-cao-" + request.getReportType().toLowerCase() + ".xlsx";
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(data);
        } catch (Exception e) {
            log.error("Error exporting report", e);
            return ResponseEntity.badRequest().build();
        }
    }
}
