import { useState, useEffect } from "react";
import Slider from "react-slick";
import { slickHotMoviesSettings } from "../../../../config/slick/slickConfig.tsx";
import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";
import { useTheme } from "../../../../contextAPI/ThemeContext.tsx";
import { getRecommendedMoviesApi, type RecommendedMovie } from "../../../../axios/profile.tsx";
import MovieCard from "../../../../components/MovieCard/MovieCard.tsx";
import { useLocation } from "react-router-dom";
import ScrollReveal from "../../../../components/ScrollReveal/ScrollReveal.tsx";

export default function RecommendedMovies() {
    const { t, language } = useLanguage();
    const { theme } = useTheme();
    const location = useLocation();
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

        // Dispatch resize event to let slick recalculate its width
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
        const fetchRecommendedMovies = async () => {
            try {
                setLoading(true);
                const res = await getRecommendedMoviesApi();
                const list = res.data?.data || [];
                
                const mapped = list.map((m: RecommendedMovie) => {
                    let image = m.Movie?.imageUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80";
                    if (m.Movie?.imageUrl && !m.Movie.imageUrl.startsWith('http')) {
                        const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://api.mievoh.io.vn/api';
                        const domain = apiBase.replace('/api', '');
                        image = `${domain}/movies/${m.Movie.imageUrl}`;
                    }

                    return {
                        id: m.movieId,
                        title: m.Movie?.title_vi || "Movie",
                        title_vi: m.Movie?.title_vi || "Phim",
                        title_en: m.Movie?.title_vi || "Movie",
                        image,
                        rating: m.Movie?.averageRating ?? m.Movie?.averagerating ?? 0,
                        genres: [],
                        status: "now_showing",
                    };
                });
                setMovies(mapped);
            } catch (err) {
                console.warn("Lỗi khi lấy danh sách phim đề xuất:", err);
                setMovies([]);
            } finally {
                setLoading(false);
            }
        };
        
        // Fetch recommendations only if we have an accessToken (user is logged in)
        const token = localStorage.getItem('accessToken');
        if (token) {
            fetchRecommendedMovies();
        } else {
            setMovies([]);
            setLoading(false);
        }
    }, [language]);

    useEffect(() => {
        if (!loading && movies.length > 0 && location.hash === "#recommended-movies") {
            const timer = setTimeout(() => {
                const el = document.getElementById("recommended-movies");
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [loading, movies, location.hash]);

    if (loading) {
        return null; // Don't show loading spinner on home page for recommended section, keep it seamless
    }

    if (movies.length === 0) {
        return null; // Hide the section completely if no recommendations exist or user is not logged in
    }

    const getSlidesToShow = () => {
        if (windowWidth < 420) return 1;
        if (windowWidth < 768) return 2;
        if (windowWidth < 1024) return 3;
        return Math.min(4, movies.length);
    };

    const sliderSettings = {
        ...slickHotMoviesSettings,
        slidesToShow: getSlidesToShow(),
        responsive: undefined
    };

    const SlickSlider = (Slider as any).default || Slider;

    return (
        <ScrollReveal animationClass="animate__fadeInUp">
            <section id="recommended-movies" className={`mx-auto max-w-[85%] px-4 py-8 sm:py-10 font-sans transition-colors duration-200 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {/* Header section with heading */}
                <div className="mb-8">
                    <h2 className="text-2xl font-extrabold tracking-tight">
                        {t("recommended_movies")}
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
                    {mounted && (
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
        </ScrollReveal>
    );
}
