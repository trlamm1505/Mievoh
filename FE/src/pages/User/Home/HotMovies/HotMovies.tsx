import { useState, useEffect } from "react";
import Slider from "react-slick";
import { slickHotMoviesSettings } from "../../../../config/slick/slickConfig.tsx";
import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";
import { getNowShowingMoviesApi } from "../../../../axios/movie.tsx";
import MovieCard from "../../../../components/MovieCard/MovieCard.tsx";

export default function HotMovies() {
    const { t, language } = useLanguage();
    const [mounted, setMounted] = useState(false);
    const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
    const [movies, setMovies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };
        window.addEventListener("resize", handleResize);
        handleResize();

        const offsets = [50, 150, 300, 500, 1000];
        const timers = offsets.map(delay => 
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, delay)
        );

        return () => {
            window.removeEventListener("resize", handleResize);
            timers.forEach(clearTimeout);
        };
    }, []);

    useEffect(() => {
        const fetchHotMovies = async () => {
            try {
                setLoading(true);
                const res = await getNowShowingMoviesApi({ page: 1, pageSize: 100 });
                const list = (res.data as any)?.data || [];
                
                const mapped = list.map((m: any) => {
                    let genresArr: string[] = [];
                    if (Array.isArray(m.genres)) {
                        genresArr = m.genres;
                    } else if (typeof m.genres === 'string') {
                        genresArr = m.genres.split(',').map((g: string) => g.trim());
                    }

                    let image = m.imageUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80";
                    if (m.imageUrl && !m.imageUrl.startsWith('http')) {
                        const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://api.mievoh.io.vn/api';
                        const domain = apiBase.replace('/api', '');
                        image = `${domain}/movies/${m.imageUrl}`;
                    }

                    return {
                        id: m.movieId,
                        title: language === "vi" ? (m.title_vi || m.title_en || "Phim") : (m.title_en || m.title_vi || "Movie"),
                        image,
                        rating: m.averageRating ?? 0,
                        genres: genresArr,
                        status: "now_showing",
                    };
                });
                const sorted = mapped.sort((a: any, b: any) => b.rating - a.rating);
                const top8 = sorted.slice(0, 8);
                setMovies(top8);
            } catch (err) {
                console.error("Lỗi khi lấy danh sách phim hot:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHotMovies();
    }, [language]);

    const getSlidesToShow = () => {
        if (windowWidth < 420) return 1;
        if (windowWidth < 768) return 2;
        if (windowWidth < 1024) return 3;
        return 4;
    };

    const sliderSettings = {
        ...slickHotMoviesSettings,
        slidesToShow: getSlidesToShow(),
        responsive: undefined
    };

    // Resolve default export for react-slick in Vite environment
    const SlickSlider = (Slider as any).default || Slider;

    return (
        <section className="mx-auto max-w-[85%] px-4 py-16 sm:py-20 font-sans">
            {/* Header section with heading */}
            <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    {t("trending_movies")}
                </h2>
            </div>

            {/* Movies Slider */}
            <div className="relative slider-container">
                <style>{`
                    .slider-container .slick-track {
                        display: flex !important;
                    }
                    .slider-container .slick-slide {
                        height: inherit !important;
                        display: flex !important;
                        justify-content: center;
                    }
                    .slider-container .slick-slide > div {
                        width: 100%;
                        height: 100% !important;
                        display: flex !important;
                    }
                `}</style>
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-650"></div>
                    </div>
                ) : mounted && (
                    <SlickSlider {...sliderSettings}>
                        {movies.map((movie) => (
                            <div key={movie.id} className="px-2 pb-4 flex flex-col h-full w-full">
                                <MovieCard 
                                    movie={movie} 
                                    showStatus={true} 
                                    buttonVariant="outline" 
                                    buttonText={t("quick_book")} 
                                    useCountUp={true} 
                                    lineClamp={1}
                                />
                            </div>
                        ))}
                    </SlickSlider>
                )}
            </div>
        </section>
    );
}
