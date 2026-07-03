import {
    Mail,
    Lock,
    Eye,
    EyeOff
} from 'lucide-react';
import Button from '../../../../components/Button/Button.tsx';
import useLogin from '../../../../hooks/useLogin.ts';
import { redirectToGoogleApi } from '../../../../axios/auth.tsx';
import { useLanguage } from '../../../../contextAPI/LanguageContext.tsx';
import ForgotEmailPanel from '../Forgot/ForgotEmailPanel.tsx';
import ResetPasswordPanel from '../Forgot/ResetPasswordPanel.tsx';

interface MobileSigninPanelProps {
    loginProps: ReturnType<typeof useLogin>;
    handleSwitchToRegister: () => void;
}

export default function MobileSigninPanel({ loginProps, handleSwitchToRegister }: MobileSigninPanelProps) {
    const { t } = useLanguage();

    const {
        loginLoading,
        loginError,
        loginForm,
        showLoginPwd,
        setShowLoginPwd,
        forgotStep,
        setForgotStep,
        handleLoginChange,
        handleLoginSubmit,
    } = loginProps;

    return (
        <div className="w-full bg-white/95 backdrop-blur-xl border border-violet-100 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <form
                onSubmit={handleLoginSubmit}
                noValidate
            >
                <div className="flex flex-col items-center mb-6">
                    <img src="/images/mievoh_logo.png" alt="Mievoh Logo" className="h-14 w-14 rounded-full object-cover mb-2 shadow-sm border border-violet-100" />
                    <span className="logo-text-gradient h-32 w-auto my-[-3.2rem]" aria-label="Mievoh" />
                    <p className="text-xs text-violet-600/80">{t("sign_in_subtitle")}</p>
                </div>

                {forgotStep === 'email' ? (
                    <ForgotEmailPanel loginProps={loginProps} isMobile={true} />
                ) : forgotStep === 'reset' ? (
                    <ResetPasswordPanel loginProps={loginProps} isMobile={true} />
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-violet-950 mb-5 text-center">{t("sign_in_title")}</h2>

                        <div className="space-y-4">
                            <div className="relative">
                                <span className="absolute left-3 top-3.5 text-violet-500">
                                    <Mail className="h-4 w-4" />
                                </span>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    value={loginForm.email}
                                    onChange={handleLoginChange}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-violet-100 bg-violet-50/20 text-violet-950 text-base placeholder-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
                                    placeholder={t("email_address")}
                                />
                            </div>

                            <div className="relative">
                                <span className="absolute left-3 top-3.5 text-violet-500">
                                    <Lock className="h-4 w-4" />
                                </span>
                                <input
                                    name="password"
                                    type={showLoginPwd ? "text" : "password"}
                                    required
                                    value={loginForm.password}
                                    onChange={handleLoginChange}
                                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-violet-100 bg-violet-50/20 text-violet-950 text-base placeholder-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
                                    placeholder={t("password")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowLoginPwd(!showLoginPwd)}
                                    className="absolute right-3 top-3 text-violet-400 hover:text-violet-600 transition-colors"
                                >
                                    {showLoginPwd ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                                </button>
                            </div>

                            {/* Forgot Password Link */}
                            <div className="flex justify-end mt-2">
                                <a
                                    href="#forgot-password"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setForgotStep('email');
                                    }}
                                    className="text-xs text-violet-600 hover:text-violet-500 font-semibold underline cursor-pointer"
                                >
                                    {t("forgot_password")}
                                </a>
                            </div>
                        </div>

                        {loginError && (
                            <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-center">
                                <p className="text-red-600 text-xs">{loginError}</p>
                            </div>
                        )}

                        <div className="mt-5">
                            <Button
                                type="submit"
                                disabled={loginLoading}
                                variant="primary"
                                className="w-full shadow-[0_6px_20px_rgba(123,104,238,0.25)] py-3 text-sm"
                            >
                                {loginLoading ? t("signing_in") : t("sign_in_title").toUpperCase()}
                            </Button>
                        </div>

                        {/* Google Sign In Divider & Button */}
                        <div className="relative my-4 flex items-center">
                            <div className="flex-grow border-t border-violet-100"></div>
                            <span className="flex-shrink mx-3 text-2xs text-violet-400 uppercase tracking-wider font-semibold bg-white px-2">{t("or_divider")}</span>
                            <div className="flex-grow border-t border-violet-100"></div>
                        </div>

                        <button
                            type="button"
                            onClick={() => redirectToGoogleApi()}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-violet-200 hover:border-violet-300 hover:bg-violet-50/10 text-violet-700 font-bold transition-all text-sm cursor-pointer"
                        >
                            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
                                <path
                                    fill="#EA4335"
                                    d="M12 5.04c1.74 0 3.3.6 4.53 1.78l3.39-3.39C17.9 1.48 15.15.5 12 .5 7.37.5 3.38 3.16 1.48 7.06l3.96 3.07C6.39 7.07 9 5.04 12 5.04z"
                                />
                                <path
                                    fill="#4285F4"
                                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.46h6.44c-.28 1.47-1.11 2.71-2.35 3.55l3.66 2.84c2.14-1.97 3.74-4.88 3.74-8.5z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.44 14.93c-.24-.71-.38-1.47-.38-2.26s.14-1.55.38-2.26L1.48 7.34C.53 9.24 0 11.36 0 13.5s.53 4.26 1.48 6.16l3.96-3.07z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23.5c3.24 0 5.97-1.07 7.96-2.92l-3.66-2.84c-1.01.68-2.31 1.08-3.76 1.08-3 0-5.54-2.03-6.44-4.79L1.48 17.1c1.9 3.9 5.89 6.4 10.52 6.4z"
                                />
                            </svg>
                            {t("sign_in_google")}
                        </button>
                    </>
                )}
            </form>

            <div className="mt-6 text-center text-sm">
                <span className="text-violet-600/60">New to Mievoh?</span>
                <button
                    onClick={handleSwitchToRegister}
                    className="ml-1.5 text-violet-600 hover:text-violet-500 font-semibold underline cursor-pointer"
                >
                    Sign up now
                </button>
            </div>
        </div>
    );
}
