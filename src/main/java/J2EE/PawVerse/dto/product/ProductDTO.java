package J2EE.PawVerse.dto.product;

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
public class ProductDTO {
    
    private Long idProduct;
    private String tenProduct;
    private String moTa;
    private BigDecimal giaBan;
    private BigDecimal giaGoc;
    private Integer soLuongTonKho;
    private Integer soLuongDaBan;
    private Double avgRating;
    private Integer totalReviews;
    private Boolean isEnabled;
    private Boolean isFeatured;
    private String thumbnailUrl;
    private List<String> imageUrls;
    private Long categoryId;
    private String categoryName;
    private Long brandId;
    private String brandName;
    private LocalDateTime ngayTao;
}
