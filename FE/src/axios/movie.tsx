import api from '../config/axios/axiosConfig';

export interface BaseResponse<T> {
  message: string;
  statusCode: number;
  data: T;
}

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
  genres: string | null; // Note: genres is a string in backend DTO (comma separated)
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
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GetMoviesParams {
  page?: number;
  pageSize?: number;
  filters?: string;
}

/**
 * Lấy danh sách phim đang chiếu
 * GET /api/movies/now-showing
 */
export const getNowShowingMoviesApi = async (
  params?: GetMoviesParams
): Promise<BaseResponse<PaginatedMovies>> => {
  const response = await api.get<BaseResponse<PaginatedMovies>>('/movies/now-showing', { params });
  return response.data;
};

/**
 * Lấy danh sách phim sắp chiếu
 * GET /api/movies/coming-soon
 */
export const getComingSoonMoviesApi = async (
  params?: GetMoviesParams
): Promise<BaseResponse<PaginatedMovies>> => {
  const response = await api.get<BaseResponse<PaginatedMovies>>('/movies/coming-soon', { params });
  return response.data;
};

/**
 * Lấy chi tiết phim
 * GET /api/movies/:movieId
 */
export const getMovieDetailApi = async (movieId: string): Promise<BaseResponse<Movie>> => {
  const response = await api.get<BaseResponse<Movie>>(`/movies/${movieId}`);
  return response.data;
};

/**
 * Lấy lịch chiếu của 1 Phim (Gom nhóm theo Hệ thống rạp)
 * GET /api/showtimes/movie/:movieId
 */
export const getShowtimesByMovieApi = async (movieId: string, date?: string): Promise<BaseResponse<any>> => {
  const response = await api.get<BaseResponse<any>>(`/showtimes/movie/${movieId}`, {
    params: { date }
  });
  return response.data;
};
