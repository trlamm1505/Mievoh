import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";
import { toast } from "../../../../components/Toast/Toast.tsx";
import { getMyVouchersApi } from "../../../../axios/booking.tsx";
import type { Voucher } from "../../../../axios/booking.tsx";
import VoucherCard from "../../../../components/VoucherCard/VoucherCard.tsx";
import type { Promotion } from "../../../../components/VoucherCard/VoucherCard.tsx";

export default function Promotions() {
    const { t, language } = useLanguage();
    const navigate = useNavigate();

    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [claimedPromos, setClaimedPromos] = useState<string[]>([]);
    const [myVoucherIds, setMyVoucherIds] = useState<string[]>([]);
    const [loggedIn, setLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    const visiblePromotions = promotions.slice(0, 3);

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
        // Load claimed promos from localStorage
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

    if (loading) {
        return (
            <section className="mx-auto max-w-[85%] px-4 py-16 sm:py-20 font-sans">
                <div className="mb-8">
                    <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                        {t("special_promotions")}
                    </h2>
                </div>
                <div className="flex justify-center items-center h-44">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#6D28D9]"></div>
                </div>
            </section>
        );
    }

    if (promotions.length === 0) {
        return null;
    }

    return (
        <section className="mx-auto max-w-[85%] px-4 py-16 sm:py-20 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    {t("special_promotions")}
                </h2>
                {promotions.length > 3 && (
                    <button
                        onClick={() => navigate("/promotions")}
                        className="text-sm font-semibold text-[#6D28D9] hover:text-[#5B21B6] transition-colors duration-200 flex items-center gap-1 focus:outline-none"
                    >
                        {language === "en" ? `Show All (${promotions.length})` : `Xem tất cả (${promotions.length})`}
                    </button>
                )}
            </div>

            {/* Promotions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visiblePromotions.map((promo) => {
                    const isClaimed = claimedPromos.includes(promo.id);
                    const isUsed = loggedIn && !myVoucherIds.includes(promo.id);

                    return (
                        <VoucherCard 
                            key={promo.id}
                            promo={promo}
                            isClaimed={isClaimed}
                            isUsed={isUsed}
                            handleClaimPromo={handleClaimPromo}
                            language={language}
                        />
                    );
                })}
            </div>
        </section>
    );
}
