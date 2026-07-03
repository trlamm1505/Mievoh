import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";
import type { TranslationKeys } from "../../../../contextAPI/LanguageContext.tsx";
import type { DateOption } from "../DateSelector/DateSelector.tsx";
import { Clock, Film, User } from "lucide-react";
import { getShowtimesByComplexApi } from "../../../../axios/cinemas.tsx";

interface MovieShowtimesListProps {
    complexId: string;
    selectedDate: DateOption | null;
    cinemaName: string;
}

interface ShowtimeItem {
    showtimeId: string;
    showDateTime: string;
    format: string | null;
}

interface ShowtimeMovie {
    movieId: string;
    title_vi?: string | null;
    title_en?: string | null;
    imageUrl?: string | null;
    duration?: number | null;
    director?: string | null;
    ageRestriction?: string | null;
    genres?: string[];
    showtimes: ShowtimeItem[];
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

export default function MovieShowtimesList({ complexId, selectedDate, cinemaName }: MovieShowtimesListProps) {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [movies, setMovies] = useState<ShowtimeMovie[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!complexId) return;

        const fetchShowtimes = async () => {
            try {
                setLoading(true);
                let dateParam: string | undefined = undefined;
                if (selectedDate?.dateString) {
                    const [yyyy, mm, dd] = selectedDate.dateString.split("-");
                    dateParam = `${dd}/${mm}/${yyyy}`;
                }
                const res = await getShowtimesByComplexApi(complexId, dateParam);
                const responseData = res as unknown as { data?: ShowtimeMovie[] } & ShowtimeMovie[];
                const moviesList = responseData.data || (Array.isArray(responseData) ? responseData : []);
                setMovies(moviesList);
            } catch (err) {
                console.error("Lỗi khi lấy lịch chiếu:", err);
                setMovies([]);
            } finally {
                setLoading(false);
            }
        };

        fetchShowtimes();
    }, [complexId, selectedDate]);

    // Check if selected date is today
    const isToday = useMemo(() => {
        if (!selectedDate) return false;
        const todayStr = new Date().toISOString().split('T')[0];
        return selectedDate.dateString === todayStr;
    }, [selectedDate]);

    // Check if time slot is expired (for today)
    const isExpired = (timeStr: string) => {
        if (!isToday) return false;
        const [hours, minutes] = timeStr.split(":").map(Number);
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        return currentHours > hours || (currentHours === hours && currentMinutes >= minutes);
    };

    const handleSelectShowtime = (movieId: string, showtimeId: string, format: string, time: string) => {
        navigate(`/movies/${movieId}/book/seats`, {
            state: {
                branchName: cinemaName,
                format,
                time,
                date: selectedDate?.dateString,
                dateLabel: selectedDate?.label,
                dayOfWeek: selectedDate?.dayOfWeek,
                showtimeId
            }
        });
    };

    const getAgeBadgeStyle = (ageRating: string = "P") => {
        const cleanRating = ageRating.toUpperCase();
        if (cleanRating.includes("P")) return "bg-emerald-500 text-white";
        if (cleanRating.includes("T13")) return "bg-amber-500 text-white";
        if (cleanRating.includes("T16")) return "bg-orange-500 text-white";
        return "bg-rose-500 text-white";
    };

    const formatTime = (dateTimeStr: string) => {
        const d = new Date(dateTimeStr);
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#6C5CE7] mb-2"></div>
                <p className="text-gray-500 font-semibold">{t("loading") || "Đang tải lịch chiếu..."}</p>
            </div>
        );
    }

    if (movies.length === 0) {
        return (
            <div className="bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-md">
                <p className="text-gray-500 font-semibold">{t("no_showtimes") || "Không có suất chiếu nào cho ngày này."}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate__animated animate__fadeIn">
            {movies.map(movie => {
                const title = (language === "vi" ? (movie.title_vi || movie.title_en) : (movie.title_en || movie.title_vi)) || "Phim";
                const genresList = movie.genres || [];
                const age = movie.ageRestriction || "P";
                
                // Group showtimes by format
                const groupedShowtimes: Record<string, ShowtimeItem[]> = {};
                movie.showtimes.forEach((st: ShowtimeItem) => {
                    let fmt = st.format || "2D Sub";
                    if (fmt.toLowerCase() === "2d-sub-en" || fmt.toLowerCase() === "2d-sub-vi") {
                        fmt = "2D Phụ Đề";
                    } else if (fmt.toLowerCase() === "2d-dub") {
                        fmt = "2D Lồng Tiếng";
                    }
                    if (!groupedShowtimes[fmt]) {
                        groupedShowtimes[fmt] = [];
                    }
                    groupedShowtimes[fmt].push(st);
                });

                return (
                    <div
                        key={movie.movieId}
                        className="bg-white dark:bg-zinc-900/50 border border-slate-100/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-md shadow-slate-100/50 dark:shadow-none hover:shadow-xl hover:shadow-indigo-100/20 hover:border-indigo-200/50 dark:hover:border-zinc-700/80 transition-all duration-300 flex flex-col md:flex-row gap-6 group"
                    >
                        {/* Poster with hover scale and age tag */}
                        <div className="w-full md:w-32 aspect-[2/3] md:h-48 rounded-2xl overflow-hidden shrink-0 shadow-md relative group/poster border border-slate-100 dark:border-zinc-800">
                            <img
                                src={movie.imageUrl ?? "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80"}
                                alt={title}
                                className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform duration-500"
                            />
                            {/* Age badge */}
                            <div className={`absolute top-3 left-3 font-extrabold text-[10px] px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm ${getAgeBadgeStyle(age)}`}>
                                {age}
                            </div>
                        </div>

                        {/* Details & Showtimes */}
                        <div className="flex-grow flex flex-col justify-between">
                            <div>
                                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3 group-hover:text-[#6C5CE7] dark:group-hover:text-violet-400 transition-colors duration-200">
                                    {title}
                                </h3>

                                {/* Info tags row */}
                                <div className="flex flex-wrap gap-2.5 mb-5">
                                    {movie.duration && (
                                        <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/50 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400 font-bold px-3 py-1.5 rounded-xl text-xs">
                                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                                            {movie.duration} mins
                                        </span>
                                    )}
                                    {genresList.length > 0 && (
                                        <span className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200/50 text-indigo-800 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400 font-bold px-3 py-1.5 rounded-xl text-xs">
                                            <Film className="h-3.5 w-3.5 text-indigo-600" />
                                            {genresList.map((genre: string) => {
                                                const key = genreKeys[genre];
                                                return key ? t(key as TranslationKeys) : genre;
                                            }).join(", ")}
                                        </span>
                                    )}
                                    {movie.director && (
                                        <span className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 dark:bg-zinc-800 dark:border-zinc-700/80 dark:text-zinc-300 font-bold px-3 py-1.5 rounded-xl text-xs">
                                            <User className="h-3.5 w-3.5 text-slate-500" />
                                            {t("director")}: {movie.director}
                                        </span>
                                    )}
                                </div>

                                {/* Formats & time buttons grid */}
                                <div className="space-y-5 pt-5 border-t border-slate-100 dark:border-zinc-800/80">
                                    {Object.entries(groupedShowtimes).map(([formatName, showtimes]) => (
                                        <div key={formatName}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="h-3 w-1.5 bg-[#6C5CE7] rounded-full animate-pulse" />
                                                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                                    {formatName}
                                                </h4>
                                            </div>
                                            <div className="flex flex-wrap gap-2.5">
                                                {showtimes.map((st: ShowtimeItem) => {
                                                    const time = formatTime(st.showDateTime);
                                                    const expired = isExpired(time);
                                                    return (
                                                        <button
                                                            key={st.showtimeId}
                                                            disabled={expired}
                                                            onClick={() => handleSelectShowtime(movie.movieId, st.showtimeId, formatName, time)}
                                                            className={`px-5.5 py-2.5 text-xs font-black rounded-xl border transition-all duration-200 ${expired
                                                                    ? "bg-slate-50 border-slate-100/65 text-slate-300 dark:bg-zinc-800/20 dark:border-zinc-800/55 dark:text-zinc-600 dark:line-through cursor-not-allowed line-through text-[11px] font-bold"
                                                                    : "bg-slate-50/80 border-slate-200 text-slate-900 dark:bg-zinc-800/50 dark:border-zinc-700/80 dark:text-zinc-200 dark:hover:bg-[#6C5CE7] dark:hover:border-[#6C5CE7] dark:hover:text-white hover:bg-[#6C5CE7] hover:border-[#6C5CE7] hover:text-white hover:scale-[1.03] cursor-pointer shadow-sm active:scale-95"
                                                                }`}
                                                        >
                                                            {time}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
