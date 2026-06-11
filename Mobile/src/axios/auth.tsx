import api from '../config/axios/axiosConfig';
import { Linking } from 'react-native';
import { API_BASE_URL } from '../config/constant/constant';


// Định nghĩa các Interface cho dữ liệu Auth tương ứng với DTO của Backend
export interface LoginPayload {
  email: string; // Địa chỉ email đăng nhập
  password: string; // Mật khẩu
}

export interface RegisterPayload {
  fullName: string;    // Họ tên đầy đủ
  email: string;       // Địa chỉ email
  phoneNumber: string; // Số điện thoại
  password: string;    // Mật khẩu
}

export interface UserResponse {
  fullName: string | null;
  email: string;
  avatar: string | null;
  userType: string | null;
  phoneNumber?: string | null;
  gender?: 'Nam' | 'Nữ' | 'Khác' | null;
  dob?: string | null;
  address?: string | null;
  cccd?: string | null;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: TokenResponse;
}

/**
 * API đăng nhập cục bộ (Local Login)
 * Endpoint: POST /api/auth/login
 */
export const loginApi = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', payload);
  return response.data;
};

/**
 * API đăng ký tài khoản cục bộ (Local Register)
 * Endpoint: POST /api/auth/register
 */
export const registerApi = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', payload);
  return response.data;
};



/**
 * Khởi tạo quá trình đăng nhập bằng tài khoản Google.
 * Endpoint: GET /api/auth/google
 * Phương pháp này sẽ mở trình duyệt để người dùng xác thực Google qua Backend.
 */
export const redirectToGoogleApi = async (): Promise<void> => {
  const url = `${API_BASE_URL}/auth/google`;
  try {
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
    }
  } catch (error) {
    console.error('Không thể mở liên kết đăng nhập Google', error);
  }
};

/**
 * API nhận thông tin xác thực sau khi Google redirect thành công (nếu cần gọi từ Client)
 * Endpoint: GET /api/auth/google/callback
 */
export const googleCallbackApi = async (): Promise<AuthResponse> => {
  const response = await api.get<AuthResponse>('/auth/google/callback');
  return response.data;
};

/**
 * API đăng nhập bằng Google idToken từ Mobile.
 * Endpoint: POST /auth/google/mobile
 */
export const googleLoginMobileApi = async (idToken: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/google/mobile', { idToken });
  return response.data;
};

export interface SendRegisterOtpPayload {
  email: string;       // Địa chỉ email (duy nhất)
  phoneNumber: string; // Số điện thoại
  fullName: string;    // Họ và tên
  password: string;    // Mật khẩu (tối thiểu 6 ký tự)
}

export interface VerifyRegisterOtpPayload {
  email: string;       // Địa chỉ email đã yêu cầu OTP
  otp: string;         // Mã OTP 6 chữ số nhận từ email
}

export interface VerifyResetOtpPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  resetToken: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

/**
 * API gửi mã OTP đăng ký tài khoản qua Email (Register - Step 1)
 * Endpoint: POST /api/auth/register/send-otp
 */
export const sendRegisterOtpApi = async (payload: SendRegisterOtpPayload): Promise<{ message: string, expiresIn?: number }> => {
  const response = await api.post<{ message: string, expiresIn?: number }>('/auth/register/send-otp', payload);
  return response.data;
};

/**
 * API xác thực mã OTP và hoàn tất đăng ký tài khoản (Register - Step 2)
 * Endpoint: POST /api/auth/register
 */
export const verifyRegisterOtpApi = async (payload: VerifyRegisterOtpPayload): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', payload);
  return response.data;
};

/**
 * API kiểm tra email tồn tại để khôi phục mật khẩu (Forgot Password - Step 1)
 * Endpoint: POST /api/auth/verify-email
 */
export const verifyEmailApi = async (email: string): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/auth/verify-email', { email });
  return response.data;
};

/**
 * API khôi phục mật khẩu (Forgot Password - Step 1)
 * Endpoint: POST /api/auth/forgot-password
 */
export const forgotPasswordApi = async (email: string): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
  return response.data;
};

/**
 * API xác thực OTP khôi phục mật khẩu (Forgot Password - Step 2)
 * Endpoint: POST /api/auth/forgot-password/verify-otp
 */
export const verifyResetOtpApi = async (payload: VerifyResetOtpPayload): Promise<{ resetToken: string }> => {
  const response = await api.post<any>('/auth/forgot-password/verify-otp', payload);
  const data = response.data?.data || response.data;
  return data;
};

/**
 * API đặt lại mật khẩu mới cho người dùng (Forgot Password - Step 3)
 * Endpoint: POST /api/auth/reset-password
 */
export const resetPasswordApi = async (payload: ResetPasswordPayload): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/auth/reset-password', payload);
  return response.data;
};

/**
 * API thay đổi mật khẩu khi đã đăng nhập (Change Password)
 * Endpoint: POST /api/auth/change-password
 */
export const changePasswordApi = async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/auth/change-password', payload);
  return response.data;
};

