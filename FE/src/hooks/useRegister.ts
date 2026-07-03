import { useLanguage } from "../contextAPI/LanguageContext.tsx";
import React, { useState, useEffect } from 'react';
import { toast } from '../components/Toast/Toast.tsx';
import { sendRegisterOtpApi, verifyRegisterOtpApi } from '../axios/auth.tsx';
import { 
    validateEmail, 
    validatePhone, 
    validateName, 
    validatePassword, 
    validateConfirmPassword 
} from '../validation/validation';

export interface RegisterForm {
    matKhau: string;
    xacNhanMatKhau: string;
    email: string;
    hoTen: string;
    soDT: string;
}

export interface FormErrors {
    email?: string;
    matKhau?: string;
    xacNhanMatKhau?: string;
    hoTen?: string;
    soDT?: string;
}

export default function useRegister(onRegisterSuccess: () => void) {
    const { t } = useLanguage();
    const [regLoading, setRegLoading] = useState(false);
    const [regError, setRegError] = useState<string | null>(null);
    const [regSuccess, setRegSuccess] = useState(false);
    const [emailTaken, setEmailTaken] = useState(false);

    const [registerForm, setRegisterForm] = useState<RegisterForm>({
        matKhau: '',
        xacNhanMatKhau: '',
        email: '',
        hoTen: '',
        soDT: ''
    });

    const [errors, setErrors] = useState<FormErrors>({});

    const [showRegPwd, setShowRegPwd] = useState(false);
    const [showRegConfirmPwd, setShowRegConfirmPwd] = useState(false);

    // OTP states
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState<string | null>(null);
    const [otpResendLoading, setOtpResendLoading] = useState(false);

    useEffect(() => {
        if (regSuccess) {
            const timer = setTimeout(() => {
                onRegisterSuccess();
                setRegSuccess(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [regSuccess, onRegisterSuccess]);

    const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        let filteredValue = value;
        if (name === 'soDT') {
            filteredValue = value.replace(/[^0-9]/g, "");
        }

        setRegisterForm(prev => ({ ...prev, [name]: filteredValue }));
        validateField(name as keyof RegisterForm, filteredValue);

        if (name === 'email') {
            if (filteredValue && validateEmail(filteredValue) === null) {
                checkEmailExists(filteredValue);
            } else {
                setEmailTaken(false);
            }
        }
    };

    const validateField = (fieldName: keyof RegisterForm, value: string) => {
        const newErrors: FormErrors = { ...errors };

        switch (fieldName) {
            case 'matKhau': {
                const err = validatePassword(value);
                if (err) newErrors.matKhau = err;
                else delete newErrors.matKhau;
                
                if (registerForm.xacNhanMatKhau) {
                    const confirmErr = validateConfirmPassword(value, registerForm.xacNhanMatKhau);
                    if (confirmErr) newErrors.xacNhanMatKhau = confirmErr;
                    else delete newErrors.xacNhanMatKhau;
                }
                break;
            }
            case 'xacNhanMatKhau': {
                const confirmErr = validateConfirmPassword(registerForm.matKhau, value);
                if (confirmErr) newErrors.xacNhanMatKhau = confirmErr;
                else delete newErrors.xacNhanMatKhau;
                break;
            }
            case 'email': {
                const err = validateEmail(value);
                if (err) newErrors.email = err;
                else delete newErrors.email;
                break;
            }
            case 'hoTen': {
                const err = validateName(value);
                if (err) newErrors.hoTen = err;
                else delete newErrors.hoTen;
                break;
            }
            case 'soDT': {
                const err = validatePhone(value);
                if (err) newErrors.soDT = err;
                else delete newErrors.soDT;
                break;
            }
            default:
                break;
        }

        setErrors(newErrors);
    };

    const validateRegisterForm = () => {
        const newErrors: FormErrors = {};

        const nameErr = validateName(registerForm.hoTen);
        if (nameErr) newErrors.hoTen = nameErr;

        const emailErr = validateEmail(registerForm.email);
        if (emailErr) newErrors.email = emailErr;

        const phoneErr = validatePhone(registerForm.soDT);
        if (phoneErr) newErrors.soDT = phoneErr;

        const passwordErr = validatePassword(registerForm.matKhau);
        if (passwordErr) newErrors.matKhau = passwordErr;

        const confirmErr = validateConfirmPassword(registerForm.matKhau, registerForm.xacNhanMatKhau);
        if (confirmErr) newErrors.xacNhanMatKhau = confirmErr;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const checkEmailExists = async (_emailStr: string) => {
        // Disabled real-time check since backend validates user existence during submit
        setEmailTaken(false);
    };

    const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateRegisterForm()) return;

        setRegLoading(true);
        setRegError(null);
        try {
            await sendRegisterOtpApi({
                fullName: registerForm.hoTen,
                email: registerForm.email,
                phoneNumber: registerForm.soDT,
                password: registerForm.matKhau
            });
            setShowOtpModal(true);
            setOtpError(null);
            setOtpCode('');
            toast.success(t("toast_otp_sent"));
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.message || "Failed to send OTP";
            setRegError(errorMessage);
        } finally {
            setRegLoading(false);
        }
    };

    const handleVerifyOtpSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (otpCode.length !== 6) {
            setOtpError(t("otp_invalid_length"));
            return;
        }

        setOtpLoading(true);
        setOtpError(null);
        try {
            await verifyRegisterOtpApi({
                email: registerForm.email,
                otp: otpCode
            });
            setShowOtpModal(false);
            setRegSuccess(true);
            toast.success(t("toast_register_success"));
            setRegisterForm({
                matKhau: '',
                xacNhanMatKhau: '',
                email: '',
                hoTen: '',
                soDT: ''
            });
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.message || "OTP verification failed";
            setOtpError(errorMessage);
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setOtpResendLoading(true);
        setOtpError(null);
        try {
            await sendRegisterOtpApi({
                fullName: registerForm.hoTen,
                email: registerForm.email,
                phoneNumber: registerForm.soDT,
                password: registerForm.matKhau
            });
            toast.success(t("toast_otp_sent"));
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.message || "Failed to resend OTP";
            setOtpError(errorMessage);
        } finally {
            setOtpResendLoading(false);
        }
    };

    const isHoTenValid = registerForm.hoTen.trim() !== '' && !errors.hoTen;
    const isEmailValid = isHoTenValid && registerForm.email.trim() !== '' && !errors.email && !emailTaken;
    const isSoDTValid = isEmailValid && registerForm.soDT.trim() !== '' && !errors.soDT;
    const isMatKhauValid = isSoDTValid && registerForm.matKhau.trim() !== '' && !errors.matKhau;
    const isXacNhanMatKhauValid = isMatKhauValid && registerForm.xacNhanMatKhau.trim() !== '' && !errors.xacNhanMatKhau;

    return {
        regLoading,
        regError,
        emailTaken,
        registerForm,
        errors,
        showRegPwd,
        setShowRegPwd,
        showRegConfirmPwd,
        setShowRegConfirmPwd,
        handleRegisterChange,
        handleRegisterSubmit,
        isHoTenValid,
        isEmailValid,
        isSoDTValid,
        isMatKhauValid,
        isXacNhanMatKhauValid,
        // OTP properties
        showOtpModal,
        setShowOtpModal,
        otpCode,
        setOtpCode,
        otpLoading,
        otpError,
        setOtpError,
        otpResendLoading,
        handleVerifyOtpSubmit,
        handleResendOtp
    };
}
