# Thuật toán Đề xuất Phim (Content-Based Recommendation System)

Tài liệu này mô tả chi tiết cơ sở lý thuyết và luồng hoạt động của thuật toán đề xuất phim tự xây dựng trong file `core/pandas_service.py`. Thư viện **Pandas** ở đây không phải là thuật toán lõi, mà được sử dụng như một công cụ đắc lực để tiền xử lý, gộp (merge) và thống kê khối lượng lớn dữ liệu, tạo nền tảng đầu vào cho thuật toán chấm điểm.

## 1. Cơ sở lý thuyết của Thuật toán (Recommendation System Model)

Thuật toán tự xây dựng ở trên có tên gọi đầy đủ là: **"Content-Based Recommendation System using User Profiling and Rule-Based Heuristic Scoring"** (Hệ thống gợi ý dựa trên nội dung, sử dụng Hồ sơ người dùng và Chấm điểm theo luật kinh nghiệm).

Đáng chú ý, mô hình này **KHÔNG** sử dụng cấu trúc Ma trận tiện ích (Utility Matrix) hay Lọc cộng tác (Collaborative Filtering). Nó giải quyết bài toán gợi ý hoàn toàn dựa trên dữ liệu dạng quan hệ (Relational DataFrame) và phân tích đặc trưng của từng người dùng độc lập.

### 1.1. Các thành phần và khái niệm áp dụng

1. **Content-Based Filtering (Đề xuất dựa trên nội dung):**
   - **Lý thuyết:** Hệ thống gợi ý các vật phẩm (items) mới có nội dung hoặc thuộc tính tương đồng với những vật phẩm mà người dùng đã thích trong quá khứ.
   - **Áp dụng:** Bộ phim (Item) được biểu diễn thông qua các thuộc tính nội dung (Item Attributes) bao gồm Thể loại (`genres`), Đạo diễn (`director`), và Diễn viên (`cast`). Thuật toán đối chiếu các thuộc tính này với sở thích của người dùng để đưa ra đề xuất.

2. **User Profiling (Xây dựng hồ sơ người dùng):**
   - **Lý thuyết:** Là quá trình phân tích hành vi của người dùng để phác họa ra một "Hồ sơ sở thích" (Feature Vector) đại diện cho họ.
   - **Áp dụng:** Hệ thống phân tích Tín hiệu ngầm (Implicit Feedback - tức là hành vi mua vé, lưu trong `df_history`). Bằng phương pháp Phân tích tần suất (Frequency Analysis) thông qua hàm `value_counts()` của Pandas, thuật toán trích xuất ra được "Gu 1", "Gu 2" và tập hợp "Nhân sự yêu thích" (`favorite_people`).

3. **Rule-Based Heuristic Scoring (Chấm điểm Heuristic theo luật):**
   - **Lý thuyết:** Sử dụng các tập luật `if-else` được định nghĩa sẵn thay vì dùng Machine Learning để máy tính tự học trọng số. Giải pháp này giúp hệ thống hoạt động nhẹ nhàng, không tốn tài nguyên huấn luyện (Training computation).
   - **Áp dụng:** Điểm phù hợp (Match Score) được tính dựa trên hệ số trọng số Heuristic:
     - Trọng số cao nhất (+50 điểm) nếu phim mới khớp Gu 1.
     - Trọng số trung bình (+30 điểm) nếu phim mới khớp Gu 2.
     - Trọng số phụ (+20 điểm) nếu có sự xuất hiện của nhân sự yêu thích.
   - **Đặc trưng:** Rất dễ bảo trì và mang tính Explainable AI cao (Biết chính xác vì sao một bộ phim lại được gợi ý cho người dùng đó).

### 1.2. Đối chiếu thực tế Code với Lý thuyết chuẩn

Theo tài liệu hàn lâm, thuật toán Content-Based gồm 2 bước chính. Thuật toán trong code đã tuân thủ hoàn toàn tư tưởng này nhưng xử lý theo hướng tối ưu bằng tập hợp (Set/Categorical) thay vì tính toán Vector đại số phức tạp:

1. **Bước 1: Biểu diễn Items (Item Profile)**
   - **Lý thuyết:** Biểu diễn phim thành Vector các con số (vd: One-Hot Encoding).
   - **Thực tế trong code:** Biểu diễn trực quan phim qua các thuộc tính phân loại (Categorical Data) gồm Thể loại (`genres`), Đạo diễn (`director`), Diễn viên (`cast`).
2. **Bước 2: Học mô hình của mỗi User (User Profile)**
   - **Lý thuyết:** Dùng Machine Learning học ra Vector Trọng số (Weight Vector).
   - **Thực tế trong code:** Dùng hàm `value_counts()` để "học" lịch sử xem phim, từ đó trích xuất ra một Hồ sơ User rất trực quan (`gu_1`, `gu_2`, `favorite_people`).
3. **Quá trình Đánh giá (Matching / Scoring)**
   - **Lý thuyết:** Tính tích vô hướng (Dot Product) hoặc độ tương đồng Cosine giữa Vector User và Vector Item.
   - **Thực tế trong code:** Đối chiếu chéo Hồ sơ User với Item Profile bằng hàm `calculate_score` (Cộng điểm Heuristic bằng lệnh if-else: +50, +30, +20).

### 1.3. Ưu điểm và Nhược điểm

- **Ưu điểm vượt trội:**
  - **Không phụ thuộc người dùng khác:** Hệ thống chỉ cần biết lịch sử của chính user đó. Phù hợp cho hệ thống mới khởi chạy, khi lượng tương tác chéo giữa các user chưa nhiều.
  - **Cold-start thân thiện:** Người dùng mới chỉ cần mua 1-2 vé (không cần đợi họ viết Review) là hệ thống đã có đủ Data để phân tích "Gu" và đưa ra gợi ý hợp lý ngay lập tức.
- **Nhược điểm:**
  - **Bong bóng sở thích (Filter Bubble):** Hệ thống sẽ có xu hướng chỉ gợi ý lặp lại những thể loại người dùng đã xem. (Ví dụ: Ai hay xem phim Hài sẽ mãi mãi được gợi ý phim Hài, khó có cơ hội được hệ thống "vô tình" giới thiệu một bộ phim Kinh dị cực kỳ xuất sắc).

### 1.4. Tài liệu tham khảo (References)

- **Tài liệu chuẩn từ Google (Machine Learning Crash Course):** [Content-based Filtering Basics](https://developers.google.com/machine-learning/recommendation/content-based/basics)
- **Tài liệu phân tích chuyên sâu (Tiếng Việt):** [Tìm hiểu về Content-based Recommendation System](https://viblo.asia/p/recommendation-system-he-thong-goi-y-content-based-recommendation-phan-2-XL6lAMwO5ek)

---

## 2. Flow Tổng quan

1. **Truy xuất dữ liệu (Extract):** Tải toàn bộ dữ liệu từ MongoDB (Bảng Booking, Showtime, Movie, Review, User).
2. **Tiền xử lý (Pre-process):** Chuyển đổi các `ObjectId` thành chuỗi (`string`) để Pandas có thể so sánh và gộp bảng. Chuyển đổi List Dict thành Pandas DataFrame.
3. **Gộp dữ liệu (Join/Merge):** Tạo ra một bảng siêu dữ liệu (`df_history`) chứa toàn bộ lịch sử xem phim và đánh giá của tất cả người dùng.
4. **Phân tích User (User Profiling):** Duyệt qua từng người dùng, lọc ra lịch sử cá nhân của họ.
5. **Định hình "Gu" (Frequency Analysis):** Thống kê tần suất để tìm ra Thể loại (Genres) xem nhiều nhất, Đạo diễn/Diễn viên yêu thích nhất.
6. **Chấm điểm Phim (Weighted Scoring):** Tính điểm phù hợp (Match Score) cho những bộ phim đang chiếu mà người dùng chưa xem.
7. **Xếp hạng & Đề xuất (Ranking):** Lấy Top 3 phim có điểm cao nhất lưu vào DB (`UserRecommendation`).

---

## 3. Minh họa quá trình gộp dữ liệu (`df_history`)

Giả sử chúng ta có các dữ liệu gốc (Raw Data) như sau đối với người dùng `user@gmail.com`:

**Bảng `df_bookings` (Vé):**
| email | showtimeId |
| :--- | :--- |
| user@gmail.com | ST_01 |
| user@gmail.com | ST_02 |
| user@gmail.com | ST_03 |

**Bảng `df_showtimes` (Lịch chiếu):**
| \_id (showtimeId) | movieId |
| :--- | :--- |
| ST_01 | M_01 |
| ST_02 | M_02 |
| ST_03 | M_03 |

**Bảng `df_all_movies` (Phim):**
| \_id (movieId) | genres | director | cast |
| :--- | :--- | :--- | :--- |
| M_01 | Hành động, Hài | Trấn Thành | Trấn Thành, Tuấn Trần |
| M_02 | Tình cảm, Tâm lý | Victor Vũ | Miu Lê, Karik |
| M_03 | Hành động, Viễn tưởng | Lý Hải | Lý Hải, Tiết Cương |

**Bảng `df_reviews` (Đánh giá):**
| email | movieId | rating |
| :--- | :--- | :--- |
| user@gmail.com | M_01 | 5 |
| user@gmail.com | M_03 | 4 |

_(Phim M_02 chưa được đánh giá)_

---

### Bước 3.1: Lần Merge 1 (Vé + Lịch chiếu)

```python
df_history = pd.merge(df_bookings, df_showtimes, on="showtimeId")
```

Pandas tìm các dòng có cùng `showtimeId` ở 2 bảng để ghép lại. Bảng kết quả `df_history` (tạm thời) sẽ là:

| email          | showtimeId | movieId |
| :------------- | :--------- | :------ |
| user@gmail.com | ST_01      | M_01    |
| user@gmail.com | ST_02      | M_02    |
| user@gmail.com | ST_03      | M_03    |

### Bước 3.2: Lần Merge 2 (Kết quả trên + Phim)

```python
df_history = pd.merge(df_history, df_all_movies, left_on="movieId", right_on="_id")
```

Pandas ghép bảng lịch sử ở Bước 3.1 với bảng `df_all_movies`. Do tên cột khác nhau nên dùng `left_on="movieId"` (cột bảng trái) và `right_on="_id"` (cột bảng phải). Kết quả:

| email          | showtimeId | movieId | genres                | director   | cast                  |
| :------------- | :--------- | :------ | :-------------------- | :--------- | :-------------------- |
| user@gmail.com | ST_01      | M_01    | Hành động, Hài        | Trấn Thành | Trấn Thành, Tuấn Trần |
| user@gmail.com | ST_02      | M_02    | Tình cảm, Tâm lý      | Victor Vũ  | Miu Lê, Karik         |
| user@gmail.com | ST_03      | M_03    | Hành động, Viễn tưởng | Lý Hải     | Lý Hải, Tiết Cương    |

### Bước 3.3: Lần Merge 3 (Kết quả trên + Đánh giá)

```python
df_history = pd.merge(df_history, df_reviews, on=["email", "movieId"], how="left")
```

Pandas ghép thêm điểm số từ bảng `df_reviews`. Sử dụng `how="left"` để giữ lại lịch sử mua vé ngay cả khi người dùng không đánh giá. Kết quả bảng `df_history` cuối cùng:

| email          | showtimeId | movieId | genres                | director   | cast                  | rating |
| :------------- | :--------- | :------ | :-------------------- | :--------- | :-------------------- | :----- |
| user@gmail.com | ST_01      | M_01    | Hành động, Hài        | Trấn Thành | Trấn Thành, Tuấn Trần | 5.0    |
| user@gmail.com | ST_02      | M_02    | Tình cảm, Tâm lý      | Victor Vũ  | Miu Lê, Karik         | NaN    |
| user@gmail.com | ST_03      | M_03    | Hành động, Viễn tưởng | Lý Hải     | Lý Hải, Tiết Cương    | 4.0    |

> [!NOTE]
> Cột rating của M_02 mang giá trị `NaN` do lệnh gộp dùng `how="left"`. Việc này giúp **không làm mất** đi lịch sử mua vé của người dùng, ngay cả khi họ chưa viết review.

---

## 4. Minh họa tính toán "Gu" và Điểm Đề Xuất (Match Score)

Tiếp tục với dữ liệu `df_history` của người dùng `user@gmail.com` ở trên.

### Bước 4.1: Tìm "Gu" phim

- **Lọc lịch sử hợp lệ:** Mã nguồn chỉ lấy các phim có `rating >= 3` hoặc `NaN` (chưa đánh giá). Ở đây cả 3 phim (M_01, M_02, M_03) đều hợp lệ.
- **Thống kê Thể loại:** Bóc tách cột `genres`, hệ thống thu được tần suất vượt trội:
  - **Hành động: 2** (xuất hiện ở M_01 và M_03)
  - Hài: 1
  - Tình cảm: 1
  - Tâm lý: 1
  - Viễn tưởng: 1
    _(Pandas sẽ xếp hạng ưu tiên rõ ràng: `gu_1 = Hành động` và `gu_2 = Hài` hoặc 1 thể loại đồng hạng khác tùy thứ tự xuất hiện)_
- **Thống kê Nhân sự (`favorite_people`):** Thu thập toàn bộ đạo diễn và diễn viên đã xem.
  -> `[Trấn Thành, Tuấn Trần, Victor Vũ, Miu Lê, Karik, Lý Hải, Tiết Cương]`

### Bước 4.2: Chấm điểm (Scoring) Phim Đang Chiếu

Giả sử ngoài rạp đang chiếu bộ phim **M_04** mà user chưa xem:

- Phim M_04: Thể loại `[Hành động, Gia đình]`, Đạo diễn `Lý Hải`, Diễn viên `Khả Như`.

Hệ thống sẽ tính điểm cho M_04 dựa trên Gu của `user@gmail.com` như sau:

1. Phim có `gu_1` (Hành động) không? -> **Có (+50đ)**
2. Phim có `gu_2` (Hài) không? -> Không (0đ)
3. Phim có nhân sự yêu thích không? -> **Có** (Lý Hải nằm trong tập `favorite_people`) -> **(+20đ)**
4. Cộng điểm nhiễu để tránh trùng lặp điểm số tuyệt đối (Random 0 đến 5) -> _(Ví dụ Random ra 2.5đ)_

**=> Tổng điểm (Match Score) của M_04:** `50 + 20 + 2.5 = 72.5 / 100`

### Bước 4.3: Xếp hạng

Phim M_04 (với `72.5đ`) sẽ được đưa vào danh sách ứng viên và đem đi so sánh với các phim đang chiếu khác. Nếu lọt Top 3 điểm cao nhất, nó sẽ được thêm vào Collection `UserRecommendation` làm đề xuất cuối cùng cho `user@gmail.com`.
