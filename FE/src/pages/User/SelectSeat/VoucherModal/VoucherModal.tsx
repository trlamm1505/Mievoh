import { X, Ticket, Calendar, Info, ShieldAlert } from "lucide-react";
import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";

interface Voucher {
    voucherId: string;
    code: string;
    description?: string;
    discountType: "FIXED" | "PERCENTAGE";
    discountValue: number;
    minPurchase: number | null;
    maxDiscount: number | null;
    endDate: string | Date;
}

interface VoucherModalProps {
    showModal: boolean;
    isClosing: boolean;
    closeModal: () => void;
    availableVouchers: Voucher[];
    currentTotalPrice: number;
    onApplyVoucher: (code: string) => void;
    formatPrice: (value: number) => string;
}

export default function VoucherModal({
    showModal,
    isClosing,
    closeModal,
    availableVouchers = [],
    currentTotalPrice,
    onApplyVoucher,
    formatPrice
}: VoucherModalProps) {
    const { language } = useLanguage();
    if (!showModal) return null;

    const isEn = language === "en";

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
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 20px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #3f3f46;
                }
            `}</style>
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-zinc-900 rounded-[2rem] w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-zinc-800/80"
                style={{ animation: isClosing ? "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 px-6 py-5">
                    <h3 className="text-lg font-black text-slate-850 dark:text-white flex items-center gap-2">
                        <Ticket className="h-5 w-5 text-[#8E7EFE]" />
                        {isEn ? "Select Promotion" : "Chọn Khuyến Mãi"}
                    </h3>
                    <button 
                        onClick={closeModal}
                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-violet-50 dark:hover:bg-zinc-700 hover:text-[#8E7EFE] flex items-center justify-center text-slate-500 dark:text-zinc-400 transition-colors cursor-pointer"
                    >
                        <X className="h-4.5 w-4.5" />
                    </button>
                </div>

                {/* Vouchers List */}
                <div className="p-6 max-h-[450px] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-zinc-955/30 pr-4 custom-scrollbar">
                    {availableVouchers.length === 0 ? (
                        <div className="py-12 col-span-1 md:col-span-2 flex flex-col items-center justify-center text-center">
                            <ShieldAlert className="h-12 w-12 text-slate-355 dark:text-zinc-650 mb-3" />
                            <p className="text-sm font-bold text-slate-400 dark:text-zinc-500">
                                {isEn ? "No vouchers available at this complex" : "Không có mã giảm giá khả dụng tại cụm rạp này"}
                            </p>
                        </div>
                    ) : (
                        availableVouchers.map((v) => {
                            const isMinPurchaseMet = v.minPurchase ? currentTotalPrice >= v.minPurchase : true;
                            const discountLabel = v.discountType === "PERCENTAGE" 
                                ? `${v.discountValue}%` 
                                : formatPrice(v.discountValue).replace(" VND", "");

                            // Compute dynamic title & description to fill up empty space beautifully
                            const valStr = v.discountType === "PERCENTAGE" 
                                ? `${v.discountValue}%` 
                                : formatPrice(v.discountValue);

                            const titleText = isEn 
                                ? `Discount ${valStr}` 
                                : `Giảm ngay ${valStr}`;

                            const conditionParts = [];
                            if (v.minPurchase) {
                                conditionParts.push(isEn 
                                    ? `Min order ${formatPrice(v.minPurchase)}`
                                    : `Áp dụng cho đơn hàng từ ${formatPrice(v.minPurchase)}`
                                );
                            } else {
                                conditionParts.push(isEn ? "No minimum order" : "Không giới hạn giá trị tối thiểu");
                            }

                            if (v.discountType === "PERCENTAGE" && v.maxDiscount) {
                                conditionParts.push(isEn
                                    ? `Up to ${formatPrice(v.maxDiscount)}`
                                    : `Giảm tối đa ${formatPrice(v.maxDiscount)}`
                                );
                            }

                            const descriptionText = conditionParts.join(isEn ? ", " : " • ");

                            return (
                                <div 
                                    key={v.voucherId}
                                    className={`relative flex rounded-2xl overflow-hidden border transition-all ${
                                        isMinPurchaseMet 
                                            ? "bg-white dark:bg-zinc-850 border-slate-200 dark:border-zinc-800 shadow-sm hover:border-violet-300 dark:hover:border-violet-900/60" 
                                            : "bg-slate-100/40 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-855/80 opacity-70"
                                    }`}
                                >
                                    {/* Left color block indicating discount */}
                                    <div className={`w-24 flex-shrink-0 flex flex-col items-center justify-center text-white p-3 text-center relative ${
                                        isMinPurchaseMet 
                                            ? "bg-gradient-to-br from-[#9E90FD] to-[#8E7EFE]" 
                                            : "bg-slate-400 dark:bg-zinc-700"
                                    }`}>
                                        <Ticket className="h-6 w-6 opacity-30 absolute top-2 left-2" />
                                        <span className="text-xl font-black tracking-tight leading-none">{discountLabel}</span>
                                        <span className="text-[10px] font-black uppercase tracking-wider mt-1.5 opacity-90">
                                            {isEn ? "OFF" : "GIẢM"}
                                        </span>
                                    </div>

                                    {/* Circular cuts decoration */}
                                    <div className="absolute left-[90px] top-0 bottom-0 flex flex-col justify-between items-center py-2 z-10 w-2.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-50 dark:bg-zinc-950 -mt-3.5 border-b border-slate-200 dark:border-zinc-800" />
                                        {/* Little dotted vertical line */}
                                        <div className="flex-grow border-l border-dashed border-slate-250 dark:border-zinc-700 my-1" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-50 dark:bg-zinc-955 -mb-3.5 border-t border-slate-200 dark:border-zinc-800" />
                                    </div>

                                    {/* Right details block */}
                                    <div className="flex-grow p-4 pl-6 flex flex-col justify-between min-w-0">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-950/40 text-[#8E7EFE] border border-violet-100 dark:border-violet-900/30 font-mono uppercase tracking-wide">
                                                    {v.code}
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-black text-slate-800 dark:text-zinc-100 mt-2">
                                                {titleText}
                                            </h4>
                                            <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 mt-1 flex items-start gap-1">
                                                <Info className="h-3 w-3 text-slate-400 dark:text-zinc-550 shrink-0 mt-0.5" />
                                                <span>{descriptionText}</span>
                                            </p>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
                                            <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-550 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {isEn ? "Exp" : "Hạn"}: {new Date(v.endDate).toLocaleDateString("vi-VN")}
                                            </span>
                                            
                                            {isMinPurchaseMet ? (
                                                <button 
                                                    onClick={() => {
                                                        onApplyVoucher(v.code);
                                                        closeModal();
                                                    }}
                                                    className="px-3.5 py-1.5 bg-[#8E7EFE] hover:bg-[#7d6dfc] text-white text-[10px] font-black rounded-xl transition-all shadow-md shadow-violet-100 dark:shadow-none cursor-pointer hover:scale-[1.03] active:scale-95"
                                                >
                                                    {isEn ? "Apply" : "Áp dụng"}
                                                </button>
                                            ) : (
                                                <span className="text-[9px] font-black text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-2 py-1 rounded-lg">
                                                    {isEn ? "Need " : "Thiếu "}{formatPrice((v.minPurchase || 0) - currentTotalPrice)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer status summary */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 text-xs font-bold text-slate-500 flex items-center justify-between">
                    <span>
                        {isEn ? "Current Subtotal:" : "Giá trị đơn hàng tạm tính:"}
                    </span>
                    <span className="text-sm font-black text-slate-850 dark:text-white">
                        {formatPrice(currentTotalPrice)}
                    </span>
                </div>
            </div>
        </div>
    );
}
