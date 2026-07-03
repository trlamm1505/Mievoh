import axios from 'axios'
import { API_BASE_URL } from '../constant/constant.tsx'

const api = axios.create({
  baseURL: API_BASE_URL,
})

// Helper to check if a JWT token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      // Not a valid JWT structure, skip auto-expiration check (for dev dummy tokens)
      return false;
    }
    
    // Decode base64url encoded payload
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    if (payload && typeof payload.exp === 'number') {
      const currentTime = Math.floor(Date.now() / 1000);
      // Expired if current time exceeds expiration claim
      return payload.exp < currentTime;
    }
    return false;
  } catch (e) {
    console.error('Error decoding JWT token:', e);
    return false;
  }
};

// Add request interceptor to automatically attach authorization header
api.interceptors.request.use((config) => {
  try {
    let token = localStorage.getItem('accessToken')
    if (token) {
      token = token.trim().replace(/^["']|["']$/g, '');
      if (isTokenExpired(token)) {
        console.warn('Token expired, logging out...');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_isAuthenticated');
        localStorage.removeItem('lastActivity');
        localStorage.removeItem('mievoh_user');
        // Redirect to login page
        window.location.href = '/login';
        return Promise.reject(new axios.Cancel('Token expired'));
      }

      if (config.headers) {
        // Set both standard headers for maximum compatibility
        config.headers.token = token
        config.headers.Authorization = `Bearer ${token}`
      }
    }
  } catch (e) {
    console.error('Error reading token from localStorage', e)
  }
  return config
})

// Add response interceptor to automatically clean up expired sessions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't redirect if the error is from the login or register API itself
      const originalRequestUrl = error.config?.url || '';
      if (!originalRequestUrl.includes('/auth/login') && !originalRequestUrl.includes('/auth/register')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_isAuthenticated');
        localStorage.removeItem('lastActivity');
        localStorage.removeItem('mievoh_user');
        // Redirect to login page
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
