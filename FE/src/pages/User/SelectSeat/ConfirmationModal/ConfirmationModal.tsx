import { X } from "lucide-react";
import type { MovieDetailInfo } from "../../MovieDetail/DetailHero/DetailHero.tsx";
import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";

interface ConfirmationModalProps {
    showConfirmModal: boolean;
    isClosing: boolean;
    closeModal: () => void;
    branchName: string;
    movie: MovieDetailInfo;
    time: string;
    dayOfWeek: string;
    dateLabel: string;
    selectedSeats: string[];
    isAuthenticated: boolean;
    userFullName: string;
    userPhone: string;
    userEmailAddress: string;
    guestName: string;
    guestPhone: string;
    guestEmail: string;
    paymentMethod: string;
    totalPrice: number;
    formatPrice: (value: number) => string;
    executeCheckout: () => void;
}

export default function ConfirmationModal({
    showConfirmModal,
    isClosing,
    closeModal,
    branchName,
    movie,
    time,
    dayOfWeek,
    dateLabel,
    selectedSeats,
    isAuthenticated,
    userFullName,
    userPhone,
    userEmailAddress,
    guestName,
    guestPhone,
    guestEmail,
    paymentMethod,
    totalPrice,
    formatPrice,
    executeCheckout
}: ConfirmationModalProps) {
    const { t } = useLanguage();
    if (!showConfirmModal) return null;

    return (
        <div 
            onClick={closeModal}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 p-4 pt-16 md:pt-24 transition-opacity duration-300"
            style={{ animation: isClosing ? "fadeOut 0.25s forwards" : "fadeIn 0.25s forwards" }}
        >
            <style>{`
                @keyframes slideDown {
                    from {
                        transform: translateY(-80px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                @keyframes slideUp {
                    from {
                        transform: translateY(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateY(-80px);
                        opacity: 0;
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `}</style>
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100"
                style={{ animation: isClosing ? "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                    <h3 className="text-lg font-black text-slate-850">{t("order_confirmation")}</h3>
                    <button 
                        onClick={closeModal}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-violet-50 hover:text-[#8E7EFE] flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
                    >
                        <X className="h-4.5 w-4.5" />
                    </button>
                </div>
                <div className="p-6 divide-y divide-slate-100 text-sm font-semibold text-slate-655">
                    <div className="py-3 flex justify-between items-start gap-4">
                        <span className="text-slate-400 shrink-0 font-medium">{t("booking_cinema")}</span>
                        <span className="text-slate-850 font-black text-right">{branchName}</span>
                    </div>
                    <div className="py-3 flex justify-between items-start gap-4">
                        <span className="text-slate-400 shrink-0 font-medium">{t("booking_movie")}</span>
                        <span className="text-slate-855 font-black text-right leading-snug">{movie.title}</span>
                    </div>
                    <div className="py-3 flex justify-between items-start gap-4">
                        <span className="text-slate-400 shrink-0 font-medium">{t("booking_showtime")}</span>
                        <span className="text-slate-855 font-black text-right">{time} - {dayOfWeek}, {dateLabel}</span>
                    </div>
                    <div className="py-3 flex justify-between items-start gap-4">
                        <span className="text-slate-400 shrink-0 font-medium">{t("booking_seats")}</span>
                        <span className="text-[#8E7EFE] font-black text-right bg-violet-50/80 px-2.5 py-0.5 rounded-lg text-xs">{selectedSeats.join(", ")}</span>
                    </div>
                    <div className="py-3 flex justify-between items-start gap-4">
                         <span className="text-slate-400 shrink-0 font-medium">{t("personal_info")}</span>
                         <div className="text-slate-855 text-right flex flex-col items-end gap-0.5">
                             <span className="font-black text-sm">{isAuthenticated ? userFullName : guestName}</span>
                             <span className="text-slate-650 font-bold text-sm mt-0.5">{isAuthenticated ? userPhone : guestPhone}</span>
                             <span className="text-slate-650 font-bold text-sm">{isAuthenticated ? userEmailAddress : guestEmail}</span>
                         </div>
                      </div>
                    <div className="py-3 flex justify-between items-start gap-4">
                        <span className="text-slate-400 shrink-0 font-medium">{t("payment_method")}</span>
                        <span className="text-slate-855 font-black text-right">
                            {paymentMethod === "qr" ? t("qr_transfer") :
                             paymentMethod === "momo" ? t("momo_wallet") :
                             paymentMethod === "zalopay" ? t("zalopay_wallet") : t("atm_card")}
                        </span>
                    </div>
                    <div className="py-4 flex justify-between items-center gap-4 text-base font-black">
                        <span className="text-slate-855">{t("total_order_value")}</span>
                        <span className="text-xl text-[#8E7EFE] font-black">{formatPrice(totalPrice)}</span>
                    </div>
                </div>
                <div className="p-6 pt-0">
                    <button
                        onClick={executeCheckout}
                        className="w-full py-4 bg-[#8E7EFE] hover:bg-[#7d6dfc] text-white font-extrabold text-base rounded-2xl transition-all duration-300 cursor-pointer shadow-lg shadow-violet-100 hover:scale-[1.01] active:scale-95 text-center flex items-center justify-center gap-2"
                    >
                        {t("proceed_to_pay")}
                    </button>
                </div>
            </div>
        </div>
    );
}
