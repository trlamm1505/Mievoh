import { useState, useEffect } from "react";
import { useLanguage } from "../../../contextAPI/LanguageContext.tsx";
import { toast } from "../../../components/Toast/Toast.tsx";
import { getMyVouchersApi } from "../../../axios/booking.tsx";
import type { Voucher } from "../../../axios/booking.tsx";
import PromotionsHero from "./PromotionsHero/PromotionsHero.tsx";
import PromotionsGrid from "./PromotionsGrid/PromotionsGrid.tsx";
import type { Promotion } from "./PromotionsGrid/PromotionsGrid.tsx";

export default function PromotionsPage() {
    const { language } = useLanguage();
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [claimedPromos, setClaimedPromos] = useState<string[]>([]);
    const [myVoucherIds, setMyVoucherIds] = useState<string[]>([]);
    const [loggedIn, setLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    const mapVoucherToPromotion = (voucher: Voucher, index: number): Promotion => {
        let type: "family" | "vip" | "student" = "vip";
        const codeLower = voucher.code.toLowerCase();
        if (codeLower.includes("student") || codeLower.includes("hssv") || codeLower.includes("hocsinh") || codeLower.includes("sinhvien")) {
            type = "student";
        } else if (codeLower.includes("family") || codeLower.includes("giadinh") || codeLower.includes("capdoi") || codeLower.includes("couple")) {
            type = "family";
        } else {
            const types: ("family" | "vip" | "student")[] = ["vip", "family", "student"];
            type = types[index % types.length];
        }

        const isEn = language === "en";
        const valStr = voucher.discountType === "PERCENTAGE" 
            ? `${voucher.discountValue}%` 
            : `${voucher.discountValue.toLocaleString()}đ`;

        const maxStr = voucher.maxDiscount 
            ? (isEn ? ` up to ${voucher.maxDiscount.toLocaleString()}đ` : ` tối đa ${voucher.maxDiscount.toLocaleString()}đ`) 
            : "";
        const minStr = voucher.minPurchase 
            ? (isEn ? ` for orders from ${voucher.minPurchase.toLocaleString()}đ` : ` cho đơn hàng từ ${voucher.minPurchase.toLocaleString()}đ`) 
            : "";
        const expDate = new Date(voucher.endDate).toLocaleDateString(isEn ? "en-US" : "vi-VN");
        const expStr = isEn ? `Expiry: ${expDate}` : `Hạn dùng: ${expDate}`;

        const description = isEn 
            ? `Get ${valStr} discount${maxStr}${minStr}. ${expStr}`
            : `Nhận ngay ${valStr} giảm giá${maxStr}${minStr}. ${expStr}`;

        return {
            id: voucher.voucherId,
            code: voucher.code,
            description,
            type,
            minPurchase: voucher.minPurchase,
            maxDiscount: voucher.maxDiscount,
            discountType: voucher.discountType,
            discountValue: voucher.discountValue,
            endDate: voucher.endDate
        };
    };

    useEffect(() => {
        const stored = localStorage.getItem("mievoh_claimed_promos");
        if (stored) {
            try {
                setClaimedPromos(JSON.parse(stored));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    useEffect(() => {
        const fetchVouchers = async () => {
            try {
                const token = localStorage.getItem("accessToken");
                const isLoggedIn = !!token;
                setLoggedIn(isLoggedIn);

                let allVouchers: Voucher[] = [];
                let eligibleIds: string[] = [];

                if (isLoggedIn) {
                    try {
                        const myRes = await getMyVouchersApi();
                        const myVouchers = myRes.data?.data || [];
                        allVouchers = myVouchers;
                        eligibleIds = myVouchers.map(v => v.voucherId);
                        setMyVoucherIds(eligibleIds);
                    } catch (err) {
                        console.error("Error fetching my vouchers:", err);
                    }
                }

                const mapped = allVouchers.map((voucher, idx) => mapVoucherToPromotion(voucher, idx));
                
                // Sort by highest discount value (weight)
                const sorted = [...mapped].sort((a, b) => {
                    const getWeight = (p: Promotion) => {
                        if (p.discountType === 'PERCENTAGE') {
                            if (p.maxDiscount) return p.maxDiscount;
                            return p.discountValue * 1000;
                        }
                        return p.discountValue;
                    };
                    return getWeight(b) - getWeight(a);
                });

                setPromotions(sorted);
            } catch (error) {
                console.error("Error fetching vouchers:", error);
                setPromotions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchVouchers();
    }, [language]);

    const handleClaimPromo = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        const isEn = language === "en";
        toast.success(
            isEn 
                ? `Voucher code "${code}" copied to clipboard!` 
                : `Đã sao chép mã giảm giá "${code}" vào bộ nhớ tạm!`
        );

        if (!claimedPromos.includes(id)) {
            const nextClaimed = [...claimedPromos, id];
            setClaimedPromos(nextClaimed);
            localStorage.setItem("mievoh_claimed_promos", JSON.stringify(nextClaimed));
        }
    };

    return (
        <div className="min-h-screen bg-[#EFEBF4] dark:bg-zinc-950 font-sans pb-16">
            {/* Header Hero Banner */}
            <PromotionsHero />

            {/* Grid Container */}
            <div className="max-w-[85%] mx-auto px-4 sm:px-6 lg:px-8 mt-12 animate__animated animate__fadeInUp [animation-delay:200ms]">
                <PromotionsGrid 
                    promotions={promotions}
                    loading={loading}
                    loggedIn={loggedIn}
                    myVoucherIds={myVoucherIds}
                    claimedPromos={claimedPromos}
                    handleClaimPromo={handleClaimPromo}
                    language={language}
                />
            </div>
        </div>
    );
}
