import { useState, useEffect, useRef } from "react";
import { Play, Info, X, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import Button from "../../../../components/Button/Button.tsx";
import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";
import { getNowShowingMoviesApi, getComingSoonMoviesApi } from "../../../../axios/cinemas.tsx";

export default function Hero() {
    const { t, language } = useLanguage();
    const [showTrailerModal, setShowTrailerModal] = useState<string | false>(false);
    const [topMovie, setTopMovie] = useState<any>(null);
    const [banners, setBanners] = useState<any[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://api.mievoh.io.vn/api').replace(/\/$/, '');

                const [nowShowingRes, comingSoonRes, bannersRes] = await Promise.all([
                    getNowShowingMoviesApi({ pageSize: 100 }),
                    getComingSoonMoviesApi({ pageSize: 100 }),
                    // Plain axios — /banners is @Public(), no auth needed
                    axios.get(`${API_BASE}/banners`).catch(() => ({ data: { data: { data: [] } } }))
                ]);

                const nowShowing = (nowShowingRes as any).data?.movies || (nowShowingRes as any).data?.data || [];
                const comingSoon = (comingSoonRes as any).data?.movies || (comingSoonRes as any).data?.data || [];

                // BE returns: { message, statusCode, data: { data: [...banners], total: N } }
                const rawBanners = (bannersRes as any).data?.data?.data
                    || (bannersRes as any).data?.data
                    || (bannersRes as any).data
                    || [];
                const fetchedBanners = Array.isArray(rawBanners) ? rawBanners : [];

                const allMoviesList = [...nowShowing, ...comingSoon];

                const activeBanners = fetchedBanners.map((banner: any) => {
                    const fullMovie = banner.movieId
                        ? allMoviesList.find((m: any) => m.movieId === banner.movieId)
                        : null;
                    return { ...banner, fullMovie: fullMovie || banner.Movie || null };
                });

                if (activeBanners.length > 0) {
                    setBanners(activeBanners);
                } else if (allMoviesList.length > 0) {
                    const sorted = [...allMoviesList].sort((a, b) =>
                        (b.averageRating || 0) - (a.averageRating || 0)
                    );
                    setTopMovie(sorted[0]);
                }
            } catch (err) {
                console.error("Error fetching hero data:", err);
            }
        };
        fetchData();
    }, []);

    // Auto-play carousel
    useEffect(() => {
        if (banners.length <= 1) return;
        autoPlayRef.current = setInterval(() => {
            setCurrentIdx(prev => (prev + 1) % banners.length);
        }, 5000);
        return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
    }, [banners.length]);

    const goTo = (idx: number) => {
        setCurrentIdx((idx + banners.length) % banners.length);
        if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        autoPlayRef.current = setInterval(() => {
            setCurrentIdx(prev => (prev + 1) % banners.length);
        }, 5000);
    };

    const getMovieImage = (movie: any) => {
        let image = movie?.imageUrl || "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1600&q=80";
        if (image && !image.startsWith('http')) {
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://api.mievoh.io.vn/api';
            const domain = apiBase.replace('/api', '');
            image = `${domain}/movies/${image}`;
        }
        return image;
    };

    const getBannerImage = (imageUrl: string) => {
        if (!imageUrl) return "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1600&q=80";
        if (imageUrl.startsWith('http')) return imageUrl;
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://api.mievoh.io.vn/api';
        const domain = apiBase.replace('/api', '');
        return `${domain}/${imageUrl.replace(/^\//, '')}`;
    };

    const getEmbedUrl = (url: string | null) => {
        if (!url) return "";
        let videoId = "";
        if (url.includes("youtube.com/watch")) {
            const urlParams = new URLSearchParams(new URL(url).search);
            videoId = urlParams.get("v") || "";
        } else if (url.includes("youtu.be/")) {
            videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
        } else if (url.includes("youtube.com/embed/")) {
            return url;
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
    };

    const renderSlide = (movie: any, bgImage: string) => {
        const title = movie
            ? (language === "vi" ? (movie.title_vi || movie.title_en) : (movie.title_en || movie.title_vi))
            : t("infinite_journey");
        const description = movie
            ? (language === "vi" ? (movie.description_vi || movie.description_en) : (movie.description_en || movie.description_vi))
            : t("hero_desc");

        return (
            <div className="relative h-[55vh] min-h-[450px] sm:h-[75vh] sm:min-h-[550px] w-full overflow-hidden rounded-3xl bg-black dark:bg-gradient-to-br dark:from-[#090416] dark:via-[#140b2d] dark:to-[#06020f] shadow-2xl flex items-center border border-transparent dark:border-violet-500/20 dark:shadow-[0_0_40px_rgba(139,92,246,0.15)]">
                {/* Background image */}
                <img
                    src={bgImage}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-0 dark:opacity-80 blur-3xl scale-125 pointer-events-none"
                />
                {/* Vignette */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 w-full h-full flex flex-col md:flex-row items-center justify-between gap-8 p-6 sm:p-12 lg:p-16">
                    <div className="flex-1 max-w-2xl flex flex-col items-start text-left text-white">
                        <span className="inline-block rounded-full bg-white/10 text-purple-200 backdrop-blur-md px-4 py-1 text-xs font-semibold uppercase tracking-wider mb-3 sm:mb-4 border border-white/10 animate__animated animate__fadeInDown">
                            {t("explore_now")}
                        </span>
                        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-white dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-violet-100 dark:to-violet-300 drop-shadow-md animate__animated animate__fadeInLeft leading-tight">
                            {title}
                        </h1>
                        <p className="mt-2.5 sm:mt-4 text-xs sm:text-lg text-gray-300 dark:text-violet-200/80 leading-relaxed font-medium animate__animated animate__fadeInLeft animate__delay-1s line-clamp-3">
                            {description}
                        </p>
                        <div className="mt-5 sm:mt-8 flex flex-wrap gap-3 sm:gap-4 animate__animated animate__fadeInUp animate__delay-1s">
                            {movie?.trailerUrl && (
                                <Button
                                    variant="primary"
                                    size="md"
                                    onClick={() => setShowTrailerModal(movie.trailerUrl)}
                                    className="flex items-center gap-2"
                                >
                                    <Play className="h-4 w-4 fill-current" />
                                    <span>{t("watch_trailer")}</span>
                                </Button>
                            )}
                            {movie && (
                                <Button
                                    variant="outline"
                                    size="md"
                                    href={`/movies/${movie.movieId}`}
                                    className="flex items-center gap-2 border-white/40 text-white hover:bg-white/10 hover:border-white hover:text-white"
                                >
                                    <Info className="h-4 w-4" />
                                    <span>{t("more_info")}</span>
                                </Button>
                            )}
                        </div>
                    </div>

                    {movie && (
                        <div className="hidden md:flex justify-center items-center animate__animated animate__fadeInRight animate__delay-1s shrink-0">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-pink-500 rounded-2xl blur opacity-25 dark:opacity-50 group-hover:opacity-70 transition duration-1000" />
                                <div className="relative overflow-hidden rounded-2xl border border-white/10 dark:border-violet-500/20 shadow-xl w-56 sm:w-64 lg:w-80 aspect-[2/3]">
                                    <img
                                        src={getMovieImage(movie)}
                                        alt={title}
                                        className="h-full w-full object-cover transform hover:scale-105 transition-transform duration-700 ease-out"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-violet-600/10 dark:bg-violet-600/20 blur-[120px] pointer-events-none" />
                <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-fuchsia-600/10 dark:bg-fuchsia-600/15 blur-[120px] pointer-events-none" />
            </div>
        );
    };

    // Determine what to show
    const slides = banners.length > 0
        ? banners.map(b => ({ movie: b.fullMovie, image: getBannerImage(b.imageUrl) }))
        : topMovie
            ? [{ movie: topMovie, image: getMovieImage(topMovie) }]
            : [];

    return (
        <div className="relative mx-auto max-w-[85%] px-4 pt-16 sm:pt-24 animate__animated animate__fadeIn">
            {slides.length === 0 ? (
                // Loading skeleton
                <div className="h-[55vh] min-h-[450px] w-full rounded-3xl bg-gray-900 animate-pulse flex items-center justify-center shadow-2xl">
                    <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : slides.length === 1 ? (
                renderSlide(slides[0].movie, slides[0].image)
            ) : (
                // Custom Carousel (no external library)
                <div className="relative">
                    {/* Slides */}
                    <div className="relative overflow-hidden rounded-3xl">
                        {slides.map((slide, idx) => (
                            <div
                                key={idx}
                                className="transition-opacity duration-700"
                                style={{
                                    opacity: idx === currentIdx ? 1 : 0,
                                    position: idx === currentIdx ? 'relative' : 'absolute',
                                    top: 0, left: 0, width: '100%',
                                    pointerEvents: idx === currentIdx ? 'auto' : 'none',
                                    zIndex: idx === currentIdx ? 1 : 0,
                                }}
                            >
                                {renderSlide(slide.movie, slide.image)}
                            </div>
                        ))}
                    </div>

                    {/* Prev/Next arrows */}
                    <button
                        onClick={() => goTo(currentIdx - 1)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all backdrop-blur-sm border border-white/10"
                        aria-label="Previous"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => goTo(currentIdx + 1)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all backdrop-blur-sm border border-white/10"
                        aria-label="Next"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Dot indicators */}
                    <div className="flex justify-center gap-2 mt-4">
                        {slides.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => goTo(idx)}
                                className={`transition-all duration-300 rounded-full ${idx === currentIdx
                                    ? 'bg-violet-500 w-6 h-2'
                                    : 'bg-white/30 hover:bg-white/60 w-2 h-2'
                                    }`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Video Trailer Modal */}
            {showTrailerModal && typeof showTrailerModal === 'string' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md animate__animated animate__fadeIn animate__faster">
                    <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-[#1A1A1C] shadow-2xl border border-white/10 animate__animated animate__zoomIn animate__faster">
                        <button
                            onClick={() => setShowTrailerModal(false)}
                            className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 text-white/80 hover:bg-black/90 hover:text-white transition-all border border-white/10"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <div className="aspect-video w-full">
                            <iframe
                                src={getEmbedUrl(showTrailerModal)}
                                title="Movie Trailer"
                                className="h-full w-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
