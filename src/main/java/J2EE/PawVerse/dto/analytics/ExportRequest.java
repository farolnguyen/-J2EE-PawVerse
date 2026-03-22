package J2EE.PawVerse.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportRequest {
    
    // REVENUE, PRODUCTS, CUSTOMERS, ORDERS
    private String reportType;
    
    // Limit: 10, 50, 100, ALL
    private Integer limit;
    
    // Sort field
    private String sortBy;
    
    // ASC / DESC
    private String sortDirection;
    
    // List of column keys to include
    private List<String> columns;
}
