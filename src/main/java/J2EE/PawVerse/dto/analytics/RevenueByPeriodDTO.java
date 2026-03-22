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
public class RevenueByPeriodDTO {
    
    private String period;
    private BigDecimal revenue;
    private Long orderCount;
}
