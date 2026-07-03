import { useState } from "react";
import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";
import { useNavigate } from "react-router-dom";
import { Star, Clock, Calendar, Globe, Play, User, Users, Shield } from "lucide-react";
import Button from "../../../../components/Button/Button.tsx";
import TrailerModal from "../TrailerModal/TrailerModal.tsx";
import CountUp from "react-countup";

export interface MovieDetailInfo {
    id: string | number;
    title: string;
    title_vi?: string;
    title_en?: string;
    description_vi?: string;
    description_en?: string;
    language_vi?: string;
    language_en?: string;
    image: string;
    backdrop: string;
    rating: number;
    genres: string[];
    status: "now_showing" | "coming_soon";
    releaseDate: string;
    duration: string;
    ageRating: string;
    language: string;
    director: string;
    cast: string[];
    description: string;
    trailerUrl?: string;
}

interface DetailHeroProps {
    movie: MovieDetailInfo;
}

const getTrailerUrl = (movieId: number): string => {
    const trailers: Record<number, string> = {
        1: "https://www.youtube.com/embed/8hP9D6kZseM", // Inception
        2: "https://www.youtube.com/embed/0pdqf4P9MB8", // La La Land
        3: "https://www.youtube.com/embed/5xH0HfJHsaY", // Parasite
        4: "https://www.youtube.com/embed/EX6cl7mcc-c", // Bố Già
        5: "https://www.youtube.com/embed/n9xhJrPXop4", // Dune
        6: "https://www.youtube.com/embed/6zhLBe319KE", // Nausicaä
        7: "https://www.youtube.com/embed/qGqiHJTsRkQ", // Knives Out
        8: "https://www.youtube.com/embed/jCFUuGTyLg0", // Underwater
        9: "https://www.youtube.com/embed/Uv554B7GC40", // Creed
        10: "https://www.youtube.com/embed/aETNYyrqNYE", // Our Planet
        11: "https://www.youtube.com/embed/xjDjIWPwcPU", // Black Panther
        12: "https://www.youtube.com/embed/YPY7J-flzE8", // A Quiet Place: Day One
        13: "https://www.youtube.com/embed/fb5ELWi-cab", // Jurassic World
        14: "https://www.youtube.com/embed/2a13M1zFm5U", // Strange Magic
    };
    return trailers[movieId] || "https://www.youtube.com/embed/n9xhJrPXop4";
};

const genreKeys: Record<string, string> = {
    "Action": "genre_action",
    "Sci-Fi": "genre_scifi",
    "Romance": "genre_romance",
    "Music": "genre_music",
    "Mystery": "genre_mystery",
    "Thriller": "genre_thriller",
    "Comedy": "genre_comedy",
    "Family": "genre_family",
    "Adventure": "genre_adventure",
    "Animation": "genre_animation",
    "Crime": "genre_crime",
    "Horror": "genre_horror",
    "Sports": "genre_sports",
    "Drama": "genre_drama",
    "Documentary": "genre_documentary",
    "Nature": "genre_nature"
};

export default function DetailHero({ movie }: DetailHeroProps) {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const displayTitle = language === "vi" ? (movie.title_vi || movie.title) : (movie.title_en || movie.title);
    const displayDescription = language === "vi" ? (movie.description_vi || movie.description) : (movie.description_en || movie.description);
    const displayLanguage = language === "vi" ? (movie.language_vi || movie.language) : (movie.language_en || movie.language);
    const [showTrailer, setShowTrailer] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const handleBuyTicket = () => {
        navigate(`/movies/${movie.id}/book`);
    };

    const handleWatchTrailer = () => {
        setShowTrailer(true);
        setIsClosing(false);
    };

    const handleCloseTrailer = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowTrailer(false);
            setIsClosing(false);
        }, 400);
    };

    const CountUpComponent = (CountUp as any).default || CountUp;

    return (
        <div className="relative w-full min-h-[400px] md:min-h-[500px] bg-black overflow-hidden flex items-end">
            {/* Backdrop Image with blurred and dark mask overlay */}
            <div 
                className="absolute inset-0 bg-cover bg-center filter blur-[4px] scale-105 opacity-40"
                style={{ backgroundImage: `url(${movie.backdrop})` }}
            />
            {/* Solid dark gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />

            <div className="relative mx-auto max-w-[90%] w-full px-4 sm:px-6 lg:px-8 py-10 md:py-16 z-10">
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-stretch">
                    {/* Poster */}
                    <div className="w-48 sm:w-60 md:w-80 lg:w-[340px] aspect-[3/4] md:aspect-auto overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl shrink-0 animate__animated animate__zoomIn">
                        <img 
                            src={movie.image} 
                            alt={displayTitle} 
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Movie info */}
                    <div className="flex flex-col justify-between gap-4 text-center md:text-left text-white animate__animated animate__fadeInUp">
                        {/* Tags / Badges */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                            <span className="bg-white/10 text-white text-xs font-bold px-2.5 py-1 rounded-md backdrop-blur-sm border border-white/10 flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {movie.duration}
                            </span>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                                movie.status === "coming_soon" ? "bg-violet-600 text-white" : "bg-green-600 text-white"
                            }`}>
                                {movie.status === "coming_soon" ? t("coming_soon") : t("now_showing")}
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                            {displayTitle}
                        </h1>

                        {/* Rating */}
                        <div className="flex items-center justify-center md:justify-start gap-2">
                            <div className="flex items-center gap-1 text-yellow-400">
                                <Star className="h-5 w-5 fill-yellow-400" />
                                <span className="text-lg font-black">
                                    <CountUpComponent end={movie.rating} decimals={1} duration={1.5} enableScrollSpy scrollSpyOnce />
                                </span>
                            </div>
                            <span className="text-xs text-gray-400 font-bold border-l border-white/20 pl-2">
                                (5.0 / 5 based on reviews)
                            </span>
                        </div>

                        {/* Genres */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5">
                            {movie.genres.map((genre, idx) => {
                                const key = genreKeys[genre];
                                const displayGenre = key ? t(key as any) : genre;
                                return (
                                    <span 
                                        key={idx}
                                        className="bg-[#6D28D9]/30 text-[#D8B4FE] border border-[#6D28D9]/40 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm"
                                    >
                                        {displayGenre}
                                    </span>
                                );
                            })}
                        </div>

                        {/* Synopsis Description */}
                        <p className="text-gray-300 text-sm max-w-xl md:max-w-2xl leading-relaxed mt-1 font-medium text-center md:text-left opacity-90">
                            {displayDescription}
                        </p>

                        {/* Detailed Metadata Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5 mt-4 border-t border-white/10 pt-4 max-w-2xl text-sm">
                            <div className="flex items-start gap-2.5">
                                <Calendar className="h-4.5 w-4.5 text-violet-400 shrink-0 mt-0.5" />
                                <div className="flex flex-col gap-0.5 text-left">
                                    <span className="text-violet-300 font-bold text-xs uppercase tracking-wider">{t("release_date")}</span>
                                    <span className="text-white font-extrabold">{movie.releaseDate}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <User className="h-4.5 w-4.5 text-violet-400 shrink-0 mt-0.5" />
                                <div className="flex flex-col gap-0.5 text-left">
                                    <span className="text-violet-300 font-bold text-xs uppercase tracking-wider">{t("director")}</span>
                                    <span className="text-white font-extrabold">{movie.director}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <Users className="h-4.5 w-4.5 text-violet-400 shrink-0 mt-0.5" />
                                <div className="flex flex-col gap-0.5 text-left">
                                    <span className="text-violet-300 font-bold text-xs uppercase tracking-wider">{t("cast")}</span>
                                    <span className="text-white font-extrabold leading-snug">{movie.cast.join(", ")}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <Shield className="h-4.5 w-4.5 text-violet-400 shrink-0 mt-0.5" />
                                <div className="flex flex-col gap-0.5 text-left">
                                    <span className="text-violet-300 font-bold text-xs uppercase tracking-wider">{t("age_rating")}</span>
                                    <span className="text-white font-extrabold">{movie.ageRating}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <Clock className="h-4.5 w-4.5 text-violet-400 shrink-0 mt-0.5" />
                                <div className="flex flex-col gap-0.5 text-left">
                                    <span className="text-violet-300 font-bold text-xs uppercase tracking-wider">{t("duration")}</span>
                                    <span className="text-white font-extrabold">{movie.duration}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <Globe className="h-4.5 w-4.5 text-violet-400 shrink-0 mt-0.5" />
                                <div className="flex flex-col gap-0.5 text-left">
                                    <span className="text-violet-300 font-bold text-xs uppercase tracking-wider">{t("language_label")}</span>
                                    <span className="text-white font-extrabold">{displayLanguage}</span>
                                </div>
                            </div>
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-4 mt-6">
                            <Button 
                                variant="primary" 
                                size="md" 
                                onClick={handleBuyTicket}
                                className="w-full sm:w-auto shadow-lg shadow-violet-500/20"
                            >
                                {movie.status === "coming_soon" ? t("get_notified") : t("buy_ticket")}
                            </Button>
                            <Button 
                                variant="outline-purple" 
                                size="md" 
                                onClick={handleWatchTrailer}
                                className="w-full sm:w-auto text-white hover:text-white border-white/30 hover:border-white"
                            >
                                <Play className="h-4 w-4 mr-2 fill-white" />
                                {t("watch_trailer")}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trailer Modal Component */}
            <TrailerModal 
                isOpen={showTrailer}
                isClosing={isClosing}
                onClose={handleCloseTrailer}
                trailerUrl={movie.trailerUrl || getTrailerUrl(Number(movie.id) || 1)}
                movieTitle={displayTitle}
            />
        </div>
    );
}
