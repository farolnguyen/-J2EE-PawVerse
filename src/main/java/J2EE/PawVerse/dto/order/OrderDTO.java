package J2EE.PawVerse.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDTO {
    
    private Long orderId;
    private String orderNumber;
    private Long userId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    
    private String shippingAddress;
    private String shippingWard;
    private String shippingDistrict;
    private String shippingCity;
    
    private String orderStatus;
    private String paymentMethod;
    private String paymentStatus;
    
    private BigDecimal totalAmount;
    private BigDecimal shippingFee;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    
    private String voucherCode;
    private String orderNote;
    
    private List<OrderItemDTO> items;
    
    private LocalDateTime orderDate;
    private LocalDateTime estimatedDelivery;
    private LocalDateTime actualDelivery;
}
