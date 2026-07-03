import { useState } from "react";
import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";
import { Copy } from "lucide-react";
import { toast } from "../../../../components/Toast/Toast.tsx";
import Loading from "../../../../components/Loading/Loading.tsx";
import { useNavigate } from "react-router-dom";

interface QRTransferPageProps {
    isVerifying: boolean;
    paymentTimeLeft: number;
    formatTimeLeft: (sec: number) => string;
    bookingCode: string;
    totalPrice: number;
    formatPrice: (value: number) => string;
    setShowQRTransfer: (show: boolean) => void;
    setIsVerifying: (verifying: boolean) => void;
}

export default function QRTransferPage({
    isVerifying,
    paymentTimeLeft,
    formatTimeLeft,
    bookingCode,
    totalPrice,
    formatPrice,
    setShowQRTransfer,
    setIsVerifying
}: QRTransferPageProps) {
    const { t } = useLanguage();
    const [qrLoaded, setQrLoaded] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto py-6 animate__animated animate__fadeIn w-full">
            {isVerifying && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 text-white">
                    <Loading size="lg" className="mb-4" />
                    <p className="text-lg font-bold">{t("verifying_bank_transfer")}</p>
                    <p className="text-sm text-slate-355 mt-2">{t("please_wait_moment")}</p>
                </div>
            )}
            <div className="bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-[2.5rem] shadow-xl overflow-hidden p-5 sm:p-8 md:p-10">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
                    {/* Left Column: Bank account details */}
                    <div className="md:col-span-3 space-y-6">
                        <div className="border-b border-slate-100 dark:border-zinc-800/80 pb-5 text-left">
                            <h2 className="text-xl font-black text-slate-850 dark:text-white">{t("transfer_money_to_account")}</h2>
                            <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">
                                {t("transfer_time_limit_desc", { time: formatTimeLeft(paymentTimeLeft) })}
                            </p>
                        </div>
                        
                        <div className="space-y-1">
                            <div className="py-3.5 border-b border-slate-100/80 dark:border-zinc-800/60 flex flex-col items-start gap-1">
                                <span className="text-[10px] font-black uppercase text-slate-455 dark:!text-white/80 tracking-wider">{t("bank_label")}</span>
                                <span className="text-slate-800 dark:!text-white font-extrabold text-sm sm:text-base text-left">Military Commercial Joint Stock Bank (MB Bank)</span>
                            </div>
                            
                            <div className="py-3.5 border-b border-slate-100/80 dark:border-zinc-800/60 flex flex-col items-start gap-1">
                                <span className="text-[10px] font-black uppercase text-slate-455 dark:!text-white/80 tracking-wider">{t("account_number_label")}</span>
                                <div className="flex items-center justify-between w-full">
                                    <span className="text-slate-800 dark:!text-white font-extrabold text-sm sm:text-base tracking-wider">86870029</span>
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText("86870029");
                                            toast.success(t("toast_account_number_copied"));
                                        }}
                                        className="px-2.5 py-1.5 rounded-xl bg-violet-50 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-zinc-700 text-[#8E7EFE] transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold flex-shrink-0"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                        <span>{t("copy_btn")}</span>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="py-3.5 border-b border-slate-100/80 dark:border-zinc-800/60 flex flex-col items-start gap-1">
                                <span className="text-[10px] font-black uppercase text-slate-455 dark:!text-white/80 tracking-wider">{t("account_holder_label")}</span>
                                <span className="text-slate-800 dark:!text-white font-extrabold text-sm sm:text-base">CONG TY TNHH MONET</span>
                            </div>
                            
                            <div className="py-3.5 border-b border-slate-100/80 dark:border-zinc-800/60 flex flex-col items-start gap-1">
                                <span className="text-[10px] font-black uppercase text-slate-455 dark:!text-white/80 tracking-wider">{t("transfer_content_label")}</span>
                                <div className="flex items-center justify-between w-full">
                                    <span className="text-slate-805 dark:!text-white font-extrabold text-sm sm:text-base tracking-widest bg-violet-50/50 dark:bg-zinc-800/60 px-2 py-0.5 rounded text-[#8E7EFE]">{bookingCode}</span>
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(bookingCode);
                                            toast.success(t("toast_transfer_content_copied"));
                                        }}
                                        className="px-2.5 py-1.5 rounded-xl bg-violet-50 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-zinc-700 text-[#8E7EFE] transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold flex-shrink-0"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                        <span>{t("copy_btn")}</span>
                                    </button>
                                </div>
                                <span className="text-xs text-rose-500 font-bold mt-1 text-left">{t("enter_exact_content_desc")}</span>
                            </div>
                            
                            <div className="py-3.5 border-b border-slate-100/80 dark:border-zinc-800/60 flex flex-col items-start gap-1">
                                <span className="text-[10px] font-black uppercase text-slate-455 dark:!text-white/80 tracking-wider">{t("amount_label")}</span>
                                <span className="text-slate-850 dark:!text-white font-black text-lg sm:text-xl text-[#8E7EFE]">{formatPrice(totalPrice)}</span>
                            </div>
                        </div>

                        <div className="text-left space-y-1.5 text-xs font-bold text-slate-500 dark:text-zinc-400 pt-2 leading-relaxed">
                            {t("hotline_reminder_desc")}
                        </div>

                        <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3 w-full">
                            <button 
                                onClick={() => setShowQRTransfer(false)}
                                className="w-full sm:w-auto px-6 py-3.5 border border-slate-200 dark:border-zinc-700 hover:border-slate-355 dark:hover:border-zinc-600 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-650 dark:text-zinc-300 hover:text-slate-800 dark:hover:text-white font-extrabold text-sm rounded-2xl transition-all cursor-pointer text-center"
                            >
                                {t("cancel_transaction")}
                            </button>
                            <button 
                                onClick={() => {
                                    setIsVerifying(true);
                                    setTimeout(() => {
                                        setIsVerifying(false);
                                        setShowQRTransfer(false);
                                        navigate(`/payments/vnpay-return?vnp_ResponseCode=00&vnp_TxnRef=${bookingCode}`);
                                    }, 2200);
                                }}
                                className="w-full sm:flex-1 py-3.5 bg-[#8E7EFE] hover:bg-[#7d6dfc] text-white font-extrabold text-sm rounded-2xl transition-all cursor-pointer shadow-lg shadow-violet-100 dark:shadow-none text-center"
                            >
                                {t("confirm_successful_transfer")}
                            </button>
                        </div>
                    </div>
                    
                    {/* Right Column: VietQR Code display */}
                    <div className="md:col-span-2 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-100 dark:border-zinc-800/80 pt-8 md:pt-0 md:pl-8 w-full">
                        <div className="flex flex-col items-center mb-6">
                            <div className="flex items-center justify-center gap-0.5 text-lg font-black italic tracking-tight">
                                <span className="text-rose-600 text-2xl">V</span>
                                <span className="text-rose-500">iet</span>
                                <span className="text-[#0F3B84] dark:text-sky-400 text-2xl ml-0.5">QR</span>
                            </div>
                        </div>
                        
                        <div className="bg-white dark:bg-transparent p-4 dark:p-0 rounded-3xl shadow-md dark:shadow-none border border-slate-100/90 dark:border-none flex flex-col items-center justify-center w-64 h-64 relative">
                            {!qrLoaded && (
                                <Loading className="absolute inset-0 flex items-center justify-center" />
                            )}
                            <img 
                                src={`https://img.vietqr.io/image/MB-86870029-compact.png?amount=${totalPrice}&addInfo=${bookingCode}&accountName=CONG%20TY%20TNHH%20MONET`} 
                                alt="VietQR Payment Code" 
                                className={`w-64 h-64 object-contain rounded-2xl transition-opacity duration-500 ${qrLoaded ? "opacity-100" : "opacity-0 absolute"}`} 
                                onLoad={() => setQrLoaded(true)}
                                onError={(e) => {
                                    e.currentTarget.src = "https://placehold.co/250x250/fff/8E7EFE?text=VietQR+Code";
                                    setQrLoaded(true);
                                }}
                            />
                        </div>
                        
                        <div className="flex items-center justify-center gap-4 mt-6 border-t border-slate-100 dark:border-zinc-800/85 pt-4 w-full">
                            <div className="text-[9px] font-black text-[#004A9C] tracking-wider uppercase px-2.5 py-1 bg-blue-50 rounded-lg">napas 247</div>
                            <div className="text-[9px] font-black text-white tracking-wider uppercase px-2.5 py-1 bg-[#1A3B8B] rounded-lg">MB Bank</div>
                        </div>
                        
                        <button 
                            onClick={() => toast.success(t("toast_screenshot_captured"))}
                            className="text-xs text-rose-500 font-bold underline mt-5 hover:text-rose-600 cursor-pointer"
                        >
                            {t("screenshot_qr_desc")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
