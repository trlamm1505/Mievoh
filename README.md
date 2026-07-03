# Mievoh - Hệ Thống Đặt Vé Xem Phim & Gợi Ý Phim Toàn Diện

<p align="center">
  <img src="Mobile/assets/images/mievoh/readme_logo.png" alt="Mievoh Logo" height="90" align="middle" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="Mobile/assets/images/mievoh/readme_text.png" alt="Mievoh Text" height="55" align="middle" />
</p>

Chào mừng bạn đến với **Mievoh** - Hệ sinh thái đặt vé xem phim thông minh, mượt mà và trực quan tích hợp hệ thống đề xuất cá nhân hóa. Dự án bao gồm đầy đủ các nền tảng: ứng dụng Web (FE), ứng dụng Di động (Mobile), máy chủ API (BE), dịch vụ gửi Email (Microservice) và bộ phân tích gợi ý phim AI (Python Worker).

---

## 🏗️ Kiến Trúc Hệ Thống (System Architecture)

Mievoh được thiết kế theo kiến trúc Microservices và Event-driven thông qua Message Broker (RabbitMQ), giúp hệ thống hoạt động ổn định, dễ dàng mở rộng và tối ưu hiệu năng:

```mermaid
graph TD
    subgraph Clients ["Giao diện Người dùng (Clients)"]
        FE["Frontend Web<br/>(React 19 + Tailwind v4)"]
        Mobile["Mobile App<br/>(React Native + Expo 56 + SQLite)"]
    end

    subgraph BackendCore ["Hệ thống Core Backend"]
        BE["NestJS API Core<br/>(Socket.io / Swagger / BullMQ)"]
        Prisma["Prisma ORM"]
        MongoDB[("MongoDB Database")]
        Redis[("Redis Cache")]
    end

    subgraph Broker ["Hàng đợi tin nhắn"]
        RMQ{"RabbitMQ<br/>Message Broker"}
    end

    subgraph Workers ["Dịch vụ bổ trợ (Workers)"]
        EmailWorker["Email Microservice<br/>(NestJS + Nodemailer)"]
        PyWorker["Python Recommendation Worker<br/>(Pandas + Pymongo)"]
    end

    FE <-->|REST API & WebSockets| BE
    Mobile <-->|REST API & WebSockets| BE
    BE --> Prisma
    Prisma --> MongoDB
    BE <-->|Caching & Session| Redis
    BE --->|Publish Events| RMQ
    RMQ --->|Consume Email Tasks| EmailWorker
    RMQ <--->|Trigger & Update Progress| PyWorker
    PyWorker <--->|Đọc & Lưu kết quả gợi ý| MongoDB
```

---

## 📌 Các Thành Phần & Chức Năng Chính (Core Components)

### 1. Frontend Web (`FE`)
Phân hệ Web dành cho cả Khách hàng trải nghiệm lẫn Ban quản trị (Admin / Staff):
* **Khách hàng**: 
  - Xem danh sách phim, suất chiếu trực quan theo rạp và thời gian.
  - Sơ đồ chọn ghế động (Standard, VIP, Double) thời gian thực.
  - Quản lý lịch sử đặt vé, ví voucher cá nhân.
  - Nhận thông báo trực tiếp qua WebSockets.
* **Admin & Staff**:
  - Quản lý phim, lịch chiếu, cụm rạp và hệ thống ghế ngồi.
  - Phát hành và phân phối mã giảm giá (Vouchers) đến khách hàng.
  - Thống kê doanh thu chi tiết qua biểu đồ động, phân tích doanh số rạp chiếu.
  - Quản lý người dùng, phân quyền nhân viên quản trị cụm rạp.

### 2. Mobile App (`Mobile`)
Ứng dụng di động đa nền tảng (Android/iOS) tập trung vào trải nghiệm mượt mà của khách hàng:
* **Xác thực thông minh**: Hỗ trợ đăng nhập nhanh bằng tài khoản Google, đổi mật khẩu và cập nhật thông tin cá nhân.
* **Xác thực mã OTP**: Xác thực an toàn thông qua giao diện OTP modal.
* **Chế độ Ngoại tuyến (Offline Mode)**: Đồng bộ lịch sử đặt vé và danh sách đề xuất phim về cơ sở dữ liệu cục bộ **SQLite**, cho phép xem lại vé đã đặt bất cứ lúc nào mà không cần kết nối mạng.
* **Giao diện Dynamic & Theme**: Tích hợp đổi giao diện Sáng/Tối (Light/Dark Mode) mượt mà cùng hiệu ứng chuyển động cao cấp bằng React Native Reanimated.
* **Đề xuất Phim**: Hiển thị điểm số tương thích (Match Score %) và các đề xuất cá nhân hóa được đồng bộ trực tiếp từ AI worker.

### 3. Core Backend (`BE`)
Hệ thống xử lý trung tâm, cung cấp API Gateway và quản lý dữ liệu:
* **NestJS Framework**: Thiết kế dạng mô-đun chặt chẽ, dễ bảo trì và mở rộng.
* **Prisma & MongoDB**: Tương tác cơ sở dữ liệu phi quan hệ linh hoạt, mô hình hóa dữ liệu phim, người dùng, giao dịch đặt vé tối ưu.
* **Redis Caching**: Tăng tốc truy vấn danh sách phim và suất chiếu, giảm tải cho MongoDB.
* **WebSockets (Socket.io)**: Đẩy thông báo tức thời (Real-time Notifications) cho Clients.
* **Tích hợp Thanh toán**: Xử lý cổng thanh toán trực tuyến (VNPay/MoMo) và cập nhật trạng thái đơn hàng.

### 4. Email Microservice (`microservice-email`)
Dịch vụ xử lý gửi email chạy độc lập:
* **RabbitMQ Consumer**: Lắng nghe hàng đợi gửi tin nhắn `email_queue`.
* **Nodemailer**: Tự động gửi email xác nhận đặt vé thành công kèm mã QR/Barcode check-in, gửi mã OTP xác nhận tài khoản, thông tin Voucher khuyến mãi mới.

### 5. Python Recommendation Engine (`python-worker`)
Bộ phân tích đề xuất phim thông minh dựa trên hành vi người dùng:
* **Pandas**: Tính toán độ tương thích của người dùng với các thể loại phim dựa trên lịch sử đặt vé, lượt review/rating phim và danh mục yêu thích.
* **RabbitMQ Integration**: Lắng nghe tín hiệu kích hoạt tính toán đề xuất (`TRIGGER_ANALYSIS`) từ Core Backend, báo cáo tiến độ tính toán theo thời gian thực về Backend qua hàng đợi tin nhắn.

---

## 🛠️ Công Nghệ Phát Triển (Technology Stack)

| Phân hệ | Công nghệ chủ chốt |
| :--- | :--- |
| **Frontend Web (FE)** | React 19, Vite, TypeScript, Tailwind CSS v4, Redux Toolkit, React Router v7, Socket.io-client, Axios, React Slick |
| **Mobile App** | React Native, Expo 56, TypeScript, Expo Router (File-based), NativeWind v4, SQLite (`expo-sqlite`), AsyncStorage, Reanimated v4 |
| **Core Backend (BE)** | NestJS, Prisma ORM, MongoDB, Redis, RabbitMQ (`amqplib`), BullMQ, Socket.io, Passport, Swagger |
| **Email Service** | NestJS, RabbitMQ Microservice, Nodemailer |
| **AI Python Worker** | Python 3, RabbitMQ (`pika`), MongoDB (`pymongo`), Pandas, python-dotenv |

---

## 🛠️ Cấu hình biến môi trường (Environment Variables)

Bạn cần tạo file `.env` tương ứng ở từng thư mục thành phần để cấu hình hệ thống:

### 1. Backend (`BE/.env`)
```env
PORT=3069
DATABASE_URL="mongodb+url_ket_noi_mongodb/mievoh_db"
DATABASE_REDIS="redis://localhost:6379"
RABBIT_MQ_URL="amqp://admin:admin123@localhost:5672"
ACCESS_TOKEN_SECRET="your_jwt_secret_key"
FRONTEND_URL="http://localhost:5173"
DOMAIN_SERVER="http://localhost:3069"

# Google OAuth (Nếu sử dụng đăng nhập Google)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_CALLBACK_URL="http://localhost:3069/api/auth/google/callback"

# VNPay Payment Gateway
VNP_TMNCODE="your_vnpay_tmncode"
VNP_HASHSECRET="your_vnpay_hashsecret"
VNP_URL="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
VNP_RETURN_URL="http://localhost:3069/api/payments/vnpay-return"
```

### 2. Frontend Web (`FE/.env`)
```env
VITE_API_BASE_URL=http://localhost:3069/api
```

### 3. Mobile App (`Mobile/.env`)
```env
EXPO_PUBLIC_API_URL=http://localhost:3069/api
EXPO_PUBLIC_GOOGLE_CLIENT_ID="your_google_client_id_for_mobile"
```

### 4. Email Microservice (`microservice-email/.env`)
```env
RABBIT_MQ_URL="amqp://admin:admin123@localhost:5672"
EMAIL_HOST="smtp.gmail.com"
EMAIL_USER="your_email_sender@gmail.com"
EMAIL_PASS="your_app_password"
FRONTEND_URL="http://localhost:5173"
```

### 5. Python Worker (`python-worker/.env`)
```env
MONGO_URL="mongodb+url_ket_noi_mongodb/mievoh_db"
RABBIT_MQ_URL="amqp://admin:admin123@localhost:5672"
```

---

## 🔗 Tài liệu API (API Documentation)
Để phục vụ cho việc phát triển và thử nghiệm các API của dự án Mievoh, vui lòng tham khảo trang tài liệu Swagger chính thức tại:
👉 **[https://api.mievoh.io.vn/api-docs](https://api.mievoh.io.vn/api-docs)**

---

## 🚀 Hướng dẫn cài đặt và Khởi chạy

### Yêu cầu hệ thống
* Đã cài đặt **Node.js** (Phiên bản LTS từ 18 trở lên).
* Đã cài đặt **Docker** & **Docker Compose** (nếu muốn khởi chạy nhanh bằng container).
* Đã cài đặt **Python 3.8+** (nếu muốn chạy thủ công Python Worker).
* Thiết bị di động đã cài đặt ứng dụng **Expo Go** hoặc có sẵn Máy ảo (Android Emulator / iOS Simulator).

---

### Cách 1: Khởi chạy nhanh toàn bộ dự án bằng Docker Compose (Khuyến nghị)

Phân hệ Backend, Cache, Queue và các Workers đã được định nghĩa sẵn trong `BE/docker-compose.yml`.

1. **Khởi chạy các container:**
   ```bash
   cd BE
   docker-compose up --build -d
   ```
2. **Các cổng dịch vụ mặc định:**
   * **Core Backend API**: `http://localhost:3069` (Swagger: `/api-docs`)
   * **Redis Cache**: Cổng `6382` (nội bộ Docker `6379`)
   * **RabbitMQ Broker**: Cổng `5673` (giao diện quản lý UI tại: `http://localhost:15673` với `admin` / `admin123`)
   * **Email Microservice**: Chạy nền lắng nghe RabbitMQ
   * **Python Recommendation Worker**: Chạy nền lắng nghe RabbitMQ
3. **Khởi chạy ứng dụng Web (FE) & Mobile cục bộ:**
   * Làm theo hướng dẫn chạy thủ công bên dưới cho `FE` và `Mobile` để kết nối tới Backend Docker.

---

### Cách 2: Khởi chạy thủ công từng phân hệ (Local Development)

#### 1. Khởi động Core Backend (`BE`)
```bash
cd BE
# Cài đặt thư viện
npm install
# Khởi chạy Prisma client
npx prisma generate
# Khởi động ở chế độ Watch/Hot-reload
npm run start:dev
```

#### 2. Khởi động Frontend Web (`FE`)
```bash
cd FE
# Cài đặt thư viện
npm install
# Khởi chạy Web Server
npm run dev
```
*Truy cập giao diện Web tại: `http://localhost:5173`*

#### 3. Khởi động Mobile App (`Mobile`)
```bash
cd Mobile
# Cài đặt thư viện
npm install
# Khởi động Expo Server
npm run start
```
*Gõ `a` để mở trên Android, `i` để mở trên iOS hoặc quét mã QR hiển thị bằng ứng dụng **Expo Go** trên điện thoại.*

#### 4. Khởi động Email Microservice
```bash
cd microservice-email
npm install
npm run start:dev
```

#### 5. Khởi động Python Worker
```bash
cd python-worker
# Tạo môi trường ảo (Khuyến nghị)
python -m venv venv
# Active môi trường ảo
# Trên Windows:
.\venv\Scripts\activate
# Trên macOS/Linux:
source venv/bin/activate

# Cài đặt thư viện
pip install -r requirements.txt
# Khởi chạy Worker
python main.py
```