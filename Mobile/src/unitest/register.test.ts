import {
  validateName,
  validateEmail,
  validatePhone,
  validatePassword,
  validateConfirmPassword,
  validateDateOfBirth,
  validateCccd,
  setValidationLanguage,
} from '../validation/validation';

describe('Registration Validation Tests', () => {
  beforeEach(() => {
    setValidationLanguage('vi');
  });

  describe('Full Name Field', () => {
    it('should fail if name is empty', () => {
      expect(validateName('')).toBe('Họ và tên là bắt buộc');
      expect(validateName('   ')).toBe('Họ và tên là bắt buộc');
    });

    it('should pass for a valid name', () => {
      expect(validateName('Nguyen Van A')).toBeNull();
    });
  });

  describe('Email Field', () => {
    it('should fail if email is empty', () => {
      expect(validateEmail('')).toBe('Email là bắt buộc');
    });

    it('should pass for valid email', () => {
      expect(validateEmail('newuser@mievoh.com')).toBeNull();
    });
  });

  describe('Phone Number Field', () => {
    it('should fail if phone is empty', () => {
      expect(validatePhone('')).toBe('Số điện thoại là bắt buộc');
    });

    it('should fail if phone number is not exactly 10 digits', () => {
      expect(validatePhone('123456789')).toContain('10 chữ số');
      expect(validatePhone('12345678901')).toContain('10 chữ số');
    });

    it('should fail if phone number contains letters', () => {
      expect(validatePhone('091234567a')).toContain('10 chữ số');
    });

    it('should pass for a valid 10-digit number', () => {
      expect(validatePhone('0987654321')).toBeNull();
    });
  });

  describe('Password & Confirm Password Fields', () => {
    it('should fail if password is too short', () => {
      expect(validatePassword('123')).toBe('Mật khẩu phải có ít nhất 5 ký tự');
    });

    it('should fail if confirm password is empty', () => {
      expect(validateConfirmPassword('password123', '')).toBe('Xác nhận mật khẩu là bắt buộc');
    });

    it('should fail if confirm password does not match password', () => {
      expect(validateConfirmPassword('password123', 'password321')).toBe('Mật khẩu xác nhận không khớp');
    });

    it('should pass if confirm password matches password', () => {
      expect(validateConfirmPassword('password123', 'password123')).toBeNull();
    });
  });

  describe('Date of Birth Field (Optional)', () => {
    it('should pass if empty', () => {
      expect(validateDateOfBirth('')).toBeNull();
    });

    it('should fail if format is not DD/MM/YYYY or DD-MM-YYYY', () => {
      expect(validateDateOfBirth('01/01')).toContain('ngày, tháng và năm');
      expect(validateDateOfBirth('2000/01')).toContain('ngày, tháng và năm');
    });

    it('should fail if date values are invalid', () => {
      expect(validateDateOfBirth('30/02/2000')).toBe('Ngày sinh không hợp lệ');
      expect(validateDateOfBirth('31/06/1999')).toBe('Ngày sinh không hợp lệ');
      expect(validateDateOfBirth('2000/01/01')).toBe('Ngày sinh không hợp lệ'); // splits but results in invalid values for day/year
    });

    it('should pass for a valid date of birth', () => {
      expect(validateDateOfBirth('29/02/2004')).toBeNull(); // Leap year
      expect(validateDateOfBirth('15/08/1998')).toBeNull();
    });
  });

  describe('CCCD Field (Optional)', () => {
    it('should pass if empty', () => {
      expect(validateCccd('')).toBeNull();
    });

    it('should fail if CCCD is not exactly 12 digits', () => {
      expect(validateCccd('12345678901')).toBe('CCCD phải có đúng 12 chữ số');
    });

    it('should fail if CCCD contains letters', () => {
      expect(validateCccd('01234567890a')).toBe('CCCD chỉ được chứa các chữ số');
    });

    it('should pass for a valid 12-digit CCCD', () => {
      expect(validateCccd('030200123456')).toBeNull();
    });
  });
});
