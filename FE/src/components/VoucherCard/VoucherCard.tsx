import { Users, Ticket, GraduationCap } from "lucide-react";
import Button from "../Button/Button.tsx";

export interface Promotion {
    id: string;
    code: string;
    description: string;
    type: "family" | "vip" | "student";
    minPurchase: number | null;
    maxDiscount: number | null;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    endDate: string;
}

interface VoucherCardProps {
    promo: Promotion;
    isClaimed: boolean;
    isUsed: boolean;
    handleClaimPromo: (code: string, id: string) => void;
    language: string;
    cutoutBgClass?: string;
}

export default function VoucherCard({
    promo,
    isClaimed,
    isUsed,
    handleClaimPromo,
    language,
    cutoutBgClass = "bg-[#FAF9FC]"
}: VoucherCardProps) {
    const getIcon = (type: string) => {
        const iconClass = "h-4 w-4 text-[#6D28D9]";
        switch (type) {
            case "family":
                return <Users className={iconClass} />;
            case "vip":
                return <Ticket className={iconClass} />;
            case "student":
                return <GraduationCap className={iconClass} />;
            default:
                return <Ticket className={iconClass} />;
        }
    };

    const buttonText = isUsed 
        ? (language === "en" ? "Used" : "Đã dùng") 
        : (isClaimed ? (language === "en" ? "Claimed" : "Đã nhận") : (language === "en" ? "Claim" : "Nhận Mã"));

    const valStr = promo.discountType === "PERCENTAGE" 
        ? `${promo.discountValue}%` 
        : promo.discountValue >= 1000 
            ? `${promo.discountValue / 1000}k` 
            : `${promo.discountValue}`;

    return (
        <div className="flex bg-white dark:bg-zinc-900 border border-[#EAE6F0] dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#6D28D9]/30 transition-all duration-300 h-44 relative">
            {/* Left Part: Discount Info */}
            <div className="w-32 bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] text-white flex flex-col justify-center items-center relative flex-shrink-0">
                <span className="text-3xl font-black tracking-tight">
                    {valStr}
                </span>
                <span className="text-xs font-extrabold tracking-widest opacity-95 uppercase mt-1">
                    {language === "en" ? "Discount" : "Giảm giá"}
                </span>
                
                {/* Floating Badge with Icon */}
                <div className="absolute top-3 left-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                    {getIcon(promo.type)}
                </div>
                
                {/* Ticket Circle Cutouts on Center Separator */}
                <div className={`absolute -top-3 -right-3 w-6 h-6 rounded-full border border-[#EAE6F0] dark:border-zinc-800 ${cutoutBgClass}`}></div>
                <div className={`absolute -bottom-3 -right-3 w-6 h-6 rounded-full border border-[#EAE6F0] dark:border-zinc-800 ${cutoutBgClass}`}></div>
            </div>

            {/* Right Part: Coupon Details */}
            <div className="flex-grow p-5 flex flex-col justify-between min-w-0 bg-[#FAF9FC] dark:bg-zinc-900/50">
                <div>
                    <div className="flex justify-between items-center gap-2">
                        <span className="text-sm font-extrabold text-[#6D28D9] dark:text-[#A78BFA] bg-[#EDE9FE] dark:bg-[#5B21B6]/30 px-3 py-1 rounded select-all font-mono tracking-wider">
                            {promo.code}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-zinc-505 flex-shrink-0 font-medium">
                            {new Date(promo.endDate).toLocaleDateString(language === "en" ? "en-US" : "vi-VN")}
                        </span>
                    </div>
                    
                    <p className="text-sm text-gray-605 dark:text-zinc-300 mt-3 font-medium line-clamp-2 leading-relaxed">
                        {promo.description}
                    </p>
                </div>

                <div className="flex justify-between items-center mt-3 gap-2">
                    <span className="text-xs text-gray-400 dark:text-zinc-500 font-semibold truncate">
                        {promo.minPurchase 
                            ? (language === "en" ? `Min: ${promo.minPurchase.toLocaleString()}đ` : `Tối thiểu: ${promo.minPurchase.toLocaleString()}đ`)
                            : (language === "en" ? "No min purchase" : "Không tối thiểu")}
                    </span>

                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => !isUsed && handleClaimPromo(promo.code, promo.id)}
                        disabled={isUsed}
                        className={`px-5 py-2 text-xs font-bold h-9 rounded-xl transition-all duration-200 ${
                            isUsed
                                ? "border-gray-200 text-gray-400 bg-gray-55 dark:bg-zinc-800 dark:border-zinc-700 cursor-not-allowed"
                                : isClaimed 
                                    ? "border-green-300 text-green-600 bg-green-55 dark:border-green-800/40 dark:text-green-400 dark:bg-green-950/20 hover:bg-green-100 hover:text-green-700" 
                                    : "border-[#6D28D9] text-[#6D28D9] dark:border-[#A78BFA] dark:text-[#A78BFA] hover:bg-[#6D28D9] hover:text-white dark:hover:bg-[#A78BFA] dark:hover:text-zinc-950"
                        }`}
                    >
                        {buttonText}
                    </Button>
                </div>
            </div>
        </div>
    );
}
