import sys
import os
import json
import warnings

# Ẩn toàn bộ các cảnh báo (Warning) từ thư viện bên thứ 3 (như PyMongo/Cryptography)
warnings.filterwarnings("ignore")

# Thêm đường dẫn thư mục gốc để import được thư mục core
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.database import DatabaseManager

def export_data():
    print("=========================================================")
    print("      TRÍCH XUẤT DỮ LIỆU TỪ MONGODB CHO BENCHMARK        ")
    print("=========================================================")
    
    db_manager = DatabaseManager()
    db = db_manager.db

    # Lấy dữ liệu Phim
    raw_movies = list(db["Movie"].find({"isShowing": True}, {"_id": 1, "title_vi": 1, "genres": 1, "director": 1, "cast": 1}))
    processed_movies = []
    
    for m in raw_movies:
        movie_id = str(m.get("_id", ""))
        genres = " ".join(m.get("genres", [])) if isinstance(m.get("genres"), list) else ""
        director = m.get("director", "") or ""
        cast = m.get("cast", "") or ""
        
        processed_movies.append({
            "_id": movie_id,
            "title": m.get("title_vi", "Unknown"),
            "content": f"{genres} {director} {cast}",
            "genres": m.get("genres", []),
            "director": director,
            "cast": cast
        })

    # Lấy dữ liệu Đánh giá (Ratings)
    raw_reviews = list(db["Review"].find({}, {"_id": 0, "email": 1, "movieId": 1, "rating": 1}))
    processed_reviews = []
    
    for r in raw_reviews:
        processed_reviews.append({
            "userId": r.get("email", "unknown"),
            "movieId": str(r.get("movieId", "")),
            "rating": r.get("rating", 0)
        })

    # Lấy dữ liệu Đặt vé (Bookings) để biết chính xác lịch sử xem phim
    raw_showtimes = list(db["Showtime"].find({}, {"_id": 1, "movieId": 1}))
    showtime_map = {str(s.get("_id")): str(s.get("movieId", "")) for s in raw_showtimes}

    raw_bookings = list(db["Booking"].find({"paymentStatus": "Success"}, {"_id": 0, "email": 1, "showtimeId": 1}))
    processed_bookings = []

    for b in raw_bookings:
        s_id = str(b.get("showtimeId", ""))
        m_id = showtime_map.get(s_id)
        if m_id:
            processed_bookings.append({
                "userId": b.get("email", "unknown"),
                "movieId": m_id
            })

    # Đóng gói thành 1 cục JSON duy nhất
    export_json = {
        "movies": processed_movies,
        "ratings": processed_reviews,
        "bookings": processed_bookings
    }

    # Cùng lưu tại thư mục benchmark
    export_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'db_data.json')
    
    with open(export_path, 'w', encoding='utf-8') as f:
        json.dump(export_json, f, ensure_ascii=False, indent=4)
        
    print(f" -> Lấy thành công {len(processed_movies)} phim, {len(processed_reviews)} lượt đánh giá và {len(processed_bookings)} lượt đặt vé.")
    print(f" -> Đã lưu toàn bộ dữ liệu vào file: {export_path}")
    print("=========================================================\n")

if __name__ == "__main__":
    export_data()
