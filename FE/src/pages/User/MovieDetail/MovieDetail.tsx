import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "../../../contextAPI/LanguageContext.tsx";
import DetailHero from "./DetailHero/DetailHero.tsx";
import type { MovieDetailInfo } from "./DetailHero/DetailHero.tsx";
import DetailReviews from "./DetailReviews/DetailReviews.tsx";
import type { Review } from "./DetailReviews/DetailReviews.tsx";
import ScrollReveal from "../../../components/ScrollReveal/ScrollReveal.tsx";
import { ArrowLeft } from "lucide-react";
import { getMovieDetailApi } from "../../../axios/movie.tsx";
import { getReviewsByMovieApi, createReviewApi } from "../../../axios/cinemas.tsx";
import type { Review as ApiReview } from "../../../axios/cinemas.tsx";
import { toast } from "../../../components/Toast/Toast.tsx";

interface ApiResponseMovie {
    movieId: string;
    title_vi?: string | null;
    title_en?: string | null;
    description_vi?: string | null;
    description_en?: string | null;
    imageUrl?: string | null;
    averageRating?: number | null;
    genres?: string | string[] | null;
    status?: string | null;
    releaseDate?: string | null;
    duration?: number | string | null;
    ageRestriction?: string | null;
    language?: string | null;
    director?: string | null;
    cast?: string | string[] | null;
    trailerUrl?: string | null;
}

export default function MovieDetail() {
    const { t, language } = useLanguage();
    const { id } = useParams<{ id: string }>();

    const [movie, setMovie] = useState<MovieDetailInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<Review[]>([]);

    // Automatically scroll to top when movie ID changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    useEffect(() => {
        if (!id) return;

        const fetchDetail = async () => {
            try {
                setLoading(true);
                const res = await getMovieDetailApi(id);
                const responseData = res as unknown as {
                    data?: {
                        data?: ApiResponseMovie;
                    } & ApiResponseMovie;
                } & ApiResponseMovie;
                const data = responseData.data?.data || responseData.data || responseData;

                if (data) {
                    let genresArr: string[] = [];
                    if (Array.isArray(data.genres)) {
                        genresArr = data.genres;
                    } else if (typeof data.genres === 'string') {
                        genresArr = data.genres.split(',').map((g: string) => g.trim());
                    }

                    let image = data.imageUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80";
                    if (data.imageUrl && !data.imageUrl.startsWith('http')) {
                        const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://api.mievoh.io.vn/api';
                        const domain = apiBase.replace('/api', '');
                        image = `${domain}/movies/${data.imageUrl}`;
                    }

                    const mapped: MovieDetailInfo = {
                        id: data.movieId,
                        title: language === "vi" ? (data.title_vi || data.title_en || "") : (data.title_en || data.title_vi || ""),
                        title_vi: data.title_vi || undefined,
                        title_en: data.title_en || undefined,
                        description: language === "vi" ? (data.description_vi || data.description_en || "") : (data.description_en || data.description_vi || ""),
                        description_vi: data.description_vi || undefined,
                        description_en: data.description_en || undefined,
                        image,
                        backdrop: image,
                        rating: data.averageRating ?? 4.5,
                        genres: genresArr,
                        status: (data.status === "coming_soon" ? "coming_soon" : "now_showing") as "now_showing" | "coming_soon",
                        releaseDate: data.releaseDate ? new Date(data.releaseDate).toLocaleDateString("vi-VN") : "10/06/2026",
                        duration: data.duration ? `${data.duration} mins` : "120 mins",
                        ageRating: data.ageRestriction || "P",
                        language: data.language || "English",
                        language_vi: data.language === "vi" ? "Tiếng Việt" : "Tiếng Anh",
                        language_en: data.language === "vi" ? "Vietnamese" : "English",
                        director: data.director || "Unknown",
                        cast: data.cast ? (Array.isArray(data.cast) ? data.cast : data.cast.split(',')) : ["Various Artists"],
                        trailerUrl: data.trailerUrl || "",
                    };
                    setMovie(mapped);

                    // Fetch reviews from backend Reviews API
                    try {
                        const reviewsRes = await getReviewsByMovieApi(id);
                        const rawReviews = reviewsRes as unknown as {
                            data?: {
                                data?: ApiReview[];
                                reviews?: ApiReview[];
                            } & {
                                reviews?: ApiReview[];
                            } & ApiReview[];
                            reviews?: ApiReview[];
                        } & ApiReview[];

                        const reviewsListRaw = 
                            rawReviews.data?.reviews || 
                            rawReviews.data?.data || 
                            rawReviews.reviews || 
                            (Array.isArray(rawReviews.data) ? rawReviews.data : null) ||
                            (Array.isArray(rawReviews) ? rawReviews : []);

                        const reviewsList = reviewsListRaw.map((r: ApiReview) => ({
                            id: r.reviewId || Date.now().toString(),
                            name: r.User?.fullName || r.username || "User",
                            rating: r.rating || 5,
                            comment: r.comment || "",
                            date: r.createdAt ? new Date(r.createdAt).toLocaleDateString("vi-VN") : "06/06/2026"
                        }));
                        setReviews(reviewsList);
                    } catch (reviewErr) {
                        console.error("Lỗi khi lấy đánh giá từ API:", reviewErr);
                        // Fallback to placeholder if call fails or there are no reviews yet
                        setReviews([
                            { id: "1", name: "Minh Anh", rating: 5, comment: "Phim quá hay, kỹ xảo đỉnh cao và nội dung rất ý nghĩa!", date: "05/06/2026" },
                            { id: "2", name: "John Doe", rating: 4, comment: "Great visuals and sound design. Highly recommended!", date: "04/06/2026" }
                        ]);
                    }
                } else {
                    setMovie(null);
                }
            } catch (err) {
                console.error("Lỗi khi lấy chi tiết phim:", err);
                setMovie(null);
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id, language]);

    const handleAddReview = async (newReview: Omit<Review, "id" | "date">) => {
        if (!id) return;
        try {
            const res = await createReviewApi({
                movieId: id,
                rating: newReview.rating,
                comment: newReview.comment
            });
            
            // Re-fetch reviews to get the latest list with updated stats from database
            const reviewsRes = await getReviewsByMovieApi(id);
            const rawReviews = reviewsRes as unknown as {
                data?: {
                    data?: ApiReview[];
                    reviews?: ApiReview[];
                } & {
                    reviews?: ApiReview[];
                } & ApiReview[];
                reviews?: ApiReview[];
            } & ApiReview[];

            const reviewsListRaw = 
                rawReviews.data?.reviews || 
                rawReviews.data?.data || 
                rawReviews.reviews || 
                (Array.isArray(rawReviews.data) ? rawReviews.data : null) ||
                (Array.isArray(rawReviews) ? rawReviews : []);

            const reviewsList = reviewsListRaw.map((r: ApiReview) => ({
                id: r.reviewId || Date.now().toString(),
                name: r.User?.fullName || r.username || "User",
                rating: r.rating || 5,
                comment: r.comment || "",
                date: r.createdAt ? new Date(r.createdAt).toLocaleDateString("vi-VN") : "06/06/2026"
            }));
            setReviews(reviewsList);

            // Cập nhật rating trung bình của phim ở trên ngay lập tức trên UI
            const newAverageRating = reviewsList.length > 0
                ? reviewsList.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewsList.length
                : 5.0;
            
            setMovie(prev => prev ? {
                ...prev,
                rating: newAverageRating
            } : null);

            toast.success(res.message || t("reviews_success_toast") || "Đánh giá thành công!");

            // Đồng bộ lại dữ liệu chi tiết phim từ database trong background
            try {
                const movieRes = await getMovieDetailApi(id);
                const responseData = movieRes as any;
                const data = responseData.data?.data || responseData.data || responseData;
                if (data && typeof data.averageRating === "number") {
                    setMovie(prev => prev ? {
                        ...prev,
                        rating: data.averageRating
                    } : null);
                }
            } catch (syncErr) {
                console.error("Lỗi đồng bộ chi tiết phim sau khi đánh giá:", syncErr);
            }
        } catch (err) {
            console.error("Lỗi khi đăng đánh giá:", err);
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
            const errMsg = errorObj?.response?.data?.message || errorObj?.message || "Không thể gửi đánh giá";
            toast.error(errMsg);
            throw err; // throw to let component know it failed and not reset form
        }
    };

    if (loading) {
        return (
            <div className="w-full bg-[#EFEBF4] py-20 flex flex-col items-center justify-center text-center px-4 min-h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#6D28D9] mb-4"></div>
                <p className="text-gray-500 font-semibold">{t("loading") || "Đang tải thông tin phim..."}</p>
            </div>
        );
    }

    if (!movie) {
        return (
            <div className="w-full bg-[#EFEBF4] py-20 flex flex-col items-center justify-center text-center px-4 min-h-[60vh]">
                <h2 className="text-2xl font-black text-gray-900 mb-2">{t("movie_not_found")}</h2>
                <p className="text-gray-500 mb-6 font-medium">{t("movie_not_found_desc")}</p>
                <Link to="/movies" className="inline-flex items-center gap-2 bg-[#6D28D9] text-white font-bold px-6 py-2.5 rounded-full hover:bg-[#5B21B6] transition-colors duration-200">
                    <ArrowLeft className="h-4 w-4" />
                    {t("back_to_movie_list")}
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full bg-[#EFEBF4] pb-16">
            <DetailHero movie={movie} />

            <div className="mx-auto max-w-[90%] px-4 sm:px-6 lg:px-8 mt-8 flex flex-col gap-8">
                <ScrollReveal animationClass="animate__fadeInUp">
                    <DetailReviews reviews={reviews} onAddReview={handleAddReview} />
                </ScrollReveal>
            </div>
        </div>
    );
}
