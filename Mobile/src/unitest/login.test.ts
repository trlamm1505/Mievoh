import {
  validateEmail,
  validatePassword,
  setValidationLanguage,
} from '../validation/validation';

describe('Login Validation Tests', () => {
  beforeEach(() => {
    setValidationLanguage('vi'); // Reset to Vietnamese before each test
  });

  describe('Language Support', () => {
    it('should validate in Vietnamese by default', () => {
      expect(validateEmail('')).toBe('Email là bắt buộc');
      expect(validatePassword('')).toBe('Mật khẩu là bắt buộc');
    });

    it('should validate in English when language is set to "en"', () => {
      setValidationLanguage('en');
      expect(validateEmail('')).toBe('Email is required');
      expect(validatePassword('')).toBe('Password is required');
    });
  });

  describe('Email Field', () => {
    it('should fail if email is empty or whitespace', () => {
      expect(validateEmail('')).toBe('Email là bắt buộc');
      expect(validateEmail('   ')).toBe('Email là bắt buộc');
    });

    it('should fail for malformed emails', () => {
      expect(validateEmail('test')).toContain('không hợp lệ');
      expect(validateEmail('test@')).toContain('không hợp lệ');
      expect(validateEmail('@gmail.com')).toContain('không hợp lệ');
    });

    it('should pass for correctly formatted emails', () => {
      expect(validateEmail('user@example.com')).toBeNull();
      expect(validateEmail('admin.mievoh@domain.org')).toBeNull();
    });
  });

  describe('Password Field', () => {
    it('should fail if password is empty', () => {
      expect(validatePassword('')).toBe('Mật khẩu là bắt buộc');
    });

    it('should fail if password has less than 5 characters', () => {
      expect(validatePassword('1234')).toBe('Mật khẩu phải có ít nhất 5 ký tự');
    });

    it('should pass for passwords with 5 or more characters', () => {
      expect(validatePassword('12345')).toBeNull();
      expect(validatePassword('strongpass123')).toBeNull();
    });
  });
});
