package J2EE.PawVerse.dto.product;

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
public class ExcelProductRow {
    
    private int rowNumber;
    private String tenProduct;
    private String moTa;
    private String danhMuc;
    private String thuongHieu;
    private BigDecimal giaBan;
    private BigDecimal giaGoc;
    private Integer soLuongTonKho;
    private List<String> imageUrls;
    
    // Preview metadata
    private boolean exists;
    private Long existingProductId;
    private String existingProductName;
    private Integer existingStock;
    private String action; // "CREATE" or "UPDATE"
    
    // Validation
    private boolean valid;
    private List<String> errors;
}
