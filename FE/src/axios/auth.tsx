import api from '../config/axios/axiosConfig';

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

export interface UserResponse {
  username: string;
  fullName: string | null;
  email: string | null;
  avatar: string | null;
  userType: string | null;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
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
 * Khởi tạo quá trình đăng nhập bằng tài khoản Google.
 * Endpoint: GET /api/auth/google
 * Phương pháp này sẽ chuyển hướng trình duyệt của người dùng đến trang xác thực Google qua Backend.
 */
export const redirectToGoogleApi = (): void => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.mievoh.io.vn/api';
  window.location.href = `${apiBaseUrl}/auth/google`;
};

/**
 * API nhận thông tin xác thực sau khi Google redirect thành công (nếu cần gọi từ Client)
 * Endpoint: GET /api/auth/google/callback
 */
export const googleCallbackApi = async (): Promise<AuthResponse> => {
  const response = await api.get<AuthResponse>('/auth/google/callback');
  return response.data;
};

export interface ForgotPasswordPayload {
  email: string;
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
  // NestJS wraps successful response payload in a { message, statusCode, data } object
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

