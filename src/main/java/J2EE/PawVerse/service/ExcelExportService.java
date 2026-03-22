package J2EE.PawVerse.service;

import J2EE.PawVerse.dto.analytics.ExportRequest;
import J2EE.PawVerse.entity.Order;
import J2EE.PawVerse.entity.Product;
import J2EE.PawVerse.entity.User;
import J2EE.PawVerse.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExcelExportService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductImageRepository productImageRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;

    // ============ COLUMN DEFINITIONS ============

    public static final Map<String, String> PRODUCT_COLUMNS = new LinkedHashMap<>() {{
        put("idProduct", "ID");
        put("tenProduct", "Tên sản phẩm");
        put("categoryName", "Danh mục");
        put("brandName", "Thương hiệu");
        put("giaBan", "Giá bán");
        put("giaGoc", "Giá gốc");
        put("soLuongTonKho", "Tồn kho");
        put("soLuongDaBan", "Đã bán");
        put("revenue", "Doanh thu ước tính");
        put("avgRating", "Đánh giá TB");
        put("totalReviews", "Số đánh giá");
        put("isEnabled", "Trạng thái");
        put("isFeatured", "Nổi bật");
        put("ngayTao", "Ngày tạo");
    }};

    public static final Map<String, String> ORDER_COLUMNS = new LinkedHashMap<>() {{
        put("idOrder", "ID");
        put("maOrder", "Mã đơn hàng");
        put("customerName", "Khách hàng");
        put("email", "Email");
        put("soDienThoai", "Số điện thoại");
        put("tongTienSanPham", "Tổng tiền SP");
        put("phiVanChuyen", "Phí vận chuyển");
        put("tienGiamGia", "Giảm giá");
        put("tongTienCuoiCung", "Tổng thanh toán");
        put("orderStatus", "Trạng thái");
        put("paymentMethod", "Phương thức TT");
        put("paymentStatus", "TT thanh toán");
        put("diaChiGiaoHang", "Địa chỉ");
        put("ngayTao", "Ngày đặt");
    }};

    public static final Map<String, String> CUSTOMER_COLUMNS = new LinkedHashMap<>() {{
        put("idUser", "ID");
        put("fullName", "Họ tên");
        put("email", "Email");
        put("soDienThoai", "Số điện thoại");
        put("totalOrders", "Số đơn hàng");
        put("totalSpent", "Tổng chi tiêu");
        put("roleName", "Vai trò");
        put("locked", "Trạng thái");
        put("ngayTao", "Ngày đăng ký");
    }};

    public static final Map<String, String> REVENUE_COLUMNS = new LinkedHashMap<>() {{
        put("period", "Kỳ");
        put("revenue", "Doanh thu");
        put("orderCount", "Số đơn hàng");
        put("avgOrderValue", "TB/đơn");
    }};

    // ============ SORT OPTIONS ============

    public static final Map<String, List<String>> SORT_OPTIONS = new LinkedHashMap<>() {{
        put("PRODUCTS", List.of("idProduct", "tenProduct", "giaBan", "soLuongTonKho", "soLuongDaBan", "avgRating", "ngayTao"));
        put("ORDERS", List.of("idOrder", "tongTienCuoiCung", "ngayTao", "trangThaiOrder"));
        put("CUSTOMERS", List.of("idUser", "fullName", "totalOrders", "totalSpent", "ngayTao"));
        put("REVENUE", List.of("period", "revenue", "orderCount"));
    }};

    @Transactional(readOnly = true)
    public byte[] exportReport(ExportRequest request) {
        return switch (request.getReportType().toUpperCase()) {
            case "PRODUCTS" -> exportProducts(request);
            case "ORDERS" -> exportOrders(request);
            case "CUSTOMERS" -> exportCustomers(request);
            case "REVENUE" -> exportRevenue(request);
            default -> throw new RuntimeException("Loại báo cáo không hợp lệ: " + request.getReportType());
        };
    }

    // ============ PRODUCT EXPORT ============

    private byte[] exportProducts(ExportRequest request) {
        List<String> cols = getColumns(request, PRODUCT_COLUMNS);
        String sortField = mapProductSortField(request.getSortBy());
        Sort.Direction dir = "ASC".equalsIgnoreCase(request.getSortDirection()) ? Sort.Direction.ASC : Sort.Direction.DESC;

        int limit = request.getLimit() != null && request.getLimit() > 0 ? request.getLimit() : Integer.MAX_VALUE;
        List<Product> products = productRepository.findAll(Sort.by(dir, sortField));
        if (limit < products.size()) {
            products = products.subList(0, limit);
        }

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Sản phẩm");
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle moneyStyle = createMoneyStyle(wb);

            // Header
            Row header = sheet.createRow(0);
            for (int i = 0; i < cols.size(); i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(PRODUCT_COLUMNS.get(cols.get(i)));
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            // Data
            int rowIdx = 1;
            for (Product p : products) {
                Row row = sheet.createRow(rowIdx++);
                int colIdx = 0;
                for (String col : cols) {
                    Cell cell = row.createCell(colIdx++);
                    switch (col) {
                        case "idProduct" -> cell.setCellValue(p.getIdProduct());
                        case "tenProduct" -> cell.setCellValue(p.getTenProduct());
                        case "categoryName" -> cell.setCellValue(p.getCategory() != null ? p.getCategory().getTenCategory() : "");
                        case "brandName" -> cell.setCellValue(p.getBrand() != null ? p.getBrand().getTenBrand() : "");
                        case "giaBan" -> { cell.setCellValue(p.getGiaBan() != null ? p.getGiaBan().doubleValue() : 0); cell.setCellStyle(moneyStyle); }
                        case "giaGoc" -> { cell.setCellValue(p.getGiaGoc() != null ? p.getGiaGoc().doubleValue() : 0); cell.setCellStyle(moneyStyle); }
                        case "soLuongTonKho" -> cell.setCellValue(p.getSoLuongTonKho() != null ? p.getSoLuongTonKho() : 0);
                        case "soLuongDaBan" -> cell.setCellValue(p.getSoLuongDaBan() != null ? p.getSoLuongDaBan() : 0);
                        case "revenue" -> {
                            double rev = 0;
                            if (p.getGiaBan() != null && p.getSoLuongDaBan() != null) {
                                rev = p.getGiaBan().doubleValue() * p.getSoLuongDaBan();
                            }
                            cell.setCellValue(rev);
                            cell.setCellStyle(moneyStyle);
                        }
                        case "avgRating" -> cell.setCellValue(p.getAvgRating() != null ? p.getAvgRating() : 0);
                        case "totalReviews" -> cell.setCellValue(p.getTotalReviews() != null ? p.getTotalReviews() : 0);
                        case "isEnabled" -> cell.setCellValue(Boolean.TRUE.equals(p.getIsEnabled()) ? "Đang bán" : "Đã ẩn");
                        case "isFeatured" -> cell.setCellValue(Boolean.TRUE.equals(p.getIsFeatured()) ? "Có" : "Không");
                        case "ngayTao" -> cell.setCellValue(p.getNgayTao() != null ? p.getNgayTao().format(fmt) : "");
                    }
                }
            }

            // Auto-size important columns
            for (int i = 0; i < cols.size(); i++) {
                if ("tenProduct".equals(cols.get(i))) sheet.setColumnWidth(i, 10000);
                if ("categoryName".equals(cols.get(i)) || "brandName".equals(cols.get(i))) sheet.setColumnWidth(i, 6000);
            }

            return writeToBytes(wb);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi export sản phẩm: " + e.getMessage());
        }
    }

    // ============ ORDER EXPORT ============

    private byte[] exportOrders(ExportRequest request) {
        List<String> cols = getColumns(request, ORDER_COLUMNS);
        String sortField = mapOrderSortField(request.getSortBy());
        Sort.Direction dir = "ASC".equalsIgnoreCase(request.getSortDirection()) ? Sort.Direction.ASC : Sort.Direction.DESC;

        int limit = request.getLimit() != null && request.getLimit() > 0 ? request.getLimit() : Integer.MAX_VALUE;
        List<Order> orders = orderRepository.findAll(Sort.by(dir, sortField));
        if (limit < orders.size()) {
            orders = orders.subList(0, limit);
        }

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Đơn hàng");
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle moneyStyle = createMoneyStyle(wb);

            Row header = sheet.createRow(0);
            for (int i = 0; i < cols.size(); i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(ORDER_COLUMNS.get(cols.get(i)));
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            int rowIdx = 1;
            for (Order o : orders) {
                Row row = sheet.createRow(rowIdx++);
                int colIdx = 0;
                for (String col : cols) {
                    Cell cell = row.createCell(colIdx++);
                    switch (col) {
                        case "idOrder" -> cell.setCellValue(o.getIdOrder());
                        case "maOrder" -> cell.setCellValue(o.getMaOrder() != null ? o.getMaOrder() : "");
                        case "customerName" -> cell.setCellValue(o.getHoTen() != null ? o.getHoTen() : o.getTenKhachHang());
                        case "email" -> cell.setCellValue(o.getEmail() != null ? o.getEmail() : "");
                        case "soDienThoai" -> cell.setCellValue(o.getSoDienThoai() != null ? o.getSoDienThoai() : "");
                        case "tongTienSanPham" -> { cell.setCellValue(o.getTongTienSanPham() != null ? o.getTongTienSanPham().doubleValue() : 0); cell.setCellStyle(moneyStyle); }
                        case "phiVanChuyen" -> { cell.setCellValue(o.getPhiVanChuyen() != null ? o.getPhiVanChuyen().doubleValue() : 0); cell.setCellStyle(moneyStyle); }
                        case "tienGiamGia" -> { cell.setCellValue(o.getTienGiamGia() != null ? o.getTienGiamGia().doubleValue() : 0); cell.setCellStyle(moneyStyle); }
                        case "tongTienCuoiCung" -> { cell.setCellValue(o.getTongTienCuoiCung() != null ? o.getTongTienCuoiCung().doubleValue() : 0); cell.setCellStyle(moneyStyle); }
                        case "orderStatus" -> cell.setCellValue(o.getTrangThaiOrder() != null ? o.getTrangThaiOrder() : "");
                        case "paymentMethod" -> cell.setCellValue(o.getPhuongThucThanhToan() != null ? o.getPhuongThucThanhToan() : "");
                        case "paymentStatus" -> cell.setCellValue(o.getTrangThaiThanhToan() != null ? o.getTrangThaiThanhToan() : "");
                        case "diaChiGiaoHang" -> cell.setCellValue(buildAddress(o));
                        case "ngayTao" -> cell.setCellValue(o.getNgayTao() != null ? o.getNgayTao().format(fmt) : "");
                    }
                }
            }

            return writeToBytes(wb);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi export đơn hàng: " + e.getMessage());
        }
    }

    // ============ CUSTOMER EXPORT ============

    private byte[] exportCustomers(ExportRequest request) {
        List<String> cols = getColumns(request, CUSTOMER_COLUMNS);
        int limit = request.getLimit() != null && request.getLimit() > 0 ? request.getLimit() : Integer.MAX_VALUE;

        List<User> allUsers = userRepository.findAll();

        // Build spending map
        Map<Long, BigDecimal> spendingMap = new HashMap<>();
        Map<Long, Long> orderCountMap = new HashMap<>();
        for (Order o : orderRepository.findAll()) {
            if ("DELIVERED".equals(o.getTrangThaiOrder()) && o.getUser() != null) {
                Long uid = o.getUser().getIdUser();
                BigDecimal amt = o.getTongTienCuoiCung() != null ? o.getTongTienCuoiCung() : o.getTongTien();
                spendingMap.merge(uid, amt != null ? amt : BigDecimal.ZERO, BigDecimal::add);
                orderCountMap.merge(uid, 1L, Long::sum);
            }
        }

        // Attach spending to users and sort
        List<Map.Entry<User, BigDecimal>> userEntries = allUsers.stream()
                .map(u -> Map.entry(u, spendingMap.getOrDefault(u.getIdUser(), BigDecimal.ZERO)))
                .collect(Collectors.toList());

        // Sort
        String sortBy = request.getSortBy() != null ? request.getSortBy() : "totalSpent";
        boolean asc = "ASC".equalsIgnoreCase(request.getSortDirection());
        userEntries.sort((a, b) -> {
            int cmp = switch (sortBy) {
                case "idUser" -> Long.compare(a.getKey().getIdUser(), b.getKey().getIdUser());
                case "fullName" -> String.valueOf(a.getKey().getFullName()).compareToIgnoreCase(String.valueOf(b.getKey().getFullName()));
                case "totalOrders" -> Long.compare(
                        orderCountMap.getOrDefault(a.getKey().getIdUser(), 0L),
                        orderCountMap.getOrDefault(b.getKey().getIdUser(), 0L));
                default -> a.getValue().compareTo(b.getValue());
            };
            return asc ? cmp : -cmp;
        });

        if (limit < userEntries.size()) {
            userEntries = userEntries.subList(0, limit);
        }

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Khách hàng");
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle moneyStyle = createMoneyStyle(wb);

            Row header = sheet.createRow(0);
            for (int i = 0; i < cols.size(); i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(CUSTOMER_COLUMNS.get(cols.get(i)));
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            int rowIdx = 1;
            for (Map.Entry<User, BigDecimal> entry : userEntries) {
                User u = entry.getKey();
                BigDecimal spent = entry.getValue();
                Row row = sheet.createRow(rowIdx++);
                int colIdx = 0;
                for (String col : cols) {
                    Cell cell = row.createCell(colIdx++);
                    switch (col) {
                        case "idUser" -> cell.setCellValue(u.getIdUser());
                        case "fullName" -> cell.setCellValue(u.getFullName() != null ? u.getFullName() : u.getUsername());
                        case "email" -> cell.setCellValue(u.getEmail() != null ? u.getEmail() : "");
                        case "soDienThoai" -> cell.setCellValue(u.getSoDienThoai() != null ? u.getSoDienThoai() : "");
                        case "totalOrders" -> cell.setCellValue(orderCountMap.getOrDefault(u.getIdUser(), 0L));
                        case "totalSpent" -> { cell.setCellValue(spent.doubleValue()); cell.setCellStyle(moneyStyle); }
                        case "roleName" -> cell.setCellValue(u.getRole() != null ? u.getRole().getTenRole() : "");
                        case "locked" -> cell.setCellValue(Boolean.TRUE.equals(u.getIsLocked()) ? "Bị khóa" : "Hoạt động");
                        case "ngayTao" -> cell.setCellValue(u.getNgayTao() != null ? u.getNgayTao().format(fmt) : "");
                    }
                }
            }

            return writeToBytes(wb);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi export khách hàng: " + e.getMessage());
        }
    }

    // ============ REVENUE EXPORT ============

    private byte[] exportRevenue(ExportRequest request) {
        List<String> cols = getColumns(request, REVENUE_COLUMNS);

        // Get revenue by month for the last 12 months
        java.time.LocalDateTime end = java.time.LocalDateTime.now();
        java.time.LocalDateTime start = end.minusMonths(12);
        List<Object[]> rawResults = orderRepository.findRevenueByMonth(start, end);

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Object[] r : rawResults) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("period", r[0].toString());
            BigDecimal rev = r[1] != null ? (BigDecimal) r[1] : BigDecimal.ZERO;
            Long count = ((Number) r[2]).longValue();
            map.put("revenue", rev);
            map.put("orderCount", count);
            map.put("avgOrderValue", count > 0 ? rev.doubleValue() / count : 0.0);
            rows.add(map);
        }

        // Sort
        boolean asc = "ASC".equalsIgnoreCase(request.getSortDirection());
        String sortBy = request.getSortBy() != null ? request.getSortBy() : "period";
        rows.sort((a, b) -> {
            Comparable va = (Comparable) a.get(sortBy);
            Comparable vb = (Comparable) b.get(sortBy);
            if (va == null) return asc ? -1 : 1;
            if (vb == null) return asc ? 1 : -1;
            int cmp = va.compareTo(vb);
            return asc ? cmp : -cmp;
        });

        int limit = request.getLimit() != null && request.getLimit() > 0 ? request.getLimit() : Integer.MAX_VALUE;
        if (limit < rows.size()) {
            rows = rows.subList(0, limit);
        }

        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Doanh thu");
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle moneyStyle = createMoneyStyle(wb);

            Row header = sheet.createRow(0);
            for (int i = 0; i < cols.size(); i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(REVENUE_COLUMNS.get(cols.get(i)));
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            int rowIdx = 1;
            for (Map<String, Object> dataRow : rows) {
                Row row = sheet.createRow(rowIdx++);
                int colIdx = 0;
                for (String col : cols) {
                    Cell cell = row.createCell(colIdx++);
                    Object val = dataRow.get(col);
                    if (val instanceof BigDecimal bd) {
                        cell.setCellValue(bd.doubleValue());
                        cell.setCellStyle(moneyStyle);
                    } else if (val instanceof Number num) {
                        cell.setCellValue(num.doubleValue());
                        if ("revenue".equals(col) || "avgOrderValue".equals(col)) cell.setCellStyle(moneyStyle);
                    } else {
                        cell.setCellValue(val != null ? val.toString() : "");
                    }
                }
            }

            return writeToBytes(wb);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi export doanh thu: " + e.getMessage());
        }
    }

    // ============ HELPERS ============

    private List<String> getColumns(ExportRequest request, Map<String, String> allColumns) {
        if (request.getColumns() != null && !request.getColumns().isEmpty()) {
            return request.getColumns().stream()
                    .filter(allColumns::containsKey)
                    .collect(Collectors.toList());
        }
        return new ArrayList<>(allColumns.keySet());
    }

    private String mapProductSortField(String field) {
        if (field == null) return "idProduct";
        return switch (field) {
            case "tenProduct" -> "tenProduct";
            case "giaBan" -> "giaBan";
            case "soLuongTonKho" -> "soLuongTonKho";
            case "soLuongDaBan" -> "soLuongDaBan";
            case "avgRating" -> "avgRating";
            case "ngayTao" -> "ngayTao";
            default -> "idProduct";
        };
    }

    private String mapOrderSortField(String field) {
        if (field == null) return "idOrder";
        return switch (field) {
            case "tongTienCuoiCung" -> "tongTienCuoiCung";
            case "ngayTao" -> "ngayTao";
            case "orderStatus" -> "trangThaiOrder";
            default -> "idOrder";
        };
    }


    private String buildAddress(Order o) {
        StringBuilder sb = new StringBuilder();
        if (o.getDiaChiGiaoHang() != null) sb.append(o.getDiaChiGiaoHang());
        if (o.getPhuongXa() != null) sb.append(", ").append(o.getPhuongXa());
        if (o.getQuanHuyen() != null) sb.append(", ").append(o.getQuanHuyen());
        if (o.getTinhThanhPho() != null) sb.append(", ").append(o.getTinhThanhPho());
        return sb.toString();
    }

    private CellStyle createHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createMoneyStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        DataFormat format = wb.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0"));
        return style;
    }

    private byte[] writeToBytes(Workbook wb) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi ghi file Excel: " + e.getMessage());
        }
    }
}
