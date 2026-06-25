import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  setValidationLanguage,
} from '../validation/validation';

describe('Forgot Password Validation Tests', () => {
  beforeEach(() => {
    setValidationLanguage('vi');
  });

  describe('Step 1: Request Reset Link/Code (Email Validation)', () => {
    it('should fail if email is empty', () => {
      expect(validateEmail('')).toBe('Email là bắt buộc');
    });

    it('should fail if email format is invalid', () => {
      expect(validateEmail('test@invalid')).toContain('không hợp lệ');
    });

    it('should pass if email is valid', () => {
      expect(validateEmail('recovery@mievoh.com')).toBeNull();
    });
  });

  describe('Step 2: Reset Password (New Password & Confirm Password Validation)', () => {
    it('should fail if new password is empty', () => {
      expect(validatePassword('')).toBe('Mật khẩu là bắt buộc');
    });

    it('should fail if new password is less than 5 characters', () => {
      expect(validatePassword('abc')).toBe('Mật khẩu phải có ít nhất 5 ký tự');
    });

    it('should fail if confirm password is empty', () => {
      expect(validateConfirmPassword('newPassword123', '')).toBe('Xác nhận mật khẩu là bắt buộc');
    });

    it('should fail if confirm password does not match new password', () => {
      expect(validateConfirmPassword('newPassword123', 'differentPassword')).toBe('Mật khẩu xác nhận không khớp');
    });

    it('should pass if both new password and confirm password match and are valid', () => {
      expect(validatePassword('newPassword123')).toBeNull();
      expect(validateConfirmPassword('newPassword123', 'newPassword123')).toBeNull();
    });
  });
});
