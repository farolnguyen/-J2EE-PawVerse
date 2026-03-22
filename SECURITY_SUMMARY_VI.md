# PawVerse – Tóm Tắt Bảo Mật

> Tài liệu này mô tả tất cả các biện pháp bảo mật, logic và kỹ thuật được triển khai trong ứng dụng web PawVerse.

---

## 1. Giới Hạn Tốc Độ Yêu Cầu (Chặn Spam Request)

**Loại:** Sliding Window theo địa chỉ IP  
**Vị trí:** `security/RateLimitInterceptor.java`, đăng ký qua `config/WebMvcConfig.java`

### Logic
- Áp dụng cho tất cả endpoint `/api/**` thông qua Spring `HandlerInterceptor`.
- Mỗi địa chỉ IP có một log yêu cầu riêng lưu trong `ConcurrentHashMap<String, Queue<Long>>`.
- Key là `"IP::tên_bucket"`, value là hàng đợi timestamp của các yêu cầu.
- Mỗi lần có yêu cầu mới, các timestamp cũ hơn cửa sổ 1 phút sẽ bị xóa. Nếu số lượng còn lại ≥ giới hạn, yêu cầu bị từ chối với HTTP **429 Too Many Requests**.

### Giới Hạn (số yêu cầu mỗi phút mỗi IP)

| Bucket         | Pattern Endpoint                          | Giới Hạn |
|----------------|-------------------------------------------|-----------|
| `auth_login`   | `POST /api/auth/login`                    | 10        |
| `auth_general` | Bất kỳ `/api/auth/**` nào khác            | 20        |
| `order_create` | `POST /api/user/orders`                   | 10        |
| `cart`         | `/api/user/cart/**`                       | 60        |
| `api_default`  | Tất cả `/api/**` còn lại                  | 120       |

### Xác Định IP Client
Ưu tiên: `X-Forwarded-For` → `X-Real-IP` → `remoteAddr` (hỗ trợ reverse proxy).

---

## 2. Chặn Spam Click Nút (Frontend Button Debounce)

**Loại:** Trạng thái loading theo từng yêu cầu / hook debounce  
**Vị trí:** `frontend/src/hooks/useDebounce.js`, `HomePage.jsx`, `ProductsPage.jsx`, `ProductDetailPage.jsx`

### Logic
- Hook `useDebounce(fn, ms=800)` có thể tái sử dụng, chặn gọi lại trong khi yêu cầu trước chưa hoàn tất (dùng `busy` ref với `setTimeout`).
- Trên trang danh sách sản phẩm (`HomePage`, `ProductsPage`): một `Set<productId>` theo dõi thao tác thêm vào giỏ hàng đang chạy. Nút bị `disabled` khi ID sản phẩm đang có trong Set.
- Trên `ProductDetailPage`: trạng thái boolean `isAddingToCart` vô hiệu hóa cả nút "Thêm vào giỏ" và "Mua ngay".
- Thông báo lỗi được lấy từ trường `message` của backend (ví dụ: vượt quá giới hạn).

---

## 3. Kiểm Tra File Ảnh Tải Lên

**Loại:** Kiểm tra MIME type + kích thước file  
**Vị trí:** `util/ImageValidator.java`, áp dụng trong `UserController`, `PetProfileController`

### Logic
- **Kích thước tối đa:** 5 MB (`5 * 1024 * 1024` byte).
- **MIME type được chấp nhận:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
- `ImageValidator.validate(MultipartFile)` được gọi ở tầng controller trước khi chuyển file cho service. Nếu không hợp lệ sẽ ném `IllegalArgumentException` với thông báo lỗi tiếng Việt.

### Các Endpoint Được Bảo Vệ
| Endpoint                         | Mô tả                  |
|----------------------------------|------------------------|
| `POST /api/user/avatar`          | Ảnh đại diện người dùng|
| `POST /api/user/pets/{id}/avatar`| Ảnh thú cưng           |

---

## 4. Giới Hạn Import File Excel

**Loại:** Kiểm tra kích thước file + số lượng dòng  
**Vị trí:** `service/ExcelImportService.java` – phương thức `parseAndPreview()`

### Logic
- **Kích thước file tối đa:** 2 MB — kiểm tra trước khi parse (`file.getSize() > 2 * 1024 * 1024`).
- **Đuôi file được chấp nhận:** `.xlsx`, `.xls` — kiểm tra qua tên file gốc.
- **Số dòng dữ liệu tối đa:** 100 — kiểm tra sau khi đọc `sheet.getLastRowNum()`. Trả về lỗi nếu vượt quá.
- Lỗi được trả về trong `ExcelImportPreviewResponse.globalErrors` (không throw exception), đảm bảo hiển thị nhất quán trên UI.

---

## 5. Giới Hạn Sản Phẩm Trong Giỏ Hàng

**Loại:** Quy tắc nghiệp vụ  
**Vị trí:** `service/CartService.java` – phương thức `addToCart()`

### Logic
- Khi thêm sản phẩm **mới** (chưa có trong giỏ), đếm số sản phẩm khác nhau qua `cartItemRepository.findByCart(cart).size()`.
- Nếu số lượng ≥ **30**, ném `RuntimeException("Giỏ hàng tối đa 30 sản phẩm khác nhau")`.
- Tăng số lượng cho sản phẩm **đã có** trong giỏ không bị giới hạn.
- Frontend hiển thị thông báo lỗi từ backend qua `toast.error`.

---

## 6. CAPTCHA Toán Học (Chống Spam Đăng Nhập)

**Loại:** Câu đố toán học phía server sau nhiều lần thất bại  
**Vị trí:** `service/CaptchaService.java`, `service/AuthService.java`, `controller/AuthController.java`, `frontend/src/pages/Auth/LoginPage.jsx`

### Logic Backend
1. **Ngưỡng kích hoạt:** Sau **3 lần đăng nhập thất bại** (theo dõi trong `user.failedLoginAttempts` ở database), endpoint đăng nhập sẽ kiểm tra CAPTCHA token.
2. Nếu không có token, `AuthService.login()` trả về `AuthResponse` với `requiresCaptcha: true`, `captchaToken` (UUID) và `captchaQuestion` (ví dụ: `"4 + 7 = ?"`).
3. `CaptchaService` lưu đáp án trong `ConcurrentHashMap<token, CaptchaEntry{answer, expiry}>`. Thử thách hết hạn sau **5 phút**. Mỗi token chỉ dùng **một lần** (xóa sau khi xác thực).
4. Nếu đáp án sai, service ném exception với dấu phân cách `|captcha|` kèm token và câu hỏi mới, controller parse và trả về HTTP 400 với dữ liệu thử thách mới.
5. Endpoint `GET /api/auth/captcha` (không cần xác thực) tạo thử thách mới theo yêu cầu.

### Logic Frontend
- Sau mỗi lần đăng nhập thất bại, response được kiểm tra `requiresCaptcha: true` hoặc `data.requiresCaptcha: true`.
- Hộp cảnh báo màu vàng xuất hiện bên dưới ô mật khẩu, hiển thị câu hỏi toán.
- Người dùng nhập đáp án; khi submit, `captchaToken` + `captchaAnswer` được gửi kèm thông tin đăng nhập.
- Nếu đáp án sai, CAPTCHA tự động làm mới với câu hỏi mới.

---

## 7. Bảo Vệ OTP Khỏi Tấn Công Brute Force

**Loại:** Đếm số lần thử + vô hiệu hóa khi vượt ngưỡng  
**Vị trí:** `service/AuthService.java` – phương thức `confirmPasswordReset()`

### Logic
- Map `otpAttemptStorage` theo dõi số lần nhập sai theo email.
- **Số lần thử tối đa:** 5. Đến lần thứ 5, OTP bị xóa khỏi tất cả map (`otpStorage`, `otpExpiryStorage`, `otpAttemptStorage`), buộc người dùng yêu cầu OTP mới.
- Mỗi lần thất bại (trước khi đạt giới hạn), thông báo lỗi có kèm số lần còn lại: `"OTP không hợp lệ. Còn X lần thử"`.
- OTP cũng bị vô hiệu hóa khi hết hạn (TTL 10 phút) và bị xóa sau khi đặt lại mật khẩu thành công.
- Tất cả map được dọn sạch đồng thời khi thành công để tránh dữ liệu tồn đọng.

---

## 8. HTTP Security Headers (Các Header Bảo Mật)

**Loại:** Cấu hình Spring Security headers  
**Vị trí:** `config/SecurityConfig.java` – khối `.headers(...)`

### Các Header Được Áp Dụng

| Header                        | Giá trị / Chính Sách                                      |
|-------------------------------|-----------------------------------------------------------|
| `X-Content-Type-Options`      | `nosniff` (ngăn trình duyệt đoán MIME type)               |
| `X-Frame-Options`             | `SAMEORIGIN` (ngăn nhúng trang vào iframe từ domain khác)|
| `Strict-Transport-Security`   | `max-age=31536000; includeSubDomains`                     |
| `Content-Security-Policy`     | Xem các chỉ thị CSP bên dưới                              |

### Các Chỉ Thị CSP
```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' data:;
connect-src 'self'
```

---

## 9. Giới Hạn Danh Sách Yêu Thích

**Loại:** Quy tắc nghiệp vụ  
**Vị trí:** `service/WishlistService.java` – phương thức `addToWishlist()`

### Logic
- Trước khi thêm mới, đếm kích thước wishlist hiện tại qua `wishlistRepository.findByUserOrderByNgayTaoDesc(user).size()`.
- Nếu số lượng ≥ **50**, ném `RuntimeException("Danh sách yêu thích tối đa 50 sản phẩm")`.

---

## Các Biện Pháp Bảo Mật Đã Có Sẵn

Các biện pháp này đã tồn tại trước khi triển khai các phase trên:

| Tính Năng | Vị Trí | Mô Tả |
|-----------|--------|-------|
| **Xác thực JWT** | `security/JwtAuthenticationFilter.java`, `util/JwtUtil.java` | Xác thực Bearer token stateless cho tất cả endpoint `/api/**` |
| **Khóa tài khoản** | `service/AuthService.java` | Khóa tài khoản 1 giờ sau **7** lần đăng nhập sai |
| **Phân quyền theo Role** | `config/SecurityConfig.java` | Các role ADMIN / STAFF / USER được kiểm soát qua `@PreAuthorize` và `requestMatchers` |
| **Mã hóa mật khẩu** | `service/AuthService.java` | BCrypt qua Spring Security `PasswordEncoder` |
| **OTP xác thực email** | `service/AuthService.java` | OTP 10 phút cho đặt lại mật khẩu và xác thực email |
| **Lọc ngôn ngữ thô tục** | `service/ProfanityFilterService.java` | Lọc nội dung đa ngôn ngữ mức MILD/SEVERE trên đánh giá |
| **Đăng nhập OAuth2** | `config/SecurityConfig.java` | Đăng nhập qua Google, GitHub, Discord bằng Spring OAuth2 |
| **Chính sách CORS** | `config/SecurityConfig.java` | Danh sách `allowedOrigins` được giới hạn |
| **Kiểm tra tồn kho** | `service/CartService.java` | Thêm/cập nhật giỏ hàng kiểm tra `soLuongTonKho` trước khi thực hiện |
| **Refresh Token** | `service/AuthService.java` | Refresh token 7 ngày có thời hạn, bị vô hiệu hóa khi tài khoản bị khóa |

---

*Ngày tạo: 22/03/2026 | PawVerse Security Review*
