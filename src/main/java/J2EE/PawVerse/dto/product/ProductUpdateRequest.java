package J2EE.PawVerse.dto.product;

import jakarta.validation.constraints.*;
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
public class ProductUpdateRequest {
    
    @Size(max = 200, message = "Tên sản phẩm không được quá 200 ký tự")
    private String tenProduct;
    
    private String moTa;
    
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá bán phải lớn hơn 0")
    private BigDecimal giaBan;
    
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá gốc phải lớn hơn 0")
    private BigDecimal giaGoc;
    
    @Min(value = 0, message = "Số lượng tồn kho không được âm")
    private Integer soLuongTonKho;
    
    private Long categoryId;
    private Long brandId;
    private Boolean isEnabled;
    private Boolean isFeatured;
    
    private List<String> imageUrls;
}
