import React, { useRef, useEffect, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import Button from '../../../../components/Button/Button.tsx';
import { useLanguage } from '../../../../contextAPI/LanguageContext.tsx';

interface OtpModalProps {
    isOpen: boolean;
    onClose: () => void;
    email: string;
    otpCode: string;
    setOtpCode: (code: string) => void;
    otpLoading: boolean;
    otpError: string | null;
    otpResendLoading: boolean;
    onSubmit: (e?: React.FormEvent) => void;
    onResend: () => void;
}

export default function OtpModal({
    isOpen,
    onClose,
    email,
    otpCode,
    setOtpCode,
    otpLoading,
    otpError,
    otpResendLoading,
    onSubmit,
    onResend
}: OtpModalProps) {
    const { t } = useLanguage();
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [secondsLeft, setSecondsLeft] = useState(60);

    useEffect(() => {
        if (!isOpen) return;

        // Reset timer to 60 when modal opens
        setSecondsLeft(60);

        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen]);

    if (!isOpen) return null;

    // Convert current otpCode (which is a string) to an array of 6 elements
    const otpArray = otpCode.split('').concat(Array(6).fill('')).slice(0, 6);

    const handleInputChange = (index: number, val: string) => {
        const cleanedVal = val.replace(/[^0-9]/g, '');
        if (!cleanedVal) {
            // Handle case where field is cleared
            const newOtpArray = [...otpArray];
            newOtpArray[index] = '';
            setOtpCode(newOtpArray.join(''));
            return;
        }

        const newOtpArray = [...otpArray];
        // If pasted multiple digits
        if (cleanedVal.length > 1) {
            const pastedDigits = cleanedVal.slice(0, 6 - index).split('');
            for (let i = 0; i < pastedDigits.length; i++) {
                newOtpArray[index + i] = pastedDigits[i];
            }
            const finalCode = newOtpArray.join('');
            setOtpCode(finalCode);
            // Focus on the last filled or next empty box
            const nextIndex = Math.min(index + pastedDigits.length, 5);
            inputRefs.current[nextIndex]?.focus();
        } else {
            newOtpArray[index] = cleanedVal;
            const finalCode = newOtpArray.join('');
            setOtpCode(finalCode);
            // Move to next input box
            if (index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            const newOtpArray = [...otpArray];
            if (otpArray[index] === '') {
                // If current is empty, delete previous and move back
                if (index > 0) {
                    newOtpArray[index - 1] = '';
                    setOtpCode(newOtpArray.join(''));
                    inputRefs.current[index - 1]?.focus();
                }
            } else {
                // Just delete current
                newOtpArray[index] = '';
                setOtpCode(newOtpArray.join(''));
            }
        }
    };

    const handleResendClick = () => {
        if (secondsLeft > 0 || otpResendLoading) return;
        onResend();
        setSecondsLeft(60);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-violet-950/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl border border-violet-100 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 text-violet-400 hover:text-violet-600 transition-colors p-1.5 rounded-full hover:bg-violet-50 cursor-pointer"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-5 shadow-sm border border-violet-200/50">
                        <ShieldCheck className="h-8 w-8 text-violet-600" />
                    </div>

                    <h2 className="text-2xl font-bold text-violet-950 mb-2">{t("otp_modal_title")}</h2>
                    <p className="text-sm text-violet-600/80 mb-6 max-w-sm">
                        {t("otp_modal_subtitle")}{" "}
                        <span className="font-semibold text-violet-700">{email}</span>
                    </p>

                    <form onSubmit={onSubmit} className="w-full">
                        {/* 6 Digit Inputs */}
                        <div className="flex justify-center gap-3 mb-6">
                            {Array(6)
                                .fill(null)
                                .map((_, idx) => (
                                    <input
                                        key={idx}
                                        ref={(el) => {
                                            inputRefs.current[idx] = el;
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={otpArray[idx]}
                                        onChange={(e) => handleInputChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(idx, e)}
                                        className="w-12 h-14 text-center text-xl font-extrabold text-violet-950 border border-violet-200 rounded-xl bg-violet-50/20 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all shadow-sm"
                                    />
                                ))}
                        </div>

                        {otpError && (
                            <div className="mb-5 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                                <p className="text-red-600 text-xs font-semibold">{otpError}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <Button
                                type="submit"
                                disabled={otpLoading || otpCode.length !== 6}
                                variant="primary"
                                className="w-full py-3.5 text-base shadow-[0_6px_20px_rgba(123,104,238,0.25)] rounded-xl"
                            >
                                {otpLoading ? t("otp_verifying") : t("otp_verify_btn").toUpperCase()}
                            </Button>

                            <div className="flex justify-center items-center gap-2 text-xs">
                                <span className="text-violet-600/60">Haven't received the code?</span>
                                <button
                                    type="button"
                                    onClick={handleResendClick}
                                    disabled={otpResendLoading || secondsLeft > 0}
                                    className="text-violet-600 hover:text-violet-500 font-bold underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                                >
                                    {otpResendLoading 
                                        ? t("otp_resending") 
                                        : secondsLeft > 0 
                                        ? `${t("otp_resend_btn")} (${secondsLeft}s)` 
                                        : t("otp_resend_btn")}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
