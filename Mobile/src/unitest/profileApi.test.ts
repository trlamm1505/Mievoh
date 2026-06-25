import api from '../config/axios/axiosConfig';
import {
  getProfileApi,
  updateProfileApi,
  getBookingHistoryApi,
  UserProfile,
  UpdateProfileParams,
  BookingHistoryItem,
} from '../axios/profile';

// Mock the axiosConfig instance
jest.mock('../config/axios/axiosConfig', () => ({
  get: jest.fn(),
  put: jest.fn(),
}));

describe('Profile API Service Tests', () => {
  const mockProfile: UserProfile = {
    fullName: 'Trần Quốc Lâm',
    email: 'tqlam150504@mievoh.com',
    phoneNumber: '0987654321',
    avatar: 'http://avatar.url',
    userType: 'Customer',
    cinemaComplexId: 'c1',
    dateOfBirth: '2004-05-15',
    address: 'HCM',
    gender: 'Nam',
    cccd: '096204000737',
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfileApi', () => {
    it('should successfully fetch user profile', async () => {
      const mockResponse = {
        message: 'Success',
        statusCode: 200,
        data: mockProfile,
      };
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await getProfileApi();

      expect(api.get).toHaveBeenCalledWith('/users/profile');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateProfileApi', () => {
    it('should successfully update user profile', async () => {
      const updateParams: UpdateProfileParams = {
        fullName: 'Nguyen Van B',
        address: 'HCMC',
      };
      const mockResponse = {
        message: 'Profile updated',
        statusCode: 200,
        data: {
          ...mockProfile,
          ...updateParams,
        },
      };
      (api.put as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await updateProfileApi(updateParams);

      expect(api.put).toHaveBeenCalledWith('/users/profile', updateParams);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getBookingHistoryApi', () => {
    it('should successfully fetch booking history', async () => {
      const mockHistory: BookingHistoryItem[] = [
        {
          bookingId: 'b1',
          email: 'user@mievoh.com',
          showtimeId: 's1',
          bookingDate: '2026-06-25',
          totalPrice: 150000,
          paymentStatus: 'Success',
          paymentMethod: 'VNPAY',
          ticketCode: 'TKT123',
          createdAt: '2026-06-25',
          updatedAt: '2026-06-25',
          Showtime: {
            showtimeId: 's1',
            cinemaId: 'c1',
            movieId: 'm1',
            showDateTime: '2026-06-25T19:00:00Z',
            format: '2D',
            Movie: {
              title_vi: 'Phim A',
              title_en: 'Movie A',
              imageUrl: 'http://image.a',
            },
            Cinema: {
              CinemaComplex: {
                name: 'Mievoh Complex',
                address: 'Hanoi',
              },
            },
          },
          BookingDetails: [
            {
              Seat: {
                name: 'A1',
                seatType: 'Standard',
              },
            },
          ],
          BookingFoods: [],
        },
      ];

      const mockResponse = {
        message: 'Success',
        statusCode: 200,
        data: mockHistory,
      };
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await getBookingHistoryApi();

      expect(api.get).toHaveBeenCalledWith('/bookings/my-history');
      expect(result).toEqual(mockResponse);
    });
  });
});
