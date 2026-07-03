import VoucherCard from "../../../../components/VoucherCard/VoucherCard.tsx";
import type { Promotion } from "../../../../components/VoucherCard/VoucherCard.tsx";
import { Ticket } from "lucide-react";

interface PromotionsGridProps {
    promotions: Promotion[];
    loading: boolean;
    loggedIn: boolean;
    myVoucherIds: string[];
    claimedPromos: string[];
    handleClaimPromo: (code: string, id: string) => void;
    language: string;
}

export default function PromotionsGrid({
    promotions,
    loading,
    loggedIn,
    myVoucherIds,
    claimedPromos,
    handleClaimPromo,
    language
}: PromotionsGridProps) {
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6D28D9]"></div>
            </div>
        );
    }

    if (promotions.length === 0) {
        return (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center shadow-sm border border-slate-100 dark:border-zinc-800">
                <Ticket className="h-16 w-16 text-gray-300 dark:text-zinc-650 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-750 dark:text-zinc-200">
                    {language === "en" ? "No promotions active" : "Hiện tại chưa có ưu đãi nào"}
                </h3>
                <p className="text-sm text-gray-400 dark:text-zinc-500 mt-1">
                    {language === "en" ? "Check back later for new exclusive deals!" : "Hãy quay lại sau để cập nhật các chương trình khuyến mãi mới nhất!"}
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.map((promo) => {
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
                        cutoutBgClass="bg-[#EFEBF4] dark:bg-zinc-950"
                    />
                );
            })}
        </div>
    );
}
export type { Promotion };
