import { useLanguage } from "../contextAPI/LanguageContext.tsx";
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '../components/Toast/Toast.tsx';
import { loginUser, clearError, setAuthenticated } from '../pages/User/Login/slice.ts';
import type { AppDispatch } from '../store/index.tsx';
import { validateEmail, validatePassword, validateConfirmPassword } from '../validation/validation';
import { forgotPasswordApi, verifyResetOtpApi, resetPasswordApi } from '../axios/auth.tsx';

export interface LoginForm {
    email: string;
    password: string;
}

interface LoginSliceState {
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    user: any | null;
}

export default function useLogin(initialSliding: boolean) {
    const { t } = useLanguage();
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const [isSliding, setIsSliding] = useState(initialSliding);
    const [loginForm, setLoginForm] = useState<LoginForm>({ email: '', password: '' });
    const [showLoginPwd, setShowLoginPwd] = useState(false);

    // Forgot Password States
    const [forgotStep, setForgotStep] = useState<'none' | 'email' | 'reset'>('none');
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotNewPassword, setForgotNewPassword] = useState('');
    const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
    const [forgotErrors, setForgotErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
    const [showForgotPwd, setShowForgotPwd] = useState(false);
    const [showForgotConfirmPwd, setShowForgotConfirmPwd] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);

    // Forgot Password OTP States
    const [showForgotOtpModal, setShowForgotOtpModal] = useState(false);
    const [forgotOtpCode, setForgotOtpCode] = useState('');
    const [forgotOtpLoading, setForgotOtpLoading] = useState(false);
    const [forgotOtpError, setForgotOtpError] = useState<string | null>(null);
    const [forgotOtpResendLoading, setForgotOtpResendLoading] = useState(false);
    const [resetToken, setResetToken] = useState('');

    const { loading: loginLoading, error: loginError, isAuthenticated } = useSelector(
        (state: { login: LoginSliceState }) => state.login
    );

    useEffect(() => {
        dispatch(clearError());
        if (isAuthenticated) {
            const redirect = params.get('redirect');
            const pendingStr = localStorage.getItem('pendingBooking');
            if (pendingStr) {
                try {
                    const pending = JSON.parse(pendingStr);
                    if (pending.redirect) {
                        navigate(pending.redirect, { replace: true });
                    } else {
                        navigate('/');
                    }
                } catch {
                    navigate(redirect || '/', { replace: true });
                }
            } else {
                navigate(redirect || '/', { replace: true });
            }
        }
    }, [isAuthenticated, navigate, params, dispatch]);

    // Handle Google OAuth redirect credentials
    useEffect(() => {
        // Parse Hash parameters since we switched from ? to # for security
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const token = hashParams.get('token') || params.get('token');
        const fullName = hashParams.get('fullName') || params.get('fullName');
        const email = hashParams.get('email') || params.get('email');
        const avatar = hashParams.get('avatar') || params.get('avatar');
        const userType = hashParams.get('userType') || params.get('userType');

        if (token && email) {
            // Prevent duplicate toast/processing in StrictMode (development)
            if ((window as any).__google_oauth_processed__ === token) {
                return;
            }
            (window as any).__google_oauth_processed__ = token;

            // Check if user agent is mobile / emulator
            const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobileUA) {
                const deepLinkUrl = `mievohmobile://login?token=${token}&fullName=${encodeURIComponent(fullName || '')}&email=${email}&avatar=${encodeURIComponent(avatar || '')}&userType=${userType || 'USER'}`;
                window.location.href = deepLinkUrl;
                return;
            }

            // Write to localStorage early so API interceptor can use token
            localStorage.setItem('accessToken', token);
            localStorage.setItem('auth_isAuthenticated', 'true');
            
            // Asynchronously fetch profile to get reliable userType, then dispatch
            import('../axios/profile').then(({ getProfileApi }) => {
                getProfileApi()
                    .then(res => {
                        const profile = res.data;
                        const finalUserType = profile.userType || userType || "USER";
                        
                        const userObj = {
                            name: profile.fullName || fullName || profile.email || email,
                            email: profile.email || email,
                            fullName: profile.fullName || fullName || profile.email || email,
                            hoTen: profile.fullName || fullName || profile.email || email,
                            role: finalUserType,
                            avatar: profile.avatar || avatar || "/images/avatar.jpg",
                            token
                        };
                        localStorage.setItem('auth_user', JSON.stringify(userObj));
                        
                        // Dispatch action to update Redux store
                        dispatch(setAuthenticated(userObj));

                        toast.success(t("toast_google_login_success"));

                        // Clear query params by navigating to homepage or redirect target
                        const redirect = params.get('redirect') || '/';
                        navigate(redirect, { replace: true });
                    })
                    .catch(() => {
                        // Fallback to URL params if profile fetch fails
                        const userObj = {
                            name: fullName || email,
                            email: email,
                            fullName: fullName || email,
                            hoTen: fullName || email,
                            role: userType || "USER",
                            avatar: avatar || "/images/avatar.jpg",
                            token
                        };
                        localStorage.setItem('auth_user', JSON.stringify(userObj));
                        dispatch(setAuthenticated(userObj));
                        toast.success(t("toast_google_login_success"));
                        const redirect = params.get('redirect') || '/';
                        navigate(redirect, { replace: true });
                    });
            });
        }
    }, [params, dispatch, navigate]);

    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLoginForm(prev => ({ ...prev, [name]: value }));
    };

    const handleVerifyEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        const emailErr = validateEmail(forgotEmail);
        if (emailErr) {
            setForgotErrors({ email: emailErr });
            return;
        }
        
        setForgotLoading(true);
        setForgotErrors({});
        try {
            await forgotPasswordApi(forgotEmail);
            toast.success(t("toast_otp_sent"));
            setShowForgotOtpModal(true);
            setForgotOtpError(null);
            setForgotOtpCode('');
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Failed to verify email';
            setForgotErrors({ email: message });
        } finally {
            setForgotLoading(false);
        }
    };

    const handleVerifyForgotOtp = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (forgotOtpCode.length !== 6) {
            setForgotOtpError(t("otp_invalid_length"));
            return;
        }

        setForgotOtpLoading(true);
        setForgotOtpError(null);
        try {
            const res = await verifyResetOtpApi({
                email: forgotEmail,
                otp: forgotOtpCode
            });
            const token = res?.resetToken || (res as any)?.data?.resetToken;
            setResetToken(token || '');
            setShowForgotOtpModal(false);
            setForgotStep('reset');
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'OTP verification failed';
            setForgotOtpError(message);
        } finally {
            setForgotOtpLoading(false);
        }
    };

    const handleResendForgotOtp = async () => {
        setForgotOtpResendLoading(true);
        setForgotOtpError(null);
        try {
            await forgotPasswordApi(forgotEmail);
            toast.success(t("toast_otp_sent"));
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Failed to resend OTP';
            setForgotOtpError(message);
        } finally {
            setForgotOtpResendLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs: typeof forgotErrors = {};
        
        const newPasswordError = validatePassword(forgotNewPassword);
        if (newPasswordError) {
            errs.password = newPasswordError;
        }
        
        const confirmError = validateConfirmPassword(forgotNewPassword, forgotConfirmPassword);
        if (confirmError) {
            errs.confirmPassword = confirmError;
        }

        if (Object.keys(errs).length > 0) {
            setForgotErrors(errs);
            return;
        }

        setForgotLoading(true);
        setForgotErrors({});
        try {
            await resetPasswordApi({ resetToken, newPassword: forgotNewPassword });
            toast.success(t("toast_password_reset_success"));
            setForgotStep('none');
            setForgotEmail('');
            setForgotNewPassword('');
            setForgotConfirmPassword('');
            setResetToken('');
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Failed to reset password';
            setForgotErrors({ password: message });
        } finally {
            setForgotLoading(false);
        }
    };

    const handleLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!loginForm.email.trim()) {
            toast.error(t("toast_email_required"));
            return;
        }
        if (!loginForm.password.trim()) {
            toast.error(t("toast_password_required"));
            return;
        }
        dispatch(loginUser(loginForm))
            .unwrap()
            .then(() => {
                toast.success(t("toast_login_success"));
            })
            .catch((err: any) => {
                const message = Array.isArray(err) ? err[0] : err;
                toast.error(message || t("toast_login_failed"));
            });
    };

    const handleSwitchToRegister = () => {
        setIsSliding(true);
        const redirect = params.get('redirect');
        const redirectQuery = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';
        window.history.pushState(null, '', `/register${redirectQuery}`);
    };

    const handleSwitchToLogin = () => {
        setIsSliding(false);
        const redirect = params.get('redirect');
        const redirectQuery = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';
        window.history.pushState(null, '', `/login${redirectQuery}`);
    };

    return {
        isSliding,
        loginLoading,
        loginError,
        loginForm,
        showLoginPwd,
        setShowLoginPwd,
        forgotStep,
        setForgotStep,
        forgotEmail,
        setForgotEmail,
        forgotNewPassword,
        setForgotNewPassword,
        forgotConfirmPassword,
        setForgotConfirmPassword,
        forgotErrors,
        setForgotErrors,
        showForgotPwd,
        setShowForgotPwd,
        showForgotConfirmPwd,
        setShowForgotConfirmPwd,
        forgotLoading,
        handleVerifyEmail,
        handleResetPassword,
        handleLoginChange,
        handleLoginSubmit,
        handleSwitchToRegister,
        handleSwitchToLogin,
        // Forgot Password OTP states
        showForgotOtpModal,
        setShowForgotOtpModal,
        forgotOtpCode,
        setForgotOtpCode,
        forgotOtpLoading,
        forgotOtpError,
        forgotOtpResendLoading,
        handleVerifyForgotOtp,
        handleResendForgotOtp
    };
}
