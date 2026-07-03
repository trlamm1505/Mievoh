import { useState } from "react";
import { useSelector } from "react-redux";
import { Star, MessageSquarePlus } from "lucide-react";
import Button from "../../../../components/Button/Button.tsx";
import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";
import { toast } from "../../../../components/Toast/Toast.tsx";
import CountUp from "react-countup";

export interface Review {
    id: string | number;
    name: string;
    rating: number;
    comment: string;
    date: string;
}

interface DetailReviewsProps {
    reviews: Review[];
    onAddReview: (review: Omit<Review, "id" | "date">) => Promise<void>;
}

export default function DetailReviews({ reviews, onAddReview }: DetailReviewsProps) {
    const { t } = useLanguage();
    const { isAuthenticated, user } = useSelector((state: any) => state.login || { isAuthenticated: false, user: null });
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const [comment, setComment] = useState("");
    const [guestName, setGuestName] = useState("");

    // Calculate rating statistics
    const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 5.0;

    const ratingDistribution = [0, 0, 0, 0, 0]; // index 0 for 5-star, index 4 for 1-star
    reviews.forEach(r => {
        const starIdx = 5 - Math.round(r.rating);
        if (starIdx >= 0 && starIdx < 5) {
            ratingDistribution[starIdx]++;
        }
    });

    const totalVotes = reviews.length;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để đánh giá phim!");
            return;
        }

        let reviewerName = user?.name || user?.hoTen || "User";

        if (!comment.trim()) {
            toast.error(t("reviews_enter_comment_toast"));
            return;
        }

        try {
            await onAddReview({ name: reviewerName, rating, comment });
            
            // Reset form only on success
            setRating(5);
            setComment("");
            setGuestName("");
        } catch (err) {
            // Keep user comment if submission failed
        }
    };

    const CountUpComponent = (CountUp as any).default || CountUp;

    return (
        <div className="w-full bg-white dark:bg-zinc-900/40 rounded-2xl border border-[#EAE6F0] dark:border-zinc-800/80 p-6 sm:p-8 shadow-sm flex flex-col gap-8 animate__animated animate__fadeIn">
            {/* Header / Title */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:border-zinc-800/80 border-b border-[#EAE6F0] pb-3">
                    {t("reviews_audience", { count: reviews.length })}
                </h2>
            </div>

            {/* Ratings summary breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-[#F6F3F9]/60 dark:bg-zinc-900/60 p-6 rounded-2xl border border-[#EAE6F0]/60 dark:border-zinc-800/60">
                {/* Average rating summary */}
                <div className="text-center flex flex-col items-center">
                    <span className="text-5xl font-black text-[#6D28D9] dark:text-violet-400 mb-2">
                        <CountUpComponent end={averageRating} decimals={1} duration={1.5} enableScrollSpy scrollSpyOnce />
                    </span>
                    <div className="flex gap-0.5 text-yellow-400 mb-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                                key={s} 
                                className={`h-5 w-5 ${s <= Math.round(averageRating) ? "fill-yellow-400" : "text-gray-300"}`} 
                            />
                        ))}
                    </div>
                    <span className="text-xs text-gray-500 font-bold">
                        {t("reviews_based_on", { count: reviews.length })}
                    </span>
                </div>

                {/* Rating bars */}
                <div className="md:col-span-2 flex flex-col gap-2">
                    {[5, 4, 3, 2, 1].map((stars, idx) => {
                        const count = ratingDistribution[idx];
                        const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                        return (
                            <div key={stars} className="flex items-center gap-3 text-sm">
                                <span className="w-12 font-bold text-gray-600 text-right shrink-0">{t("reviews_star_count", { count: stars })}</span>
                                <div className="flex-grow h-2.5 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-[#9370DB] to-[#7B68EE] rounded-full transition-all duration-500" 
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="w-8 font-semibold text-gray-500 shrink-0 text-left">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Comments List */}
            <div className="flex flex-col gap-6">
                {reviews.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
                        <p className="text-gray-500 text-sm font-medium">{t("reviews_no_reviews")}</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {reviews.map((review) => (
                            <div key={review.id} className="flex gap-4 p-4 rounded-xl border border-[#EAE6F0] dark:border-zinc-800/60 bg-[#F6F3F9]/30">
                                {/* User avatar icon */}
                                <div className="h-10 w-10 rounded-full bg-[#E9D5FF] text-[#6D28D9] font-black flex items-center justify-center text-sm shrink-0">
                                    {(review.name || "U").charAt(0).toUpperCase()}
                                </div>
                                
                                <div className="flex flex-col gap-1 w-full">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="text-sm font-bold text-gray-900">{review.name}</h4>
                                        <span className="text-xs text-gray-400 font-semibold">{review.date}</span>
                                    </div>
                                    
                                    {/* Star scores */}
                                    <div className="flex text-yellow-400">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star 
                                                key={s} 
                                                className={`h-3 w-3 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
                                            />
                                        ))}
                                    </div>

                                    {/* Comment text */}
                                    <p className="text-gray-600 text-sm font-medium mt-1.5 leading-relaxed">
                                        {review.comment}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Write a review form */}
            <div className="border-t border-[#EAE6F0]/60 dark:border-zinc-800/80 pt-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <MessageSquarePlus className="h-5 w-5 text-[#6D28D9] dark:text-violet-400 shrink-0" />
                    <span className="review-header-gradient">
                        {t("reviews_write_review")}
                    </span>
                </h3>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* Star selection */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-600">{t("reviews_your_rating")}</span>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(null)}
                                    className="text-yellow-400 hover:scale-110 transition-transform duration-100 cursor-pointer focus:outline-none"
                                >
                                    <Star 
                                        className={`h-6 w-6 ${
                                            star <= (hoverRating ?? rating) 
                                                ? "fill-yellow-400 text-yellow-400" 
                                                : "text-gray-300"
                                        }`} 
                                    />
                                </button>
                            ))}
                        </div>
                        <span className="text-xs font-bold text-[#6D28D9] dark:text-violet-300 bg-[#F3E8FF] dark:bg-violet-950/50 px-2 py-0.5 rounded">
                            {rating} / 5
                        </span>
                    </div>

                    {/* Guest Name (only when not logged in) */}
                    {!isAuthenticated && (
                        <div className="flex flex-col gap-1.5 animate__animated animate__fadeIn">
                            <label htmlFor="reviewerName" className="text-sm font-bold text-gray-600">{t("reviews_your_name")}</label>
                            <input
                                type="text"
                                id="reviewerName"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                placeholder={t("reviews_name_placeholder")}
                                className="rounded-xl border border-violet-100 bg-[#F6F3F9]/50 py-2.5 px-4 text-sm text-gray-700 outline-none transition-all duration-300 placeholder:text-gray-400 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100 max-w-md dark:border-zinc-800 dark:bg-zinc-850/40 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-800 dark:focus:ring-zinc-800"
                            />
                        </div>
                    )}

                    {/* Comment text */}
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="reviewerComment" className="text-sm font-bold text-gray-600">{t("reviews_comment_label")}</label>
                        <textarea
                            id="reviewerComment"
                            rows={4}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={t("reviews_comment_placeholder")}
                            className="rounded-xl border border-violet-100 bg-[#F6F3F9]/50 py-2.5 px-4 text-sm text-gray-700 outline-none transition-all duration-300 placeholder:text-gray-400 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100 resize-none dark:border-zinc-800 dark:bg-zinc-850/40 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-800 dark:focus:ring-zinc-800"
                        />
                    </div>

                    {/* Submit button */}
                    <div className="mt-2">
                        <Button 
                            variant="primary" 
                            size="md" 
                            type="submit"
                            className="w-full sm:w-auto px-10"
                        >
                            {t("reviews_submit")}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
