import api from '../config/axios/axiosConfig';

// ==========================================
// 1. INTERFACES DỮ LIỆU
// ==========================================

export interface BaseResponse<T> {
  message: string;
  statusCode: number;
  data: T;
}

// Interface cho Movie (Phim)
export interface Movie {
  movieId: string;
  title_vi: string | null;
  title_en: string | null;
  trailerUrl: string | null;
  imageUrl: string | null;
  description_vi: string | null;
  description_en: string | null;
  releaseDate: string | null;
  duration: number | null;
  language_vi: string | null;
  language_en: string | null;
  ageRestriction: string | null;
  genres: string[];
  director: string | null;
  cast: string | null;
  averageRating: number | null;
  totalReviews: number | null;
  isHot: boolean | null;
  isShowing: boolean | null;
  isComingSoon: boolean | null;
  createdAt: string;
  updatedAt: string;
}

// Interface cho Cinema System (Hệ thống rạp)
export interface CinemaSystem {
  cinemaSystemId: string;
  name: string | null;
  logo: string | null;
  createdAt: string;
  updatedAt: string;
  CinemaComplexes?: CinemaComplex[];
}

// Interface cho Cinema Complex (Cụm rạp)
export interface CinemaComplex {
  cinemaComplexId: string;
  name: string | null;
  address: string | null;
  cinemaSystemId: string | null;
  createdAt: string;
  updatedAt: string;
  CinemaSystem?: CinemaSystem;
  Cinemas?: Cinema[];
}

// Interface cho Cinema (Phòng chiếu / Rạp)
export interface Cinema {
  cinemaId: string;
  name: string | null;
  cinemaComplexId: string | null;
  createdAt: string;
  updatedAt: string;
  CinemaComplex?: CinemaComplex;
}

// Interface cho Showtime (Suất chiếu)
export interface Showtime {
  showtimeId: string;
  cinemaId: string | null;
  movieId: string | null;
  showDateTime: string | null;
  format: string | null;
  ticketPrice: number | null;
  status: string | null;
  createdAt: string;
  updatedAt: string;
  Cinema?: Cinema;
  Movie?: Movie;
}

// Dữ liệu phân trang cho danh sách Phim
export interface PaginatedMovies {
  movies: Movie[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==========================================
// 2. CÁC API PHIM (MOVIES)
// ==========================================

export interface GetMoviesParams {
  page?: number;
  pageSize?: number;
  filters?: string; // Chuỗi JSON bộ lọc
}

/**
 * Lấy danh sách phim đang chiếu (Có phân trang)
 * GET /api/movies/now-showing
 */
export const getNowShowingMoviesApi = async (
  params?: GetMoviesParams
): Promise<BaseResponse<PaginatedMovies>> => {
  const response = await api.get<BaseResponse<PaginatedMovies>>('/movies/now-showing', { params });
  return response.data;
};

/**
 * Lấy danh sách phim sắp chiếu (Có phân trang)
 * GET /api/movies/coming-soon
 */
export const getComingSoonMoviesApi = async (
  params?: GetMoviesParams
): Promise<BaseResponse<PaginatedMovies>> => {
  const response = await api.get<BaseResponse<PaginatedMovies>>('/movies/coming-soon', { params });
  return response.data;
};

/**
 * Lấy thông tin chi tiết một phim
 * GET /api/movies/:movieId
 */
export const getMovieDetailApi = async (movieId: string): Promise<BaseResponse<Movie>> => {
  const response = await api.get<BaseResponse<Movie>>(`/movies/${movieId}`);
  return response.data;
};

// ==========================================
// 3. CÁC API HỆ THỐNG RẠP (CINEMA SYSTEMS)
// ==========================================

/**
 * Lấy danh sách hệ thống rạp
 * GET /api/cinema-systems
 */
export const getCinemaSystemsApi = async (): Promise<BaseResponse<CinemaSystem[]>> => {
  const response = await api.get<BaseResponse<CinemaSystem[]>>('/cinema-systems');
  return response.data;
};

/**
 * Lấy chi tiết hệ thống rạp
 * GET /api/cinema-systems/:cinemaSystemId
 */
export const getCinemaSystemDetailApi = async (
  cinemaSystemId: string
): Promise<BaseResponse<CinemaSystem>> => {
  const response = await api.get<BaseResponse<CinemaSystem>>(`/cinema-systems/${cinemaSystemId}`);
  return response.data;
};

// ==========================================
// 4. CÁC API CỤM RẠP (CINEMA COMPLEXES)
// ==========================================

/**
 * Lấy danh sách cụm rạp (Có thể lọc theo hệ thống rạp bằng cinemaSystemId)
 * GET /api/cinema-complexes
 */
export const getCinemaComplexesApi = async (
  cinemaSystemId?: string
): Promise<BaseResponse<CinemaComplex[]>> => {
  const params = cinemaSystemId ? { cinemaSystemId } : undefined;
  const response = await api.get<BaseResponse<CinemaComplex[]>>('/cinema-complexes', { params });
  return response.data;
};

/**
 * Lấy chi tiết cụm rạp
 * GET /api/cinema-complexes/:cinemaComplexId
 */
export const getCinemaComplexDetailApi = async (
  cinemaComplexId: string
): Promise<BaseResponse<CinemaComplex>> => {
  const response = await api.get<BaseResponse<CinemaComplex>>(`/cinema-complexes/${cinemaComplexId}`);
  return response.data;
};

// ==========================================
// 5. CÁC API RẠP CHIẾU / PHÒNG CHIẾU (CINEMAS)
// ==========================================

/**
 * Lấy danh sách rạp chiếu / phòng chiếu thuộc một cụm rạp
 * GET /api/cinemas (Yêu cầu query param: cinemaComplexId)
 */
export const getCinemasApi = async (
  cinemaComplexId: string
): Promise<BaseResponse<Cinema[]>> => {
  const response = await api.get<BaseResponse<Cinema[]>>('/cinemas', {
    params: { cinemaComplexId },
  });
  return response.data;
};

/**
 * Lấy chi tiết rạp chiếu
 * GET /api/cinemas/:cinemaId
 */
export const getCinemaDetailApi = async (cinemaId: string): Promise<BaseResponse<Cinema>> => {
  const response = await api.get<BaseResponse<Cinema>>(`/cinemas/${cinemaId}`);
  return response.data;
};

// ==========================================
// 6. CÁC API SUẤT CHIẾU (SHOWTIMES)
// ==========================================

/**
 * Lấy lịch chiếu của 1 Phim (Gom nhóm theo Hệ thống rạp)
 * GET /api/showtimes/movie/:movieId
 * @param date Ngày chiếu dạng DD/MM/YYYY (Ví dụ: 06/06/2026)
 */
export const getShowtimesByMovieApi = async (
  movieId: string,
  date?: string
): Promise<BaseResponse<any>> => {
  const params = date ? { date } : undefined;
  const response = await api.get<BaseResponse<any>>(`/showtimes/movie/${movieId}`, { params });
  return response.data;
};

/**
 * Lấy lịch chiếu của 1 Cụm rạp (Gom nhóm theo Phim)
 * GET /api/showtimes/complex/:complexId
 * @param date Ngày chiếu dạng DD/MM/YYYY (Ví dụ: 06/06/2026)
 */
export const getShowtimesByComplexApi = async (
  complexId: string,
  date?: string
): Promise<BaseResponse<any>> => {
  const params = date ? { date } : undefined;
  const response = await api.get<BaseResponse<any>>(`/showtimes/complex/${complexId}`, { params });
  return response.data;
};

/**
 * Lấy thông tin tóm tắt 1 Suất chiếu (Dùng cho Header Chọn ghế)
 * GET /api/showtimes/:showtimeId
 */
export const getShowtimeDetailApi = async (showtimeId: string): Promise<BaseResponse<Showtime>> => {
  const response = await api.get<BaseResponse<Showtime>>(`/showtimes/${showtimeId}`);
  return response.data;
};

export interface CinemaBranch {
    id: string | number;
    name: string;
    address: string;
    phone: string;
    city: string;
    rating: number;
    priceRange: string;
    image: string;
}

export interface TheaterChain {
    id: string;
    name: string;
    logo: string;
    description: string;
    website: string;
    branches: CinemaBranch[];
}

export interface Review {
  reviewId: string;
  movieId: string;
  username: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  User?: {
    fullName: string | null;
    avatar: string | null;
  };
}

export interface PaginatedReviews {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateReviewParams {
  movieId: string;
  rating: number;
  comment?: string;
}

/**
 * Lấy danh sách đánh giá của một bộ phim
 * GET /api/reviews/movie/:movieId
 */
export const getReviewsByMovieApi = async (
  movieId: string,
  page?: number,
  limit?: number
): Promise<BaseResponse<PaginatedReviews>> => {
  const params = { page, limit };
  const response = await api.get<BaseResponse<PaginatedReviews>>(`/reviews/movie/${movieId}`, { params });
  return response.data;
};

/**
 * Tạo mới hoặc cập nhật đánh giá phim
 * POST /api/reviews
 */
export const createReviewApi = async (
  data: CreateReviewParams
): Promise<BaseResponse<Review>> => {
  const response = await api.post<BaseResponse<Review>>('/reviews', data);
  return response.data;
};

