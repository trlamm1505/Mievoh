import api from '../config/axios/axiosConfig';
import {
  getCinemaSystemsApi,
  getCinemaComplexesApi,
  getCinemaComplexDetailApi,
  getCinemasApi,
  getShowtimesByComplexApi,
} from '../axios/cinemas';

// Mock the axiosConfig instance
jest.mock('../config/axios/axiosConfig', () => ({
  get: jest.fn(),
}));

describe('Cinema API Service Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCinemaSystemsApi', () => {
    it('should fetch cinema systems and handle nested data format', async () => {
      const mockSystems = [{ cinemaSystemId: 'sys1', name: 'CGV' }];
      const mockResponse = { data: { data: mockSystems } };
      (api.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await getCinemaSystemsApi();

      expect(api.get).toHaveBeenCalledWith('/cinema-systems');
      expect(result).toEqual(mockSystems);
    });
  });

  describe('getCinemaComplexesApi', () => {
    it('should fetch cinema complexes with system filter', async () => {
      const mockComplexes = [{ cinemaComplexId: 'c1', name: 'CGV Tower' }];
      const mockResponse = { data: { data: mockComplexes } };
      (api.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await getCinemaComplexesApi('sys1');

      expect(api.get).toHaveBeenCalledWith('/cinema-complexes', {
        params: { cinemaSystemId: 'sys1' },
      });
      expect(result).toEqual(mockComplexes);
    });
  });

  describe('getCinemaComplexDetailApi', () => {
    it('should fetch cinema complex detail by ID', async () => {
      const mockComplex = { cinemaComplexId: 'c1', name: 'CGV Tower' };
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockComplex });

      const result = await getCinemaComplexDetailApi('c1');

      expect(api.get).toHaveBeenCalledWith('/cinema-complexes/c1');
      expect(result).toEqual(mockComplex);
    });
  });

  describe('getCinemasApi', () => {
    it('should fetch individual cinemas under a complex', async () => {
      const mockCinemas = [{ cinemaId: 'room1', name: 'Screen 1' }];
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockCinemas });

      const result = await getCinemasApi('c1');

      expect(api.get).toHaveBeenCalledWith('/cinemas', {
        params: { cinemaComplexId: 'c1' },
      });
      expect(result).toEqual(mockCinemas);
    });
  });

  describe('getShowtimesByComplexApi', () => {
    it('should fetch showtimes grouped by movie for a complex', async () => {
      const mockShowtimes = { movieGroup: [] };
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockShowtimes });

      const result = await getShowtimesByComplexApi('c1', '2026-06-25');

      expect(api.get).toHaveBeenCalledWith('/showtimes/complex/c1', {
        params: { date: '2026-06-25' },
      });
      expect(result).toEqual(mockShowtimes);
    });
  });
});
