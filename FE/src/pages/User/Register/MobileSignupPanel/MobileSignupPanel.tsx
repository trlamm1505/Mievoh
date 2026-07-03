import {
    User,
    Lock,
    Mail,
    Phone,
    Eye,
    EyeOff
} from 'lucide-react';
import Button from '../../../../components/Button/Button.tsx';
import useRegister from '../../../../hooks/useRegister.ts';
import { useLanguage } from '../../../../contextAPI/LanguageContext.tsx';

interface MobileSignupPanelProps {
    registerProps: ReturnType<typeof useRegister>;
    handleSwitchToLogin: () => void;
}

export default function MobileSignupPanel({ registerProps, handleSwitchToLogin }: MobileSignupPanelProps) {
    const { t } = useLanguage();

    const {
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
        isXacNhanMatKhauValid
    } = registerProps;

    return (
        <div className="w-full bg-white/95 backdrop-blur-xl border border-violet-100 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <form onSubmit={handleRegisterSubmit} noValidate>
                <div className="flex flex-col items-center mb-6">
                    <img src="/images/mievoh_logo.png" alt="Mievoh Logo" className="h-14 w-14 rounded-full object-cover mb-2 shadow-sm border border-violet-100" />
                    <span className="logo-text-gradient h-32 w-auto my-[-3.2rem]" aria-label="Mievoh" />
                    <p className="text-xs text-violet-600/80">{t("sign_up_subtitle")}</p>
                </div>

                <h2 className="text-2xl font-bold text-violet-950 mb-5 text-center">{t("sign_up_title")}</h2>

                <div className="space-y-4">
                    {/* Họ Tên */}
                    <div>
                        <div className="relative">
                            <span className="absolute left-3.5 top-3.5 text-violet-500">
                                <User className="h-5 w-5" />
                            </span>
                            <input
                                name="hoTen"
                                type="text"
                                required
                                value={registerForm.hoTen}
                                onChange={handleRegisterChange}
                                className={`w-full pl-12 pr-4 py-3.5 rounded-xl border bg-violet-50/20 text-violet-950 text-base placeholder-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all ${registerForm.hoTen && errors.hoTen ? 'border-violet-300 focus:border-violet-500' : 'border-violet-100 focus:border-violet-400'
                                    }`}
                                placeholder={t("full_name")}
                            />
                        </div>
                        {errors.hoTen && (
                            <p className="mt-1 ml-1 text-2xs text-violet-950 flex items-center gap-1 font-semibold">
                                <span>⚠️</span> {errors.hoTen}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <div className="relative">
                            <span className="absolute left-3.5 top-3.5 text-violet-500">
                                <Mail className="h-5 w-5" />
                            </span>
                            <input
                                name="email"
                                type="email"
                                required
                                disabled={!isHoTenValid}
                                value={registerForm.email}
                                onChange={handleRegisterChange}
                                className={`w-full pl-12 pr-4 py-3.5 rounded-xl border bg-violet-50/20 text-violet-950 text-base placeholder-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-violet-100/10 ${registerForm.email && (errors.email || emailTaken) ? 'border-violet-300 focus:border-violet-500' : 'border-violet-100 focus:border-violet-400'
                                    }`}
                                placeholder={t("email_address")}
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-1 ml-1 text-2xs text-violet-950 flex items-center gap-1 font-semibold">
                                <span>⚠️</span> {errors.email}
                            </p>
                        )}
                        {!errors.email && emailTaken && (
                            <p className="mt-1 ml-1 text-2xs text-violet-950 flex items-center gap-1 font-semibold">
                                <span>⚠️</span> {t("email_registered")}
                            </p>
                        )}
                    </div>

                    {/* Số điện thoại */}
                    <div>
                        <div className="relative">
                            <span className="absolute left-3.5 top-3.5 text-violet-500">
                                <Phone className="h-5 w-5" />
                            </span>
                            <input
                                name="soDT"
                                type="tel"
                                required
                                disabled={!isEmailValid}
                                value={registerForm.soDT}
                                onChange={handleRegisterChange}
                                className={`w-full pl-12 pr-4 py-3.5 rounded-xl border bg-violet-50/20 text-violet-950 text-base placeholder-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-violet-100/10 ${registerForm.soDT && errors.soDT ? 'border-violet-300 focus:border-violet-500' : 'border-violet-100 focus:border-violet-400'
                                    }`}
                                placeholder={t("phone_number")}
                            />
                        </div>
                        {errors.soDT && (
                            <p className="mt-1 ml-1 text-2xs text-violet-950 flex items-center gap-1 font-semibold">
                                <span>⚠️</span> {errors.soDT}
                            </p>
                        )}
                    </div>

                    {/* Mật khẩu */}
                    <div>
                        <div className="relative">
                            <span className="absolute left-3.5 top-3.5 text-violet-500">
                                <Lock className="h-5 w-5" />
                            </span>
                            <input
                                name="matKhau"
                                type={showRegPwd ? "text" : "password"}
                                required
                                disabled={!isSoDTValid}
                                value={registerForm.matKhau}
                                onChange={handleRegisterChange}
                                className={`w-full pl-12 pr-11 py-3.5 rounded-xl border bg-violet-50/20 text-violet-950 text-base placeholder-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-violet-100/10 ${registerForm.matKhau && errors.matKhau ? 'border-violet-300 focus:border-violet-500' : 'border-violet-100 focus:border-violet-400'
                                    }`}
                                placeholder={t("password")}
                            />
                            <button
                                type="button"
                                disabled={!isSoDTValid}
                                onClick={() => setShowRegPwd(!showRegPwd)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-violet-400 hover:text-violet-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                {showRegPwd ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                            </button>
                        </div>
                        {errors.matKhau && (
                            <p className="mt-1 ml-1 text-2xs text-violet-950 flex items-center gap-1 font-semibold">
                                <span>⚠️</span> {errors.matKhau}
                            </p>
                        )}
                    </div>

                    {/* Xác nhận mật khẩu */}
                    <div>
                        <div className="relative">
                            <span className="absolute left-3.5 top-3.5 text-violet-500">
                                <Lock className="h-5 w-5" />
                            </span>
                            <input
                                name="xacNhanMatKhau"
                                type={showRegConfirmPwd ? "text" : "password"}
                                required
                                disabled={!isMatKhauValid}
                                value={registerForm.xacNhanMatKhau}
                                onChange={handleRegisterChange}
                                className={`w-full pl-12 pr-11 py-3.5 rounded-xl border bg-violet-50/20 text-violet-950 text-base placeholder-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-violet-100/10 ${registerForm.xacNhanMatKhau && errors.xacNhanMatKhau ? 'border-violet-300 focus:border-violet-500' : 'border-violet-100 focus:border-violet-400'
                                    }`}
                                placeholder={t("confirm_password")}
                            />
                            <button
                                type="button"
                                disabled={!isMatKhauValid}
                                onClick={() => setShowRegConfirmPwd(!showRegConfirmPwd)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-violet-400 hover:text-violet-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                {showRegConfirmPwd ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                            </button>
                        </div>
                        {errors.xacNhanMatKhau && (
                            <p className="mt-1 ml-1 text-2xs text-violet-950 flex items-center gap-1 font-semibold">
                                <span>⚠️</span> {errors.xacNhanMatKhau}
                            </p>
                        )}
                    </div>
                </div>

                {regError && (
                    <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-center">
                        <p className="text-red-600 text-xs">{regError}</p>
                    </div>
                )}

                <div className="mt-5">
                    <Button
                        type="submit"
                        disabled={regLoading || !isXacNhanMatKhauValid}
                        variant="primary"
                        className="w-full shadow-[0_6px_20px_rgba(123,104,238,0.25)] py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {regLoading ? t("signing_up") : t("sign_up_title").toUpperCase()}
                    </Button>
                </div>
            </form>

            <div className="mt-6 text-center text-sm">
                <span className="text-violet-600/60">Already have an account?</span>
                <button
                    onClick={handleSwitchToLogin}
                    className="ml-1.5 text-violet-600 hover:text-violet-500 font-semibold underline cursor-pointer"
                >
                    Sign in here
                </button>
            </div>
        </div>
    );
}
