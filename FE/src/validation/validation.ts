const getLang = () => localStorage.getItem("language") || "vi";


export const validateEmail = (email: string): string | null => {
    const isVi = getLang() === "vi";
    if (!email.trim()) {
        return isVi ? "Email là bắt buộc" : "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return isVi 
            ? "Địa chỉ email không hợp lệ (ví dụ: example@gmail.com)" 
            : "Invalid email address (e.g. example@gmail.com)";
    }
    return null;
};

export const validatePhone = (phone: string): string | null => {
    const isVi = getLang() === "vi";
    if (!phone.trim()) {
        return isVi ? "Số điện thoại là bắt buộc" : "Phone number is required";
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.trim())) {
        return isVi ? "Số điện thoại phải có đúng 10 chữ số" : "Phone number must be exactly 10 digits";
    }
    return null;
};

export const validateName = (name: string): string | null => {
    const isVi = getLang() === "vi";
    if (!name.trim()) {
        return isVi ? "Họ và tên là bắt buộc" : "Full name is required";
    }
    return null;
};

export const validatePassword = (password: string): string | null => {
    const isVi = getLang() === "vi";
    if (!password) {
        return isVi ? "Mật khẩu là bắt buộc" : "Password is required";
    }
    if (password.length < 5) {
        return isVi ? "Mật khẩu phải có ít nhất 5 ký tự" : "Password must be at least 5 characters";
    }
    return null;
};

export const validateConfirmPassword = (password: string, confirm: string): string | null => {
    const isVi = getLang() === "vi";
    if (!confirm) {
        return isVi ? "Xác nhận mật khẩu là bắt buộc" : "Confirm password is required";
    }
    if (password !== confirm) {
        return isVi ? "Mật khẩu xác nhận không khớp" : "Passwords do not match";
    }
    return null;
};

export const validateDateOfBirth = (dobString: string): string | null => {
    const isVi = getLang() === "vi";
    if (!dobString.trim()) return null; // Date of birth is optional
    const parts = dobString.trim().split(/[-/.]/);
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
        return isVi ? "Vui lòng điền ngày, tháng và năm" : "Please fill day, month, and year";
    }
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const dob = new Date(year, month, day);
    if (isNaN(day) || isNaN(month) || isNaN(year) || dob.getFullYear() !== year || dob.getMonth() !== month || dob.getDate() !== day) {
        return isVi ? "Ngày sinh không hợp lệ" : "Invalid date of birth";
    }
    return null;
};

export const validateCccd = (cccd: string): string | null => {
    const isVi = getLang() === "vi";
    if (!cccd.trim()) return null; // CCCD is optional
    const hasNonDigits = /[^0-9]/.test(cccd.trim());
    if (hasNonDigits) {
        return isVi ? "CCCD chỉ được chứa các chữ số" : "CCCD must contain only digits";
    }
    if (cccd.trim().length !== 12) {
        return isVi ? "CCCD phải có đúng 12 chữ số" : "CCCD must be exactly 12 digits";
    }
    return null;
};
