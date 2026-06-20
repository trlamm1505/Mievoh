# Mievoh - Hệ Thống Đặt Vé Xem Phim (Mievoh)

<p align="center">
  <img src="Mobile/assets/images/mievoh/readme_logo.png" alt="Mievoh Logo" height="90" align="middle" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="Mobile/assets/images/mievoh/readme_text.png" alt="Mievoh Text" height="55" align="middle" />
</p>

Chào mừng bạn đến với **Mievoh Mobile** - ứng dụng đặt vé xem phim thông minh, mượt mà và trực quan được xây dựng trên nền tảng Expo và React Native.

---

## 📌 Các Chức Năng Chính (Core Features)

Ứng dụng cung cấp trải nghiệm đặt vé xem phim toàn diện với các chức năng nổi bật:

1. **Quản lý & Xác thực Tài khoản**:
   - Đăng ký, đăng nhập và khôi phục mật khẩu (Quên mật khẩu) an toàn.
   - Hỗ trợ đăng nhập nhanh bằng tài khoản Google (Google Sign-In).
   - Quản lý thông tin cá nhân: Cập nhật thông tin chi tiết, thay đổi ảnh đại diện (avatar) và đổi mật khẩu trực tiếp.
   - Xác thực mã OTP bảo mật thông qua giao diện modal tiện lợi.

2. **Duyệt Phim & Đề xuất Cá nhân hóa**:
   - Hiển thị danh sách phim đang chiếu (Now Showing), phim hot và các tin tức ưu đãi/khuyến mãi.
   - Tìm kiếm phim thông minh, lọc kết quả trực quan.
   - **Đề xuất cá nhân hóa (Personal Recommendations)**: Thuật toán gợi ý các bộ phim phù hợp nhất với sở thích người dùng, kèm theo tỷ lệ tương thích (Match Score %) và đánh giá trung bình.
   - Trang chi tiết phim trực quan: Xem thông tin tóm tắt, lịch chiếu, đánh giá và trình phát trailer phim YouTube trực tiếp.

3. **Quy trình Đặt vé Xem phim Toàn diện**:
   - Lựa chọn suất chiếu linh hoạt theo ngày, định dạng chiếu (2D/3D) và cụm rạp.
   - Sơ đồ chọn ghế ngồi trực quan, hỗ trợ nhiều loại ghế (Standard, VIP, Double).
   - Tích hợp thêm các gói bắp nước, combo đồ ăn uống đi kèm đa dạng.
   - Màn hình thanh toán bảo mật với chi tiết hóa đơn rõ ràng, hỗ trợ nhiều phương thức.
   - Xuất vé ảo kèm mã vạch / mã QR và mã đặt vé chi tiết để check-in tại rạp.

4. **Chế độ Ngoại tuyến & Đồng bộ hóa Dữ liệu (Offline Mode & SQLite)**:
   - Tự động nhận diện trạng thái kết nối mạng (Online/Offline) của thiết bị.
   - Lưu trữ cục bộ lịch sử đặt vé và danh sách đề xuất phim bằng SQLite.
   - Người dùng có thể xem lại toàn bộ vé đã đặt và gợi ý phim bất kỳ lúc nào mà không cần kết nối mạng.

5. **Trung tâm Thông báo Thời gian thực (Real-time Notifications)**:
   - Nhận thông báo cá nhân (đặt vé thành công, nhắc lịch chiếu) và thông báo hệ thống (sự kiện, tin tức).
   - Đồng bộ trạng thái thông báo đã đọc/chưa đọc thông qua Socket.io trong thời gian thực.
   - Hộp thư thông báo riêng biệt giúp quản lý tin tức dễ dàng.

6. **Hỗ trợ Song ngữ & Giao diện Đa dạng**:
   - Chuyển đổi ngôn ngữ Tiếng Việt (`vi`) và Tiếng Anh (`en`) nhanh chóng trong cài đặt.
   - Hỗ trợ đổi giao diện Sáng/Tối (Light/Dark Mode) mượt mà giúp bảo vệ mắt và tiết kiệm pin.

---

## 🛠️ Công Nghệ Phát Triển (Technology Stack)

Dự án được xây dựng dựa trên các công nghệ hiện đại nhằm đảm bảo hiệu năng và khả năng mở rộng:

- **Framework chính**: **React Native** & **Expo (SDK 56)** cho phép phát triển ứng dụng di động đa nền tảng (Android/iOS) nhanh chóng, mượt mà.
- **Ngôn ngữ**: **TypeScript** bảo đảm mã nguồn an toàn, chặt chẽ và dễ bảo trì.
- **Quản lý Điều hướng**: **Expo Router (File-based Routing)** tối ưu hóa cấu trúc thư mục và trải nghiệm chuyển trang nguyên bản (native).
- **Thiết kế Giao diện**: **Tailwind CSS & NativeWind (v4)** đem lại giao diện hiện đại, responsive và hỗ trợ Dark Mode vượt trội.
- **Cơ sở dữ liệu Ngoại tuyến**: **SQLite (`expo-sqlite`)** phục vụ lưu trữ đệm dữ liệu (caching) khi không có mạng và `@react-native-async-storage/async-storage` để lưu trữ trạng thái người dùng.
- **Kết nối Real-time**: **Socket.io-client** hỗ trợ lắng nghe sự kiện thông báo tức thời từ server.
- **Truy vấn API**: **Axios** hỗ trợ kết nối ổn định với hệ thống RESTful API của Mievoh.
- **Hiệu ứng & Hoạt ảnh**: **React Native Reanimated (v4)** và **React Native Gesture Handler** đem đến trải nghiệm vuốt chạm mượt mà cùng các chuyển động tinh tế.
- **Trình phát phương tiện**: **React Native Webview** và **React Native YouTube Iframe** phục vụ trình chiếu trailer phim mượt mà.

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