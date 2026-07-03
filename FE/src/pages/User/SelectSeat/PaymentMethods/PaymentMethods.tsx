import { ChevronLeft } from "lucide-react";
import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";

interface PaymentMethodsProps {
    paymentMethod: string;
    setPaymentMethod: (method: string) => void;
    isAuthenticated: boolean;
    guestName: string;
    guestPhone: string;
    guestEmail: string;
    guestErrors: { name?: string; phone?: string; email?: string };
    handleGuestChange: (name: "name" | "phone" | "email", value: string) => void;
    setActiveStep: (step: number) => void;
}

export default function PaymentMethods({
    paymentMethod,
    setPaymentMethod,
    isAuthenticated,
    guestName,
    guestPhone,
    guestEmail,
    guestErrors,
    handleGuestChange,
    setActiveStep
}: PaymentMethodsProps) {
    const { t, language } = useLanguage();

    const paymentOptions = [
        { 
            id: "vnpay", 
            name: language === "vi" ? "Cổng thanh toán VNPay" : "VNPay Gateway", 
            desc: language === "vi" 
                ? "Thanh toán qua ứng dụng ngân hàng (QR-Pay), thẻ ATM nội địa hoặc thẻ quốc tế Visa/Mastercard." 
                : "Pay via banking applications (QR-Pay), local ATM cards or international credit cards.", 
            icon: (
                <svg className="w-5 h-5 text-violet-650" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
            ) 
        }
    ];

    return (
        <div className="flex flex-col gap-6 animate__animated animate__fadeIn">
            <div className="bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    💳 {t("payment_method")}
                </h3>
 
                {/* Payment Options list */}
                <div className="flex flex-col gap-3">
                    {paymentOptions.map(method => {
                        const isSelected = paymentMethod === method.id;
                        return (
                            <div 
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id)}
                                className={`p-4.5 border rounded-2xl cursor-pointer flex items-center justify-between transition-all duration-200 ${
                                    isSelected 
                                        ? "border-[#8E7EFE] bg-violet-50/20 dark:bg-[#8E7EFE]/10" 
                                        : "border-slate-100 hover:border-slate-200 bg-slate-50/20 dark:bg-zinc-800/20 dark:border-zinc-800 dark:hover:border-zinc-700"
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-855 border border-slate-100 dark:border-zinc-750 flex items-center justify-center shadow-inner shrink-0">
                                        {method.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-base font-extrabold text-slate-855 dark:text-white">{method.name}</h4>
                                        <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium mt-0.5 leading-snug">{method.desc}</p>
                                    </div>
                                </div>
                                <div className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                    isSelected ? "border-[#8E7EFE]" : "border-slate-350 dark:border-zinc-600"
                                }`}>
                                    {isSelected && <div className="w-3.5 h-3.5 rounded-full bg-[#8E7EFE]" />}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Navigation buttons */}
                <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-6 flex justify-start">
                    <button
                        onClick={() => setActiveStep(2)}
                        className="px-5 py-2.5 border border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 font-extrabold text-xs rounded-2xl transition-all cursor-pointer flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-800"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        {t("back_to_combos")}
                    </button>
                </div>
            </div>

            {!isAuthenticated && (
                <div className="bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-sm flex flex-col overflow-hidden">
                    <div className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800/80 px-6 py-4">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-white flex items-center gap-2">
                            👤 {t("personal_info")}
                        </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                            <label className="text-[11px] font-black uppercase text-slate-400 dark:!text-white block mb-2 tracking-wider">{t("full_name")}</label>
                            <input 
                                type="text" 
                                placeholder={t("full_name_placeholder")} 
                                value={guestName}
                                onChange={(e) => handleGuestChange("name", e.target.value)}
                                className={`w-full bg-slate-50/50 dark:bg-zinc-800/40 border rounded-2xl px-4 py-3 text-sm font-extrabold text-slate-880 dark:!text-white dark:!placeholder-zinc-300 outline-none focus:bg-white dark:focus:bg-zinc-800/80 transition-all ${
                                    guestErrors.name ? "border-red-400 focus:border-red-500" : "border-slate-200/80 dark:border-zinc-700/80 focus:border-[#8E7EFE]"
                                }`}
                            />
                            {guestErrors.name && (
                                <p className="mt-1.5 ml-1 text-xs text-red-500 flex items-center gap-1 font-semibold animate__animated animate__fadeIn">
                                    <span>⚠️</span> {guestErrors.name}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="text-[11px] font-black uppercase text-slate-400 dark:!text-white block mb-2 tracking-wider">{t("phone_number")}</label>
                            <input 
                                type="tel" 
                                placeholder={t("phone_number_placeholder")} 
                                value={guestPhone}
                                onChange={(e) => handleGuestChange("phone", e.target.value)}
                                className={`w-full bg-slate-50/50 dark:bg-zinc-800/40 border rounded-2xl px-4 py-3 text-sm font-extrabold text-slate-880 dark:!text-white dark:!placeholder-zinc-300 outline-none focus:bg-white dark:focus:bg-zinc-800/80 transition-all ${
                                    guestErrors.phone ? "border-red-400 focus:border-red-500" : "border-slate-200/80 dark:border-zinc-700/80 focus:border-[#8E7EFE]"
                                }`}
                            />
                            {guestErrors.phone && (
                                <p className="mt-1.5 ml-1 text-xs text-red-500 flex items-center gap-1 font-semibold animate__animated animate__fadeIn">
                                    <span>⚠️</span> {guestErrors.phone}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="text-[11px] font-black uppercase text-slate-400 dark:!text-white block mb-2 tracking-wider">{t("email_address")}</label>
                            <input 
                                type="email" 
                                placeholder={t("email_address_placeholder")} 
                                value={guestEmail}
                                onChange={(e) => handleGuestChange("email", e.target.value)}
                                className={`w-full bg-slate-50/50 dark:bg-zinc-800/40 border rounded-2xl px-4 py-3 text-sm font-extrabold text-slate-880 dark:!text-white dark:!placeholder-zinc-300 outline-none focus:bg-white dark:focus:bg-zinc-800/80 transition-all ${
                                    guestErrors.email ? "border-red-400 focus:border-red-500" : "border-slate-200/80 dark:border-zinc-700/80 focus:border-[#8E7EFE]"
                                }`}
                            />
                            {guestErrors.email && (
                                <p className="mt-1.5 ml-1 text-xs text-red-500 flex items-center gap-1 font-semibold animate__animated animate__fadeIn">
                                    <span>⚠️</span> {guestErrors.email}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
