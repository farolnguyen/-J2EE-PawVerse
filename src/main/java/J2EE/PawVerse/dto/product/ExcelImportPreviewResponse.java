package J2EE.PawVerse.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExcelImportPreviewResponse {
    
    private int totalRows;
    private int validRows;
    private int invalidRows;
    private int newProducts;
    private int existingProducts;
    private List<ExcelProductRow> rows;
    private List<String> globalErrors;
}
