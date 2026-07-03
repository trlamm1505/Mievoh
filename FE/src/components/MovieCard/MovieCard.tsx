import React from "react";
import { Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../Button/Button.tsx";
import { toast } from "../Toast/Toast.tsx";
import { useLanguage } from "../../contextAPI/LanguageContext.tsx";
import CountUp from "react-countup";

export interface Movie {
    id: number | string;
    title: string;
    title_vi?: string;
    title_en?: string;
    image: string;
    rating: number;
    genres: string[];
    status?: "now_showing" | "coming_soon";
    releaseDate?: string;
}

interface MovieCardProps {
    movie: Movie;
    showStatus?: boolean;      // defaults to true
    buttonVariant?: "primary" | "secondary" | "outline" | "link" | "danger" | "outline-purple"; // customizable button variant
    buttonText?: string;       // override button label (e.g. t("quick_book"))
    useCountUp?: boolean;      // whether to use CountUp animation for rating
    lineClamp?: 1 | 2;         // line clamp for title
}

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

export default function MovieCard({
    movie,
    showStatus = true,
    buttonVariant,
    buttonText,
    useCountUp = false,
    lineClamp = 2,
}: MovieCardProps) {
    const { t, language } = useLanguage();
    const navigate = useNavigate();

    const isComingSoon = movie.status === "coming_soon";
    const displayTitle = language === "vi" 
        ? (movie.title_vi || movie.title) 
        : (movie.title_en || movie.title);

    const handleAction = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        
        // If it has coming soon status, show toast notification. Otherwise, navigate to booking page.
        if (isComingSoon) {
            toast.success(t("subscribed_notifications", { title: displayTitle }));
        } else {
            navigate(`/movies/${movie.id}/book`);
        }
    };

    // Determine final button variant and text
    const finalVariant = buttonVariant || (isComingSoon ? "outline" : "primary");
    const finalButtonText = buttonText || (isComingSoon ? t("get_notified") : t("buy_ticket"));

    const CountUpComponent = (CountUp as any).default || CountUp;

    return (
        <Link 
            to={`/movies/${movie.id}`} 
            className="group flex flex-col justify-between overflow-hidden rounded-2xl bg-[#F6F3F9] p-3 shadow-md hover:shadow-xl transition-all duration-300 border border-[#EAE6F0] hover:scale-[1.02] h-full cursor-pointer block no-underline text-inherit"
        >
            {/* Image Container */}
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-gray-100 mb-4">
                <img
                    src={movie.image}
                    alt={displayTitle}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Floating Status Badge */}
                {showStatus && movie.status && (
                    <div className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-md backdrop-blur-sm ${
                        isComingSoon ? "bg-violet-600/80" : "bg-green-600/80"
                    }`}>
                        {isComingSoon ? t("coming_soon") : t("now_showing")}
                    </div>
                )}

                {/* Rating Badge */}
                <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/10">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>
                        {useCountUp ? (
                            <CountUpComponent end={movie.rating} decimals={1} duration={1.5} enableScrollSpy scrollSpyOnce />
                        ) : (
                            movie.rating.toFixed(1)
                        )}
                    </span>
                </div>
            </div>

            {/* Movie Details */}
            <div className="flex flex-col flex-grow">
                <h3 className={`text-base font-bold text-gray-900 group-hover:text-[#6D28D9] transition-colors duration-200 mb-2 ${
                    lineClamp === 1 ? "line-clamp-1" : "line-clamp-2 min-h-[48px]"
                }`}>
                    {displayTitle}
                </h3>

                {/* Genres */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {movie.genres.map((genre, idx) => {
                        const key = genreKeys[genre];
                        const displayGenre = key ? t(key as any) : genre;
                        return (
                            <span
                                key={idx}
                                className="inline-block rounded-md bg-[#F3E8FF] px-2 py-0.5 text-xs font-semibold text-[#6D28D9]"
                            >
                                {displayGenre}
                            </span>
                        );
                    })}
                </div>

                {/* Release date if coming soon */}
                {isComingSoon && movie.releaseDate && (
                    <div className="text-xs text-gray-500 mb-4 italic">
                        Release Date: {movie.releaseDate}
                    </div>
                )}
            </div>

            {/* Action Button */}
            <div className="mt-auto">
                <Button
                    variant={finalVariant}
                    size="sm"
                    onClick={handleAction}
                    className="w-full text-center"
                >
                    {finalButtonText}
                </Button>
            </div>
        </Link>
    );
}
