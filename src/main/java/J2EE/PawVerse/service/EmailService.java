package J2EE.PawVerse.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@pawverse.com}")
    private String fromEmail;

    public void sendOtpEmail(String toEmail, String otp) {
        String subject = "PawVerse - Mã xác thực đặt lại mật khẩu";
        String body = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">🐾 PawVerse</h1>
                    </div>
                    <div style="padding: 30px; background: #fff; border: 1px solid #e5e7eb;">
                        <h2 style="color: #1f2937;">Mã xác thực đặt lại mật khẩu</h2>
                        <p style="color: #4b5563;">Bạn đã yêu cầu đặt lại mật khẩu. Đây là mã OTP của bạn:</p>
                        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #f97316;">%s</span>
                        </div>
                        <p style="color: #6b7280; font-size: 14px;">Mã này có hiệu lực trong 10 phút. Không chia sẻ mã này với bất kỳ ai.</p>
                    </div>
                    <div style="background: #f9fafb; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">PawVerse - Cửa hàng thú cưng trực tuyến</p>
                    </div>
                </div>
                """.formatted(otp);

        sendHtmlEmail(toEmail, subject, body);
    }

    public void sendEmailVerificationOtp(String toEmail, String otp) {
        String subject = "PawVerse - Xác thực email của bạn";
        String body = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">🐾 PawVerse</h1>
                    </div>
                    <div style="padding: 30px; background: #fff; border: 1px solid #e5e7eb;">
                        <h2 style="color: #1f2937;">Xác thực email của bạn</h2>
                        <p style="color: #4b5563;">Vui lòng nhập mã OTP bên dưới để xác thực email và nhận phiếu giảm giá cho lần mua đầu tiên!</p>
                        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #f97316;">%s</span>
                        </div>
                        <p style="color: #6b7280; font-size: 14px;">Mã này có hiệu lực trong 10 phút.</p>
                    </div>
                    <div style="background: #f9fafb; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">PawVerse - Cửa hàng thú cưng trực tuyến</p>
                    </div>
                </div>
                """.formatted(otp);

        sendHtmlEmail(toEmail, subject, body);
    }

    public void sendOrderConfirmation(String toEmail, String orderNumber, String totalAmount) {
        String subject = "PawVerse - Xác nhận đơn hàng #" + orderNumber;
        String body = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">🐾 PawVerse</h1>
                    </div>
                    <div style="padding: 30px; background: #fff; border: 1px solid #e5e7eb;">
                        <h2 style="color: #1f2937;">Đặt hàng thành công!</h2>
                        <p style="color: #4b5563;">Cảm ơn bạn đã đặt hàng tại PawVerse. Đơn hàng của bạn đã được xác nhận.</p>
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Mã đơn hàng:</strong> %s</p>
                            <p style="margin: 5px 0;"><strong>Tổng tiền:</strong> %s</p>
                        </div>
                        <p style="color: #6b7280; font-size: 14px;">Bạn có thể theo dõi đơn hàng trong mục "Đơn hàng của tôi".</p>
                    </div>
                    <div style="background: #f9fafb; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">PawVerse - Cửa hàng thú cưng trực tuyến</p>
                    </div>
                </div>
                """.formatted(orderNumber, totalAmount);

        sendHtmlEmail(toEmail, subject, body);
    }

    public void sendBookingConfirmation(String toEmail, String hoTen, String serviceType, String packageInfo, String ngayGioDat, String location) {
        String serviceLabel = switch (serviceType) {
            case "PET_HOTEL" -> "Pet Hotel";
            case "SPA_GROOMING" -> "Spa & Grooming";
            case "HOME_SERVICE" -> "Home Service";
            default -> serviceType;
        };
        String subject = "PawVerse - Xác nhận đặt lịch dịch vụ " + serviceLabel;
        String body = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">🐾 PawVerse</h1>
                    </div>
                    <div style="padding: 30px; background: #fff; border: 1px solid #e5e7eb;">
                        <h2 style="color: #1f2937;">Đặt lịch dịch vụ thành công!</h2>
                        <p style="color: #4b5563;">Xin chào <strong>%s</strong>, cảm ơn bạn đã đặt lịch dịch vụ tại PawVerse.</p>
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Dịch vụ:</strong> %s</p>
                            <p style="margin: 5px 0;"><strong>Gói:</strong> %s</p>
                            <p style="margin: 5px 0;"><strong>Ngày hẹn:</strong> %s</p>
                            <p style="margin: 5px 0;"><strong>Chi nhánh:</strong> %s</p>
                        </div>
                        <p style="color: #4b5563;">Trạng thái hiện tại: <strong style="color: #f97316;">Đang chờ xác nhận</strong></p>
                        <p style="color: #6b7280; font-size: 14px;">Nhân viên sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận lịch hẹn.</p>
                        <p style="color: #6b7280; font-size: 14px;">Bạn có thể theo dõi trạng thái đặt lịch trong mục "Lịch sử đặt dịch vụ".</p>
                    </div>
                    <div style="background: #f9fafb; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">PawVerse - Cửa hàng thú cưng trực tuyến</p>
                    </div>
                </div>
                """.formatted(hoTen, serviceLabel, packageInfo, ngayGioDat, location);

        sendHtmlEmail(toEmail, subject, body);
    }

    public void sendBookingStatusUpdate(String toEmail, String hoTen, String serviceType, String newStatus) {
        String serviceLabel = switch (serviceType) {
            case "PET_HOTEL" -> "Pet Hotel";
            case "SPA_GROOMING" -> "Spa & Grooming";
            case "HOME_SERVICE" -> "Home Service";
            default -> serviceType;
        };
        String statusLabel = switch (newStatus) {
            case "CONFIRMED" -> "Đã xác nhận";
            case "CONTACTING" -> "Đang liên hệ";
            case "CONTACT_SUCCESS" -> "Liên hệ thành công";
            case "COMPLETED" -> "Đã hoàn thành";
            case "CANCELLED" -> "Đã hủy";
            default -> newStatus;
        };
        String statusColor = newStatus.equals("CANCELLED") ? "#ef4444" : newStatus.equals("COMPLETED") ? "#22c55e" : "#f97316";
        String subject = "PawVerse - Cập nhật trạng thái dịch vụ " + serviceLabel;
        String body = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">🐾 PawVerse</h1>
                    </div>
                    <div style="padding: 30px; background: #fff; border: 1px solid #e5e7eb;">
                        <h2 style="color: #1f2937;">Cập nhật trạng thái dịch vụ</h2>
                        <p style="color: #4b5563;">Xin chào <strong>%s</strong>, dịch vụ <strong>%s</strong> của bạn đã được cập nhật.</p>
                        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                            <p style="font-size: 18px; font-weight: bold; color: %s;">%s</p>
                        </div>
                        <p style="color: #6b7280; font-size: 14px;">Bạn có thể theo dõi chi tiết trong mục "Lịch sử đặt dịch vụ".</p>
                    </div>
                    <div style="background: #f9fafb; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">PawVerse - Cửa hàng thú cưng trực tuyến</p>
                    </div>
                </div>
                """.formatted(hoTen, serviceLabel, statusColor, statusLabel);

        sendHtmlEmail(toEmail, subject, body);
    }

    public void sendContactFailureReminder(String toEmail, String hoTen, String serviceType, int failCount) {
        String serviceLabel = switch (serviceType) {
            case "PET_HOTEL" -> "Pet Hotel";
            case "SPA_GROOMING" -> "Spa & Grooming";
            case "HOME_SERVICE" -> "Home Service";
            default -> serviceType;
        };
        int remaining = 3 - failCount;
        String warningText = remaining > 0
                ? "Chúng tôi sẽ tiếp tục liên hệ bạn. Còn <strong>" + remaining + " lần</strong> thử trước khi lịch hẹn tự động bị hủy."
                : "Lịch hẹn của bạn đã bị hủy tự động do không liên hệ được sau 3 lần.";
        String subject = "PawVerse - Nhắc nhở: Không liên hệ được - " + serviceLabel;
        String body = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">🐾 PawVerse</h1>
                    </div>
                    <div style="padding: 30px; background: #fff; border: 1px solid #e5e7eb;">
                        <h2 style="color: #1f2937;">⚠️ Không liên hệ được</h2>
                        <p style="color: #4b5563;">Xin chào <strong>%s</strong>,</p>
                        <p style="color: #4b5563;">Nhân viên PawVerse đã cố gắng liên hệ bạn về dịch vụ <strong>%s</strong> nhưng không thành công (lần thứ <strong>%d</strong>).</p>
                        <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                            <p style="color: #92400e; margin: 0;">%s</p>
                        </div>
                        <p style="color: #4b5563;">Vui lòng kiểm tra điện thoại và email để nhân viên có thể xác nhận lịch hẹn của bạn.</p>
                    </div>
                    <div style="background: #f9fafb; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">PawVerse - Cửa hàng thú cưng trực tuyến</p>
                    </div>
                </div>
                """.formatted(hoTen, serviceLabel, failCount, warningText);

        sendHtmlEmail(toEmail, subject, body);
    }

    private void sendHtmlEmail(String toEmail, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent successfully to: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send email to: {}", toEmail, e);
            throw new RuntimeException("Gửi email thất bại: " + e.getMessage());
        }
    }
}
