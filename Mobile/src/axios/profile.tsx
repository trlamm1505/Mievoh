import api from '../config/axios/axiosConfig';

export interface BaseResponse<T> {
  message: string;
  statusCode: number;
  data: T;
}

export interface UserProfile {
  username: string;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  avatar: string | null;
  userType: string | null;
  cinemaComplexId: string | null;
  dateOfBirth: string | null; // Backend uses dateOfBirth (string/Date)
  dob?: string | null;         // Frontend uses dob
  address: string | null;
  gender: 'Nam' | 'Nữ' | 'Khác' | null;
  cccd: string | null;
  rewardPoints?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileParams {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  gender?: 'Nam' | 'Nữ' | 'Khác' | null;
  dob?: string;
  dateOfBirth?: string;
  address?: string;
  cccd?: string;
  avatar?: string;
}

export interface BookingDetail {
  Seat: {
    name: string;
    seatType: string;
  };
}

export interface BookingFood {
  quantity: number;
  Food: {
    name: string;
    imageUrl: string | null;
  };
}

export interface ShowtimeInfo {
  showtimeId: string;
  cinemaId: string;
  movieId: string;
  showDateTime: string;
  format: string;
  Movie: {
    title_vi: string;
    title_en: string;
    imageUrl: string;
  };
  Cinema: {
    CinemaComplex: {
      name: string;
      address: string;
    };
  };
}

export interface BookingHistoryItem {
  bookingId: string;
  username: string;
  showtimeId: string;
  bookingDate: string;
  totalPrice: number;
  paymentStatus: "Success" | "Failed" | "Pending" | string;
  paymentMethod: string | null;
  ticketCode: string;
  createdAt: string;
  updatedAt: string;
  Showtime: ShowtimeInfo;
  BookingDetails: BookingDetail[];
  BookingFoods: BookingFood[];
}

/**
 * Lấy thông tin cá nhân (Profile)
 * GET /api/users/profile
 */
export const getProfileApi = async (): Promise<BaseResponse<UserProfile>> => {
  const response = await api.get<BaseResponse<UserProfile>>('/users/profile');
  return response.data;
};

/**
 * Cập nhật thông tin cá nhân (Profile)
 * PUT /api/users/profile
 */
export const updateProfileApi = async (data: UpdateProfileParams): Promise<BaseResponse<UserProfile>> => {
  const response = await api.put<BaseResponse<UserProfile>>('/users/profile', data);
  return response.data;
};

/**
 * Lấy lịch sử đặt vé của người dùng hiện tại
 * GET /api/bookings/my-history
 */
export const getBookingHistoryApi = async (): Promise<BaseResponse<BookingHistoryItem[]>> => {
  const response = await api.get<BaseResponse<BookingHistoryItem[]>>('/bookings/my-history');
  return response.data;
};

export interface RecommendedMovie {
  title_vi: string;
  imageUrl: string;
  averageRating: number;
}

export interface PersonalRecommendation {
  recommendationId: string;
  username: string;
  movieId: string;
  matchScore: number;
  isEmailSent: boolean;
  createdAt: string;
  Movie: RecommendedMovie;
}

/**
 * Lấy danh sách phim cá nhân hóa (Personal Recommendations)
 * GET /api/recommendations/my-movies
 */
export const getMyRecommendationsApi = async (): Promise<BaseResponse<PersonalRecommendation[]>> => {
  const response = await api.get<BaseResponse<PersonalRecommendation[]>>('/recommendations/my-movies');
  return response.data;
};
