import time
import json
import pandas as pd
import sys
import os
import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import matplotlib.pyplot as plt


print("=========================================================")
print("          KIỂM THỬ VÀ ĐỐI CHIẾU CÁC THUẬT TOÁN           ")
print("=========================================================")

# ---------------------------------------------------------
# 0. NẠP DỮ LIỆU TỪ FILE JSON
# ---------------------------------------------------------
data_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'db_data.json')

if not os.path.exists(data_file_path):
    print(f"LỖI: Không tìm thấy file {data_file_path}")
    print("Vui lòng chạy file 'export_data.py' trước để lấy dữ liệu từ DB!")
    sys.exit()

with open(data_file_path, 'r', encoding='utf-8') as f:
    db_data = json.load(f)

df_movies = pd.DataFrame(db_data['movies'])
df_ratings = pd.DataFrame(db_data['ratings'])
df_bookings = pd.DataFrame(db_data.get('bookings', []))

if df_movies.empty:
    print("LỖI: Bảng Phim trống. Không thể chạy Benchmark!")
    sys.exit()

# ---------------------------------------------------------
# 0.5. EXPLORATORY DATA ANALYSIS (EDA) - Phân tích dữ liệu nền
# ---------------------------------------------------------
print("=========================================================")
print("          EXPLORATORY DATA ANALYSIS (EDA)                ")
print("=========================================================")
print(f" -> TỔNG QUAN: Nạp thành công {len(df_movies)} phim, {len(df_ratings)} lượt đánh giá và {len(df_bookings)} lượt mua vé.\n")

if 'genres' in df_movies.columns:
    all_system_genres = df_movies['genres'].explode().dropna()
    top_genres = all_system_genres.value_counts().head(5)
    print("[EDA] Top 5 Thể loại phim xuất hiện nhiều nhất trong DB:")
    for g, count in top_genres.items():
        print(f"      - {g}: {count} phim")
    print("")

    # Vẽ biểu đồ Genres
    plt.figure(figsize=(8, 5))
    top_genres.sort_values().plot(kind='barh', color='skyblue')
    plt.title('Top 5 Thể loại phim phổ biến nhất')
    plt.xlabel('Số lượng phim')
    plt.tight_layout()
    base_img_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'result', 'images')
    dir_eda = os.path.join(base_img_dir, '1_eda')
    dir_profiling = os.path.join(base_img_dir, '2_profiling')
    dir_comparison = os.path.join(base_img_dir, '3_comparison')
    os.makedirs(dir_eda, exist_ok=True)
    os.makedirs(dir_profiling, exist_ok=True)
    os.makedirs(dir_comparison, exist_ok=True)
    plt.savefig(os.path.join(dir_eda, 'eda_top_genres.png'))
    plt.close()

if 'director' in df_movies.columns:
    top_directors = df_movies['director'].str.split(',').explode().str.strip().dropna().value_counts()
    top_directors = top_directors[top_directors.index != ""].head(5)
    if not top_directors.empty:
        print("[EDA] Top 5 Đạo diễn có nhiều tác phẩm nhất trong DB:")
        for d, count in top_directors.items():
            print(f"      - {d}: {count} phim")
        print("")
        
        # Vẽ biểu đồ Directors
        plt.figure(figsize=(8, 5))
        top_directors.sort_values().plot(kind='barh', color='lightgreen')
        plt.title('Top 5 Đạo diễn có nhiều tác phẩm nhất')
        plt.xlabel('Số lượng phim')
        plt.tight_layout()
        plt.savefig(os.path.join(dir_eda, 'eda_top_directors.png'))
        plt.close()

if 'cast' in df_movies.columns:
    top_cast = df_movies['cast'].str.split(',').explode().str.strip().dropna().value_counts()
    top_cast = top_cast[top_cast.index != ""].head(5)
    if not top_cast.empty:
        print("[EDA] Top 5 Diễn viên có nhiều tác phẩm nhất trong DB:")
        for c, count in top_cast.items():
            print(f"      - {c}: {count} phim")
        print("")
        
        # Vẽ biểu đồ Cast
        plt.figure(figsize=(8, 5))
        top_cast.sort_values().plot(kind='barh', color='salmon')
        plt.title('Top 5 Diễn viên có nhiều tác phẩm nhất')
        plt.xlabel('Số lượng phim')
        plt.tight_layout()
        plt.savefig(os.path.join(dir_eda, 'eda_top_cast.png'))
        plt.close()

print("=========================================================\n")

# Tạo thư mục result nếu chưa có
result_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'result', 'json')
os.makedirs(result_dir, exist_ok=True)

# ---------------------------------------------------------
# 1. XÁC ĐỊNH USER VÀ PHÂN TÍCH GU PHIM
# ---------------------------------------------------------
if not df_bookings.empty:
    user_to_predict = df_bookings['userId'].value_counts().idxmax()
elif not df_ratings.empty:
    user_to_predict = df_ratings['userId'].value_counts().idxmax()
else:
    user_to_predict = "system"
print(f" -> Đang chạy kiểm thử chung cho User: {user_to_predict}")

user_history = df_ratings[df_ratings['userId'] == user_to_predict]
user_bookings = df_bookings[df_bookings['userId'] == user_to_predict] if not df_bookings.empty else pd.DataFrame()

rated_ids = user_history['movieId'].tolist()
booked_ids = user_bookings['movieId'].tolist() if not user_bookings.empty else []
watched_movie_ids = list(set(rated_ids + booked_ids))

# Lọc Gu phim: Loại bỏ những phim bị đánh giá xấu (< 3 sao)
disliked_ids = user_history[user_history['rating'] < 3]['movieId'].tolist()
liked_movies_ids = [m for m in watched_movie_ids if m not in disliked_ids]

liked_movies = df_movies[df_movies['_id'].isin(liked_movies_ids)]

print(f" -> Lịch sử xem phim của User ({len(watched_movie_ids)} phim):")
watched_movies_df = df_movies[df_movies['_id'].isin(watched_movie_ids)]
for _, row in watched_movies_df.iterrows():
    rating_row = user_history[user_history['movieId'] == row['_id']]
    if not rating_row.empty:
        rating_val = f"{rating_row['rating'].iloc[0]} sao"
    else:
        rating_val = "Chỉ mua vé, không đánh giá"
    print(f"    - [{rating_val}] {row['title']}")
print("")

all_genres = liked_movies['genres'].explode().dropna()
genre_counts = all_genres.value_counts()
gu_1 = genre_counts.index[0] if len(genre_counts) > 0 else "Action"
gu_1_count = genre_counts.iloc[0] if len(genre_counts) > 0 else 0
gu_2 = genre_counts.index[1] if len(genre_counts) > 1 else "Horror"
gu_2_count = genre_counts.iloc[1] if len(genre_counts) > 1 else 0

# Trích xuất toàn bộ Đạo diễn và Diễn viên yêu thích vào danh sách để đếm tần suất
people_list = []
directors = liked_movies.get("director", pd.Series()).dropna().tolist()
casts = liked_movies.get("cast", pd.Series()).dropna().tolist()
for d in directors: 
    people_list.extend([x.strip() for x in d.split(",") if x.strip()])
for c in casts: 
    people_list.extend([x.strip() for x in c.split(",") if x.strip()])

favorite_people = set(people_list)
people_counts = pd.Series(people_list).value_counts().head(5)

print(f" -> Phân tích lịch sử của User:")
print(f"    + Thích thể loại    : '{gu_1}' (xem {gu_1_count} lần), '{gu_2}' (xem {gu_2_count} lần)")

# In danh sách diễn viên / đạo diễn (tối đa hiển thị cho đỡ rối mắt)
people_str = ", ".join(list(favorite_people))
print(f"    + Danh sách Đạo diễn/Diễn viên yêu thích: {people_str}")
print("\n")

# Vẽ biểu đồ Gu Thể loại của User
if not genre_counts.empty:
    plt.figure(figsize=(6, 6))
    genre_counts.plot(kind='pie', autopct='%1.1f%%', startangle=90, colors=plt.cm.Paired.colors)
    plt.title(f'Phân bổ Gu Thể loại của User:\n{user_to_predict}')
    plt.ylabel('')
    plt.tight_layout()
    plt.savefig(os.path.join(dir_profiling, 'user_preferred_genres.png'))
    plt.close()

# Vẽ biểu đồ Nhân sự yêu thích của User
if not people_counts.empty:
    plt.figure(figsize=(8, 4))
    people_counts.sort_values().plot(kind='barh', color='orange')
    plt.title(f'Top Nhân sự (Đạo diễn/Diễn viên) yêu thích của User:\n{user_to_predict}')
    plt.xlabel('Số lần xem')
    plt.tight_layout()
    plt.savefig(os.path.join(dir_profiling, 'user_preferred_people.png'))
    plt.close()

# Bảng theo dõi thời gian
time_records = {}

# ---------------------------------------------------------
# THUẬT TOÁN 1: TF-IDF + Cosine Similarity
# ---------------------------------------------------------
print("[1] Đang chạy thuật toán TF-IDF (Content-Based ML)...")
start_time = time.perf_counter()

tfidf = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf.fit_transform(df_movies['content'])

liked_indices = df_movies.index[df_movies['_id'].isin(liked_movies_ids)].tolist()
if liked_indices:
    user_profile_vector = tfidf_matrix[liked_indices].mean(axis=0)
    user_similarities = cosine_similarity(np.asarray(user_profile_vector), tfidf_matrix).flatten()
else:
    user_similarities = np.zeros(len(df_movies))

df_movies['tfidf_score'] = np.round(user_similarities * 100, 1)
# Loại bỏ các phim đã xem khỏi danh sách gợi ý
df_ranked_tfidf = df_movies[~df_movies['_id'].isin(watched_movie_ids)].sort_values(by="tfidf_score", ascending=False)

tfidf_time = time.perf_counter() - start_time
time_records["TF-IDF"] = tfidf_time

tfidf_output = []
for _, row in df_ranked_tfidf.iterrows():
    tfidf_output.append({
        "userId": user_to_predict,
        "_id": row['_id'],
        "title": row['title'],
        "genres": row.get('genres', []),
        "director": row.get('director', ''),
        "cast": row.get('cast', ''),
        "score": row['tfidf_score']
    })

tfidf_path = os.path.join(result_dir, 'tfidf_result.json')
with open(tfidf_path, 'w', encoding='utf-8') as f:
    json.dump(tfidf_output, f, ensure_ascii=False, indent=4)


# ---------------------------------------------------------
# THUẬT TOÁN 2: Pandas Heuristic (Thuật toán Dự án)
# ---------------------------------------------------------
print("[2] Đang chạy thuật toán Pandas Heuristic (Luật kinh nghiệm)...")
start_time = time.perf_counter()

import random

def heuristic_score(row):
    score = 0
    if isinstance(row.get("genres"), list):
        if gu_1 in row["genres"]: score += 50
        if gu_2 in row["genres"]: score += 30
        
    m_director = str(row.get("director", ""))
    m_cast = str(row.get("cast", ""))
    people = []
    if m_director: people.extend([x.strip() for x in m_director.split(",") if x.strip()])
    if m_cast: people.extend([x.strip() for x in m_cast.split(",") if x.strip()])
    
    if any(p in favorite_people for p in people if p):
        score += 20
        
    score += random.uniform(0, 5)
    return min(score, 100)

df_movies["score"] = df_movies.apply(heuristic_score, axis=1)
# Loại bỏ các phim đã xem khỏi danh sách gợi ý
df_ranked_pandas = df_movies[~df_movies['_id'].isin(watched_movie_ids)].sort_values(by="score", ascending=False)

pandas_time = time.perf_counter() - start_time
time_records["Pandas Heuristic"] = pandas_time

pandas_output = []
for _, row in df_ranked_pandas.iterrows():
    pandas_output.append({
        "userId": user_to_predict,
        "_id": row['_id'],
        "title": row['title'],
        "genres": row.get('genres', []),
        "director": row.get('director', ''),
        "cast": row.get('cast', ''),
        "score": row['score']
    })

pandas_path = os.path.join(result_dir, 'pandas_result.json')
with open(pandas_path, 'w', encoding='utf-8') as f:
    json.dump(pandas_output, f, ensure_ascii=False, indent=4)


# ---------------------------------------------------------
# 2.5. SO SÁNH ĐIỂM SỐ ĐẦU RA (SCORE ANALYSIS)
# ---------------------------------------------------------
if not df_ranked_pandas.empty and not df_ranked_tfidf.empty:
    top_n = min(20, len(df_ranked_pandas), len(df_ranked_tfidf))
    
    scores_pandas = df_ranked_pandas.head(top_n)['score'].tolist()
    scores_tfidf = df_ranked_tfidf.head(top_n)['tfidf_score'].tolist()
    
    plt.figure(figsize=(10, 6))
    plt.plot(range(1, top_n + 1), scores_pandas, marker='o', linestyle='-', color='#28a745', label='Pandas Heuristic', linewidth=2)
    plt.plot(range(1, top_n + 1), scores_tfidf, marker='s', linestyle='--', color='#dc3545', label='TF-IDF', linewidth=2)
    
    plt.title(f'So sánh Điểm số Top {top_n} Phim được đề xuất')
    plt.xlabel('Thứ hạng (Rank)')
    plt.ylabel('Điểm số (Score 0-100)')
    plt.xticks(range(1, top_n + 1))
    plt.legend()
    plt.grid(True, linestyle=':', alpha=0.7)
    plt.tight_layout()
    plt.savefig(os.path.join(dir_comparison, 'algo_score_comparison.png'))
    plt.close()


# ---------------------------------------------------------
# 2.6. SO SÁNH ĐỘ CHÍNH XÁC (GENRE MATCH ACCURACY)
# ---------------------------------------------------------
if not df_ranked_pandas.empty and not df_ranked_tfidf.empty:
    top_10_pandas = df_ranked_pandas.head(10)
    top_10_tfidf = df_ranked_tfidf.head(10)
    
    def count_match(df, target_genres):
        match_count = 0
        for _, row in df.iterrows():
            genres = row.get('genres', [])
            if isinstance(genres, list) and any(g in genres for g in target_genres):
                match_count += 1
        return match_count
        
    pandas_match = count_match(top_10_pandas, [gu_1, gu_2])
    tfidf_match = count_match(top_10_tfidf, [gu_1, gu_2])
    
    print("\n=========================================================")
    print("          ĐỘ BÁM SÁT THỂ LOẠI (TOP 10 GỢI Ý)             ")
    print("=========================================================")
    print(f" - Pandas Heuristic     : {pandas_match}/10 phim đúng Gu ({gu_1}, {gu_2})")
    print(f" - TF-IDF               : {tfidf_match}/10 phim đúng Gu ({gu_1}, {gu_2})")
    
    plt.figure(figsize=(7, 5))
    algos = ['Pandas Heuristic', 'TF-IDF']
    matches = [pandas_match, tfidf_match]
    
    bars = plt.bar(algos, matches, color=['#28a745', '#dc3545'], width=0.5)
    plt.title(f'Độ bám sát Thể loại trong Top 10\n(Gu: {gu_1}, {gu_2})')
    plt.ylabel('Số lượng phim đúng Gu (Max 10)')
    plt.ylim(0, 11)
    
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, yval + 0.2, f"{int(yval)}/10", ha='center', fontweight='bold')
        
    plt.tight_layout()
    plt.savefig(os.path.join(dir_comparison, 'algo_genre_accuracy.png'))
    plt.close()

# ---------------------------------------------------------
# 2.7. SO SÁNH ĐỘ CHÍNH XÁC NHÂN SỰ (PEOPLE MATCH ACCURACY)
# ---------------------------------------------------------
if not df_ranked_pandas.empty and not df_ranked_tfidf.empty and favorite_people:
    top_10_pandas = df_ranked_pandas.head(10)
    top_10_tfidf = df_ranked_tfidf.head(10)
    
    def count_people_match(df, fav_people):
        match_count = 0
        for _, row in df.iterrows():
            m_director = str(row.get("director", ""))
            m_cast = str(row.get("cast", ""))
            people = []
            if m_director: people.extend([x.strip() for x in m_director.split(",") if x.strip()])
            if m_cast: people.extend([x.strip() for x in m_cast.split(",") if x.strip()])
            
            if any(p in fav_people for p in people if p):
                match_count += 1
        return match_count
        
    pandas_p_match = count_people_match(top_10_pandas, favorite_people)
    tfidf_p_match = count_people_match(top_10_tfidf, favorite_people)
    
    print("\n=========================================================")
    print("          ĐỘ BÁM SÁT NHÂN SỰ (TOP 10 GỢI Ý)              ")
    print("=========================================================")
    print(f" - Pandas Heuristic     : {pandas_p_match}/10 phim chứa Đạo diễn/Diễn viên yêu thích")
    print(f" - TF-IDF               : {tfidf_p_match}/10 phim chứa Đạo diễn/Diễn viên yêu thích")
    
    plt.figure(figsize=(7, 5))
    algos = ['Pandas Heuristic', 'TF-IDF']
    p_matches = [pandas_p_match, tfidf_p_match]
    
    bars = plt.bar(algos, p_matches, color=['#28a745', '#dc3545'], width=0.5)
    plt.title('Độ bám sát Nhân sự (Đạo diễn/Diễn viên) trong Top 10')
    plt.ylabel('Số lượng phim đúng Gu (Max 10)')
    plt.ylim(0, 11)
    
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, yval + 0.2, f"{int(yval)}/10", ha='center', fontweight='bold')
        
    plt.tight_layout()
    plt.savefig(os.path.join(dir_comparison, 'algo_people_accuracy.png'))
    plt.close()

# ---------------------------------------------------------
# 2.8. SO SÁNH TOP 3 PHIM ĐẦU RA
# ---------------------------------------------------------
if not df_ranked_pandas.empty and not df_ranked_tfidf.empty:
    top3_pandas = df_ranked_pandas.head(3)
    top3_tfidf = df_ranked_tfidf.head(3)

    fig, axes = plt.subplots(1, 2, figsize=(14, 4))
    
    def truncate(text, length=30):
        return text[:length] + '...' if len(text) > length else text

    titles_pandas = [truncate(t) for t in top3_pandas['title'][::-1]]
    titles_tfidf = [truncate(t) for t in top3_tfidf['title'][::-1]]
    
    # Subplot 1: Pandas Heuristic
    axes[0].barh(range(3), top3_pandas['score'][::-1], color='#2E86C1', height=0.6, edgecolor='black', linewidth=1.2)
    axes[0].set_title('Top 3: Pandas Heuristic (0-100 điểm)', fontsize=13, fontweight='bold', pad=15)
    axes[0].set_xlim(0, 110)
    axes[0].set_yticks([])
    axes[0].grid(axis='x', linestyle='--', alpha=0.6)
    axes[0].spines['top'].set_visible(False)
    axes[0].spines['right'].set_visible(False)
    axes[0].spines['left'].set_visible(False)
    for index, (title, value) in enumerate(zip(titles_pandas, top3_pandas['score'][::-1])):
        axes[0].text(value + 2, index, f'{value:.1f}', va='center', fontweight='bold', color='#2E86C1', fontsize=11)
        axes[0].text(2, index, title, va='center', color='white', fontweight='bold', fontsize=11)
        
    # Subplot 2: TF-IDF
    axes[1].barh(range(3), top3_tfidf['tfidf_score'][::-1], color='#E74C3C', height=0.6, edgecolor='black', linewidth=1.2)
    axes[1].set_title('Top 3: TF-IDF (Cosine Similarity x 100)', fontsize=13, fontweight='bold', pad=15)
    max_tfidf = top3_tfidf['tfidf_score'].max()
    axes[1].set_xlim(0, max_tfidf + (max_tfidf * 0.2) if max_tfidf > 0 else 20)
    axes[1].set_yticks([])
    axes[1].grid(axis='x', linestyle='--', alpha=0.6)
    axes[1].spines['top'].set_visible(False)
    axes[1].spines['right'].set_visible(False)
    axes[1].spines['left'].set_visible(False)
    for index, (title, value) in enumerate(zip(titles_tfidf, top3_tfidf['tfidf_score'][::-1])):
        axes[1].text(value + (max_tfidf * 0.05), index, f'{value:.1f}', va='center', fontweight='bold', color='#E74C3C', fontsize=11)
        # Sử dụng chữ đen cho TF-IDF vì thanh điểm thường rất ngắn, chữ sẽ tràn ra ngoài nền trắng
        axes[1].text(0.5, index, title, va='center', color='black', fontweight='bold', fontsize=11)

    plt.tight_layout()
    plt.savefig(os.path.join(dir_comparison, 'algo_top3_movies.png'), dpi=300)
    plt.close()


# ---------------------------------------------------------
# TỔNG KẾT VÀ SO SÁNH THỜI GIAN CHẠY
# ---------------------------------------------------------
print("\n=========================================================")
print("          BẢNG SO SÁNH THỜI GIAN THỰC THI                ")
print("=========================================================")
for algo, t in time_records.items():
    print(f" - {algo.ljust(20)} : {t:.6f} giây")

pandas_t = time_records.get("Pandas Heuristic", 0)
tfidf_t = time_records.get("TF-IDF", 0)
if pandas_t > 0:
    speedup_tfidf = tfidf_t / pandas_t
    print(f"\n[KẾT LUẬN]: Thuật toán dự án (Pandas) chạy nhanh hơn TF-IDF xấp xỉ {speedup_tfidf:.2f} lần.")

    # Vẽ biểu đồ so sánh tốc độ
    plt.figure(figsize=(6, 5))
    algos = ['Pandas Heuristic', 'TF-IDF']
    times = [pandas_t, tfidf_t]
    plt.bar(algos, times, color=['#28a745', '#dc3545'])
    plt.title('So sánh thời gian chạy thuật toán (Giây)')
    plt.ylabel('Thời gian (Giây) - Càng thấp càng tốt')
    
    for i, v in enumerate(times):
        plt.text(i, v + (max(times)*0.01), f"{v:.5f}s", ha='center', fontweight='bold')
        
    plt.tight_layout()
    plt.savefig(os.path.join(dir_comparison, 'algo_speed_comparison.png'))
    plt.close()

print("\n -> Tất cả danh sách phim gợi ý và biểu đồ phân tích đã được lưu vào thư mục: benchmark/result/")
print("=========================================================\n")
