import api from '../config/axios/axiosConfig';

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

export interface PaginatedMovies {
  data: Movie[];
  total: number;
}

export interface GetMoviesParams {
  page?: number;
  pageSize?: number;
  filters?: string; // JSON string filter, e.g. {"title_vi": "abc"}
}

/**
 * Lấy danh sách phim đang chiếu
 * GET /api/movies/now-showing
 */
export const getNowShowingMoviesApi = async (
  params?: GetMoviesParams
): Promise<PaginatedMovies> => {
  const response = await api.get<any>('/movies/now-showing', { params });
  return response.data;
};

/**
 * Lấy danh sách phim sắp chiếu
 * GET /api/movies/coming-soon
 */
export const getComingSoonMoviesApi = async (
  params?: GetMoviesParams
): Promise<PaginatedMovies> => {
  const response = await api.get<any>('/movies/coming-soon', { params });
  return response.data;
};

/**
 * Lấy chi tiết phim
 * GET /api/movies/:movieId
 */
export const getMovieDetailApi = async (movieId: string): Promise<Movie> => {
  const response = await api.get<any>(`/movies/${movieId}`);
  return response.data;
};

export const getShowtimesByMovieApi = async (movieId: string, date?: string): Promise<any> => {
  const response = await api.get<any>(`/showtimes/movie/${movieId}`, {
    params: { date }
  });
  return response.data;
};

export interface API_Review {
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
  reviews: API_Review[];
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

export interface BaseResponse<T> {
  message: string;
  statusCode: number;
  data: T;
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
): Promise<BaseResponse<API_Review>> => {
  const response = await api.post<BaseResponse<API_Review>>('/reviews', data);
  return response.data;
};
