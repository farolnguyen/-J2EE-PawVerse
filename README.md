# 🐾 PawVerse

> Nền tảng thương mại điện tử và quản lý thú cưng toàn diện — mua sắm, đặt dịch vụ, và chăm sóc thú cưng trong một ứng dụng duy nhất.

---

## 📌 Giới Thiệu

**PawVerse** là một ứng dụng web full-stack dành cho những người yêu thú cưng, tích hợp:

- 🛍️ **Cửa hàng thú cưng trực tuyến** — duyệt sản phẩm, thêm vào giỏ hàng, thanh toán
- 📅 **Đặt lịch dịch vụ** — spa, grooming, khám bệnh cho thú cưng
- 🐶 **Hồ sơ thú cưng** — quản lý thông tin, ảnh đại diện cho từng thú cưng
- ⭐ **Đánh giá sản phẩm** — viết review, lọc ngôn ngữ thô tục tự động
- 🤖 **Chatbot AI** — hỗ trợ tư vấn tích hợp Coze AI
- 🔔 **Thông báo real-time** — cập nhật trạng thái đơn hàng, booking
- 📊 **Dashboard Admin/Staff** — quản lý sản phẩm, đơn hàng, người dùng, analytics

---

## 🛠️ Công Nghệ Sử Dụng

### Backend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **Java** | 21 | Ngôn ngữ lập trình chính |
| **Spring Boot** | 4.0.3 | Framework backend |
| **Spring Security** | 7.x | Xác thực & phân quyền |
| **Spring Data JPA** | 7.x | ORM / Database access |
| **MySQL** | 8.0+ | Cơ sở dữ liệu |
| **JWT** | jjwt | Stateless authentication |
| **OAuth2** | Spring | Đăng nhập Google, GitHub, Discord |
| **JavaMailSender** | Spring | Gửi email OTP |
| **Apache POI** | — | Đọc/ghi file Excel |
| **Lombok** | — | Giảm boilerplate code |
| **SpringDoc** | — | Swagger UI / API docs |

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **React** | 19 | UI framework |
| **Vite** | 8 | Build tool & dev server |
| **TailwindCSS** | 3.4 | Styling |
| **React Router** | 7 | Client-side routing |
| **Zustand** | 5 | Global state management |
| **React Query** | 5 | Server state & caching |
| **React Hook Form** | 7 | Form management |
| **Zod** | 4 | Schema validation |
| **Axios** | 1.x | HTTP client |
| **Recharts** | 3 | Biểu đồ analytics |
| **Lucide React** | — | Icon library |
| **Swiper** | 12 | Carousel/slider |

---

## ✨ Tính Năng Chính

### 👤 Người Dùng (User)
- Đăng ký / Đăng nhập bằng username/email hoặc OAuth2 (Google, GitHub, Discord)
- Xem và cập nhật thông tin cá nhân, ảnh đại diện
- Đổi mật khẩu, quên mật khẩu qua OTP email
- Quản lý hồ sơ thú cưng (thêm, sửa, xóa, upload ảnh)

### 🛒 Mua Sắm
- Xem danh sách sản phẩm theo danh mục, thương hiệu
- Tìm kiếm và lọc sản phẩm
- Giỏ hàng (tối đa 30 sản phẩm khác nhau)
- Danh sách yêu thích — Wishlist (tối đa 50 sản phẩm)
- Thanh toán (COD) với hỗ trợ mã giảm giá/voucher
- Theo dõi lịch sử đơn hàng

### 📅 Dịch Vụ
- Xem danh sách dịch vụ chăm sóc thú cưng
- Đặt lịch với chọn ngày giờ
- Theo dõi trạng thái booking

### ⭐ Đánh Giá
- Viết và xem đánh giá sản phẩm
- Lọc ngôn ngữ thô tục tự động (tiếng Việt + tiếng Anh)
- Rating trung bình hiển thị trên sản phẩm

### 🔔 Thông Báo
- Thông báo in-app khi đơn hàng được cập nhật trạng thái
- Đánh dấu đã đọc

### 🤖 Chatbot AI
- Tích hợp Coze AI để tư vấn sản phẩm, chăm sóc thú cưng

### 🔧 Admin / Staff
- Quản lý sản phẩm (CRUD, import hàng loạt từ Excel — tối đa 100 dòng/2MB)
- Quản lý danh mục, thương hiệu
- Quản lý đơn hàng (cập nhật trạng thái theo luồng)
- Quản lý người dùng (khóa/mở tài khoản, phân quyền)
- Quản lý voucher/mã giảm giá
- Quản lý booking dịch vụ
- Xem analytics: doanh thu, đơn hàng, người dùng mới
- Activity log (lịch sử thao tác)

---

## 🔐 Bảo Mật

| Biện pháp | Mô tả |
|-----------|-------|
| **Rate Limiting** | Sliding window theo IP, giới hạn 10 req/phút cho login |
| **CAPTCHA Toán Học** | Hiển thị sau 3 lần đăng nhập sai |
| **Account Lockout** | Khóa 1 giờ sau 7 lần sai mật khẩu |
| **OTP Brute Force** | Vô hiệu OTP sau 5 lần nhập sai |
| **JWT Stateless** | Access token 24h + Refresh token 7 ngày |
| **BCrypt** | Mã hóa mật khẩu |
| **Image Validation** | Kiểm tra MIME type + giới hạn 5MB |
| **Security Headers** | CSP, X-Frame-Options, HSTS, X-Content-Type-Options |
| **CORS Policy** | Danh sách origin được phép |
| **Profanity Filter** | Lọc nội dung thô tục đa ngôn ngữ |

> Xem chi tiết: [`SECURITY_SUMMARY_VI.md`](./SECURITY_SUMMARY_VI.md)

---

## 🏗️ Cấu Trúc Project

```
J2EEPawVerse/
├── src/
│   └── main/
│       ├── java/J2EE/PawVerse/
│       │   ├── config/          # SecurityConfig, WebMvcConfig, CORS
│       │   ├── controller/      # REST API controllers (19 controllers)
│       │   ├── dto/             # Request/Response DTOs
│       │   ├── entity/          # JPA entities
│       │   ├── repository/      # Spring Data JPA repositories
│       │   ├── security/        # JWT filter, OAuth2 handlers
│       │   ├── service/         # Business logic
│       │   └── util/            # ImageValidator, JwtUtil, ...
│       └── resources/
│           └── application.properties
│
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios service calls
│   │   ├── components/          # Shared UI components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── pages/               # 14 page groups (Admin, Auth, Cart, ...)
│   │   └── store/               # Zustand global state
│   ├── package.json
│   └── vite.config.js
│
├── migration_data.sql           # Dữ liệu mẫu
├── HOW_TO_RUN.md               # Hướng dẫn cài đặt & chạy
├── SECURITY_SUMMARY_VI.md      # Tóm tắt bảo mật (tiếng Việt)
└── pom.xml
```

---

## 🚀 Chạy Nhanh

### 1. Tạo database MySQL
```sql
CREATE DATABASE pawverse_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Cấu hình `application.properties`
```properties
spring.datasource.password=    ← điền mật khẩu MySQL của bạn
```

### 3. Chạy Backend
```powershell
# Tại thư mục gốc J2EEPawVerse
.\mvnw.cmd spring-boot:run
```

### 4. Chạy Frontend
```powershell
cd frontend
npm install     # lần đầu
npm run dev
```

### 5. Truy cập
| URL | Mô tả |
|-----|-------|
| http://localhost:5173 | Giao diện người dùng |
| http://localhost:8080/swagger-ui.html | Tài liệu API |

> Xem hướng dẫn chi tiết: [`HOW_TO_RUN.md`](./HOW_TO_RUN.md)

---

## 📷 Vai Trò Hệ Thống

```
ADMIN ──► Quản lý user, lịch sử hoạt động
STAFF ──► Quản lý sản phẩm, đơn hàng, booking dịch vụ, voucher, analytics
USER  ──► Mua sắm, đặt dịch vụ, quản lý thú cưng
```

---

**Môn học:** J2EE 
**Trường:** Đại học Hutech
