# Mievoh - Hệ Thống Đặt Vé Xem Phim (Mievoh)

<p align="center">
  <img src="Mobile/assets/images/mievoh/readme_logo.png" alt="Mievoh Logo" height="90" align="middle" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="Mobile/assets/images/mievoh/readme_text.png" alt="Mievoh Text" height="55" align="middle" />
</p>

Chào mừng bạn đến với **Mievoh Mobile** - ứng dụng đặt vé xem phim thông minh, mượt mà và trực quan được xây dựng trên nền tảng Expo và React Native.

---

## 📌 Tính năng nổi bật
- **Đặt vé xem phim trực tuyến**: Chọn phim, chọn rạp, suất chiếu và vị trí ghế ngồi nhanh chóng.
- **Đồng bộ hóa ngoại tuyến**: Sử dụng SQLite để lưu trữ lịch sử đặt vé và hiển thị ngoại tuyến.
- **Cập nhật thời gian thực**: Tích hợp Socket.io để nhận thông tin cập nhật tức thì.
- **Thiết kế hiện đại**: UI/UX tối ưu với các hiệu ứng chuyển động mượt mà và giao diện bắt mắt.

---

## 🛠️ Cấu hình biến môi trường (Environment Variables)

Trước khi khởi chạy ứng dụng, bạn cần cấu hình đường dẫn API bằng cách tạo file `.env` ở thư mục gốc của dự án (nếu chưa có):

1. Tạo file `.env` tại thư mục gốc:
   ```env
   EXPO_PUBLIC_API_URL=https://api.mievoh.io.vn/api
   ```

2. Đảm bảo biến môi trường này đã được khai báo chính xác để ứng dụng kết nối tới đúng máy chủ API.

---

## 🔗 Tài liệu API (API Documentation)

Để phục vụ cho việc phát triển và thử nghiệm các API của dự án Mievoh, vui lòng tham khảo trang tài liệu Swagger chính thức tại:
👉 **[https://api.mievoh.io.vn/api-docs](https://api.mievoh.io.vn/api-docs)**

---

## 🚀 Hướng dẫn cài đặt và Khởi chạy

### Yêu cầu hệ thống
- Đã cài đặt **Node.js** (Khuyến nghị phiên bản LTS mới nhất).
- Đã cài đặt ứng dụng **Expo Go** trên thiết bị di động của bạn (Android/iOS) hoặc thiết lập sẵn máy ảo (Android Emulator / iOS Simulator).

### Các bước khởi chạy

1. **Cài đặt các thư viện phụ thuộc (Dependencies):**
   Di chuyển vào thư mục dự án `Mobile` và cài đặt:
   ```bash
   cd Mobile
   npm install
   ```

2. **Khởi động dự án:**
   ```bash
   npm run start
   ```
   *Hoặc bạn có thể khởi chạy trực tiếp trên các nền tảng mong muốn:*
   - Chạy trên Android: `npm run android`
   - Chạy trên iOS: `npm run ios`
   - Chạy trên trình duyệt Web: `npm run web`

3. **Kết nối thiết bị:**
   - Quét mã QR hiển thị trên Terminal/Console bằng ứng dụng **Expo Go** (đối với hệ điều hành Android) hoặc ứng dụng Camera mặc định (đối với hệ điều hành iOS) để tải và trải nghiệm ứng dụng.