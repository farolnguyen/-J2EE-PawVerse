package J2EE.PawVerse.service;

import J2EE.PawVerse.dto.order.OrderDTO;
import J2EE.PawVerse.dto.order.OrderItemDTO;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@Slf4j
public class InvoiceService {

    private static final DeviceRgb PRIMARY_COLOR = new DeviceRgb(59, 130, 246);
    private static final DeviceRgb HEADER_BG = new DeviceRgb(37, 99, 235);
    private static final DeviceRgb ROW_ALT = new DeviceRgb(249, 250, 251);
    private static final DeviceRgb TEXT_DARK = new DeviceRgb(17, 24, 39);
    private static final DeviceRgb TEXT_GRAY = new DeviceRgb(107, 114, 128);
    private static final DeviceRgb GREEN = new DeviceRgb(22, 163, 74);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public byte[] generateInvoice(OrderDTO order) {
        if (!"DELIVERED".equals(order.getOrderStatus())) {
            throw new RuntimeException("Chỉ có thể xuất hóa đơn cho đơn hàng đã giao");
        }
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc, PageSize.A4);
            document.setMargins(45, 50, 45, 50);

            PdfFont regular = loadFont(false);
            PdfFont bold = loadFont(true);

            renderHeader(document, regular, bold);
            renderOrderInfo(document, order, regular, bold);
            renderItemsTable(document, order, regular, bold);
            renderPriceSummary(document, order, regular, bold);
            renderFooter(document, regular);

            document.close();
            return baos.toByteArray();
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error generating PDF invoice for order {}", order.getOrderId(), e);
            throw new RuntimeException("Không thể tạo hóa đơn PDF", e);
        }
    }

    private PdfFont loadFont(boolean bold) {
        String[] windowsPaths = bold
                ? new String[]{"C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/calibrib.ttf"}
                : new String[]{"C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/calibri.ttf"};
        String[] linuxPaths = bold
                ? new String[]{"/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"}
                : new String[]{"/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"};

        for (String path : windowsPaths) {
            try {
                return PdfFontFactory.createFont(path, PdfEncodings.IDENTITY_H,
                        PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED);
            } catch (Exception ignored) {}
        }
        for (String path : linuxPaths) {
            try {
                return PdfFontFactory.createFont(path, PdfEncodings.IDENTITY_H,
                        PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED);
            } catch (Exception ignored) {}
        }
        try {
            return PdfFontFactory.createFont();
        } catch (Exception e) {
            throw new RuntimeException("Cannot load any PDF font", e);
        }
    }

    private void renderHeader(Document doc, PdfFont regular, PdfFont bold) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();

        Cell left = new Cell().setBorder(null).setPaddingBottom(4);
        left.add(new Paragraph("PawVerse").setFont(bold).setFontSize(28).setFontColor(PRIMARY_COLOR).setMarginBottom(2));
        left.add(new Paragraph("Cua hang san pham thu cung").setFont(regular).setFontSize(10).setFontColor(TEXT_GRAY));
        table.addCell(left);

        Cell right = new Cell().setBorder(null).setTextAlignment(TextAlignment.RIGHT).setPaddingBottom(4);
        right.add(new Paragraph("HOA DON BAN HANG").setFont(bold).setFontSize(15).setFontColor(TEXT_DARK));
        table.addCell(right);

        doc.add(table);
        doc.add(new LineSeparator(new SolidLine(1)).setMarginTop(6).setMarginBottom(20));
    }

    private void renderOrderInfo(Document doc, OrderDTO order, PdfFont regular, PdfFont bold) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();

        Cell left = new Cell().setBorder(null);
        left.add(new Paragraph("Thong tin khach hang").setFont(bold).setFontSize(11)
                .setFontColor(PRIMARY_COLOR).setMarginBottom(5));
        if (order.getCustomerName() != null)
            left.add(new Paragraph(order.getCustomerName()).setFont(bold).setFontSize(11).setFontColor(TEXT_DARK));
        if (order.getCustomerPhone() != null)
            left.add(new Paragraph("SDT: " + order.getCustomerPhone()).setFont(regular).setFontSize(10).setFontColor(TEXT_GRAY));
        if (order.getCustomerEmail() != null)
            left.add(new Paragraph("Email: " + order.getCustomerEmail()).setFont(regular).setFontSize(10).setFontColor(TEXT_GRAY));
        String addr = buildAddress(order);
        if (!addr.isEmpty())
            left.add(new Paragraph("Dia chi: " + addr).setFont(regular).setFontSize(10).setFontColor(TEXT_GRAY));
        table.addCell(left);

        Cell right = new Cell().setBorder(null).setTextAlignment(TextAlignment.RIGHT);
        right.add(new Paragraph("Thong tin don hang").setFont(bold).setFontSize(11)
                .setFontColor(PRIMARY_COLOR).setMarginBottom(5));
        right.add(new Paragraph("Ma don: #" + (order.getOrderNumber() != null ? order.getOrderNumber() : order.getOrderId()))
                .setFont(bold).setFontSize(11).setFontColor(TEXT_DARK));
        if (order.getOrderDate() != null)
            right.add(new Paragraph("Ngay dat: " + order.getOrderDate().format(DATE_FMT))
                    .setFont(regular).setFontSize(10).setFontColor(TEXT_GRAY));
        if (order.getActualDelivery() != null)
            right.add(new Paragraph("Ngay giao: " + order.getActualDelivery().format(DATE_FMT))
                    .setFont(regular).setFontSize(10).setFontColor(TEXT_GRAY));
        right.add(new Paragraph("Thanh toan: Da thanh toan").setFont(regular).setFontSize(10).setFontColor(GREEN));
        table.addCell(right);

        doc.add(table);
        doc.add(new Paragraph(" ").setMarginBottom(8));
    }

    private void renderItemsTable(Document doc, OrderDTO order, PdfFont regular, PdfFont bold) {
        float[] cols = {3.5f, 1f, 1.8f, 1.8f};
        Table table = new Table(UnitValue.createPercentArray(cols)).useAllAvailableWidth();

        String[] headers = {"San pham", "SL", "Don gia", "Thanh tien"};
        TextAlignment[] aligns = {TextAlignment.LEFT, TextAlignment.CENTER, TextAlignment.RIGHT, TextAlignment.RIGHT};
        for (int i = 0; i < headers.length; i++) {
            table.addHeaderCell(new Cell()
                    .setBackgroundColor(HEADER_BG)
                    .setFont(bold).setFontSize(10).setFontColor(ColorConstants.WHITE)
                    .setPadding(8).setTextAlignment(aligns[i])
                    .add(new Paragraph(headers[i])));
        }

        if (order.getItems() != null) {
            boolean alt = false;
            for (OrderItemDTO item : order.getItems()) {
                DeviceRgb bg = alt ? ROW_ALT : new DeviceRgb(255, 255, 255);
                String name = item.getProductName() != null ? item.getProductName() : "San pham da xoa";

                table.addCell(dataCell(name, regular, bg, TextAlignment.LEFT));
                table.addCell(dataCell(String.valueOf(item.getQuantity()), regular, bg, TextAlignment.CENTER));
                table.addCell(dataCell(formatVnd(item.getPrice()), regular, bg, TextAlignment.RIGHT));
                table.addCell(dataCell(formatVnd(item.getTotal()), regular, bg, TextAlignment.RIGHT));
                alt = !alt;
            }
        }

        doc.add(table);
        doc.add(new Paragraph(" ").setMarginBottom(8));
    }

    private Cell dataCell(String text, PdfFont font, DeviceRgb bg, TextAlignment align) {
        return new Cell().setBackgroundColor(bg).setFont(font).setFontSize(10)
                .setPadding(7).setTextAlignment(align).add(new Paragraph(text));
    }

    private void renderPriceSummary(Document doc, OrderDTO order, PdfFont regular, PdfFont bold) {
        Table wrapper = new Table(UnitValue.createPercentArray(new float[]{1.5f, 1})).useAllAvailableWidth();
        wrapper.addCell(new Cell().setBorder(null));

        Table priceBox = new Table(UnitValue.createPercentArray(new float[]{1.3f, 1})).useAllAvailableWidth();

        addPriceRow(priceBox, "Tam tinh:", formatVnd(order.getTotalAmount()), regular, false);
        addPriceRow(priceBox, "Phi van chuyen:",
                formatVnd(order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO), regular, false);

        if (order.getDiscountAmount() != null && order.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            addPriceRow(priceBox, "Giam gia:", "- " + formatVnd(order.getDiscountAmount()), regular, false);
        }

        priceBox.addCell(new Cell(1, 2).setBorder(null).setBorderTop(new SolidBorder(TEXT_GRAY, 1)).setHeight(1f));
        addPriceRow(priceBox, "TONG CONG:", formatVnd(order.getFinalAmount()), bold, true);

        wrapper.addCell(new Cell().setBorder(null).add(priceBox));
        doc.add(wrapper);
    }

    private void addPriceRow(Table table, String label, String value, PdfFont font, boolean total) {
        float size = total ? 12f : 10f;
        DeviceRgb color = total ? PRIMARY_COLOR : TEXT_DARK;

        table.addCell(new Cell().setBorder(null).setFont(font).setFontSize(size).setFontColor(color)
                .setPaddingTop(5).setPaddingBottom(5).add(new Paragraph(label).setTextAlignment(TextAlignment.LEFT)));
        table.addCell(new Cell().setBorder(null).setFont(font).setFontSize(size).setFontColor(color)
                .setPaddingTop(5).setPaddingBottom(5).add(new Paragraph(value).setTextAlignment(TextAlignment.RIGHT)));
    }

    private void renderFooter(Document doc, PdfFont regular) {
        doc.add(new Paragraph(" ").setMarginTop(24));
        doc.add(new LineSeparator(new SolidLine(1)).setMarginBottom(10));
        doc.add(new Paragraph("Cam on ban da tin tuong mua sam tai PawVerse!")
                .setFont(regular).setFontSize(10).setFontColor(TEXT_GRAY).setTextAlignment(TextAlignment.CENTER));
        doc.add(new Paragraph("Moi thac mac vui long lien he: support@pawverse.vn")
                .setFont(regular).setFontSize(9).setFontColor(TEXT_GRAY).setTextAlignment(TextAlignment.CENTER));
    }

    private String buildAddress(OrderDTO order) {
        StringBuilder sb = new StringBuilder();
        if (order.getShippingAddress() != null) sb.append(order.getShippingAddress());
        if (order.getShippingDistrict() != null && !order.getShippingDistrict().isBlank())
            sb.append(", ").append(order.getShippingDistrict());
        if (order.getShippingCity() != null && !order.getShippingCity().isBlank())
            sb.append(", ").append(order.getShippingCity());
        return sb.toString();
    }

    private String formatVnd(BigDecimal amount) {
        if (amount == null) return "0 VND";
        NumberFormat fmt = NumberFormat.getNumberInstance(Locale.of("vi", "VN"));
        return fmt.format(amount) + " VND";
    }
}
