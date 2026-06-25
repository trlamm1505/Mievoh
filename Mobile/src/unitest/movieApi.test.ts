import api from '../config/axios/axiosConfig';
import {
  getNowShowingMoviesApi,
  getComingSoonMoviesApi,
  getMovieDetailApi,
  getReviewsByMovieApi,
  createReviewApi,
  getShowtimesByMovieApi,
} from '../axios/movie';

// Mock the axiosConfig instance
jest.mock('../config/axios/axiosConfig', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe('Movie API Service Tests', () => {
  const mockMovie = {
    movieId: 'm1',
    title_vi: 'Phim Hành Động',
    title_en: 'Action Movie',
    imageUrl: 'http://image.url',
    averageRating: 4.8,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNowShowingMoviesApi', () => {
    it('should successfully fetch now showing movies', async () => {
      const mockResponse = { data: [mockMovie], total: 1 };
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await getNowShowingMoviesApi({ page: 1, pageSize: 10 });

      expect(api.get).toHaveBeenCalledWith('/movies/now-showing', {
        params: { page: 1, pageSize: 10 },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getComingSoonMoviesApi', () => {
    it('should successfully fetch coming soon movies', async () => {
      const mockResponse = { data: [mockMovie], total: 1 };
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await getComingSoonMoviesApi();

      expect(api.get).toHaveBeenCalledWith('/movies/coming-soon', { params: undefined });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMovieDetailApi', () => {
    it('should successfully fetch movie detail', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockMovie });

      const result = await getMovieDetailApi('m1');

      expect(api.get).toHaveBeenCalledWith('/movies/m1');
      expect(result).toEqual(mockMovie);
    });
  });

  describe('getShowtimesByMovieApi', () => {
    it('should successfully fetch showtimes by movie ID and date', async () => {
      const mockShowtimes = [
        {
          showtimeId: 'st1',
          movieId: 'm1',
          showDateTime: '2026-06-25T19:00:00Z',
          Cinema: { name: 'Cinema 1' }
        }
      ];
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockShowtimes });

      const result = await getShowtimesByMovieApi('m1', '2026-06-25');

      expect(api.get).toHaveBeenCalledWith('/showtimes/movie/m1', {
        params: { date: '2026-06-25' }
      });
      expect(result).toEqual(mockShowtimes);
    });
  });

  describe('getReviewsByMovieApi', () => {
    it('should successfully fetch reviews with pagination parameters', async () => {
      const mockReviewsResponse = {
        message: 'Success',
        statusCode: 200,
        data: {
          reviews: [
            {
              reviewId: 'r1',
              movieId: 'm1',
              email: 'user@mievoh.com',
              rating: 5,
              comment: 'Great movie!',
              createdAt: '2026-06-25',
              updatedAt: '2026-06-25',
            },
          ],
          total: 1,
          page: 1,
          limit: 5,
          totalPages: 1,
        },
      };

      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockReviewsResponse });

      const result = await getReviewsByMovieApi('m1', 1, 5);

      expect(api.get).toHaveBeenCalledWith('/reviews/movie/m1', {
        params: { page: 1, limit: 5 },
      });
      expect(result).toEqual(mockReviewsResponse);
    });
  });

  describe('createReviewApi', () => {
    it('should successfully post a new review', async () => {
      const reviewParams = { movieId: 'm1', rating: 5, comment: 'Awesome!' };
      const mockReviewResponse = {
        message: 'Review created',
        statusCode: 201,
        data: {
          reviewId: 'r2',
          ...reviewParams,
          email: 'user@mievoh.com',
          createdAt: '2026-06-25',
          updatedAt: '2026-06-25',
        },
      };

      (api.post as jest.Mock).mockResolvedValueOnce({ data: mockReviewResponse });

      const result = await createReviewApi(reviewParams);

      expect(api.post).toHaveBeenCalledWith('/reviews', reviewParams);
      expect(result).toEqual(mockReviewResponse);
    });
  });
});
