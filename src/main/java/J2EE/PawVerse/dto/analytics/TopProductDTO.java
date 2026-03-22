package J2EE.PawVerse.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopProductDTO {
    
    private Long productId;
    private String productName;
    private String imageUrl;
    private Long totalSold;
    private BigDecimal revenue;
}
