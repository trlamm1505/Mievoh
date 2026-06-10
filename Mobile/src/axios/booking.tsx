import api from '../config/axios/axiosConfig';

export interface BaseResponse<T> {
  message: string;
  statusCode: number;
  data: T;
}

export interface SeatStatus {
  seatId: string;
  name: string;
  seatType: string;
  status: 'AVAILABLE' | 'SOLD' | 'HELD';
}

export interface Food {
  foodId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  cinemaComplexId: string;
}

export interface FoodBookingInput {
  foodId: string;
  quantity: number;
}

export interface CreateBookingDto {
  showtimeId: string;
  seats: string[];
  foods?: FoodBookingInput[];
  voucherCode?: string;
}

export interface CreateBookingResponse {
  message: string;
  booking: any;
  paymentUrl: string;
}

/**
 * Lấy trạng thái ghế của suất chiếu
 * GET /api/bookings/seats-status/:showtimeId
 */
export const getSeatsStatusApi = async (showtimeId: string): Promise<BaseResponse<SeatStatus[]>> => {
  const response = await api.get<BaseResponse<SeatStatus[]>>(`/bookings/seats-status/${showtimeId}`);
  return response.data;
};

/**
 * Lấy menu đồ ăn/combo của một cụm rạp
 * GET /api/foods/complex/:complexId
 */
export const getFoodsByComplexApi = async (complexId: string): Promise<BaseResponse<Food[]>> => {
  const response = await api.get<BaseResponse<Food[]>>(`/foods/complex/${complexId}`);
  return response.data;
};

/**
 * Đặt vé
 * POST /api/bookings
 */
export const createBookingApi = async (data: CreateBookingDto): Promise<BaseResponse<CreateBookingResponse>> => {
  const response = await api.post<BaseResponse<CreateBookingResponse>>('/bookings', data);
  return response.data;
};

/**
 * Xác minh kết quả thanh toán VNPay
 * GET /api/payments/vnpay-return
 */
export const verifyVNPayReturnApi = async (params: any): Promise<BaseResponse<{ code: string; message: string }>> => {
  const response = await api.get<BaseResponse<{ code: string; message: string }>>('/payments/vnpay-return', { params });
  return response.data;
};

/**
 * Trigger IPN update on backend for local testing
 * GET /api/payments/vnpay-ipn
 */
export const triggerVNPayIPNApi = async (params: any): Promise<any> => {
  const response = await api.get('/payments/vnpay-ipn', { params });
  return response.data;
};

export interface Voucher {
  voucherId: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxDiscount: number | null;
  minPurchase: number | null;
  startDate: string;
  endDate: string;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  cinemaComplexId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}



export interface MyVouchersResponse {
  message: string;
  data: Voucher[];
}

/**
 * Lấy mã giảm giá khả dụng của tôi
 * GET /api/vouchers/my-vouchers
 */
export const getMyVouchersApi = async (): Promise<BaseResponse<MyVouchersResponse>> => {
  const response = await api.get<BaseResponse<MyVouchersResponse>>('/vouchers/my-vouchers');
  return response.data;
};

export interface ApplyVoucherDto {
  code: string;
  bookingId: string;
}

export interface ApplyVoucherResponse {
  discountAmount: number;
  originalPrice: number;
  finalPrice: number;
  voucherId: string;
}

/**
 * Áp dụng mã giảm giá cho đơn hàng (Booking)
 * POST /api/vouchers/apply
 */
export const applyVoucherApi = async (data: ApplyVoucherDto): Promise<BaseResponse<ApplyVoucherResponse>> => {
  const response = await api.post<BaseResponse<ApplyVoucherResponse>>('/vouchers/apply', data);
  return response.data;
};
