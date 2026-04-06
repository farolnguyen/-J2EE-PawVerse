# PawVerse – Tóm Tắt Bảo Mật

> Tài liệu tổng hợp toàn bộ biện pháp bảo mật được triển khai trong ứng dụng web PawVerse.  
> Phần I trình bày các kỹ thuật bảo mật chuẩn công nghiệp. Phần II liệt kê các ràng buộc bảo mật đặc thù của hệ thống.

---

## Phần I — Kỹ Thuật Bảo Mật Chuẩn Công Nghiệp

| # | Kỹ Thuật | Mô Tả | File Triển Khai | Chi Tiết |
|---|----------|-------|----------------|----------|
| 1 | **JWT (JSON Web Token)** | Xác thực phi trạng thái (Stateless) bằng token ký số | `security/JwtAuthenticationFilter.java` · `util/JwtUtil.java` | Mọi request đến `/api/**` đều phải mang `Bearer <token>` trong header `Authorization` · Token được ký bằng thuật toán **HMAC-SHA256** · Access token hết hạn sau **24 giờ** · Refresh token hết hạn sau **7 ngày** · Refresh token bị vô hiệu hóa ngay khi tài khoản bị khóa hoặc đăng xuất |
| 2 | **BCrypt Password Hashing** | Mã hóa mật khẩu một chiều, không thể giải mã ngược | `config/SecurityConfig.java` · `service/AuthService.java` | Sử dụng `BCryptPasswordEncoder` của Spring Security · Mật khẩu **không bao giờ** được lưu dạng plaintext · Mỗi lần hash đều có salt ngẫu nhiên khác nhau, chống rainbow table |
| 3 | **Phân Quyền RBAC** (Role-Based Access Control) | Kiểm soát quyền truy cập dựa trên vai trò người dùng | `config/SecurityConfig.java` · annotation `@PreAuthorize` | Ba vai trò: **ADMIN** · **STAFF** · **USER** · Phân quyền tĩnh qua `requestMatchers` và động qua `@PreAuthorize("hasRole(...)")` trên từng phương thức service/controller |
| 4 | **OAuth2 Social Login** | Đăng nhập qua bên thứ ba, không cần quản lý mật khẩu | `config/SecurityConfig.java` · `security/OAuth2LoginSuccessHandler.java` | Hỗ trợ **Google · GitHub · Discord** · Xử lý qua Spring Security OAuth2 Client · Tự động tạo tài khoản nếu chưa tồn tại · Gán role USER mặc định |
| 5 | **JPA Parameterized Queries** | Chống tấn công SQL Injection | Toàn bộ `repository/*.java` | Tất cả truy vấn database sử dụng **Hibernate JPA / JPQL** với tham số `@Param` · Không có câu truy vấn SQL ghép chuỗi trực tiếp · ORM tự động escape ký tự đặc biệt |
| 6 | **Bean Validation (@Valid)** | Kiểm tra và làm sạch dữ liệu đầu vào | Toàn bộ `controller/*.java` · `dto/**/*.java` | Các DTO sử dụng annotation `@NotBlank` · `@NotNull` · `@Size` · `@Email` · Controller gắn `@Valid` trước `@RequestBody` · Dữ liệu không hợp lệ bị từ chối trước khi vào service |
| 7 | **Rate Limiting – Sliding Window** | Giới hạn số request theo IP, chống DDoS và brute force tự động | `security/RateLimitInterceptor.java` | Cơ chế cửa sổ trượt 60 giây per-IP · **Login:** 300/phút · **Auth chung:** 600/phút · **Tạo đơn hàng:** 600/phút · **Giỏ hàng:** 6.000/phút · **Mặc định:** 15.000/phút · Trả về HTTP **429** khi vượt ngưỡng · Bộ nhớ tự dọn dẹp mỗi 5 phút · Chỉ tin `X-Forwarded-For` khi request đến từ mạng nội bộ (chống IP spoofing) |
| 8 | **Google reCAPTCHA v2** | Phân biệt người thật và bot tự động | `service/ReCaptchaVerificationService.java` · `LoginPage.jsx` | Frontend hiển thị widget reCAPTCHA · Backend **xác minh token với Google API** (`/recaptcha/api/siteverify`) trước khi xử lý đăng nhập · Không cho phép bỏ qua từ phía client |
| 9 | **HTTP Security Headers** | Bảo vệ trình duyệt người dùng khỏi các tấn công phổ biến | `config/SecurityConfig.java` – `.headers()` | `X-Content-Type-Options: nosniff` – chặn MIME sniffing · `X-Frame-Options: SAMEORIGIN` – chặn Clickjacking · `HSTS: max-age=31536000; includeSubDomains` – bắt buộc HTTPS · `Content-Security-Policy` – giới hạn nguồn script/style/frame · `Referrer-Policy: strict-origin-when-cross-origin` · `Permissions-Policy: camera=(), microphone=(), geolocation=(self)` |
| 10 | **CORS Policy** | Kiểm soát domain nào được gọi API | `config/SecurityConfig.java` – `corsConfigurationSource()` | Chỉ các origin được liệt kê trong `allowedOrigins` mới được phép · **Không cho phép wildcard `*`** · Cấu hình riêng cho môi trường production qua `application-prod.properties` |
| 11 | **SecureRandom OTP** | Sinh mã OTP ngẫu nhiên an toàn về mặt mật mã học | `service/AuthService.java` – `generateOTP()` | Sử dụng `java.security.SecureRandom` thay vì `Random` thông thường · Chống tấn công đoán OTP dựa trên seed có thể dự đoán |
| 12 | **Session Stateless** | Không lưu session phía server, giảm tấn công Session Hijacking | `config/SecurityConfig.java` | `SessionCreationPolicy.STATELESS` · Không dùng cookie session · Toàn bộ trạng thái xác thực nằm trong JWT · Chống tấn công CSRF trên stateful session |

---

## Phần II — Ràng Buộc Bảo Mật Đặc Thù Của Hệ Thống

| # | Chức Năng | Ràng Buộc | File Triển Khai | Chi Tiết |
|---|-----------|-----------|----------------|----------|
| 1 | **Đăng nhập sai → CAPTCHA toán học** | Sau 3 lần nhập sai mật khẩu, bắt buộc giải câu đố toán | `service/CaptchaService.java` · `service/AuthService.java` · `LoginPage.jsx` | CAPTCHA kích hoạt sau **3 lần sai** · Server sinh câu hỏi phép cộng ngẫu nhiên (VD: `3 + 7 = ?`) · Token UUID, dùng **một lần**, hết hạn **5 phút** · Frontend hiển thị ô nhập kết quả · Sai CAPTCHA → cấp token mới ngay lập tức |
| 2 | **Khóa tài khoản tạm thời** | Sau 7 lần đăng nhập sai, tài khoản bị khóa 1 giờ | `service/AuthService.java` – `handleFailedLogin()` | Đếm `failedLoginAttempts` trên từng tài khoản · Khóa **1 giờ** sau **7 lần** sai · Cảnh báo còn X lần khi gần đến ngưỡng · Tự động mở khóa sau hết thời gian · Refresh token bị xóa khi tài khoản bị khóa |
| 3 | **Bảo vệ OTP quên mật khẩu** | Giới hạn số lần nhập OTP, hủy khi vượt ngưỡng | `service/AuthService.java` – `confirmPasswordReset()` | OTP hết hạn sau **10 phút** · Tối đa **5 lần nhập sai** · Vượt ngưỡng → OTP bị xóa hoàn toàn, phải yêu cầu lại · Hiển thị còn X lần thử · OTP bị xóa ngay sau khi dùng thành công (one-time use) |
| 4 | **Xác thực email qua OTP** | Xác nhận quyền sở hữu email trước khi kích hoạt | `service/AuthService.java` – `confirmEmailVerification()` | OTP gửi về email, hết hạn **10 phút** · Xóa sau khi xác thực thành công · Email dạng `.oauth` (tài khoản mạng xã hội) không được xác thực theo cách này |
| 5 | **Kiểm soát giỏ hàng** | Giới hạn số loại sản phẩm và kiểm tra tồn kho | `service/CartService.java` | Tối đa **30 sản phẩm khác nhau** trong một giỏ · Tăng số lượng sản phẩm đã có không bị giới hạn · Kiểm tra `soLuongTonKho` trước mỗi thao tác thêm/cập nhật · Từ chối ngay nếu hàng không đủ |
| 6 | **Giới hạn danh sách yêu thích** | Ngăn lạm dụng bộ nhớ server | `service/WishlistService.java` – `addToWishlist()` | Tối đa **50 sản phẩm** mỗi tài khoản · Kiểm tra trước khi thêm mới · Trả về lỗi rõ ràng khi đạt giới hạn |
| 7 | **Kiểm tra file ảnh tải lên** | Ngăn upload file độc hại | `util/ImageValidator.java` → `UserController` · `PetProfileController` | Chỉ chấp nhận MIME: `image/jpeg` · `image/png` · `image/webp` · `image/gif` · Kích thước tối đa: **5 MB** · Kiểm tra tại tầng controller trước khi gọi service |
| 8 | **Giới hạn import Excel** | Ngăn file quá lớn gây quá tải server | `service/ExcelImportService.java` – `parseAndPreview()` | Chỉ chấp nhận `.xlsx` / `.xls` · File tối đa: **2 MB** · Tối đa **100 dòng** dữ liệu · Lỗi trả về dạng danh sách, không throw exception |
| 9 | **Lọc ngôn ngữ thô tục** | Kiểm duyệt nội dung do người dùng tạo | `service/ProfanityFilterService.java` | Áp dụng trên nội dung **đánh giá sản phẩm** · Hỗ trợ tiếng Việt và tiếng Anh · Phân loại MILD / SEVERE · Nội dung vi phạm bị từ chối hoặc cảnh báo |
| 10 | **Chặn spam thao tác** (Button Debounce) | Ngăn gửi request trùng lặp khi click nhiều lần | `pages/ProductsPage.jsx` · `pages/Products/ProductDetailPage.jsx` | Nút thêm vào giỏ bị `disabled` ngay khi bắt đầu request · Trạng thái loading theo từng `productId` · Chặn double-submit và click liên tục |
| 11 | **Kiểm tra số lượng sản phẩm đặt hàng** | Không cho phép đặt quá tồn kho hiện có | `service/OrderService.java` – `createOrder()` | Kiểm tra `soLuongTonKho` cho từng sản phẩm trong đơn hàng · Trừ tồn kho ngay sau khi đơn được xác nhận · Rollback nếu có lỗi (transactional) |
| 12 | **Bảo vệ API Admin/Staff** | Chặn người dùng thường truy cập trang quản trị | `config/SecurityConfig.java` · `@PreAuthorize` | `/api/admin/**` → chỉ **ADMIN · STAFF** · `/api/admin/users/**` → chỉ **ADMIN** · `/api/user/**` → **ADMIN · STAFF · USER** · Kiểm tra cả ở tầng route và tầng method |
| 13 | **Vô hiệu hóa Swagger trên Production** | Ẩn tài liệu API khỏi môi trường thật | `application-prod.properties` | `springdoc.swagger-ui.enabled=false` · `springdoc.api-docs.enabled=false` · Chỉ bật khi chạy profile `dev` |
| 14 | **Refresh Token Rotation** | Cấp refresh token mới sau mỗi lần làm mới, chống token replay | `service/AuthService.java` – `refreshToken()` | Mỗi lần gọi `/api/auth/refresh` đều cấp **refresh token mới** · Token cũ bị vô hiệu hóa ngay lập tức · Tra cứu token bằng `findByRefreshToken()` (O(1) thay vì quét toàn bảng) |

---

*Cập nhật: 06/04/2026 | PawVerse Security Review*
