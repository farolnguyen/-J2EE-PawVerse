# Hướng Dẫn Cài Đặt & Chạy PawVerse (A–Z)

> Hướng dẫn đầy đủ để setup môi trường và chạy project PawVerse trên máy local.

---

## Yêu Cầu Phần Mềm

| Phần mềm | Phiên bản tối thiểu | Ghi chú |
|----------|---------------------|---------|
| **JDK** | 21+ | [Tải tại Adoptium](https://adoptium.net/) |
| **Node.js** | 18+ | [Tải tại nodejs.org](https://nodejs.org/) |
| **MySQL** | 8.0+ | [Tải tại mysql.com](https://dev.mysql.com/downloads/) |
| **Git** | Bất kỳ | Để clone project |

> Maven **không cần cài riêng** — project đã có Maven Wrapper (`mvnw.cmd`).

---

## 1. Clone Project

```powershell
git clone <url-repository>
cd J2EEPawVerse
```

---

## 2. Cài Đặt Cơ Sở Dữ Liệu (MySQL)

### 2.1. Tạo Database

Mở MySQL client (MySQL Workbench, HeidiSQL, hoặc terminal) và chạy:

```sql
CREATE DATABASE pawverse_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2.2. Cấu Hình Kết Nối

Mở file `src\main\resources\application.properties` và kiểm tra / chỉnh sửa các dòng sau:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/pawverse_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=         ← điền mật khẩu MySQL của bạn vào đây (để trống nếu không có)
```

> ⚠️ Nếu MySQL của bạn chạy cổng khác hoặc có username khác, hãy sửa tương ứng.

### 2.3. Tạo Bảng (Tự Động)

Project sử dụng `spring.jpa.hibernate.ddl-auto=update`, nên **toàn bộ bảng sẽ được Hibernate tự tạo** khi backend khởi động lần đầu.

Sau khi backend chạy thành công lần đầu, nạp dữ liệu mẫu:

```powershell
# Từ thư mục gốc project (nơi chứa migration_data.sql)
mysql -u root -p pawverse_db < migration_data.sql
```

> Nếu không có `migration_data.sql`, bỏ qua bước này — database trống vẫn chạy bình thường.

---

## 3. Cài Đặt & Chạy Backend (Spring Boot)

### 3.1. Yêu Cầu

Đảm bảo `JAVA_HOME` trỏ đúng vào JDK 21+:

```powershell
java -version
# Kết quả mong đợi: openjdk version "21.x.x" ...
```

### 3.2. Cấu Trúc Thư Mục Backend

```
J2EEPawVerse/
├── src/
│   └── main/
│       ├── java/J2EE/PawVerse/    ← source code Java
│       └── resources/
│           └── application.properties
├── mvnw                            ← Maven Wrapper (Linux/Mac)
├── mvnw.cmd                        ← Maven Wrapper (Windows)
└── pom.xml
```

### 3.3. Chạy Backend

Mở terminal tại thư mục gốc project (`J2EEPawVerse`):

```powershell
.\mvnw.cmd spring-boot:run
```

> **Lần đầu chạy** sẽ tải các dependencies về (~2–5 phút tùy tốc độ mạng).

### 3.4. Xác Nhận Backend Đang Chạy

Backend khởi động thành công khi log hiển thị:
```
Started PawVerseApplication in X.XXX seconds
```

Kiểm tra tại: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

---

## 4. Cài Đặt & Chạy Frontend (React + Vite)

### 4.1. Yêu Cầu

```powershell
node -v    # >= 18
npm -v     # >= 9
```

### 4.2. Cấu Trúc Thư Mục Frontend

```
J2EEPawVerse/
└── frontend/
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── api/
    │   └── store/
    ├── package.json
    └── vite.config.js
```

### 4.3. Cài Đặt Dependencies

```powershell
cd frontend
npm install
```

> Chỉ cần chạy lần đầu hoặc sau khi có thay đổi `package.json`.

### 4.4. Chạy Frontend

```powershell
npm run dev
```

Frontend khởi động tại: [http://localhost:5173](http://localhost:5173)

### 4.5. Proxy API

Vite đã cấu hình proxy trong `vite.config.js` — tất cả request đến `/api`, `/oauth2`, `/uploads` sẽ **tự động** chuyển tiếp đến `http://localhost:8080`. Không cần cấu hình thêm.

---

## 5. Chạy Toàn Bộ Project (Backend + Frontend)

Mở **2 terminal riêng biệt**:

**Terminal 1 — Backend:**
```powershell
# Tại thư mục J2EEPawVerse
.\mvnw.cmd spring-boot:run
```

**Terminal 2 — Frontend:**
```powershell
# Tại thư mục J2EEPawVerse\frontend
npm run dev
```

Sau đó truy cập: **[http://localhost:5173](http://localhost:5173)**

---

## 6. Tài Khoản Mặc Định (sau khi nạp migration_data.sql)

| Vai trò | Username | Mật khẩu |
|---------|----------|-----------|
| Admin   | `admin`  | `123456`  |
| Staff   | `staff`  | `123456`  |
| User    | `user1`  | `123456`  |

> Nếu không có `migration_data.sql`, hãy đăng ký tài khoản mới tại `/register`.

---

## 7. Các Endpoint Quan Trọng

| URL | Mô tả |
|-----|-------|
| `http://localhost:5173` | Giao diện người dùng (React) |
| `http://localhost:8080` | Backend API (Spring Boot) |
| `http://localhost:8080/swagger-ui.html` | Tài liệu API (Swagger UI) |
| `http://localhost:8080/api-docs` | OpenAPI JSON spec |

---

## 8. Xử Lý Lỗi Thường Gặp

### ❌ Lỗi kết nối MySQL (`Access denied` hoặc `Unknown database`)
- Kiểm tra lại `spring.datasource.username` và `spring.datasource.password` trong `application.properties`.
- Đảm bảo database `pawverse_db` đã được tạo (bước 2.1).

### ❌ Cổng 8080 đã bị chiếm
```powershell
# Tìm process đang dùng cổng 8080
netstat -ano | findstr :8080
# Kill process theo PID
taskkill /PID <PID> /F
```
Hoặc đổi cổng trong `application.properties`:
```properties
server.port=8081
```
Và cập nhật proxy trong `frontend/vite.config.js` thành `http://localhost:8081`.

### ❌ Cổng 5173 đã bị chiếm
Vite tự động thử cổng tiếp theo (5174, 5175...). Hoặc đổi cổng trong `vite.config.js`:
```js
server: { port: 3000 }
```

### ❌ `mvnw.cmd` không chạy được
```powershell
# Cấp quyền thực thi
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\mvnw.cmd spring-boot:run
```

### ❌ Lỗi `JAVA_HOME is not set`
Đặt biến môi trường `JAVA_HOME` trỏ đến thư mục cài JDK, ví dụ:
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.x.x-hotspot"
.\mvnw.cmd spring-boot:run
```

### ❌ `npm install` thất bại
```powershell
# Xóa cache và thử lại
npm cache clean --force
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 9. Build Production (Tùy Chọn)

**Build Frontend:**
```powershell
cd frontend
npm run build
# Output tại: frontend/dist/
```

**Build Backend JAR:**
```powershell
# Tại thư mục gốc
.\mvnw.cmd clean package -DskipTests
# Output tại: target/PawVerse-0.0.1-SNAPSHOT.jar
```

**Chạy JAR:**
```powershell
java -jar target/PawVerse-0.0.1-SNAPSHOT.jar
```

---

## Tóm Tắt Lệnh

```powershell
# ─── Backend ───────────────────────────────────────────
.\mvnw.cmd spring-boot:run

# ─── Frontend ──────────────────────────────────────────
cd frontend
npm install          # lần đầu
npm run dev          # chạy dev server
```
