import api from '../config/axios/axiosConfig';
import {
  getSeatsStatusApi,
  getFoodsByComplexApi,
  createBookingApi,
  getMyVouchersApi,
  applyVoucherApi,
} from '../axios/booking';

// Mock the axiosConfig instance
jest.mock('../config/axios/axiosConfig', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe('Booking API Service Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSeatsStatusApi', () => {
    it('should fetch seat status for a given showtime', async () => {
      const mockSeats = {
        message: 'Success',
        statusCode: 200,
        data: [
          { seatId: 's1', name: 'A1', seatType: 'STANDARD', status: 'AVAILABLE' },
          { seatId: 's2', name: 'A2', seatType: 'STANDARD', status: 'SOLD' },
        ],
      };
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockSeats });

      const result = await getSeatsStatusApi('showtime-123');

      expect(api.get).toHaveBeenCalledWith('/bookings/seats-status/showtime-123');
      expect(result).toEqual(mockSeats);
    });
  });

  describe('getFoodsByComplexApi', () => {
    it('should fetch foods by cinema complex ID', async () => {
      const mockFoods = {
        message: 'Success',
        statusCode: 200,
        data: [
          { foodId: 'f1', name: 'Popcorn', price: 50000, isActive: true, cinemaComplexId: 'c1', description: 'Sweet' },
        ],
      };
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockFoods });

      const result = await getFoodsByComplexApi('complex-456');

      expect(api.get).toHaveBeenCalledWith('/foods/complex/complex-456');
      expect(result).toEqual(mockFoods);
    });
  });

  describe('createBookingApi', () => {
    it('should place a booking successfully', async () => {
      const bookingData = {
        showtimeId: 'showtime-123',
        seats: ['s1', 's2'],
        foods: [{ foodId: 'f1', quantity: 2 }],
      };
      const mockResponse = {
        message: 'Success',
        statusCode: 201,
        data: {
          message: 'Booking completed',
          booking: { id: 'booking-789' },
          paymentUrl: 'http://payment.url',
        },
      };
      (api.post as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await createBookingApi(bookingData);

      expect(api.post).toHaveBeenCalledWith('/bookings', bookingData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMyVouchersApi', () => {
    it('should fetch my available vouchers', async () => {
      const mockVouchers = {
        message: 'Success',
        statusCode: 200,
        data: {
          message: 'Success',
          data: [
            {
              voucherId: 'v1',
              code: 'MIEVOH50',
              discountType: 'PERCENTAGE',
              discountValue: 50,
              maxDiscount: 50000,
              minPurchase: 100000,
              startDate: '2026-01-01',
              endDate: '2026-12-31',
              usedCount: 0,
              isActive: true,
              cinemaComplexId: null,
              createdBy: 'admin',
              createdAt: '2026-01-01',
              updatedAt: '2026-01-01',
            },
          ],
        },
      };
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockVouchers });

      const result = await getMyVouchersApi();

      expect(api.get).toHaveBeenCalledWith('/vouchers/my-vouchers');
      expect(result).toEqual(mockVouchers);
    });
  });

  describe('applyVoucherApi', () => {
    it('should apply a voucher code successfully', async () => {
      const voucherData = { code: 'MIEVOH50', bookingId: 'booking-789' };
      const mockResponse = {
        message: 'Success',
        statusCode: 200,
        data: {
          discountAmount: 50000,
          originalPrice: 100000,
          finalPrice: 50000,
          voucherId: 'v1',
        },
      };
      (api.post as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await applyVoucherApi(voucherData);

      expect(api.post).toHaveBeenCalledWith('/vouchers/apply', voucherData);
      expect(result).toEqual(mockResponse);
    });
  });
});
