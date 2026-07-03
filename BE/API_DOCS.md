# 📚 Mievoh Booking System – Tài Liệu API Đầy Đủ

> **Base URL (Local):** `http://localhost:3069/api`  
> **Base URL (Production):** `https://api.mievoh.io.vn/api`  
> **Swagger UI:** `http://localhost:3069/api/docs`

---

## 📌 Quy ước chung

### Xác thực (Authentication)

Hầu hết các API yêu cầu gửi kèm JWT Token trong Header:

```
Authorization: Bearer <jwt_token>
```

### Phân quyền (Roles)

| Tag              | Mô tả                              |
| ---------------- | ---------------------------------- |
| `[PUBLIC]`       | Không cần đăng nhập                |
| `[AUTH]`         | Cần JWT Token (user, staff, admin) |
| `[ADMIN]`        | Chỉ tài khoản Admin                |
| `[STAFF]`        | Chỉ tài khoản Staff                |
| `[ADMIN, STAFF]` | Admin hoặc Staff                   |

### Định dạng ngày tháng

Hệ thống sử dụng 2 định dạng tùy theo từng loại trường:

| Định dạng              | Ví dụ                  | Áp dụng cho                                                     |
| ---------------------- | ---------------------- | --------------------------------------------------------------- |
| `DD/MM/YYYY`           | `09/06/2026`           | Ngày (date only): `date`, `startDate`, `endDate`, `dateOfBirth` |
| `YYYY-MM-DDThh:mm:ssZ` | `2026-06-09T14:00:00Z` | Ngày giờ đầy đủ (datetime): `showDateTime`                      |

---

## 1. 🔐 Authentication – Xác thực

### `POST /auth/register/send-otp` [PUBLIC]

Gửi yêu cầu đăng ký tài khoản. Hệ thống sẽ sinh mã OTP 6 số và gửi về email. (Mã có hiệu lực 5 phút).

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `email` | string | ✅ | Địa chỉ email (duy nhất) |
| `phoneNumber` | string | ✅ | Số điện thoại |
| `fullName` | string | ✅ | Họ và tên |
| `password` | string | ✅ | Mật khẩu (tối thiểu 6 ký tự) |

---

### `POST /auth/register` [PUBLIC]

Xác nhận mã OTP để hoàn tất đăng ký tài khoản.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `email` | string | ✅ | Địa chỉ email đã yêu cầu OTP |
| `otp` | string | ✅ | Mã OTP 6 chữ số nhận từ email |

**Response trả về JWT Token sau khi tạo tài khoản thành công.**

---

### `POST /auth/login` [PUBLIC]

Đăng nhập và nhận JWT Token.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `email` | string | ✅ | Địa chỉ email |
| `password` | string | ✅ | Mật khẩu |

**Response trả về JWT Token.**

---

### `GET /auth/google` [PUBLIC]

Đăng nhập bằng Google OAuth. Redirect trình duyệt tới trang xác thực Google.

### `GET /auth/google/callback` [PUBLIC]

Callback URL sau khi Google xác thực thành công. Tự động trả về JWT Token.

---

### `POST /auth/google/mobile` [PUBLIC]

Đăng nhập bằng Google dành riêng cho Mobile App. App gửi `idToken` lấy được từ Google SDK, Server xác thực và trả về JWT trực tiếp (Không dùng Redirect).

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `idToken` | string | ✅ | ID Token do Google SDK trên Mobile sinh ra |

---

### `POST /auth/forgot-password` [PUBLIC]

Gửi yêu cầu khôi phục mật khẩu. Hệ thống sẽ sinh mã OTP 6 số và gửi về email. (Mã có hiệu lực 5 phút).

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `email` | string | ✅ | Địa chỉ email đã đăng ký tài khoản |

---

### `POST /auth/forgot-password/verify-otp` [PUBLIC]

Bước 2: Xác nhận mã OTP. Nếu mã đúng, hệ thống trả về `resetToken` dùng để đặt mật khẩu mới.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `email` | string | ✅ | Địa chỉ email đã yêu cầu OTP |
| `otp` | string | ✅ | Mã OTP 6 chữ số nhận từ email |

**Response:** Trả về `resetToken` (sống 15 phút).

---

### `POST /auth/reset-password` [PUBLIC]

Bước 3: Đặt lại mật khẩu mới bằng `resetToken`.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `resetToken` | string | ✅ | Mã token nhận được từ bước 2 |
| `newPassword` | string | ✅ | Mật khẩu mới |

---

### `POST /auth/change-password` [AUTH]

Thay đổi mật khẩu khi đang đăng nhập. Chỉ áp dụng cho tài khoản nội bộ (đăng ký bằng email), không áp dụng cho tài khoản đăng nhập qua Google OAuth.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `oldPassword` | string | ✅ | Mật khẩu cũ hiện tại |
| `newPassword` | string | ✅ | Mật khẩu mới muốn thay đổi |

---

## 2. 👤 Users – Quản lý người dùng

### `GET /users/profile` [AUTH]

Lấy thông tin cá nhân của tài khoản đang đăng nhập.

---

### `PUT /users/profile` [AUTH]

Cập nhật thông tin cá nhân. Form-data (multipart/form-data).

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `fullName` | string | ❌ | Họ và tên |
| `phoneNumber` | string | ❌ | Số điện thoại |
| `dateOfBirth` | string (ISO) | ❌ | Ngày sinh. Ví dụ: `1995-10-25T00:00:00Z` |
| `address` | string | ❌ | Địa chỉ |
| `gender` | string | ❌ | Giới tính (`Nam`, `Nữ`, `Khác`) |
| `cccd` | string | ❌ | Số CCCD / CMND |
| `avatar` | file (binary) | ❌ | Ảnh đại diện mới |

---

### `GET /users` [ADMIN]

Lấy danh sách tất cả người dùng (có phân trang).

**Query Params:**
| Tham số | Kiểu | Mặc định | Mô tả |
|---------|------|----------|-------|
| `page` | number | `1` | Số trang |
| `limit` | number | `10` | Số bản ghi / trang |
| `userType` | string | - | Lọc theo loại: `user`, `staff`, `admin` |

---

### `GET /users/:username` [ADMIN]

Lấy chi tiết 1 người dùng theo username.

---

### `POST /users/staff` [ADMIN]

Tạo tài khoản nhân viên (Staff) mới.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `username` | string | ✅ | Tên đăng nhập |
| `fullName` | string | ✅ | Họ và tên |
| `email` | string | ✅ | Email |
| `cinemaComplexId` | string (ObjectId) | ✅ | ID Cụm rạp mà Staff này phụ trách |
| `password` | string | ❌ | Mật khẩu. Mặc định: `123456` |

---

### `PUT /users/staff/:username` [ADMIN]

Cập nhật thông tin hoặc luân chuyển cụm rạp cho Staff.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `fullName` | string | ❌ | Họ và tên mới |
| `email` | string | ❌ | Email mới |
| `cinemaComplexId` | string | ❌ | ID Cụm rạp mới (Luân chuyển) |
| `isActive` | boolean | ❌ | Trạng thái hoạt động |

---

### `DELETE /users/:username` [ADMIN]

Vô hiệu hóa tài khoản (Không xóa vật lý).

---

## 3. 🎬 Movies – Quản lý phim

### `GET /movies` [PUBLIC]

Lấy danh sách phim (có phân trang và lọc).

**Query Params:**
| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `page` | number | Số trang (mặc định: 1) |
| `pageSize` | number | Số lượng / trang (mặc định: 10) |
| `isShowing` | boolean | Lọc phim đang chiếu |
| `isComingSoon` | boolean | Lọc phim sắp chiếu |
| `isHot` | boolean | Lọc phim hot |
| `search` | string | Tìm kiếm theo tên phim |

---

### `GET /movies/:id` [PUBLIC]

Lấy chi tiết 1 bộ phim kèm điểm đánh giá trung bình.

---

### `POST /movies` [ADMIN, STAFF]

Thêm phim mới. Form-data (multipart/form-data).

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `title_vi` | string | ❌ | Tên phim tiếng Việt |
| `title_en` | string | ❌ | Tên phim tiếng Anh |
| `description_vi` | string | ❌ | Mô tả phim (Tiếng Việt) |
| `description_en` | string | ❌ | Mô tả phim (Tiếng Anh) |
| `trailerUrl` | string | ❌ | Link trailer YouTube |
| `releaseDate` | string (ISO) | ❌ | Ngày khởi chiếu |
| `duration` | number | ❌ | Thời lượng (phút) |
| `language_vi` | string | ❌ | Ngôn ngữ âm thanh |
| `language_en` | string | ❌ | Ngôn ngữ phụ đề |
| `ageRestriction` | string | ❌ | Phân loại độ tuổi (C13, C18, P) |
| `genres` | string[] | ❌ | Thể loại. Ví dụ: `["Hành động", "Viễn tưởng"]` |
| `director` | string | ❌ | Đạo diễn |
| `cast` | string | ❌ | Diễn viên |
| `isShowing` | boolean | ❌ | Đang chiếu? (mặc định: true) |
| `isComingSoon` | boolean | ❌ | Sắp chiếu? (mặc định: false) |
| `isHot` | boolean | ❌ | Phim hot? (mặc định: false) |
| `image` | file (binary) | ❌ | Ảnh poster phim |

---

### `PUT /movies/:id` [ADMIN, STAFF]

Cập nhật thông tin phim. Form-data (multipart/form-data). Tất cả trường đều optional.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `title_vi` | string | ❌ | Tên phim tiếng Việt |
| `title_en` | string | ❌ | Tên phim tiếng Anh |
| `description_vi` | string | ❌ | Mô tả phim (Tiếng Việt) |
| `description_en` | string | ❌ | Mô tả phim (Tiếng Anh) |
| `trailerUrl` | string | ❌ | Link trailer YouTube |
| `releaseDate` | string (DD/MM/YYYY) | ❌ | Ngày khởi chiếu |
| `duration` | number | ❌ | Thời lượng (phút) |
| `language_vi` | string | ❌ | Ngôn ngữ âm thanh |
| `language_en` | string | ❌ | Ngôn ngữ phụ đề |
| `ageRestriction` | string | ❌ | Phân loại độ tuổi (C13, C18, P) |
| `genres` | string[] | ❌ | Thể loại |
| `director` | string | ❌ | Đạo diễn |
| `cast` | string | ❌ | Diễn viên |
| `isShowing` | boolean | ❌ | Đang chiếu? |
| `isComingSoon` | boolean | ❌ | Sắp chiếu? |
| `isHot` | boolean | ❌ | Phim hot? |
| `image` | file (binary) | ❌ | Ảnh poster phim mới |

### `DELETE /movies/:id` [ADMIN]

Xóa phim.

---

## 4. 🏢 Cinema Systems – Hệ thống rạp (CGV, Lotte...)

### `GET /cinema-systems` [PUBLIC]

Lấy danh sách các thương hiệu rạp.

### `POST /cinema-systems` [ADMIN]

Thêm hệ thống rạp mới. Form-data (multipart/form-data).

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `name` | string | ✅ | Tên hệ thống rạp (VD: CGV) |
| `logo` | file (binary) | ❌ | File ảnh logo |

### `PUT /cinema-systems` [ADMIN]

Cập nhật thông tin hệ thống rạp. Form-data (multipart/form-data).

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `cinemaSystemId` | string (ObjectId) | ✅ | ID hệ thống rạp cần cập nhật |
| `name` | string | ❌ | Tên mới |
| `logo` | file (binary) | ❌ | File ảnh logo mới |

### `DELETE /cinema-systems/:id` [ADMIN]

Xóa hệ thống rạp.

---

## 5. 🗺️ Cinema Complexes – Cụm rạp

### `GET /cinema-complexes` [PUBLIC]

Lấy danh sách cụm rạp. Có thể lọc theo hệ thống rạp hoặc thành phố.

**Query Params:**
| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `cinemaSystemId` | string | Lọc theo ID hệ thống rạp |

---

### `POST /cinema-complexes` [ADMIN]

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `name` | string | ✅ | Tên cụm rạp (VD: CGV Vincom Thủ Đức) |
| `address` | string | ❌ | Địa chỉ cụm rạp |
| `cinemaSystemId` | string (ObjectId) | ❌ | Thuộc hệ thống rạp nào |

### `PUT /cinema-complexes/:id` [ADMIN]

Cập nhật cụm rạp.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `cinemaComplexId` | string (ObjectId) | ✅ | ID cụm rạp cần cập nhật |
| `name` | string | ❌ | Tên cụm rạp mới |
| `address` | string | ❌ | Địa chỉ mới |
| `cinemaSystemId` | string (ObjectId) | ❌ | ID hệ thống rạp mới |

### `DELETE /cinema-complexes/:id` [ADMIN]

Xóa cụm rạp.

---

## 6. 🎭 Cinemas – Phòng chiếu

### `GET /cinemas` [ADMIN, STAFF]

Lấy danh sách phòng chiếu. Có thể lọc theo cụm rạp.

**Query Params:**
| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `cinemaComplexId` | string | Lọc phòng chiếu theo cụm rạp |

---

### `POST /cinemas` [ADMIN, STAFF]

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `name` | string | ✅ | Tên phòng chiếu (VD: Phòng 1, IMAX Hall) |
| `cinemaComplexId` | string (ObjectId) | ✅ | ID Cụm rạp chứa phòng này |

### `PUT /cinemas/:id` [ADMIN, STAFF]

Cập nhật phòng chiếu.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `cinemaId` | string (ObjectId) | ✅ | ID phòng chiếu cần cập nhật |
| `name` | string | ❌ | Tên phòng chiếu mới |
| `cinemaComplexId` | string (ObjectId) | ❌ | ID Cụm rạp mới (chuyển phòng sang cụm khác) |

### `DELETE /cinemas/:id` [ADMIN, STAFF]

Xóa phòng chiếu.

---

## 7. 💺 Seats – Ghế ngồi

### `GET /seats` [PUBLIC]

Lấy sơ đồ ghế của một phòng chiếu.

**Query Params:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| `cinemaId` | string | ✅ | ID Phòng chiếu cần xem sơ đồ |

---

### `POST /seats/generate` [ADMIN, STAFF]

Tự động sinh sơ đồ ghế hàng loạt cho phòng chiếu.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `cinemaId` | string (ObjectId) | ✅ | ID Phòng chiếu cần sinh ghế |
| `rowLetterStart` | string | ✅ | Ký tự hàng bắt đầu (VD: `A`) |
| `rowLetterEnd` | string | ✅ | Ký tự hàng kết thúc (VD: `J`) |
| `seatsPerRow` | number | ✅ | Số ghế mỗi hàng (tối đa 50) |
| `vipRows` | string[] | ❌ | Danh sách hàng VIP. VD: `["G", "H"]` |
| `sweetboxRows` | string[] | ❌ | Danh sách hàng ghế Đôi. VD: `["J"]` |

---

### `POST /seats` [ADMIN, STAFF]

Thêm thủ công 1 ghế.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `name` | string | ✅ | Tên ghế (VD: A1, B5) |
| `cinemaId` | string (ObjectId) | ✅ | ID Phòng chiếu |
| `seatType` | string | ✅ | Loại ghế (`Thường`, `VIP`, `Đôi`) |

### `PUT /seats/:id` [ADMIN, STAFF]

Cập nhật ghế.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `seatId` | string (ObjectId) | ✅ | ID ghế cần cập nhật |
| `name` | string | ❌ | Tên ghế mới (VD: A1) |
| `seatType` | string | ❌ | Loại ghế mới (`Thường`, `VIP`, `Đôi`) |

### `DELETE /seats/:id` [ADMIN, STAFF]

Xóa ghế.

---

## 8. 🗓️ Showtimes – Lịch chiếu

### `GET /showtimes/movie/:movieId` [PUBLIC]

Lấy lịch chiếu của 1 bộ phim, **gom nhóm theo Hệ thống rạp**. Dùng cho trang chi tiết phim.

**Query Params:**
| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `date` | string (DD/MM/YYYY) | Lọc theo ngày chiếu. Ví dụ: `09/06/2026` |

---

### `GET /showtimes/complex/:complexId` [PUBLIC]

Lấy lịch chiếu của 1 cụm rạp, **gom nhóm theo Phim**. Dùng cho trang chi tiết cụm rạp.

**Query Params:**
| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `date` | string (DD/MM/YYYY) | Lọc theo ngày chiếu. Ví dụ: `09/06/2026` |

---

### `GET /showtimes/:showtimeId` [PUBLIC]

Lấy thông tin tóm tắt 1 suất chiếu (dùng cho header màn hình chọn ghế).

---

### `POST /showtimes` [ADMIN, STAFF]

Tạo lịch chiếu mới.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `cinemaId` | string (ObjectId) | ✅ | ID Phòng chiếu |
| `movieId` | string (ObjectId) | ✅ | ID Bộ phim |
| `showDateTime` | string (ISO) | ✅ | Ngày giờ chiếu. Ví dụ: `2026-06-10T14:00:00Z` |
| `format` | string | ❌ | Định dạng chiếu (mặc định: `2D Phụ Đề`) |
| `ticketPrice` | number | ❌ | Giá vé cơ bản của suất chiếu (VNĐ) |

---

### `PUT /showtimes` [ADMIN, STAFF]

Cập nhật lịch chiếu.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `showtimeId` | string (ObjectId) | ✅ | ID suất chiếu cần cập nhật |
| `cinemaId` | string | ❌ | ID Phòng chiếu mới |
| `movieId` | string | ❌ | ID Phim mới |
| `showDateTime` | string (ISO) | ❌ | Thời gian mới |
| `format` | string | ❌ | Định dạng mới |
| `ticketPrice` | number | ❌ | Giá vé mới |
| `status` | string | ❌ | Trạng thái (`Active`, `Cancelled`) |

### `DELETE /showtimes/:id` [ADMIN, STAFF]

Xóa suất chiếu.

---

## 9. 🍿 Foods – Đồ ăn & Thức uống

### `GET /foods` [PUBLIC]

Lấy menu đồ ăn. Có thể lọc theo cụm rạp.

**Query Params:**
| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `cinemaComplexId` | string | Lọc menu theo cụm rạp |

---

### `POST /foods` [ADMIN, STAFF]

Thêm sản phẩm đồ ăn mới. Form-data (multipart/form-data).

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `name` | string | ✅ | Tên sản phẩm (VD: Bắp Rang Bơ L) |
| `price` | number | ✅ | Giá (VNĐ) |
| `cinemaComplexId` | string (ObjectId) | ✅ | Thuộc cụm rạp nào |
| `description` | string | ❌ | Mô tả |
| `isActive` | boolean | ❌ | Đang bán? (mặc định: true) |
| `image` | file (binary) | ❌ | Ảnh sản phẩm |

### `PUT /foods/:id` [ADMIN, STAFF]

Cập nhật sản phẩm. Tất cả trường đều optional.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `name` | string | ❌ | Tên sản phẩm |
| `price` | number | ❌ | Giá (VNĐ) |
| `cinemaComplexId` | string (ObjectId) | ❌ | ID cụm rạp |
| `description` | string | ❌ | Mô tả |
| `isActive` | boolean | ❌ | Đang bán? |
| `image` | file (binary) | ❌ | Ảnh sản phẩm mới |

### `DELETE /foods/:id` [ADMIN, STAFF]

Xóa sản phẩm khỏi menu.

---

## 10. 🎟️ Vouchers – Mã giảm giá

### `GET /vouchers/public` [PUBLIC]

Lấy danh sách mã giảm giá đang có hiệu lực để hiển thị trang khuyến mãi.

**Query Params:**
| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `cinemaComplexId` | string | Lọc mã theo cụm rạp (bỏ trống = lấy tất cả toàn quốc) |

---

### `GET /vouchers/my-vouchers` [AUTH]

Lấy danh sách mã giảm giá mà người dùng hiện tại **CÒN CÓ THỂ SỬ DỤNG** (đã loại trừ mã đã dùng, hết số lượng).

---

### `POST /vouchers` [ADMIN, STAFF]

Tạo mã giảm giá mới.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `code` | string | ✅ | Mã giảm giá. Tự động viết hoa, xóa khoảng trắng |
| `discountType` | string | ✅ | Loại giảm: `PERCENTAGE` hoặc `FIXED` |
| `discountValue` | number | ✅ | Giá trị giảm (% hoặc VNĐ) |
| `startDate` | string (DD/MM/YYYY) | ✅ | Ngày bắt đầu hiệu lực. Ví dụ: `08/06/2026` |
| `endDate` | string (DD/MM/YYYY) | ✅ | Ngày hết hạn. Ví dụ: `08/07/2026` |
| `maxDiscount` | number | ❌ | Số tiền giảm tối đa (chỉ áp dụng cho PERCENTAGE) |
| `minPurchase` | number | ❌ | Tổng tiền đơn hàng tối thiểu để dùng mã |
| `usageLimit` | number | ❌ | Giới hạn tổng số lượt dùng trên toàn hệ thống |
| `cinemaComplexId` | string (ObjectId) | ❌ | Giới hạn áp dụng cho 1 cụm rạp. Để trống = Toàn quốc |
| `isBroadcast` | boolean | ❌ | Gửi thông báo In-app cho tất cả user ngay khi tạo (mặc định: false) |

> **Lưu ý:** Nếu tài khoản là **Staff**, trường `cinemaComplexId` sẽ tự động được gán theo cụm rạp của Staff đó.

---

### `PUT /vouchers/:id` [ADMIN, STAFF]

Cập nhật mã giảm giá.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `discountValue` | number | ❌ | Giá trị giảm mới |
| `maxDiscount` | number | ❌ | Số tiền giảm tối đa mới |
| `minPurchase` | number | ❌ | Đơn hàng tối thiểu mới |
| `startDate` | string (DD/MM/YYYY) | ❌ | Ngày bắt đầu mới. Ví dụ: `08/06/2026` |
| `endDate` | string (DD/MM/YYYY) | ❌ | Ngày hết hạn mới. Ví dụ: `08/07/2026` |
| `usageLimit` | number | ❌ | Giới hạn số lượt mới |
| `isActive` | boolean | ❌ | Kích hoạt / Vô hiệu hóa mã |

### `DELETE /vouchers/:id` [ADMIN, STAFF]

Xóa mã giảm giá.

---

### `POST /vouchers/apply` [AUTH]

Kiểm tra và tính toán số tiền được giảm trước khi thanh toán.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `code` | string | ✅ | Mã giảm giá cần áp dụng |
| `bookingId` | string (ObjectId) | ✅ | ID của Booking cần áp mã |

**Response trả về:**

```json
{
  "discountAmount": 50000,
  "originalPrice": 280000,
  "finalPrice": 230000,
  "voucherId": "..."
}
```

---

## 11. 🎫 Bookings – Đặt vé

### `GET /bookings/seats-status/:showtimeId` [PUBLIC]

Lấy trạng thái từng ghế (Trống / Đã đặt) của suất chiếu. Dùng để render sơ đồ ghế cho người dùng chọn chỗ.

---

### `POST /bookings` [AUTH]

Tạo đặt vé mới và sinh URL thanh toán VNPay.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `showtimeId` | string (ObjectId) | ✅ | ID Suất chiếu |
| `seatIds` | string[] | ✅ | Danh sách ID ghế đã chọn. VD: `["id1", "id2"]` |
| `foodItems` | object[] | ❌ | Danh sách đồ ăn. Cấu trúc: `[{ foodId, quantity }]` |
| `voucherCode` | string | ❌ | Mã giảm giá muốn áp dụng |
| `returnUrl` | string | ❌ | URL chuyển hướng về App/Web sau khi thanh toán VNPay |

**Response trả về URL VNPay để chuyển hướng thanh toán.**

---

### `GET /bookings/my-history` [AUTH]

Lấy lịch sử đặt vé của người dùng hiện tại. Không có Query Params - trả toàn bộ.

---

### `GET /bookings/:id` [AUTH]

Lấy thông tin chi tiết một hóa đơn đặt vé cụ thể của người dùng hiện tại (kèm theo rạp, phim, ghế ngồi). Thường dùng để polling lấy mã vé sau khi thanh toán VNPay.

---

## 12. 💳 Payments – Thanh toán

### `GET /payments/vnpay-ipn` [PUBLIC – Chỉ VNPay gọi]

Endpoint nhận kết quả thanh toán từ VNPay (IPN Callback). **Không gọi trực tiếp.**  
Khi VNPay trả về `rspCode = 00` (Thành công), hệ thống tự động:

- Cập nhật trạng thái Booking → `Success`
- Ghi nhận VoucherUsage (nếu có)
- Gửi thông báo Socket Realtime cho người dùng

---

### `GET /payments/vnpay-return` [PUBLIC – Để FE gọi lên]

ENDPOINT để FE gọi sau khi VNPay redirect về. FE nhận URL redirect từ VNPay kèm các query params, sau đó forward toàn bộ params lên endpoint này để **xác thực chữ ký điện tử** và biết kết quả giao dịch.

> **Lưu ý:** Endpoint này **KHÔNG cập nhật trạng thái DB**. Việc cập nhật DB (Booking → `Success`/`Failed`, giải phóng ghế, gửi notification) được thực hiện bởi `vnpay-ipn` (VNPay server tự gọi server-to-server). FE chỉ dùng response của endpoint này để hiển thị UI thành công/thất bại.

**Query Params:**
| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `vnp_Amount` | number | Số tiền thanh toán |
| `vnp_BankCode` | string | Mã ngân hàng |
| `vnp_BankTranNo` | string | Mã giao dịch ngân hàng |
| `vnp_CardType` | string | Loại thẻ |
| `vnp_OrderInfo` | string | Thông tin đơn hàng |
| `vnp_PayDate` | string | Ngày thanh toán |
| `vnp_ResponseCode` | string | Mã phản hồi |
| `vnp_TmnCode` | string | Mã terminal |
| `vnp_TransactionNo` | string | Mã giao dịch |
| `vnp_SecureHash` | string | Mã hash để xác thực |

---

## 13. ⭐ Reviews – Đánh giá phim

### `GET /reviews/movie/:movieId` [PUBLIC]

Lấy danh sách đánh giá của một bộ phim.

**Query Params:**
| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `page` | number | Số trang (mặc định: 1) |
| `limit` | number | Số bản ghi / trang (mặc định: 10) |

---

### `POST /reviews` [AUTH]

Đăng hoặc cập nhật đánh giá phim. **Bắt buộc phải có booking thành công cho bộ phim đó.** Nếu đã đánh giá rồi sẽ tự động cập nhật (upsert).

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `movieId` | string (ObjectId) | ✅ | ID bộ phim muốn đánh giá |
| `rating` | number | ✅ | Số sao (1 đến 5) |
| `comment` | string | ❌ | Nội dung nhận xét |

---

### `DELETE /reviews/:id` [ADMIN, STAFF]

Xóa đánh giá rác/spam. Chỉ ADMIN và STAFF mới được xóa.

---

## 14. 🖼️ Banners – Quảng cáo

### `GET /banners` [PUBLIC]

Lấy danh sách banner đang active để hiển thị trang chủ.

---

### `POST /banners` [ADMIN, STAFF]

Thêm banner mới. Form-data (multipart/form-data).

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `movieId` | string (ObjectId) | ❌ | Gắn banner với bộ phim |
| `image` | file (binary) | ✅ | File ảnh banner |

### `PUT /banners/:id` [ADMIN, STAFF]

Cập nhật banner.

### `DELETE /banners/:id` [ADMIN, STAFF]

Xóa banner.

---

## 15. 🔔 Notifications – Thông báo

### `GET /notifications` [AUTH]

Lấy danh sách thông báo của người dùng hiện tại (có phân trang, sắp xếp mới nhất trước).

**Query Params:**
| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `page` | number | Số trang (mặc định: 1) |
| `pageSize` | number | Số bản ghi / trang (mặc định: 10) |

**Response cũng trả về `unreadCount` – số thông báo chưa đọc.**

---

### `PUT /notifications/:id/read` [AUTH]

Đánh dấu 1 thông báo là đã đọc. Đồng thời phát sự kiện Socket `mark_as_read` về Frontend.

---

### `PUT /notifications/read-all` [AUTH]

Đánh dấu TẤT CẢ thông báo của mình là đã đọc. Đồng thời phát sự kiện Socket `mark_all_as_read`.

---

### `POST /notifications/broadcast` [ADMIN]

Gửi thông báo thủ công tới toàn bộ hệ thống (Dành riêng Admin).

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `title` | string | ✅ | Tiêu đề thông báo |
| `message` | string | ✅ | Nội dung thông báo |
| `link` | string | ❌ | URL đính kèm (Ví dụ: link tới trang sự kiện) |

---

### `GET /notifications/broadcasts` [ADMIN]

Lấy danh sách các broadcast đã phát (có phân trang).

**Query Params:**
| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `page` | number | Số trang (mặc định: 1) |
| `pageSize` | number | Số bản ghi / trang (mặc định: 10) |

---

### `PUT /notifications/broadcasts/:id` [ADMIN]

Cập nhật nội dung một broadcast đã phát.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `title` | string | ❌ | Tiêu đề mới |
| `message` | string | ❌ | Nội dung mới |
| `link` | string | ❌ | URL đính kèm mới |

---

### `DELETE /notifications/broadcasts/:id` [ADMIN]

Xóa một broadcast.

---

## 16. 🤖 Recommendations – Gợi ý phim AI

### `GET /recommendations/my-movies` [AUTH]

Lấy top 3 bộ phim được AI gợi ý riêng cho người dùng hiện tại (dựa trên lịch sử xem).

---

### `POST /recommendations/trigger-analysis` [ADMIN]

Kích hoạt thủ công quá trình phân tích hành vi người dùng. Hệ thống đẩy job vào hàng đợi (BullMQ), Worker Python xử lý ngầm và cập nhật kết quả gợi ý.

---

### `POST /recommendations/trigger-email` [ADMIN]

Kích hoạt thủ công việc quét và gửi **Email Marketing** ngay lập tức (không chờ cron).

---

### `POST /recommendations/config-cron` [ADMIN]

Thêm mới / cập nhật lịch hẹn giờ (Cronjob) cho Email Marketing hoặc phân tích AI.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `type` | string | ✅ | Loại job: `email` hoặc `analysis` |
| `cronExpression` | string | ✅ | Biểu thức cron Linux. VD: `0 8 * * *` = 8h sáng mỗi ngày |
| `name` | string | ❌ | Tên định danh cho cronjob (dễ quản lý). Nếu bỏ trống dùng tên mặc định |

---

### `GET /recommendations/crons` [ADMIN]

Lấy danh sách tất cả các Cronjob đang hoạt động.

---

### `DELETE /recommendations/cron` [ADMIN]

Xóa một Cronjob đang hoạt động.

**Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `repeatKey` | string | ✅ | Khóa định danh của cronjob (lấy từ `GET /recommendations/crons`) |

---

### `GET /recommendations/campaign-stats` [ADMIN]

Xem thống kê chiến dịch Email Marketing (số email đã gửi, tỉ lệ mở, v.v.).

---

## 17. 📊 Statistics & Dashboard

### `GET /statistics/overview` [STAFF, ADMIN, SYSTEM]

Lấy các thông số tổng quan (Doanh thu, số vé, số user, số phim).
*Lưu ý: Nếu user là Staff, doanh thu và số vé tự động được lọc theo cụm rạp quản lý.*

---

### `GET /statistics/revenue-chart` [STAFF, ADMIN, SYSTEM]

Vẽ biểu đồ doanh thu theo ngày.

**Query Parameters:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| `days` | number | ❌ | Số ngày lấy dữ liệu (Mặc định: 7) |

---

### `GET /statistics/top-movies` [STAFF, ADMIN, SYSTEM]

Lấy danh sách các bộ phim có doanh thu cao nhất.

**Query Parameters:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| `limit` | number | ❌ | Số lượng phim lấy ra (Mặc định: 5) |

---

### `GET /statistics/revenue-by-complex` [ADMIN, SYSTEM]

Phân bổ doanh thu của từng cụm rạp trong toàn hệ thống. Dùng để vẽ biểu đồ tròn (Pie chart).

---

## 🔌 Socket Events (Realtime)

Kết nối: `ws://localhost:3069` (Socket.io)

### Client → Server (Emit)

| Event        | Payload             | Mô tả                                    |
| ------------ | ------------------- | ---------------------------------------- |
| `join_room`  | `username` (string) | Tham gia phòng cá nhân sau khi đăng nhập |
| `leave_room` | `username` (string) | Rời phòng khi đăng xuất                  |

### Server → Client (Listen)

| Event                    | Payload                        | Mô tả                                        |
| ------------------------ | ------------------------------ | -------------------------------------------- |
| `notification`           | `{ title, message, link }`     | Nhận thông báo cá nhân mới                   |
| `broadcast_notification` | `{ title, message, link }`     | Nhận thông báo hệ thống toàn cầu             |
| `mark_as_read`           | `{ notificationId, username }` | Cập nhật UI khi 1 thông báo đã được đọc      |
| `mark_all_as_read`       | `{ username }`                 | Cập nhật UI khi tất cả thông báo đã được đọc |
| `analysis_progress`      | `{ progress }`                 | Tiến độ phân tích AI (0-100%)                |

---

_Tài liệu được tổng hợp dựa trên source code thực tế. Cập nhật lần cuối: 09/06/2026._
