import { Lock, Eye, EyeOff } from 'lucide-react';
import Button from '../../../../components/Button/Button.tsx';
import { useLanguage } from '../../../../contextAPI/LanguageContext.tsx';
import useLogin from '../../../../hooks/useLogin.ts';

interface ResetPasswordPanelProps {
    loginProps: ReturnType<typeof useLogin>;
    isMobile?: boolean;
}

export default function ResetPasswordPanel({ loginProps, isMobile = false }: ResetPasswordPanelProps) {
    const { t } = useLanguage();
    const {
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
        handleResetPassword,
        setForgotStep,
    } = loginProps;

    return (
        <>
            <h2 className={`${isMobile ? 'text-2xl font-bold' : 'text-4xl font-extrabold'} text-violet-950 text-center mb-1.5`}>
                {t("reset_password_title")}
            </h2>
            {!isMobile && (
                <p className="text-base text-violet-600/70 text-center mb-7">{t("reset_password_subtitle")}</p>
            )}

            <div className={`${isMobile ? 'space-y-4' : 'space-y-5'} ${isMobile ? 'mt-4' : ''}`}>
                <div>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-500">
                            <Lock className={`${isMobile ? 'h-4 w-4' : 'h-4.5 w-4.5'}`} />
                        </span>
                        <input
                            name="forgotNewPassword"
                            type={showForgotPwd ? "text" : "password"}
                            required
                            value={forgotNewPassword}
                            onChange={(e) => {
                                setForgotNewPassword(e.target.value);
                                setForgotErrors({});
                            }}
                            className={`w-full ${isMobile ? 'pl-10 pr-10 py-3 text-base' : 'pl-11 pr-11 py-3.5 text-lg'} rounded-xl border border-violet-100 bg-violet-50/20 text-violet-950 placeholder-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all`}
                            placeholder={t("new_password")}
                        />
                        <button
                            type="button"
                            onClick={() => setShowForgotPwd(!showForgotPwd)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-violet-400 hover:text-violet-600 transition-colors"
                        >
                            {showForgotPwd ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5 text-violet-600" />}
                        </button>
                    </div>
                    {forgotErrors.password && (
                        <p className="mt-1.5 ml-1 text-2xs text-violet-950 flex items-center gap-1 font-semibold">
                            <span>⚠️</span> {forgotErrors.password}
                        </p>
                    )}
                </div>

                <div>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-500">
                            <Lock className={`${isMobile ? 'h-4 w-4' : 'h-4.5 w-4.5'}`} />
                        </span>
                        <input
                            name="forgotConfirmPassword"
                            type={showForgotConfirmPwd ? "text" : "password"}
                            required
                            value={forgotConfirmPassword}
                            onChange={(e) => {
                                setForgotConfirmPassword(e.target.value);
                                setForgotErrors({});
                            }}
                            className={`w-full ${isMobile ? 'pl-10 pr-10 py-3 text-base' : 'pl-11 pr-11 py-3.5 text-lg'} rounded-xl border border-violet-100 bg-violet-50/20 text-violet-950 placeholder-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all`}
                            placeholder={t("confirm_new_password")}
                        />
                        <button
                            type="button"
                            onClick={() => setShowForgotConfirmPwd(!showForgotConfirmPwd)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-violet-400 hover:text-violet-600 transition-colors"
                        >
                            {showForgotConfirmPwd ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5 text-violet-600" />}
                        </button>
                    </div>
                    {forgotErrors.confirmPassword && (
                        <p className="mt-1.5 ml-1 text-2xs text-violet-950 flex items-center gap-1 font-semibold">
                            <span>⚠️</span> {forgotErrors.confirmPassword}
                        </p>
                    )}
                </div>
            </div>

            <div className={`${isMobile ? 'mt-5' : 'mt-6'} flex flex-col gap-3`}>
                <Button
                    onClick={handleResetPassword}
                    disabled={forgotLoading}
                    variant="primary"
                    className={`w-full shadow-[0_6px_20px_rgba(123,104,238,0.25)] ${isMobile ? 'py-3 text-sm' : 'py-3.5 text-base'}`}
                >
                    {forgotLoading ? t("resetting") : t("reset_password_btn").toUpperCase()}
                </Button>
                <button
                    type="button"
                    onClick={() => setForgotStep('none')}
                    className={`text-violet-600 hover:text-violet-500 font-semibold underline cursor-pointer ${isMobile ? 'text-xs' : 'text-sm'}`}
                >
                    {t("back_to_sign_in")}
                </button>
            </div>
        </>
    );
}
