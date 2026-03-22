package J2EE.PawVerse.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    
    private Long totalOrders;
    private Long totalUsers;
    private Long totalProducts;
    private BigDecimal totalRevenue;
    private Long pendingOrders;
    private Long processingOrders;
    private Long shippingOrders;
    private Long deliveredOrders;
    private Long cancelledOrders;
    private Long lowStockProducts;
    
    // Chart-ready data
    private List<RevenueByPeriodDTO> revenueLast7Days;
    private List<TopProductDTO> topProducts;
    private List<CategoryStatsDTO> categoryStats;
    private List<RecentOrderDTO> recentOrders;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryStatsDTO {
        private Long categoryId;
        private String categoryName;
        private Long productCount;
        private BigDecimal revenue;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentOrderDTO {
        private Long orderId;
        private String orderNumber;
        private String customerName;
        private BigDecimal finalAmount;
        private String orderStatus;
        private String ngayTao;
    }
}
