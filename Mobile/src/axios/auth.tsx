import api from '../config/axios/axiosConfig';
import { Linking } from 'react-native';
import { API_BASE_URL } from '../config/constant/constant';


// Định nghĩa các Interface cho dữ liệu Auth tương ứng với DTO của Backend
export interface LoginPayload {
  username: string; // Tên đăng nhập (Backend kiểm tra trường username)
  password: string; // Mật khẩu
}

export interface RegisterPayload {
  username: string;    // Tên đăng nhập (có thể dùng email làm username)
  fullName: string;    // Họ tên đầy đủ
  email: string;       // Địa chỉ email
  phoneNumber: string; // Số điện thoại
  password: string;    // Mật khẩu
}

export interface UserResponse {
  username: string;
  fullName: string | null;
  email: string | null;
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

export interface ResetPasswordPayload {
  email: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

/**
 * API kiểm tra email tồn tại để khôi phục mật khẩu (Forgot Password - Step 1)
 * Endpoint: POST /api/auth/verify-email
 */
export const verifyEmailApi = async (email: string): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/auth/verify-email', { email });
  return response.data;
};

/**
 * API đặt lại mật khẩu mới cho người dùng (Forgot Password - Step 2)
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

