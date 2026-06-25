const mockRunSync = jest.fn();
const mockGetAllSync = jest.fn();
const mockWithTransactionSync = jest.fn((cb: () => any) => cb());
const mockExecuteSync = jest.fn();
const mockFinalizeSync = jest.fn();

const mockStatement = {
  executeSync: (params?: any[]) => mockExecuteSync(params),
  finalizeSync: () => mockFinalizeSync(),
};

const mockPrepareSync = jest.fn((query?: string) => mockStatement);

// Mock the AppDatabase instance directly to avoid hoisting issues with expo-sqlite
jest.mock('../SQLite/database/AppDatabase', () => ({
  db: {
    runSync: (query: string, ...args: any[]) => mockRunSync(query, ...args),
    getAllSync: (query: string, ...args: any[]) => mockGetAllSync(query, ...args),
    prepareSync: (query: string) => mockPrepareSync(query),
    withTransactionSync: (cb: () => any) => mockWithTransactionSync(cb),
  },
}));

import { MovieRepository } from '../SQLite/repositories/MovieRepository';
import { PersonalRecommendation } from '../axios/profile';

describe('MovieRepository SQLite Tests', () => {
  const mockRecommendations = [
    {
      recommendationId: 'rec1',
      movieId: 'm1',
      matchScore: 95,
      Movie: {
        title_vi: 'Phim A',
        imageUrl: 'http://image.a',
        averageRating: 4.8,
      },
    },
    {
      recommendationId: 'rec2',
      movieId: 'm2',
      matchScore: 88,
      Movie: {
        title_vi: 'Phim B',
        imageUrl: 'http://image.b',
        averageRating: 4.2,
      },
    },
    {
      recommendationId: 'rec3',
      movieId: 'm3',
      matchScore: 80,
      Movie: null, // Will trigger default values
    },
    {
      recommendationId: 'rec4',
      movieId: 'm4',
      matchScore: 75,
      Movie: {
        title_vi: 'Phim D',
        imageUrl: 'http://image.d',
        averageRating: 3.9,
      },
    },
  ] as unknown as PersonalRecommendation[];

  beforeEach(() => {
    // Reset mock implementation of withTransactionSync to execute the callback by default
    mockWithTransactionSync.mockImplementation((cb: () => any) => cb());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveRecommendedMovies', () => {
    it('should save the first 3 recommended movies and use default values if Movie info is missing', () => {
      // Mock local DB returning empty list (meaning no changes checked, or different list)
      mockGetAllSync.mockReturnValueOnce([]);

      MovieRepository.saveRecommendedMovies(mockRecommendations);

      // Verify transaction was used
      expect(mockWithTransactionSync).toHaveBeenCalled();

      // Verify it deleted old records
      expect(mockRunSync).toHaveBeenCalledWith('DELETE FROM recommended_movies');

      // Verify statement prepare and execution (only for first 3 movies!)
      expect(mockPrepareSync).toHaveBeenCalled();
      expect(mockExecuteSync).toHaveBeenCalledTimes(3);

      // Verify the 3rd item (rec3) used default values: title 'Movie', rating 4.5, matchScore 80
      expect(mockExecuteSync).toHaveBeenNthCalledWith(3, [
        'm3',
        'Movie', // default
        '',      // default
        4.5,     // default
        80,      // matchScore
      ]);

      expect(mockFinalizeSync).toHaveBeenCalled();
    });

    it('should skip database writes if new recommended movie IDs match existing cached movie IDs', () => {
      // Mock local DB already having the exact same movie IDs [m1, m2, m3]
      mockGetAllSync.mockReturnValueOnce([
        { movieId: 'm1', titleVi: 'Phim A', imageUrl: 'http://image.a', averageRating: 4.8, matchScore: 95 },
        { movieId: 'm2', titleVi: 'Phim B', imageUrl: 'http://image.b', averageRating: 4.2, matchScore: 88 },
        { movieId: 'm3', titleVi: 'Movie', imageUrl: '', averageRating: 4.5, matchScore: 80 },
      ]);

      MovieRepository.saveRecommendedMovies(mockRecommendations);

      // Verify it fetched local movies
      expect(mockGetAllSync).toHaveBeenCalledWith('SELECT * FROM recommended_movies');

      // Should not write to DB
      expect(mockRunSync).not.toHaveBeenCalled();
    });
  });

  describe('getRecommendedMovies', () => {
    it('should fetch cached movies from SQLite database', () => {
      const mockDbMovies = [
        { movieId: 'm1', titleVi: 'Phim A', imageUrl: 'http://image.a', averageRating: 4.8, matchScore: 95 },
      ];
      mockGetAllSync.mockReturnValueOnce(mockDbMovies);

      const result = MovieRepository.getRecommendedMovies();

      expect(mockGetAllSync).toHaveBeenCalledWith('SELECT * FROM recommended_movies');
      expect(result).toEqual(mockDbMovies);
    });

    it('should return empty array and catch errors on failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetAllSync.mockImplementationOnce(() => {
        throw new Error('Database locked');
      });

      const result = MovieRepository.getRecommendedMovies();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
