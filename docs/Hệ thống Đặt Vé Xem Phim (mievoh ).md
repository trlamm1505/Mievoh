# **Hệ thống Đặt Vé Xem Phim (mievoh)**

## **Mục đích tài liệu:** Đây là tài liệu thiết kế và đặc tả logic nghiệp vụ (Business Logic), luồng hệ thống (System Flow) và danh sách các API (Endpoints) dành cho sinh viên làm tài liệu tham khảo để build/clone lại một Backend dự án Đặt vé xem phim tương tự. 

---

## **1\. Kiến trúc Database (Schema Thực Thể)**

Hệ thống sử dụng cơ sở dữ liệu MongoDB thông qua Prisma ORM. Dưới đây là các thực thể cốt lõi và mối quan hệ:

### **1.1. Quản lý Người Dùng & Phân Quyền**

* **User (Người dùng):**  
  * **Trường dữ liệu:** username (PK), fullName, email, phoneNumber, password, userType.  
  * **userType** chia làm 3 quyền cơ bản: user(Khách hàng), staff (Quản lý Vận hành) và admin (Quản trị viên hệ thống).

### **1.2. Quản lý Phim & Quảng Cáo**

* **Movie (Phim):**  
  * **Trường dữ liệu:** movieId (PK), title, trailerUrl, imageUrl, description, releaseDate, duration, language, ageRestriction *(Ví dụ: C13, C18 \- Rất quan trọng trong thực tế)*.  
  * **Trường tính toán (Phục vụ Dashboard/Review):** averageRating (Điểm đánh giá trung bình), totalReviews (Tổng số đánh giá).  
  * **Cờ phân loại:** isHot (Phim nổi bật), isShowing (Đang chiếu), isComingSoon (Sắp chiếu).  
* **Banner (Quảng cáo):**  
  * **Trường dữ liệu:** bannerId (PK), imageUrl, movieId (FK \- Liên kết đến phim), isActive.

### **1.3. Hệ Sinh Thái Rạp Phim (Cinema Hierarchy) Cấu trúc rạp được phân cấp 4 tầng chặt chẽ:**

1. **CinemaSystem (Hệ thống Rạp):** VD: CGV, Lotte, BHD. Gồm cinemaSystemId (PK), name, logo.  
2. **CinemaComplex (Cụm Rạp):** Thuộc 1 Hệ thống rạp. VD: CGV Sư Vạn Hạnh. Gồm cinemaComplexId (PK), name, address, cinemaSystemId (FK).  
3. **Cinema (Rạp / Phòng Chiếu):** Thuộc 1 Cụm rạp. VD: Rạp 1, Rạp 2\. Gồm cinemaId (PK), name, cinemaComplexId (FK).  
4. **Seat (Ghế ngồi):** Thuộc 1 Rạp cụ thể. Gồm seatId (PK), name (VD: A1, A2), seatType (Thường, VIP), cinemaId (FK).

### **1.4. Lịch Chiếu & Giao Dịch**

* **Showtime (Lịch/Suất chiếu):**  
  * **Trường dữ liệu:** showtimeId (PK), movieId (FK), cinemaId (FK), showDateTime, ticketPrice.  
* **Booking / Ticket (Giao dịch Đặt vé):**  
  * **Trường dữ liệu:** bookingId (PK), username (FK), showtimeId (FK), bookingDate, totalPrice, paymentStatus (Pending, Success, Failed).  
* **BookingDetail (Chi tiết Đặt vé / Ghế đã đặt):**  
  * *Lưu ý: Với MongoDB, nếu số lượng ghế mỗi lần đặt ít (VD: 1-10 ghế), bạn có thể lưu trực tiếp dưới dạng một mảng seatIds bên trong collection Booking để giảm thiểu việc Join (Population) giữa nhiều bảng.*  
  * **Nếu tách bảng (Chuẩn SQL):** Mapping giữa Booking (bookingId) và các Seat (seatId) mà khách hàng đã chọn.

### **1.5. Đánh Giá & Bình Luận**

* **Review (Đánh giá):**  
  * **Trường dữ liệu:** reviewId (PK), movieId (FK), username (FK), rating (1-5 sao), comment (Nội dung), createdAt.

### **1.6. Cấu Hình Hệ Thống**

* **SystemSetting (Cấu hình):** *(Tương ứng với các chức năng của Admin)*  
  * **Trường dữ liệu:** settingId (PK), key (VD: SESSION\_TIMEOUT, JWT\_EXPIRATION, MAX\_LOGIN\_ATTEMPTS), value, description.

### **1.7. Hệ thống Đề xuất (Recommendation System)**

* **UserRecommendation (Đề xuất phim cho người dùng):**  
  * **Mục đích:** Lưu trữ kết quả sau khi hệ thống phân tích dữ liệu (Python Worker) tính toán xong, chuẩn bị cho việc hiển thị trên Web và gửi Email Marketing.  
  * **Trường dữ liệu:** recommendationId (PK), username (FK \- Liên kết đến người dùng), movieId (FK \- Liên kết đến phim được đề xuất), matchScore (Điểm số phù hợp từ 0-100), isEmailSent (Boolean \- Trạng thái đã gửi email hay chưa, mặc định: false), createdAt.

---

## **2\. Các Luồng Hoạt Động (Application Flows)**

### **2.1. Luồng Khách Hàng (User Flow)**

* **Khám phá:** Khách hàng xem danh sách các banner khuyến mãi và duyệt danh sách các bộ phim hiện có trên hệ thống.  
* **Tra cứu Lịch chiếu:** Khách hàng chọn một bộ phim cụ thể để xem các suất chiếu tương ứng của phim đó.  
* **Tương tác & Đánh giá:** Khách hàng có thể đọc bình luận của những người xem trước. Sau khi đã trải nghiệm phim, khách hàng được quyền đánh giá và để lại bình luận của riêng mình.  
* **Chọn Ghế:** Khách hàng chọn một suất chiếu cụ thể và xem sơ đồ ghế của phòng chiếu đó. Trạng thái của từng ghế (trống, đang giữ, hoặc đã đặt) sẽ được hiển thị rõ ràng để khách hàng lựa chọn.  
* **Xác thực & Thanh toán:** Khách hàng đăng nhập vào tài khoản, xác nhận vị trí ghế đã chọn và tiến hành đặt vé trực tuyến.  
* **Lịch sử:** Khách hàng truy cập vào trang cá nhân để xem lại toàn bộ lịch sử các vé đã đặt trên hệ thống.

### **2.2. Luồng Quản Trị Viên (Admin Flow)**

* **Dashboard & Cấu hình:** Xem tổng doanh thu của toàn bộ hệ thống. Thiết lập các thông số bảo mật và cấu hình nền tảng chung.  
* **Quản lý Users:** Xem danh sách toàn bộ người dùng. Thực hiện các thao tác thêm, sửa, xoá tài khoản và phân quyền cho người dùng (cấp quyền Admin hoặc Staff).  
* **Quản lý Hệ sinh thái Rạp:** Xây dựng cơ sở hạ tầng rạp chiếu bằng cách: Tạo các Hệ thống rạp ➔ Thêm các Cụm Rạp trực thuộc ➔ Thêm các Phòng chiếu ➔ Thiết lập Sơ đồ Ghế cho từng phòng chiếu.

### **2.3. Luồng Quản lý Vận hành (Staff Flow)**

* **Dashboard Vận hành:** Theo dõi nhanh tình hình kinh doanh online, bao gồm tổng lượng vé đã bán ra, tỷ lệ lấp đầy của các suất chiếu và số lượng suất chiếu đang mở bán.  
* **Quản lý Phim:** Cập nhật kho phim bằng cách thêm phim mới (kèm hình ảnh, trailer), chỉnh sửa thông tin phim, phân loại độ tuổi và thay đổi trạng thái chiếu của phim.  
* **Quản lý Lịch chiếu:** Sắp xếp lịch hoạt động bằng cách tạo các suất chiếu: gắn một bộ phim cụ thể vào một phòng chiếu tại một khung giờ nhất định, đồng thời thiết lập giá vé trực tuyến cho suất chiếu đó.  
* **Quản lý Truyền thông:** Phụ trách hình ảnh truyền thông trên trang chủ bằng cách đăng tải, thay đổi hoặc gỡ bỏ các banner quảng cáo.

### **2.4. Luồng Hệ thống Đề xuất Phim (Recommendation Flow)**

* **Thu thập hành vi:** Khi khách hàng thao tác trên luồng 2.1 (Đặt vé, Đánh giá phim), hệ thống tự động ghi nhận lại các dữ liệu làm đầu vào cho thuật toán.  
* **Kích hoạt Phân tích (Cronjob/Manual):** Quản trị viên (Admin) có thể cài đặt giờ chạy tự động mỗi đêm, hoặc nhấn nút "Chạy Phân Tích" trên Dashboard để ép hệ thống xử lý ngay lập tức.  
* **Phân tích Ngoại tuyến (Offline Batch Processing):** Một hệ thống Worker bằng Python chạy ngầm sẽ tiếp nhận lệnh. Hệ thống sử dụng thuật toán tính điểm (Scoring Algorithm) dựa trên tần suất mua vé theo thể loại, đạo diễn hoặc diễn viên để tìm ra các bộ phim sắp chiếu phù hợp nhất với gu của từng khách hàng và lưu kết quả vào DB.  
* **Chiến dịch Email Tự động:** Vào khung giờ hành chính (VD: 8h30 sáng), hệ thống tự động quét danh sách các đề xuất mới (isEmailSent: false) và gửi Email Marketing cá nhân hóa cho từng khách hàng (chứa thông tin phim và mã giảm giá).


---

## **3\. Phân tích Logic Nghiệp vụ Đặt Vé (Core Business Logic)**

### **3.1 Logic Đặt Vé (POST /tickets)** Module quan trọng nhất, sinh viên phải nắm vững Concurrency Control (Kiểm soát đồng thời) để tránh việc 2 người cùng đặt 1 ghế.

* **Xác thực Input:** Kiểm tra showtimeId có tồn tại. Lấy ra cinemaId (mã rạp) của suất chiếu đó.  
* **Xác thực Ghế (Data Integrity):** đảm bảo TẤT CẢ các ghế này đều thuộc về cinemaId ở bước 1\. (Chống gian lận).  
* **Transaction Xử lý Tranh chấp:**

  Sử dụng Database Transaction (Prisma $transaction).

  Kiểm tra xem trong DB (BookingDetail) đã có bản ghi nào chứa seatIds khách chọn cho showtimeId hiện tại chưa?

  Nếu **CÓ**: Hủy bỏ (Rollback) và trả về lỗi: *“Các ghế này đã có người đặt, vui lòng chọn ghế khác”*.

  Nếu **KHÔNG**: Tạo Booking và các BookingDetail. Kết thúc Transaction.

### **3.2. Logic Phân tích & Gửi Email (Recommendation & Message Queue)** 

Module này đòi hỏi xử lý dữ liệu lớn (Big Data) và chạy ngầm tốn thời gian, do đó sinh viên cần nắm vững kiến trúc Message Queue để tránh làm treo server Node.js chính.

* **Giao tiếp liên dịch vụ (RabbitMQ):** NestJS (Backend chính) KHÔNG tự tính toán thuật toán. Nó chỉ tạo một Task (RUN\_RECSYS) và đẩy vào hàng đợi RabbitMQ. Một Server Python độc lập sẽ lắng nghe hàng đợi này, kéo task về chạy thuật toán thống kê dữ liệu và trả lại tiến độ (%) cho Admin.  
* **Quản lý Lịch hẹn & Chống Spam Email (BullMQ \+ Redis):** Sử dụng BullMQ (chạy trên RAM Redis) để lưu cấu hình giờ chạy động do Admin thiết lập (Repeatable Jobs). Khi gửi hàng ngàn Email, BullMQ sẽ áp dụng kỹ thuật **Rate Limiting** (Gửi nhỏ giọt, VD: 50 mail/giây) để server không bị quá tải và Email không bị Google/AWS chặn vì nghi ngờ Spam.

---

## **4\. Yêu Cầu Về Danh Sách APIs Đầy Đủ (Full Endpoints)**

Dưới đây là danh sách toàn bộ các API đã được cập nhật lại theo cấu trúc 3 role (Client, Staff, Admin) và bổ sung thêm các module mới (Đánh giá, Dashboard, Cấu hình) mà chúng ta vừa thảo luận.

**Chú giải quyền truy cập (RoleGuard & Auth):**

* 🟢 **Public:** Không yêu cầu đăng nhập.  
* 🔵 **Auth:** Yêu cầu có JWT Token (Tài khoản đã đăng nhập \- CLIENT, STAFF hoặc ADMIN đều dùng được).  
* 🟡 **Staff:** Yêu cầu quyền STAFF (Lưu ý: ADMIN mặc định có thể gọi được các API của STAFF).  
* 🔴 **Admin:** Quyền quản trị viên cao nhất.

### **4.1. Module Auth (/auth)**

| Method | Endpoint | Mô tả | Quyền truy cập |
| :---- | :---- | :---- | :---- |
| POST | /auth/register | Đăng ký tài khoản mới | 🟢 Public |
| POST | /auth/login | Đăng nhập lấy JWT Token | 🟢 Public |

### **4.2. Module Người dùng (/users)**

| Method | Endpoint | Mô tả | Quyền truy cập |
| :---- | :---- | :---- | :---- |
| POST | /users/create-user | Tạo người dùng mới (có gán role) | 🔴 Admin |
| GET | /users/profile | Lấy thông tin tài khoản đang đăng nhập | 🔵 Auth |
| GET | /users/get-users | Lấy danh sách toàn bộ người dùng | 🔴 Admin |
| GET | /users/detail/:username | Lấy thông tin chi tiết 1 người dùng | 🔴 Admin |
| PUT | /users/profile | Tự cập nhật thông tin tài khoản cá nhân | 🔵 Auth |
| PUT | /users/update | Cập nhật thông tin bất kỳ người dùng nào | 🔴 Admin |
| DELETE | /users/delete/:username | Xóa/Khóa người dùng | 🔴 Admin |

### **4.3. Module Phim & Lịch chiếu (/movies)**

| Method | Endpoint | Mô tả | Quyền truy cập |
| :---- | :---- | :---- | :---- |
| GET | /movies | Lấy danh sách phim (phân trang, lọc) | 🟢 Public |
| POST | /movies/create-movie | Thêm phim mới (Upload ảnh, trailer) | 🟡 Staff |
| PUT | /movies/update-movie | Cập nhật thông tin / trạng thái phim | 🟡 Staff |
| DELETE | /movies/delete-movie/:movieId | Xoá phim | 🟡 Staff |
| GET | /movies/showtimes-by-movie/:movieId | Lấy danh sách rạp và suất chiếu của 1 phim | 🟢 Public |
| GET | /movies/showtimes-by-cinema/:cinemaId | Lấy tất cả lịch chiếu phim tại 1 cụm rạp | 🟢 Public |
| POST | /movies/create-showtime | Tạo suất chiếu mới cho phim tại rạp | 🟡 Staff |
| PUT | /movies/update-showtime | Cập nhật thông tin lịch chiếu, giá vé | 🟡 Staff |
| DELETE | /movies/delete-showtime/:id | Xoá lịch chiếu | 🟡 Staff |

### **4.4. Module Quảng cáo (/banners)**

| Method | Endpoint | Mô tả | Quyền truy cập |
| :---- | :---- | :---- | :---- |
| GET | /banners | Lấy danh sách ảnh banner trang chủ | 🟢 Public |
| POST | /banners | Upload ảnh banner mới, mapping phim | 🟡 Staff |
| DELETE | /banners/:bannerId | Xóa banner | 🟡 Staff |

### **4.5. Module Hệ thống Rạp chiếu (/systems)**

| Method | Endpoint | Mô tả | Quyền truy cập |
| :---- | :---- | :---- | :---- |
| GET | /systems/cinema-system | Lấy danh sách hệ thống rạp | 🟢 Public |
| POST | /systems/cinema-system | Tạo hệ thống rạp mới (kèm upload logo) | 🔴 Admin |
| PUT | /systems/cinema-system | Cập nhật hệ thống rạp | 🔴 Admin |
| DELETE | /systems/cinema-system/:id | Xóa hệ thống rạp | 🔴 Admin |
| GET | /systems/cinema-complex/:systemId | Lấy danh sách cụm rạp theo hệ thống | 🟢 Public |
| POST | /systems/cinema-complex | Tạo cụm rạp mới | 🔴 Admin |
| PUT | /systems/cinema-complex | Cập nhật cụm rạp | 🔴 Admin |
| DELETE | /systems/cinema-complex/:id | Xóa cụm rạp | 🔴 Admin |
| GET | /systems/cinema/:complexId | Lấy danh sách phòng chiếu thuộc cụm rạp | 🟢 Public |
| POST | /systems/cinema | Tạo phòng chiếu mới | 🔴 Admin |
| PUT | /systems/cinema | Cập nhật phòng chiếu | 🔴 Admin |
| DELETE | /systems/cinema/:cinemaId | Xóa phòng chiếu | 🔴 Admin |

### **4.6. Module Ghế ngồi (/seats)**

| Method | Endpoint | Mô tả | Quyền truy cập |
| :---- | :---- | :---- | :---- |
| GET | /seats/:showtimeId | Lấy sơ đồ ghế kèm trạng thái (trống/đã đặt) | 🟢 Public |
| POST | /seats | Tạo ghế mới cho phòng chiếu | 🔴 Admin |
| PUT | /seats | Cập nhật loại ghế, tên ghế | 🔴 Admin |
| DELETE | /seats/:seatId | Xóa ghế (nếu chưa từng được đặt vé) | 🔴 Admin |

### **4.7. Module Đặt vé (/tickets)**

| Method | Endpoint | Mô tả | Quyền truy cập |
| :---- | :---- | :---- | :---- |
| GET | /tickets/history | Xem chi tiết lịch sử đặt vé của bản thân | 🔵 Auth |
| GET | /tickets/detail/:bookingId | Xem chi tiết hoá đơn đặt vé | 🔵 Auth |
| POST | /tickets | Đặt vé online (Payload: showtimeId, seatIds) | 🔵 Auth |

### **4.8. Module Đánh giá & Bình luận (/reviews)**

| Method | Endpoint | Mô tả | Quyền truy cập |
| :---- | :---- | :---- | :---- |
| GET | /reviews/:movieId | Lấy danh sách bình luận của bộ phim | 🟢 Public |
| POST | /reviews | Gửi đánh giá (Validate vé đã xem) | 🔵 Auth |
| PUT | /reviews/:reviewId | Chỉnh sửa bình luận của bản thân | 🔵 Auth |
| DELETE | /reviews/:reviewId | Xóa bình luận cá nhân / Admin xóa vi phạm | 🔵 Auth / 🔴 Admin |

### **4.9. Module Thống kê & Dashboard (/dashboards)**

| Method | Endpoint | Mô tả | Quyền truy cập |
| :---- | :---- | :---- | :---- |
| GET | /dashboards/admin | Thống kê tổng doanh thu, biểu đồ User | 🔴 Admin |
| GET | /dashboards/staff | Thống kê suất chiếu, vé bán online trong ngày | 🟡 Staff |

### **4.10. Module Cấu hình (/settings)**

| Method | Endpoint | Mô tả | Quyền truy cập |
| :---- | :---- | :---- | :---- |
| GET | /settings | Lấy các cấu hình bảo mật hiện tại | 🔴 Admin |
| PUT | /settings | Cập nhật Session timeout, JWT Expiration... | 🔴 Admin |

### **4.11. Module Đề xuất & Chiến dịch Email (/recommendations)**

| Method | Endpoint | Mô tả | Quyền truy cập |
| :---- | :---- | :---- | :---- |
| **GET** | /recommendations/my-movies | Lấy danh sách Top các phim được hệ thống gợi ý riêng cho tài khoản đang đăng nhập (Hiển thị ở trang chủ mục "Dành cho bạn"). | 🔵 Auth |
| **POST** | /recommendations/trigger-analysis | Admin nhấn nút ép hệ thống Python chạy phân tích dữ liệu ngay lập tức (Bắn tin nhắn qua RabbitMQ). | 🔴 Admin |
| **GET** | /recommendations/progress | API (hoặc WebSocket) để Frontend Admin lắng nghe phần trăm tiến độ chạy thuật toán (10%, 50%, 100%). | 🔴 Admin |
| **POST** | /recommendations/config-cron | Cài đặt cấu hình giờ chạy tự động cho hệ thống phân tích và giờ gửi Email (Lưu cấu hình vào BullMQ). | 🔴 Admin |
| **GET** | /recommendations/campaign-stats | Thống kê hiệu quả: Số lượng Email đề xuất đã gửi thành công trong ngày hôm nay. | 🟡 Staff |

