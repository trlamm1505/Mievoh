import pandas as pd
import random
from datetime import datetime
from bson import ObjectId

class PandasRecommendationService:
    """Class chịu trách nhiệm chạy thuật toán Data Analytics bằng Pandas"""
    def __init__(self, db_manager, rabbit_client):
        self.db = db_manager.db
        self.rabbit = rabbit_client

    def process_logic(self, user_id="system"):
        print("\n[Pandas] Bắt đầu chạy thuật toán phân tích dữ liệu...")
        self.rabbit.send_progress(10, user_id)
        
        # load data từ MongoDB
        print("[Pandas] Đang tải dữ liệu từ Database...")
        bookings = list(self.db["Booking"].find({}, {"_id": 0, "email": 1, "showtimeId": 1}))
        showtimes = list(self.db["Showtime"].find({}, {"_id": 1, "movieId": 1}))
        movies = list(self.db["Movie"].find({"isShowing": True}, {"_id": 1, "genres": 1, "director": 1, "cast": 1, "isHot": 1}))
        all_movies = list(self.db["Movie"].find({}, {"_id": 1, "genres": 1, "director": 1, "cast": 1}))
        reviews = list(self.db["Review"].find({}, {"_id": 0, "email": 1, "movieId": 1, "rating": 1}))

        # xử lý ObjectId thành chuỗi để Pandas dễ merge
        for m in movies: m["_id"] = str(m.get("_id", ""))
        for m in all_movies: m["_id"] = str(m.get("_id", ""))
        for s in showtimes: 
            s["showtimeId"] = str(s.get("_id", ""))
            s["movieId"] = str(s.get("movieId", ""))
        for b in bookings: 
            b["showtimeId"] = str(b.get("showtimeId", ""))
        for r in reviews:
            r["movieId"] = str(r.get("movieId", ""))

        df_bookings = pd.DataFrame(bookings)
        df_showtimes = pd.DataFrame(showtimes)
        df_all_movies = pd.DataFrame(all_movies)
        df_active_movies = pd.DataFrame(movies)
        df_reviews = pd.DataFrame(reviews)

        self.rabbit.send_progress(30, user_id)

        users = list(self.db["User"].find({"userType": {"$regex": "^user$", "$options": "i"}}, {"_id": 1}))
        new_recs = []
        
        # merge thành df_history (Join 3 bảng)
        if not df_bookings.empty and not df_showtimes.empty:
            # kết nối bảng Booking Showtime dựa trên cột chung "showtimeId" để biết user đã xem movieId nào (merge data lần 1)
            df_history = pd.merge(df_bookings, df_showtimes, on="showtimeId")
            # nối tiếp data ở trên với bảng Phim Movie để lấy thông tin chi tiết (thể loại, đạo diễn, diễn viên) của phim đó  (merge data lần 2)
            # Do tên cột khác nhau nên dùng left_on="movieId" (cột bảng trái) và right_on="_id" (cột bảng phải)
            df_history = pd.merge(df_history, df_all_movies, left_on="movieId", right_on="_id")
            # merge dữ liệu Review
            if not df_reviews.empty:
                # nối tiếp data ở trên với bảng Review, sử dụng on=["email", "movieId"] để lấy đúng review của đúng user dành cho đúng phim đó
                # how="left" để giữ lại lịch sử mua vé ngay cả khi người dùng chưa review, và cột rating có giá trị NaN
                df_history = pd.merge(df_history, df_reviews, on=["email", "movieId"], how="left")
            else:
                # nếu không có dữ liệu trong df_reviews thì tạo cột rating với giá trị NaN
                df_history["rating"] = pd.NA
        else:
            # nếu không có dữ liệu trong df_bookings hoặc df_showtimes thì tạo dataframe rỗng
            df_history = pd.DataFrame()

        self.rabbit.send_progress(50, user_id)
        print("[Pandas] Đang tính toán điểm trọng số cho từng User...")
        
        # Chạy thuật toán cho từng user
        for user in users:
            email = user.get("_id")
            if not email: continue

            # Lọc trong bảng dữ liệu tổng (df_history) để lấy ra đúng những dòng lịch sử xem phim của user đang xét (dựa vào email).
            # Safety check: Nếu bảng tổng df_history rỗng (do DB chưa có vé nào) thì gán bằng DataFrame rỗng để tránh lỗi.
            user_hist = df_history[df_history["email"] == email] if not df_history.empty else pd.DataFrame()
            
            # Yêu cầu: Bắt buộc phải có lịch sử mua vé mới phân tích
            if user_hist.empty:
                continue
            
            seen_movie_ids = set()
            gu_1 = None
            gu_2 = None
            favorite_people = set()

            # gom nhóm và Thống kê tần suất (Frequency Analysis)
            seen_movie_ids = set(user_hist["movieId"].tolist())
            
            # Bước 1.1: Lọc dữ liệu Positive Feedback (Phản hồi tích cực)
            # Chỉ lấy những phim người dùng ĐÃ MUA VÉ nhưng CHƯA ĐÁNH GIÁ (rating.isna()) 
            # HOẶC đã đánh giá tốt (rating >= 3). 
            # Loại bỏ hoàn toàn những phim bị chấm 1-2 sao để thuật toán không học sai "Gu".
            # Lệnh IF này là một chốt chặn an toàn (Safety Check) cực kỳ quan trọng:
            if "rating" in user_hist.columns:
                good_hist = user_hist[(user_hist["rating"].isna()) | (user_hist["rating"] >= 3)]
            else:
                # ELSE chạy khi: Toàn bộ hệ thống chưa có BẤT KỲ một dòng review nào (bảng df_reviews trống trơn).
                # Dẫn đến việc lệnh Merge không sinh ra được cột "rating" trong bảng df_history. 
                # Nếu không có IF mà cố tình gọi user_hist["rating"] thì Code sẽ văng lỗi KeyError (Không tìm thấy cột) và sập server.
                # Do đó, nếu không có cột rating, ta đành mặc định lấy toàn bộ lịch sử mua vé làm Gu phim luôn (không lọc được phim dở nữa).
                good_hist = user_hist
            
            # Bước 1.2: Trích xuất User Profile (Hồ sơ người dùng) - Tìm Thể loại yêu thích (Gu phim)
            # Hàm explode(): Biến cột chứa mảng (vd: ["Hành động", "Hài"]) thành nhiều dòng (Hành động \n Hài) để dễ đếm
            # Hàm dropna(): Loại bỏ các giá trị rỗng (Null/NaN)
            all_genres = good_hist["genres"].explode().dropna()
            
            if not all_genres.empty:
                # Hàm value_counts(): Đếm tần suất xuất hiện của từng thể loại và tự động sắp xếp giảm dần (từ nhiều nhất -> ít nhất)
                # Hàm index.tolist(): Lấy tên các thể loại đã được sắp xếp đó đưa vào một mảng List (vd: ['Hành động', 'Tình cảm'])
                top_genres = all_genres.value_counts().index.tolist()
                
                # Lấy ra Top 1 (gu_1) và Top 2 (gu_2) từ mảng. 
                # Có dùng hàm kiểm tra độ dài mảng (len) để tránh lỗi văng app (Index Out of Bounds) nếu user mới xem 1 phim.
                gu_1 = top_genres[0] if len(top_genres) > 0 else None
                gu_2 = top_genres[1] if len(top_genres) > 1 else None

            # Bước 1.3: Phân tích Đạo diễn / diễn viên yêu thích (Favorite People)
            # Dữ liệu gốc là chuỗi cách nhau dấu phẩy (vd: "Trấn Thành, Tuấn Trần"). Ta split(",") để cắt ra.
            # Dùng Cấu trúc dữ liệu Set (tập hợp) cho biến favorite_people để tự động loại bỏ các tên bị trùng lặp.
            directors = good_hist["director"].dropna().tolist()
            casts = good_hist["cast"].dropna().tolist()
            for d in directors: 
                favorite_people.update([x.strip() for x in d.split(",")])
            for c in casts: 
                favorite_people.update([x.strip() for x in c.split(",")])

            # Safety check: Bỏ qua (chuyển sang user khác) nếu rạp hiện tại không chiếu bộ phim nào
            if df_active_movies.empty:
                continue

            # Bước 2.1: Chuẩn bị Danh sách Ứng viên (Candidate Generation)
            # Toán tử ngã (~) có nghĩa là NOT. Lệnh này lọc ra những phim đang chiếu mà user CHƯA xem.
            df_unseen = df_active_movies[~df_active_movies["_id"].isin(seen_movie_ids)].copy()
            
            if df_unseen.empty:
                continue

            # Bước 2.2: Chấm điểm Phim đang chiếu (Rule-Based Heuristic Scoring)
            # Hàm này sẽ được "áp (apply)" lên từng dòng (từng bộ phim) trong bảng df_unseen
            def calculate_score(row):
                score = 0
                
                m_genres = row.get("genres", [])
                m_director = row.get("director", "")
                m_cast = row.get("cast", "")
                
                # Đối chiếu Thể loại (Item Profile) với Hồ sơ User (gu_1, gu_2)
                # Dùng Luật if-else kinh nghiệm (Heuristic Rule) để cộng điểm thay vì dùng Machine Learning.
                if gu_1 and gu_1 in m_genres: score += 50
                if gu_2 and gu_2 in m_genres: score += 30
                
                # Đối chiếu Con người (Item Attributes vs favorite_people)
                people = []
                if isinstance(m_director, str): people.extend([x.strip() for x in m_director.split(",")])
                if isinstance(m_cast, str): people.extend([x.strip() for x in m_cast.split(",")])
                # Hàm any() sẽ trả về True nếu có MỘT người bất kỳ trong phim trùng với tập yêu thích
                if any(p in favorite_people for p in people if p):
                    score += 20
                    
                # Cộng điểm nhiễu (Random từ 0 đến 5)
                # Tác dụng: Chống trùng điểm. Nếu có 10 phim cùng được 80 điểm thì sẽ Random ra 81.2, 83.5 để có thể xếp hạng 1-2-3 dễ dàng.
                score += random.uniform(0, 5)
                # Điểm tối đa chỉ cho phép là 100
                return min(score, 100)

            # Lệnh apply của Pandas: Duyệt siêu tốc (Vectorized/C-level) qua tất cả các dòng thay vì dùng vòng lặp for truyền thống
            df_unseen["matchScore"] = df_unseen.apply(calculate_score, axis=1)
            
            # Bước 3: Xếp hạng và Đề xuất (Ranking)
            # sort_values: Sắp xếp giảm dần (ascending=False) theo cột matchScore.
            # head(3): Lấy Top 3 bộ phim cao điểm nhất để gửi email.
            df_unseen = df_unseen.sort_values(by="matchScore", ascending=False).head(3)

            # Đóng gói kết quả của user hiện tại vào mảng chung new_recs để lát ghi xuống Database
            for _, row in df_unseen.iterrows():
                new_recs.append({
                    "email": email,
                    "movieId": ObjectId(row["_id"]),
                    "matchScore": round(row["matchScore"], 1),
                    "isEmailSent": False,
                    "createdAt": datetime.utcnow()
                })

        self.rabbit.send_progress(80, user_id)

        # Xóa dữ liệu gợi ý cũ và ghi dữ liệu mới
        print(f"[Pandas] Đang ghi {len(new_recs)} kết quả phân tích xuống Database...")
        self.db["UserRecommendation"].delete_many({})
        if new_recs:
            self.db["UserRecommendation"].insert_many(new_recs)

        self.rabbit.send_progress(100, user_id)
        print("[Pandas] Hoàn tất quá trình phân tích và lưu DB!\n")
