import DateSelector from "../CinemaDetail/DateSelector/DateSelector.tsx";
import { useLanguage } from "../../../contextAPI/LanguageContext.tsx";
import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Star, ChevronDown, Loader2 } from "lucide-react";
import CityFilter from "../../../components/CityFilter/CityFilter.tsx";
import { getMovieDetailApi, getShowtimesByMovieApi } from "../../../axios/movie.tsx";

interface DateOption {
    label: string;      // e.g. "29/5"
    dayOfWeek: string;  // e.g. "Th 6"
    dateString: string;  // e.g. "2026-05-29"
}

interface ChainTheme {
    bgGradient: string;
    textColor: string;
    titleColor: string;
    badgeBg: string;
    badgeText: string;
    buttonActive: string;
    borderColor: string;
    glowColor: string;
    branchBg: string;
}

const CHAIN_THEMES: Record<string, ChainTheme> = {
    cgv: {
        bgGradient: "from-violet-50/60 to-violet-50/30", titleColor: "text-slate-800 dark:text-white group-hover:text-[#8E7EFE] dark:group-hover:text-violet-400",
        textColor: "group-hover:text-[#8E7EFE] text-[#8E7EFE]/80 dark:text-violet-400",
        badgeBg: "bg-[#8E7EFE]/10",
        badgeText: "text-[#8E7EFE]",
        buttonActive: "hover:bg-[#6C5CE7] hover:border-[#6C5CE7] hover:text-white",
        borderColor: "border-violet-100 dark:border-zinc-800/80 hover:border-violet-200 dark:hover:border-zinc-700",
        glowColor: "#8E7EFE", branchBg: "bg-white dark:bg-zinc-900/40 hover:bg-violet-50/10 dark:hover:bg-zinc-800/30"
    },
    bhd: {
        bgGradient: "from-violet-50/60 to-violet-50/30", titleColor: "text-slate-800 dark:text-white group-hover:text-[#8E7EFE] dark:group-hover:text-violet-400",
        textColor: "group-hover:text-[#8E7EFE] text-[#8E7EFE]/80 dark:text-violet-400",
        badgeBg: "bg-[#8E7EFE]/10",
        badgeText: "text-[#8E7EFE]",
        buttonActive: "hover:bg-[#6C5CE7] hover:border-[#6C5CE7] hover:text-white",
        borderColor: "border-violet-100 dark:border-zinc-800/80 hover:border-violet-200 dark:hover:border-zinc-700",
        glowColor: "#8E7EFE", branchBg: "bg-white dark:bg-zinc-900/40 hover:bg-violet-50/10 dark:hover:bg-zinc-800/30"
    },
    lotte: {
        bgGradient: "from-violet-50/60 to-violet-50/30", titleColor: "text-slate-800 dark:text-white group-hover:text-[#8E7EFE] dark:group-hover:text-violet-400",
        textColor: "group-hover:text-[#8E7EFE] text-[#8E7EFE]/80 dark:text-violet-400",
        badgeBg: "bg-[#8E7EFE]/10",
        badgeText: "text-[#8E7EFE]",
        buttonActive: "hover:bg-[#6C5CE7] hover:border-[#6C5CE7] hover:text-white",
        borderColor: "border-violet-100 dark:border-zinc-800/80 hover:border-violet-200 dark:hover:border-zinc-700",
        glowColor: "#8E7EFE", branchBg: "bg-white dark:bg-zinc-900/40 hover:bg-violet-50/10 dark:hover:bg-zinc-800/30"
    },
    cinestar: {
        bgGradient: "from-violet-50/60 to-violet-50/30", titleColor: "text-slate-800 dark:text-white group-hover:text-[#8E7EFE] dark:group-hover:text-violet-400",
        textColor: "group-hover:text-[#8E7EFE] text-[#8E7EFE]/80 dark:text-violet-400",
        badgeBg: "bg-[#8E7EFE]/10",
        badgeText: "text-[#8E7EFE]",
        buttonActive: "hover:bg-[#6C5CE7] hover:border-[#6C5CE7] hover:text-white",
        borderColor: "border-violet-100 dark:border-zinc-800/80 hover:border-violet-200 dark:hover:border-zinc-700",
        glowColor: "#8E7EFE", branchBg: "bg-white dark:bg-zinc-900/40 hover:bg-violet-50/10 dark:hover:bg-zinc-800/30"
    },
    beta: {
        bgGradient: "from-violet-50/60 to-violet-50/30", titleColor: "text-slate-800 dark:text-white group-hover:text-[#8E7EFE] dark:group-hover:text-violet-400",
        textColor: "group-hover:text-[#8E7EFE] text-[#8E7EFE]/80 dark:text-violet-400",
        badgeBg: "bg-[#8E7EFE]/10",
        badgeText: "text-[#8E7EFE]",
        buttonActive: "hover:bg-[#6C5CE7] hover:border-[#6C5CE7] hover:text-white",
        borderColor: "border-violet-100 dark:border-zinc-800/80 hover:border-violet-200 dark:hover:border-zinc-700",
        glowColor: "#8E7EFE", branchBg: "bg-white dark:bg-zinc-900/40 hover:bg-violet-50/10 dark:hover:bg-zinc-800/30"
    }
};

const DEFAULT_THEME: ChainTheme = {
    bgGradient: "from-violet-50/60 to-violet-50/30", titleColor: "text-slate-800 dark:text-white group-hover:text-[#8E7EFE] dark:group-hover:text-violet-400",
    textColor: "group-hover:text-[#8E7EFE] text-[#8E7EFE]/80 dark:text-violet-400",
    badgeBg: "bg-[#8E7EFE]/10",
    badgeText: "text-[#8E7EFE]",
    buttonActive: "hover:bg-[#6C5CE7] hover:border-[#6C5CE7] hover:text-white",
    borderColor: "border-violet-100 dark:border-zinc-800/80 hover:border-violet-200 dark:hover:border-zinc-700",
    glowColor: "#8E7EFE", branchBg: "bg-white dark:bg-zinc-900/40 hover:bg-violet-50/10 dark:hover:bg-zinc-800/30"
};

export default function BookTicket() {
    const { t, language } = useLanguage();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [movieDetail, setMovieDetail] = useState<any | null>(null);
    const [showtimesList, setShowtimesList] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedDate, setSelectedDate] = useState<DateOption | null>(null);
    const [selectedCity, setSelectedCity] = useState<string>("All");

    const [expandedChains, setExpandedChains] = useState<Record<string, boolean>>({});
    const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({});

    // Scroll to top and fetch movie detail
    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchMovie = async () => {
            try {
                const res = await getMovieDetailApi(id || "");
                setMovieDetail(res.data);
            } catch (err) {
                console.error("Error loading movie details:", err);
            }
        };
        fetchMovie();
    }, [id]);

    // Fetch showtimes list when date changes
    useEffect(() => {
        if (!selectedDate) return;
        const fetchShowtimes = async () => {
            setLoading(true);
            try {
                let dateParam: string | undefined = undefined;
                if (selectedDate?.dateString) {
                    const [yyyy, mm, dd] = selectedDate.dateString.split("-");
                    dateParam = `${dd}/${mm}/${yyyy}`;
                }
                const res = await getShowtimesByMovieApi(id || "", dateParam);
                const cinemaSystems = res.data?.cinemaSystems || [];
                const flatShowtimes: any[] = [];
                cinemaSystems.forEach((system: any) => {
                    const complexes = system.cinemaComplexes || [];
                    complexes.forEach((complex: any) => {
                        const showtimes = complex.showtimes || [];
                        showtimes.forEach((st: any) => {
                            flatShowtimes.push({
                                showtimeId: st.showtimeId,
                                showDateTime: st.showDateTime,
                                format: st.format,
                                ticketPrice: st.ticketPrice,
                                Cinema: {
                                    name: st.cinemaName,
                                    CinemaComplex: {
                                        cinemaComplexId: complex.cinemaComplexId,
                                        name: complex.name,
                                        address: complex.address,
                                        CinemaSystem: {
                                            cinemaSystemId: system.cinemaSystemId,
                                            name: system.name,
                                            logo: system.logo
                                        }
                                    }
                                }
                            });
                        });
                    });
                });
                setShowtimesList(flatShowtimes);
            } catch (err) {
                console.error("Error loading showtimes:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchShowtimes();
    }, [id, selectedDate]);

    const movie = useMemo(() => {
        if (!movieDetail) return null;
        const data = movieDetail;

        let genresArr: string[] = [];
        if (Array.isArray(data.genres)) {
            genresArr = data.genres;
        } else if (typeof data.genres === 'string') {
            genresArr = data.genres.split(',').map((g: string) => g.trim());
        }

        let image = data.imageUrl || "🍿";
        if (data.imageUrl && !data.imageUrl.startsWith('http')) {
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://api.mievoh.io.vn/api';
            const domain = apiBase.replace('/api', '');
            image = `${domain}/movies/${data.imageUrl}`;
        }

        return {
            id: data.movieId,
            title: language === "vi" ? (data.title_vi || data.title_en) : (data.title_en || data.title_vi),
            description: language === "vi" ? (data.description_vi || data.description_en) : (data.description_en || data.description_vi),
            genres: genresArr,
            image,
            backdrop: image,
            ageRating: data.ageRestriction || "P",
            duration: data.duration ? `${data.duration} mins` : "120 mins",
            rating: data.rating || 5,
            releaseDate: data.releaseDate ? new Date(data.releaseDate).toLocaleDateString() : (language === "vi" ? "Đang chiếu" : "Now showing"),
            director: data.director || (language === "vi" ? "Chưa rõ" : "Unknown"),
            cast: Array.isArray(data.cast) ? data.cast : (typeof data.cast === 'string' ? data.cast.split(',').map((c: string) => c.trim()) : [language === "vi" ? "Chưa rõ" : "Unknown Cast"])
        };
    }, [movieDetail, language]);

    const toggleChain = (chainId: string) => {
        setExpandedChains(prev => ({
            ...prev,
            [chainId]: !prev[chainId]
        }));
    };

    const toggleBranch = (branchId: string) => {
        setExpandedBranches(prev => ({
            ...prev,
            [branchId]: !prev[branchId]
        }));
    };

    // Group showtimes dynamically
    const groupedChains = useMemo(() => {
        const systemMap: Record<string, {
            chainId: string;
            chainName: string;
            chainLogo: string;
            branches: Record<string, {
                id: string;
                name: string;
                address: string;
                rating: number;
                showtimesByFormat: Record<string, any[]>;
            }>;
        }> = {};

        showtimesList.forEach(st => {
            const complex = st.Cinema?.CinemaComplex;
            const system = complex?.CinemaSystem;
            if (!complex || !system) return;

            // Filter by city address match
            if (selectedCity !== "All") {
                const addressUpper = complex.address.toUpperCase();
                const cityUpper = selectedCity.toUpperCase();
                
                let matches = false;
                if (cityUpper === "HỒ CHÍ MINH" || cityUpper === "TP.HCM" || cityUpper === "HO CHI MINH") {
                    matches = addressUpper.includes("HỒ CHÍ MINH") || addressUpper.includes("TP.HCM") || addressUpper.includes("Q.") || addressUpper.includes("DISTRICT");
                } else if (cityUpper === "HÀ NỘI" || cityUpper === "HANOI") {
                    matches = addressUpper.includes("HÀ NỘI") || addressUpper.includes("HANOI");
                } else if (cityUpper === "ĐÀ NẴNG" || cityUpper === "DA NANG") {
                    matches = addressUpper.includes("ĐÀ NẴNG") || addressUpper.includes("DA NANG");
                } else {
                    matches = addressUpper.includes(cityUpper);
                }

                if (!matches) return;
            }

            const systemId = system.cinemaSystemId;
            if (!systemMap[systemId]) {
                let logo = system.logo || "🍿";
                if (system.logo && !system.logo.startsWith('http')) {
                    const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://api.mievoh.io.vn/api';
                    const domain = apiBase.replace('/api', '');
                    logo = `${domain}/cinemas/${system.logo}`;
                }
                systemMap[systemId] = {
                    chainId: systemId,
                    chainName: system.name,
                    chainLogo: logo,
                    branches: {}
                };
            }

            const complexId = complex.cinemaComplexId;
            if (!systemMap[systemId].branches[complexId]) {
                systemMap[systemId].branches[complexId] = {
                    id: complexId,
                    name: complex.name,
                    address: complex.address,
                    rating: 4.8,
                    showtimesByFormat: {}
                };
            }

            const isDub = st.format?.toLowerCase().includes("dub") || st.format?.toLowerCase().includes("lồng tiếng");
            const formatLabel = isDub 
                ? (language === "vi" ? "2D Lồng Tiếng" : "2D Dubbed") 
                : (language === "vi" ? "2D Phụ Đề" : "2D Subtitles");

            if (!systemMap[systemId].branches[complexId].showtimesByFormat[formatLabel]) {
                systemMap[systemId].branches[complexId].showtimesByFormat[formatLabel] = [];
            }

            systemMap[systemId].branches[complexId].showtimesByFormat[formatLabel].push(st);
        });

        return Object.values(systemMap).map(sys => ({
            ...sys,
            branches: Object.values(sys.branches)
        }));
    }, [showtimesList, selectedCity, language]);

    // Check if time slot is expired (for today)
    const isTodaySelected = useMemo(() => {
        if (!selectedDate) return false;
        const todayStr = new Date().toISOString().split('T')[0];
        return selectedDate.dateString === todayStr;
    }, [selectedDate]);

    const isExpired = (timeStr: string) => {
        if (!isTodaySelected) return false;
        const [hours, minutes] = timeStr.split(":").map(Number);
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        return currentHours > hours || (currentHours === hours && currentMinutes >= minutes);
    };

    const handleSelectShowtime = (branchName: string, format: string, time: string, showtimeId: string) => {
        navigate(`/movies/${id}/book/seats`, {
            state: {
                branchName,
                format,
                time,
                date: selectedDate?.dateString || "",
                dateLabel: selectedDate?.label || "",
                dayOfWeek: selectedDate?.dayOfWeek || "",
                showtimeId
            }
        });
    };

    if (!movie) {
        return (
            <div className="w-full bg-[#EFEBF4] py-20 flex flex-col items-center justify-center text-center px-4 min-h-[60vh] font-sans">
                <h2 className="text-2xl font-black text-slate-900 mb-2">
                    {language === "vi" ? "Không tìm thấy phim" : "Movie Not Found"}
                </h2>
                <p className="text-slate-500 mb-6 font-medium">
                    {language === "vi" ? "Vui lòng quay lại và chọn một bộ phim hợp lệ." : "Please go back and select a valid movie."}
                </p>
                <Link to="/movies" className="inline-flex items-center gap-2 bg-[#6C5CE7] text-white font-extrabold px-6 py-2.5 rounded-full hover:bg-[#5f27cd] transition-colors duration-200 shadow-lg shadow-indigo-200">
                    <ArrowLeft className="h-4 w-4" />
                    {language === "vi" ? "Quay lại danh sách phim" : "Back to Movie List"}
                </Link>
            </div>
        );
    }

    const getAgeBadgeStyle = (ageRating: string) => {
        const cleanRating = ageRating.toUpperCase();
        if (cleanRating.includes("P")) return "bg-emerald-500 text-white";
        if (cleanRating.includes("T13")) return "bg-amber-500 text-white";
        if (cleanRating.includes("T16")) return "bg-orange-500 text-white";
        return "bg-rose-500 text-white";
    };

    return (
        <div className="w-full bg-[#EFEBF4] min-h-screen pb-16 font-sans">
            {/* Header info banner with blurred backdrop image */}
            <div className="relative w-full overflow-hidden bg-[#0F0C15] text-white py-8 sm:py-10 border-b border-violet-955/20">
                <div 
                    className="absolute inset-0 bg-cover bg-center filter blur-[6px] scale-105 opacity-55 pointer-events-none"
                    style={{ backgroundImage: `url(${movie.backdrop || movie.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/90" />

                <div className="relative max-w-5xl mx-auto px-4 z-10">
                    <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 items-center sm:items-start text-center sm:text-left">
                        <div className="w-24 h-36 sm:w-28 sm:h-40 rounded-xl overflow-hidden shrink-0 border border-white/20 shadow-xl transition-transform duration-300 hover:scale-[1.02]">
                            <img src={movie.image} alt={movie.title} className="w-full h-full object-cover" />
                        </div>
                        
                        <div className="flex-1 space-y-3">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg uppercase tracking-wider ${getAgeBadgeStyle(movie.ageRating)}`}>
                                    {movie.ageRating}
                                </span>
                                <span className="bg-white/10 text-slate-200 text-[11px] font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-violet-400" />
                                    {movie.duration}
                                </span>
                                <span className="bg-white/10 text-amber-400 text-[11px] font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                    {movie.rating}/5
                                </span>
                            </div>
                            
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white">{movie.title}</h1>
                            <p className="text-violet-300 font-extrabold text-xs uppercase tracking-wide">{movie.genres.join(" / ")}</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-355 border-t border-white/10 pt-3 max-w-2xl font-medium text-left">
                                <div>
                                    <span className="text-slate-450 font-bold block text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">{t("release_date")}</span>
                                    <span className="text-slate-100 font-extrabold">{movie.releaseDate}</span>
                                </div>
                                <div>
                                    <span className="text-slate-455 font-bold block text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">{t("director")}</span>
                                    <span className="text-slate-100 font-extrabold">{movie.director}</span>
                                </div>
                                <div className="sm:col-span-1">
                                    <span className="text-slate-455 font-bold block text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">{t("cast")}</span>
                                    <span className="text-slate-100 font-semibold block truncate" title={movie.cast.join(", ")}>{movie.cast.join(", ")}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-5xl mx-auto px-4 mt-8 flex flex-col gap-6">
                
                {/* 1. Date Selector Block */}
                <DateSelector
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                />

                {/* 2. City Filter Panel */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/70 dark:bg-zinc-900/50 border border-white/60 dark:border-zinc-800/80 backdrop-blur-md rounded-2xl px-5 py-4 shadow-sm relative z-30">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
                        <span className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">{t("cinema_locations_label")}</span>
                    </div>
                    
                    <CityFilter
                        selectedCity={selectedCity}
                        onSelectCity={setSelectedCity}
                        label=""
                        className="w-full sm:w-56"
                    />
                </div>

                {/* 3. Theater Chains & Branches & Showtimes List */}
                <div className="space-y-8">
                    {loading ? (
                        <div className="bg-white dark:bg-zinc-900/50 rounded-3xl p-12 text-center border border-slate-100 dark:border-zinc-800/80 shadow-sm flex flex-col items-center justify-center">
                            <Loader2 className="h-10 w-10 text-[#8E7EFE] animate-spin" />
                            <p className="text-slate-500 dark:text-zinc-400 font-bold mt-4 text-sm">
                                {language === "vi" ? "Đang tải suất chiếu..." : "Loading showtimes..."}
                            </p>
                        </div>
                    ) : groupedChains.length === 0 ? (
                        <div className="bg-white dark:bg-zinc-900/50 rounded-3xl p-12 text-center border border-slate-100 dark:border-zinc-800/80 shadow-sm flex flex-col items-center">
                            <span className="text-4xl mb-3">📍</span>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">{t("no_cinemas_available")}</h3>
                            <p className="text-slate-500 dark:text-zinc-450 font-medium text-xs">{t("no_cinemas_available_desc")}</p>
                        </div>
                    ) : (
                        groupedChains.map(chain => {
                            const isChainExpanded = !!expandedChains[chain.chainId];
                            const theme = CHAIN_THEMES[chain.chainId.toLowerCase()] || DEFAULT_THEME;
                            return (
                                <div
                                    key={chain.chainId}
                                    className={`relative overflow-hidden bg-white/70 dark:bg-zinc-900/50 border border-white/60 dark:border-zinc-800/80 backdrop-blur-md shadow-sm animate__animated animate__fadeIn transition-all duration-300 ${
                                        isChainExpanded ? "p-6 rounded-3xl space-y-6" : "p-3 px-4 rounded-2xl"
                                    }`}
                                >
                                    <div className={`relative z-10 ${isChainExpanded ? "space-y-6" : ""}`}>
                                        {/* Theater Chain Header */}
                                        <div
                                            onClick={() => toggleChain(chain.chainId)}
                                            className={`flex items-center justify-between cursor-pointer select-none group transition-all duration-300 ${
                                                isChainExpanded ? "pb-4 border-b border-slate-100 dark:border-zinc-800/80" : "pb-0"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105">
                                                    <img src={chain.chainLogo} alt={chain.chainName} className="w-full h-full object-cover" />
                                                </div>
                                                <h2 className={`text-base sm:text-lg font-black ${theme.titleColor} transition-colors`}>{chain.chainName}</h2>
                                            </div>
                                            <ChevronDown className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-350 ${isChainExpanded ? `${theme.textColor} rotate-180` : "-rotate-90 text-slate-400/60"}`} />
                                        </div>

                                        {/* Branches List */}
                                        {isChainExpanded && (
                                            <div className="space-y-6 animate__animated animate__fadeIn">
                                                {chain.branches.map(branch => {
                                                    const isBranchExpanded = !!expandedBranches[branch.id];
                                                    return (
                                                        <div
                                                            key={branch.id}
                                                            className={`relative overflow-hidden ${theme.branchBg} border ${theme.borderColor} rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300`}
                                                        >
                                                            <div className="relative z-10">
                                                                <div
                                                                    onClick={() => toggleBranch(branch.id)}
                                                                    className="flex items-center justify-between cursor-pointer select-none group"
                                                                >
                                                                    <div className="flex items-center gap-3.5 min-w-0 pr-4">
                                                                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105">
                                                                            <img src={chain.chainLogo} alt={chain.chainName} className="w-full h-full object-cover" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <h3 className={`text-base font-extrabold ${theme.titleColor} leading-snug transition-colors`}>
                                                                                {branch.name}
                                                                            </h3>
                                                                            <p className="text-slate-500 dark:text-zinc-400 font-medium text-xs mt-1 truncate">
                                                                                {branch.address}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <ChevronDown className={`h-4.5 w-4.5 text-slate-400 shrink-0 transition-transform duration-355 ${isBranchExpanded ? `${theme.textColor} rotate-180` : "-rotate-90 text-slate-400/60"}`} />
                                                                </div>

                                                                {/* Showtimes Formats */}
                                                                {isBranchExpanded && (
                                                                    <div className="space-y-5 mt-5 pt-5 border-t border-slate-100 dark:border-zinc-800/80 animate__animated animate__fadeIn">
                                                                        {Object.entries(branch.showtimesByFormat).map(([formatLabel, stList]) => (
                                                                            <div key={formatLabel}>
                                                                                <div className="flex items-center gap-2 mb-3">
                                                                                    <span className="h-3 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: theme.glowColor }} />
                                                                                    <h4 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-wider">
                                                                                        {formatLabel}
                                                                                    </h4>
                                                                                </div>
                                                                                <div className="flex flex-wrap gap-2.5">
                                                                                    {stList.map(st => {
                                                                                        const timeString = new Date(st.showDateTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
                                                                                        const expired = isExpired(timeString);
                                                                                        return (
                                                                                            <button
                                                                                                key={st.showtimeId}
                                                                                                disabled={expired}
                                                                                                onClick={() => handleSelectShowtime(branch.name, formatLabel, timeString, st.showtimeId)}
                                                                                                className={`px-5.5 py-2.5 text-xs font-black rounded-xl border transition-all duration-200 ${
                                                                                                    expired
                                                                                                        ? "bg-slate-50 border-slate-100 text-slate-300 dark:bg-zinc-800/20 dark:border-zinc-805 dark:text-zinc-600 dark:line-through cursor-not-allowed line-through text-[11px] font-bold"
                                                                                                        : `bg-white border-slate-200 text-slate-800 dark:bg-zinc-800/50 dark:border-zinc-700/80 dark:text-zinc-200 ${theme.buttonActive} hover:scale-[1.03] cursor-pointer shadow-sm active:scale-95`
                                                                                                }`}
                                                                                            >
                                                                                                {timeString}
                                                                                            </button>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

            </div>
        </div>
    );
}
