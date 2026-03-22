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
public class ProductCreateRequest {
    
    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 200, message = "Tên sản phẩm không được quá 200 ký tự")
    private String tenProduct;
    
    @NotBlank(message = "Mô tả không được để trống")
    private String moTa;
    
    @NotNull(message = "Giá bán không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá bán phải lớn hơn 0")
    private BigDecimal giaBan;
    
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá gốc phải lớn hơn 0")
    private BigDecimal giaGoc;
    
    @NotNull(message = "Số lượng tồn kho không được để trống")
    @Min(value = 0, message = "Số lượng tồn kho không được âm")
    private Integer soLuongTonKho;
    
    @NotNull(message = "Category không được để trống")
    private Long categoryId;
    
    @NotNull(message = "Brand không được để trống")
    private Long brandId;
    
    private Boolean isFeatured = false;
    
    private List<String> imageUrls;
}
