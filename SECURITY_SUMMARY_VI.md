# PawVerse – Tóm Tắt Bảo Mật

> Tài liệu này tổng hợp toàn bộ các biện pháp bảo mật được triển khai trong ứng dụng web PawVerse.

---

| # | Biện Pháp | Loại | Vị Trí | Chi Tiết |
|---|-----------|------|--------|----------|
| 1 | **Giới hạn tốc độ yêu cầu** (Rate Limiting) | Sliding Window theo IP | `security/RateLimitInterceptor.java` | Login: 10 req/phút · Auth: 20 · Order: 10 · Cart: 60 · Mặc định: 120. Trả về HTTP 429 khi vượt. IP xác định qua `X-Forwarded-For` → `X-Real-IP` → `remoteAddr` |
| 2 | **Chặn spam click nút** (Button Debounce) | Trạng thái loading phía frontend | `hooks/useDebounce.js`, `HomePage.jsx`, `ProductsPage.jsx`, `ProductDetailPage.jsx` | Hook `useDebounce(fn, 800ms)` · Set theo `productId` trên trang danh sách · Boolean `isAddingToCart` trên trang chi tiết · Nút bị `disabled` trong khi request đang chạy |
| 3 | **Kiểm tra file ảnh tải lên** | Kiểm tra MIME type + kích thước | `util/ImageValidator.java` → `UserController`, `PetProfileController` | MIME cho phép: `jpeg/png/webp/gif` · Kích thước tối đa: **5 MB** · Kiểm tra tại tầng controller trước khi chuyển cho service |
| 4 | **Giới hạn import Excel** | Kiểm tra file + số dòng | `service/ExcelImportService.java` – `parseAndPreview()` | File tối đa: **2 MB** · Định dạng: `.xlsx/.xls` · Số dòng tối đa: **100** · Lỗi trả về qua `globalErrors` (không throw) |
| 5 | **Giới hạn giỏ hàng** | Quy tắc nghiệp vụ | `service/CartService.java` – `addToCart()` | Tối đa **30 sản phẩm khác nhau** · Chỉ kiểm tra khi thêm sản phẩm mới · Tăng số lượng sản phẩm đã có không bị giới hạn |
| 6 | **CAPTCHA toán học** | Câu đố phía server sau nhiều lần thất bại | `service/CaptchaService.java`, `service/AuthService.java`, `controller/AuthController.java`, `LoginPage.jsx` | Kích hoạt sau **3 lần đăng nhập sai** · Token UUID, hết hạn **5 phút**, dùng một lần · Câu hỏi phép cộng/trừ đơn giản · Frontend hiển thị hộp cảnh báo vàng kèm câu hỏi |
| 7 | **Bảo vệ OTP brute force** | Đếm lần thử + vô hiệu hóa | `service/AuthService.java` – `confirmPasswordReset()` | Tối đa **5 lần nhập sai** · OTP bị xóa hoàn toàn khi vượt ngưỡng · Thông báo còn X lần thử · OTP hết hạn sau **10 phút** |
| 8 | **HTTP Security Headers** | Cấu hình Spring Security | `config/SecurityConfig.java` – `.headers()` | `X-Content-Type-Options: nosniff` · `X-Frame-Options: SAMEORIGIN` · `HSTS: max-age=31536000` · `Content-Security-Policy: default-src 'self'` |
| 9 | **Giới hạn danh sách yêu thích** | Quy tắc nghiệp vụ | `service/WishlistService.java` – `addToWishlist()` | Tối đa **50 sản phẩm** · Kiểm tra trước khi thêm mới |
| 10 | **Xác thực JWT** | Stateless Bearer token | `security/JwtAuthenticationFilter.java`, `util/JwtUtil.java` | JWT cho tất cả `/api/**` · Access token **24 giờ** · Refresh token **7 ngày** · Refresh token bị vô hiệu khi tài khoản bị khóa |
| 11 | **Khóa tài khoản** | Chống brute force đăng nhập | `service/AuthService.java` | Khóa **1 giờ** sau **7 lần** sai mật khẩu · Tự mở khóa sau thời gian chờ |
| 12 | **Phân quyền theo Role** | RBAC | `config/SecurityConfig.java` | Ba role: `ADMIN / STAFF / USER` · Kiểm soát qua `@PreAuthorize` và `requestMatchers` |
| 13 | **Mã hóa mật khẩu** | BCrypt hashing | `service/AuthService.java` | BCrypt qua Spring Security `PasswordEncoder` · Không lưu mật khẩu plaintext |
| 14 | **OTP xác thực email** | One-Time Password | `service/AuthService.java` | OTP **10 phút** cho đặt lại mật khẩu và xác thực email · Xóa sau khi dùng thành công |
| 15 | **Lọc ngôn ngữ thô tục** | Content moderation | `service/ProfanityFilterService.java` | Đa ngôn ngữ (Việt + Anh) · Phân loại MILD / SEVERE · Áp dụng trên nội dung đánh giá sản phẩm |
| 16 | **Đăng nhập OAuth2** | Social login | `config/SecurityConfig.java` | Google · GitHub · Discord · Xử lý qua Spring OAuth2 |
| 17 | **Chính sách CORS** | Origin whitelist | `config/SecurityConfig.java` | Danh sách `allowedOrigins` được giới hạn · Không cho phép wildcard `*` |
| 18 | **Kiểm tra tồn kho** | Validation nghiệp vụ | `service/CartService.java` | Kiểm tra `soLuongTonKho` trước khi thêm/cập nhật giỏ hàng · Từ chối nếu không đủ hàng |

---

*Ngày tạo: 22/03/2026 | PawVerse Security Review*
