package J2EE.PawVerse.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSearchRequest {
    
    private String keyword;
    private Long categoryId;
    private Long brandId;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Double minRating;
    private Boolean isEnabled = true;
    private Boolean isFeatured;
    private String sortBy = "ngayTao";
    private String sortDirection = "DESC";
    private Integer page = 0;
    private Integer size = 20;
}
