package J2EE.PawVerse.service;

import J2EE.PawVerse.dto.product.ExcelImportPreviewResponse;
import J2EE.PawVerse.dto.product.ExcelProductRow;
import J2EE.PawVerse.entity.Brand;
import J2EE.PawVerse.entity.Category;
import J2EE.PawVerse.entity.Product;
import J2EE.PawVerse.entity.ProductImage;
import J2EE.PawVerse.repository.BrandRepository;
import J2EE.PawVerse.repository.CategoryRepository;
import J2EE.PawVerse.repository.ProductImageRepository;
import J2EE.PawVerse.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExcelImportService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final ProductImageRepository productImageRepository;

    // Expected column headers (0-indexed)
    private static final String[] EXPECTED_HEADERS = {
            "Tên sản phẩm", "Mô tả", "Danh mục", "Thương hiệu",
            "Giá bán", "Giá gốc", "Số lượng tồn kho", "Hình ảnh (URL)"
    };

    /**
     * Generate a template Excel file for product import.
     */
    public byte[] generateTemplate() {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Sản phẩm");

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 12);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            // Create header row
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < EXPECTED_HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(EXPECTED_HEADERS[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 6000);
            }

            // Wider columns for name, description, images
            sheet.setColumnWidth(0, 10000); // Tên sản phẩm
            sheet.setColumnWidth(1, 15000); // Mô tả
            sheet.setColumnWidth(7, 20000); // Hình ảnh

            // Add instruction row
            CellStyle noteStyle = workbook.createCellStyle();
            Font noteFont = workbook.createFont();
            noteFont.setItalic(true);
            noteFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
            noteStyle.setFont(noteFont);

            Row exampleRow = sheet.createRow(1);
            exampleRow.createCell(0).setCellValue("Thức ăn cho chó Royal Canin");
            exampleRow.createCell(1).setCellValue("Thức ăn hạt khô dành cho chó trưởng thành...");
            exampleRow.createCell(2).setCellValue("Thức ăn cho chó");
            exampleRow.createCell(3).setCellValue("Royal Canin");
            exampleRow.createCell(4).setCellValue(350000);
            exampleRow.createCell(5).setCellValue(400000);
            exampleRow.createCell(6).setCellValue(100);
            exampleRow.createCell(7).setCellValue("https://example.com/img1.jpg, https://example.com/img2.jpg");
            for (int i = 0; i < 8; i++) {
                exampleRow.getCell(i).setCellStyle(noteStyle);
            }

            // Second instruction sheet
            Sheet instructionSheet = workbook.createSheet("Hướng dẫn");
            String[] instructions = {
                    "HƯỚNG DẪN IMPORT SẢN PHẨM TỪ EXCEL",
                    "",
                    "1. Điền thông tin sản phẩm vào sheet 'Sản phẩm'",
                    "2. Các cột bắt buộc: Tên sản phẩm, Danh mục, Thương hiệu, Giá bán, Số lượng tồn kho",
                    "3. Cột 'Giá gốc' không bắt buộc (để trống nếu không có)",
                    "4. Cột 'Hình ảnh (URL)' chấp nhận nhiều URL phân cách bằng dấu phẩy (tối đa 5 ảnh)",
                    "5. Ảnh đầu tiên sẽ là thumbnail",
                    "",
                    "LƯU Ý VỀ SẢN PHẨM ĐÃ TỒN TẠI:",
                    "- Hệ thống kiểm tra sản phẩm trùng dựa trên: Tên sản phẩm + Danh mục + Thương hiệu",
                    "- Nếu sản phẩm đã tồn tại: số lượng tồn kho sẽ được CỘNG DỒN",
                    "- Nếu có URL hình ảnh mới: hình ảnh sẽ được CẬP NHẬT",
                    "- Nếu giá bán/giá gốc khác: giá sẽ được CẬP NHẬT",
                    "- Nếu danh mục/thương hiệu khác: sẽ được CẬP NHẬT",
                    "",
                    "TÊN DANH MỤC VÀ THƯƠNG HIỆU:",
                    "- Phải khớp chính xác với tên đã có trong hệ thống",
                    "- Hệ thống sẽ báo lỗi nếu danh mục hoặc thương hiệu không tồn tại"
            };
            for (int i = 0; i < instructions.length; i++) {
                Row row = instructionSheet.createRow(i);
                Cell cell = row.createCell(0);
                cell.setCellValue(instructions[i]);
                if (i == 0) {
                    CellStyle titleStyle = workbook.createCellStyle();
                    Font titleFont = workbook.createFont();
                    titleFont.setBold(true);
                    titleFont.setFontHeightInPoints((short) 14);
                    titleStyle.setFont(titleFont);
                    cell.setCellStyle(titleStyle);
                }
            }
            instructionSheet.setColumnWidth(0, 20000);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Không thể tạo file template: " + e.getMessage());
        }
    }

    /**
     * Parse and validate an uploaded Excel file, returning a preview of what will be imported.
     */
    public ExcelImportPreviewResponse parseAndPreview(MultipartFile file) {
        List<String> globalErrors = new ArrayList<>();
        List<ExcelProductRow> rows = new ArrayList<>();

        if (file == null || file.isEmpty()) {
            globalErrors.add("File không được để trống");
            return buildResponse(rows, globalErrors);
        }

        if (file.getSize() > 2L * 1024 * 1024) {
            globalErrors.add("File Excel không được vượt quá 2MB");
            return buildResponse(rows, globalErrors);
        }

        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls"))) {
            globalErrors.add("Chỉ chấp nhận file Excel (.xlsx hoặc .xls)");
            return buildResponse(rows, globalErrors);
        }

        // Load all categories and brands for matching
        Map<String, Category> categoryMap = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(
                        c -> c.getTenCategory().trim().toLowerCase(),
                        c -> c,
                        (a, b) -> a
                ));

        Map<String, Brand> brandMap = brandRepository.findAll().stream()
                .collect(Collectors.toMap(
                        b -> b.getTenBrand().trim().toLowerCase(),
                        b -> b,
                        (a, b) -> a
                ));

        // Load all products for duplicate detection
        List<Product> allProducts = productRepository.findAll();

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                globalErrors.add("File Excel không có sheet nào");
                return buildResponse(rows, globalErrors);
            }

            // Validate header row
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                globalErrors.add("Dòng tiêu đề (header) trống");
                return buildResponse(rows, globalErrors);
            }

            if (!validateHeaders(headerRow)) {
                globalErrors.add("Cấu trúc file không đúng. Các cột phải là: " + String.join(", ", EXPECTED_HEADERS));
                return buildResponse(rows, globalErrors);
            }

            // Parse data rows (skip header)
            int lastRow = sheet.getLastRowNum();
            if (lastRow < 1) {
                globalErrors.add("File không có dữ liệu sản phẩm (chỉ có header)");
                return buildResponse(rows, globalErrors);
            }
            if (lastRow > 100) {
                globalErrors.add("File Excel chỉ được chứa tối đa 100 dòng dữ liệu mỗi lần import");
                return buildResponse(rows, globalErrors);
            }

            for (int i = 1; i <= lastRow; i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue;

                ExcelProductRow parsedRow = parseRow(row, i + 1, categoryMap, brandMap, allProducts);
                rows.add(parsedRow);
            }

            if (rows.isEmpty()) {
                globalErrors.add("Không tìm thấy dữ liệu sản phẩm hợp lệ trong file");
            }

        } catch (Exception e) {
            log.error("Error parsing Excel file", e);
            globalErrors.add("Lỗi đọc file Excel: " + e.getMessage());
        }

        return buildResponse(rows, globalErrors);
    }

    /**
     * Execute the actual import based on previously validated rows.
     */
    @Transactional
    public ExcelImportPreviewResponse executeImport(MultipartFile file) {
        ExcelImportPreviewResponse preview = parseAndPreview(file);

        if (!preview.getGlobalErrors().isEmpty()) {
            return preview;
        }

        List<ExcelProductRow> validRows = preview.getRows().stream()
                .filter(ExcelProductRow::isValid)
                .collect(Collectors.toList());

        if (validRows.isEmpty()) {
            preview.getGlobalErrors().add("Không có dòng hợp lệ để import");
            return preview;
        }

        // Load references
        Map<String, Category> categoryMap = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(
                        c -> c.getTenCategory().trim().toLowerCase(),
                        c -> c,
                        (a, b) -> a
                ));
        Map<String, Brand> brandMap = brandRepository.findAll().stream()
                .collect(Collectors.toMap(
                        b -> b.getTenBrand().trim().toLowerCase(),
                        b -> b,
                        (a, b) -> a
                ));

        int created = 0;
        int updated = 0;

        for (ExcelProductRow row : validRows) {
            try {
                Category category = categoryMap.get(row.getDanhMuc().trim().toLowerCase());
                Brand brand = brandMap.get(row.getThuongHieu().trim().toLowerCase());

                if (row.isExists() && row.getExistingProductId() != null) {
                    // UPDATE existing product
                    Product product = productRepository.findById(row.getExistingProductId()).orElse(null);
                    if (product != null) {
                        // Accumulate stock
                        product.setSoLuongTonKho(product.getSoLuongTonKho() + row.getSoLuongTonKho());

                        // Update price
                        product.setGiaBan(row.getGiaBan());
                        if (row.getGiaGoc() != null) {
                            product.setGiaGoc(row.getGiaGoc());
                        }

                        // Update category & brand
                        if (category != null) product.setCategory(category);
                        if (brand != null) product.setBrand(brand);

                        // Update description if provided
                        if (row.getMoTa() != null && !row.getMoTa().isBlank()) {
                            product.setMoTa(row.getMoTa());
                        }

                        productRepository.save(product);

                        // Update images if new URLs provided
                        if (row.getImageUrls() != null && !row.getImageUrls().isEmpty()) {
                            // Delete old images
                            productImageRepository.deleteByProductIdProduct(product.getIdProduct());
                            // Save new images
                            saveProductImages(product, row.getImageUrls());
                        }

                        updated++;
                    }
                } else {
                    // CREATE new product
                    Product product = Product.builder()
                            .tenProduct(row.getTenProduct())
                            .moTa(row.getMoTa())
                            .giaBan(row.getGiaBan())
                            .giaGoc(row.getGiaGoc())
                            .soLuongTonKho(row.getSoLuongTonKho())
                            .soLuongDaBan(0)
                            .soLanXem(0)
                            .avgRating(0.0)
                            .totalReviews(0)
                            .isEnabled(true)
                            .isFeatured(false)
                            .category(category)
                            .brand(brand)
                            .build();

                    product = productRepository.save(product);

                    // Save images
                    if (row.getImageUrls() != null && !row.getImageUrls().isEmpty()) {
                        saveProductImages(product, row.getImageUrls());
                    }

                    created++;
                }
            } catch (Exception e) {
                log.error("Error importing row {}: {}", row.getRowNumber(), e.getMessage());
                row.setValid(false);
                row.setErrors(List.of("Lỗi import: " + e.getMessage()));
            }
        }

        log.info("Excel import completed: {} created, {} updated", created, updated);

        // Rebuild preview with final results
        preview.setNewProducts(created);
        preview.setExistingProducts(updated);
        return preview;
    }

    // ==================== PRIVATE HELPERS ====================

    private boolean validateHeaders(Row headerRow) {
        for (int i = 0; i < EXPECTED_HEADERS.length; i++) {
            Cell cell = headerRow.getCell(i);
            if (cell == null) return false;
            String value = getCellStringValue(cell).trim();
            if (!value.equalsIgnoreCase(EXPECTED_HEADERS[i])) {
                return false;
            }
        }
        return true;
    }

    private boolean isRowEmpty(Row row) {
        for (int i = 0; i < EXPECTED_HEADERS.length; i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String val = getCellStringValue(cell).trim();
                if (!val.isEmpty()) return false;
            }
        }
        return true;
    }

    private ExcelProductRow parseRow(Row row, int rowNum,
                                      Map<String, Category> categoryMap,
                                      Map<String, Brand> brandMap,
                                      List<Product> allProducts) {
        List<String> errors = new ArrayList<>();

        // Parse each cell
        String tenProduct = getCellStringValue(row.getCell(0)).trim();
        String moTa = getCellStringValue(row.getCell(1)).trim();
        String danhMuc = getCellStringValue(row.getCell(2)).trim();
        String thuongHieu = getCellStringValue(row.getCell(3)).trim();
        BigDecimal giaBan = getCellBigDecimalValue(row.getCell(4));
        BigDecimal giaGoc = getCellBigDecimalValue(row.getCell(5));
        Integer soLuongTonKho = getCellIntValue(row.getCell(6));
        String imageUrlsRaw = getCellStringValue(row.getCell(7)).trim();

        // Parse image URLs
        List<String> imageUrls = new ArrayList<>();
        if (!imageUrlsRaw.isEmpty()) {
            imageUrls = Arrays.stream(imageUrlsRaw.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .limit(5)
                    .collect(Collectors.toList());
        }

        // Validate required fields
        if (tenProduct.isEmpty()) {
            errors.add("Tên sản phẩm không được để trống");
        }
        if (danhMuc.isEmpty()) {
            errors.add("Danh mục không được để trống");
        } else if (!categoryMap.containsKey(danhMuc.toLowerCase())) {
            errors.add("Danh mục '" + danhMuc + "' không tồn tại trong hệ thống");
        }
        if (thuongHieu.isEmpty()) {
            errors.add("Thương hiệu không được để trống");
        } else if (!brandMap.containsKey(thuongHieu.toLowerCase())) {
            errors.add("Thương hiệu '" + thuongHieu + "' không tồn tại trong hệ thống");
        }
        if (giaBan == null || giaBan.compareTo(BigDecimal.ZERO) <= 0) {
            errors.add("Giá bán phải lớn hơn 0");
        }
        if (soLuongTonKho == null || soLuongTonKho < 0) {
            errors.add("Số lượng tồn kho phải >= 0");
        }
        if (giaGoc != null && giaGoc.compareTo(BigDecimal.ZERO) < 0) {
            errors.add("Giá gốc không được âm");
        }

        // Check for existing product: match by tenProduct + danhMuc + thuongHieu
        boolean exists = false;
        Long existingId = null;
        String existingName = null;
        Integer existingStock = null;

        if (!tenProduct.isEmpty() && !danhMuc.isEmpty() && !thuongHieu.isEmpty()) {
            Category cat = categoryMap.get(danhMuc.toLowerCase());
            Brand br = brandMap.get(thuongHieu.toLowerCase());

            if (cat != null && br != null) {
                // Primary match: name + category + brand
                Optional<Product> match = allProducts.stream()
                        .filter(p -> p.getTenProduct().trim().equalsIgnoreCase(tenProduct)
                                && p.getCategory().getIdCategory().equals(cat.getIdCategory())
                                && p.getBrand().getIdBrand().equals(br.getIdBrand()))
                        .findFirst();

                if (match.isPresent()) {
                    exists = true;
                    existingId = match.get().getIdProduct();
                    existingName = match.get().getTenProduct();
                    existingStock = match.get().getSoLuongTonKho();
                } else {
                    // Fallback: match by name only (for warning)
                    Optional<Product> nameMatch = allProducts.stream()
                            .filter(p -> p.getTenProduct().trim().equalsIgnoreCase(tenProduct))
                            .findFirst();
                    if (nameMatch.isPresent()) {
                        exists = true;
                        existingId = nameMatch.get().getIdProduct();
                        existingName = nameMatch.get().getTenProduct();
                        existingStock = nameMatch.get().getSoLuongTonKho();
                    }
                }
            }
        }

        return ExcelProductRow.builder()
                .rowNumber(rowNum)
                .tenProduct(tenProduct)
                .moTa(moTa)
                .danhMuc(danhMuc)
                .thuongHieu(thuongHieu)
                .giaBan(giaBan)
                .giaGoc(giaGoc)
                .soLuongTonKho(soLuongTonKho)
                .imageUrls(imageUrls)
                .exists(exists)
                .existingProductId(existingId)
                .existingProductName(existingName)
                .existingStock(existingStock)
                .action(exists ? "UPDATE" : "CREATE")
                .valid(errors.isEmpty())
                .errors(errors)
                .build();
    }

    private void saveProductImages(Product product, List<String> urls) {
        for (int i = 0; i < urls.size() && i < 5; i++) {
            String url = urls.get(i);
            if (url != null && !url.isBlank()) {
                ProductImage img = ProductImage.builder()
                        .product(product)
                        .imageUrl(url.trim())
                        .isThumbnail(i == 0)
                        .displayOrder(i)
                        .build();
                productImageRepository.save(img);
            }
        }
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toString();
                }
                // Avoid scientific notation for numbers
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val) && !Double.isInfinite(val)) {
                    yield String.valueOf((long) val);
                }
                yield String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try {
                    yield cell.getStringCellValue();
                } catch (Exception e) {
                    try {
                        yield String.valueOf(cell.getNumericCellValue());
                    } catch (Exception ex) {
                        yield "";
                    }
                }
            }
            default -> "";
        };
    }

    private BigDecimal getCellBigDecimalValue(Cell cell) {
        if (cell == null) return null;
        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return BigDecimal.valueOf(cell.getNumericCellValue());
            }
            if (cell.getCellType() == CellType.STRING) {
                String val = cell.getStringCellValue().trim().replace(",", "");
                if (val.isEmpty()) return null;
                return new BigDecimal(val);
            }
        } catch (Exception e) {
            // ignore parse errors
        }
        return null;
    }

    private Integer getCellIntValue(Cell cell) {
        if (cell == null) return null;
        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return (int) cell.getNumericCellValue();
            }
            if (cell.getCellType() == CellType.STRING) {
                String val = cell.getStringCellValue().trim();
                if (val.isEmpty()) return null;
                return Integer.parseInt(val);
            }
        } catch (Exception e) {
            // ignore parse errors
        }
        return null;
    }

    private ExcelImportPreviewResponse buildResponse(List<ExcelProductRow> rows, List<String> globalErrors) {
        long validCount = rows.stream().filter(ExcelProductRow::isValid).count();
        long newCount = rows.stream().filter(r -> r.isValid() && !r.isExists()).count();
        long existCount = rows.stream().filter(r -> r.isValid() && r.isExists()).count();

        return ExcelImportPreviewResponse.builder()
                .totalRows(rows.size())
                .validRows((int) validCount)
                .invalidRows(rows.size() - (int) validCount)
                .newProducts((int) newCount)
                .existingProducts((int) existCount)
                .rows(rows)
                .globalErrors(globalErrors)
                .build();
    }
}
