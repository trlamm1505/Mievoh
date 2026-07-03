import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { User, Menu, X, Ticket, LogOut, Lock, Sun, Moon, Globe, Bell, LayoutDashboard } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/index.tsx";
import { logout, updateUser } from "../../pages/User/Login/slice.ts";
import { useLocation, Link, useNavigate } from "react-router-dom";
import Button from "../Button/Button";
import { useTheme } from "../../contextAPI/ThemeContext.tsx";
import { useLanguage } from "../../contextAPI/LanguageContext.tsx";
import SearchInput from "../SearchInput/SearchInput";
import { getNowShowingMoviesApi, getComingSoonMoviesApi, getCinemaComplexesApi } from "../../axios/cinemas.tsx";
import type { Movie, CinemaComplex } from "../../axios/cinemas.tsx";
import { useAppSocket, emitMarkAsRead, emitMarkAllAsRead } from "../Notifications/Notifications.tsx";
import { getMyNotificationsApi, markAsReadApi, markAllAsReadApi } from "../../axios/notifications.tsx";
import type { Notification as ApiNotification } from "../../axios/notifications.tsx";

const formatRelativeTime = (dateStr: string, lang: string) => {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return lang === "vi" ? "Vừa xong" : "Just now";
        if (diffMins < 60) return lang === "vi" ? `${diffMins} phút trước` : `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return lang === "vi" ? `${diffHours} giờ trước` : `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return lang === "vi" ? `${diffDays} ngày trước` : `${diffDays}d ago`;
    } catch {
        return "";
    }
};

type NavItem = {
    label: string;
    href: string;
};

type HeaderProps = {
    navItems?: NavItem[];
};

type NotificationItem = {
    id: string;
    title: string;
    titleEn: string;
    description: string;
    descriptionEn: string;
    time: string;
    timeEn: string;
    isRead: boolean;
    link?: string | null;
};


export default function Header({
    navItems = [
        { label: "Movies", href: "/movies" },
        { label: "Cinemas", href: "/cinemas" },
        { label: "News", href: "/promotions" },
    ],
}: HeaderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notiMenuOpen, setNotiMenuOpen] = useState(false);
    const dispatch = useDispatch<AppDispatch>();
    const { isAuthenticated, user } = useSelector((state: RootState) => state.login || { isAuthenticated: false, user: null });
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const isAdminOrStaff = ['admin', 'staff'].includes((user?.role || '').toLowerCase()) ||
        ['admin', 'staff'].includes((user?.realRole || '').toLowerCase());

    const handleSwitchToAdmin = () => {
        if (user?.realRole) {
            dispatch(updateUser({ role: user.realRole, realRole: undefined }));
        }
        navigate('/admin');
    };

    const menuRef = useRef<HTMLDivElement>(null);
    const notiRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const mobileButtonRef = useRef<HTMLButtonElement>(null);

    // Connect and listen to real-time notifications via socket
    useAppSocket(user?.email || "");

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);
    const [showAllNotifications, setShowAllNotifications] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated || !user?.email) return;
        try {
            const res = await getMyNotificationsApi({ page: 1, pageSize: 20 });
            // Safe extraction of the notifications list:
            const list = (res && res.data && Array.isArray(res.data.data) ? res.data.data : []) as ApiNotification[];
            
            const mapped: NotificationItem[] = list.map((n) => {
                let targetLink = n.link;
                if (n.title?.includes("Gợi ý phim") || n.title?.includes("Gợi ý") || n.title?.toLowerCase().includes("recommend")) {
                    targetLink = "/#recommended-movies";
                }
                return {
                    id: n.notificationId,
                    title: n.title,
                    titleEn: n.title,
                    description: n.message,
                    descriptionEn: n.message,
                    time: formatRelativeTime(n.createdAt, language),
                    timeEn: formatRelativeTime(n.createdAt, "en"),
                    isRead: n.isRead,
                    link: targetLink,
                };
            });
            console.log("FE notifications fetched:", mapped);
            setNotifications(mapped);
        } catch (e) {
            console.error("Failed to fetch notifications:", e);
        }
    }, [isAuthenticated, user?.email, language]);

    useEffect(() => {
        if (isAuthenticated && user?.email) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchNotifications();
        } else {
            setNotifications([]);
        }
    }, [isAuthenticated, user?.email, fetchNotifications]);

    useEffect(() => {
        const handleSync = () => {
            fetchNotifications();
        };
        window.addEventListener('sync-notifications', handleSync);
        return () => {
            window.removeEventListener('sync-notifications', handleSync);
        };
    }, [fetchNotifications]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
            if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
                setNotiMenuOpen(false);
                setShowAllNotifications(false);
            }
            if (
                isOpen &&
                mobileMenuRef.current &&
                !mobileMenuRef.current.contains(event.target as Node) &&
                mobileButtonRef.current &&
                !mobileButtonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (userMenuOpen || isOpen || notiMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [userMenuOpen, isOpen, notiMenuOpen]);

    // Reset notification expand state when menu closes
    useEffect(() => {
        if (!notiMenuOpen) {
            setShowAllNotifications(false);
        }
    }, [notiMenuOpen]);

    // Search States & Logic
    const [searchQuery, setSearchQuery] = useState("");
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [allComplexes, setAllComplexes] = useState<CinemaComplex[]>([]);
    const [hasLoadedData, setHasLoadedData] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

    const handleSearchFocus = async () => {
        setSearchDropdownOpen(true);
        if (hasLoadedData) return;

        setIsSearching(true);
        try {
            const [nowShowingRes, comingSoonRes, complexesRes] = await Promise.all([
                getNowShowingMoviesApi({ pageSize: 100 }),
                getComingSoonMoviesApi({ pageSize: 100 }),
                getCinemaComplexesApi()
            ]);

            // Safely parse nowShowing movies
            let nowShowing: Movie[] = [];
            const nowData = nowShowingRes.data;
            if (nowData) {
                if (Array.isArray(nowData)) {
                    nowShowing = nowData;
                } else if (Array.isArray(nowData.movies)) {
                    nowShowing = nowData.movies;
                } else if (Array.isArray((nowData as unknown as { data: Movie[] }).data)) {
                    nowShowing = (nowData as unknown as { data: Movie[] }).data;
                }
            }

            // Safely parse comingSoon movies
            let comingSoon: Movie[] = [];
            const comingData = comingSoonRes.data;
            if (comingData) {
                if (Array.isArray(comingData)) {
                    comingSoon = comingData;
                } else if (Array.isArray(comingData.movies)) {
                    comingSoon = comingData.movies;
                } else if (Array.isArray((comingData as unknown as { data: Movie[] }).data)) {
                    comingSoon = (comingData as unknown as { data: Movie[] }).data;
                }
            }

            // Combine and de-duplicate movies
            const movieMap = new Map<string, Movie>();
            [...nowShowing, ...comingSoon].forEach(movie => {
                if (movie?.movieId) {
                    movieMap.set(movie.movieId, movie);
                }
            });

            // Safely parse complexes
            let complexes: CinemaComplex[] = [];
            const complexesData = complexesRes.data;
            if (complexesData) {
                if (Array.isArray(complexesData)) {
                    complexes = complexesData;
                } else if (Array.isArray((complexesData as unknown as { data: CinemaComplex[] }).data)) {
                    complexes = (complexesData as unknown as { data: CinemaComplex[] }).data;
                } else if (Array.isArray((complexesData as unknown as { cinemaComplexes: CinemaComplex[] }).cinemaComplexes)) {
                    complexes = (complexesData as unknown as { cinemaComplexes: CinemaComplex[] }).cinemaComplexes;
                }
            }

            setAllMovies(Array.from(movieMap.values()));
            setAllComplexes(complexes);
            setHasLoadedData(true);
        } catch (err) {
            console.error("Error loading search data:", err);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        const handleClickOutsideSearch = (event: MouseEvent) => {
            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(event.target as Node)
            ) {
                setSearchDropdownOpen(false);
            }
            if (
                mobileSearchContainerRef.current &&
                !mobileSearchContainerRef.current.contains(event.target as Node)
            ) {
                setSearchDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutsideSearch);
        return () => {
            document.removeEventListener("mousedown", handleClickOutsideSearch);
        };
    }, []);

    const filteredMovies = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase().trim();
        return allMovies.filter(movie => {
            const titleVi = (movie.title_vi || "").toLowerCase();
            const titleEn = (movie.title_en || "").toLowerCase();
            const genres = Array.isArray(movie.genres) 
                ? movie.genres.join(" ").toLowerCase() 
                : (typeof movie.genres === "string" ? movie.genres : "").toLowerCase();
            return titleVi.includes(q) || titleEn.includes(q) || genres.includes(q);
        });
    }, [searchQuery, allMovies]);

    const filteredComplexes = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase().trim();
        return allComplexes.filter(complex => {
            const name = (complex.name || "").toLowerCase();
            const address = (complex.address || "").toLowerCase();
            return name.includes(q) || address.includes(q);
        });
    }, [searchQuery, allComplexes]);

    const getMovieImage = (movie: Movie) => {
        let image = movie.imageUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80";
        if (movie.imageUrl && !movie.imageUrl.startsWith('http')) {
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://api.mievoh.io.vn/api';
            const domain = apiBase.replace('/api', '');
            image = `${domain}/movies/${movie.imageUrl}`;
        }
        return image as string;
    };

    const getComplexLogo = (complex: CinemaComplex) => {
        const system = complex.CinemaSystem;
        if (!system) return "🍿";
        let logo = system.logo || "🍿";
        if (system.logo && !system.logo.startsWith('http')) {
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://api.mievoh.io.vn/api';
            const domain = apiBase.replace('/api', '');
            logo = `${domain}/cinemas/${system.logo}`;
        }
        return logo as string;
    };

    const renderSearchDropdown = (isMobile: boolean) => {
        if (!searchDropdownOpen || !searchQuery.trim()) return null;

        return (
            <div className={`absolute top-full z-[100] mt-2 max-h-[380px] overflow-y-auto bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-4 flex flex-col gap-4 custom-search-scrollbar ${isMobile
                ? "left-0 right-0 w-full"
                : "right-0 w-96 lg:w-[26rem]"
                }`}>
                <style>{`
                    .custom-search-scrollbar::-webkit-scrollbar {
                        width: 6px;
                    }
                    .custom-search-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-search-scrollbar::-webkit-scrollbar-thumb {
                        background: #E9D5FF;
                        border-radius: 9999px;
                    }
                    .custom-search-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #D8B4FE;
                    }
                `}</style>
                {isSearching ? (
                    <div className="flex items-center justify-center py-6 text-sm text-gray-500 font-bold gap-2">
                        <span className="h-4 w-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        <span>{language === "vi" ? "Đang tìm kiếm..." : "Searching..."}</span>
                    </div>
                ) : filteredMovies.length === 0 && filteredComplexes.length === 0 ? (
                    <div className="text-center py-6 text-sm text-gray-400 font-medium">
                        {language === "vi" ? "Không tìm thấy kết quả nào" : "No results found"}
                    </div>
                ) : (
                    <>
                        {/* Movies section */}
                        {filteredMovies.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <h5 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider px-1 text-left">
                                    {language === "vi" ? "Phim" : "Movies"}
                                </h5>
                                <div className="flex flex-col gap-1.5">
                                    {filteredMovies.map(movie => {
                                        const title = language === "vi" ? (movie.title_vi || movie.title_en) : (movie.title_en || movie.title_vi);
                                        const img = getMovieImage(movie);
                                        return (
                                            <Link
                                                key={movie.movieId}
                                                to={`/movies/${movie.movieId}`}
                                                onClick={() => {
                                                    setSearchQuery("");
                                                    setSearchDropdownOpen(false);
                                                    setIsOpen(false);
                                                }}
                                                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors"
                                            >
                                                <img src={img} alt={title || undefined} className="w-10 h-14 object-cover rounded-lg shadow-sm" />
                                                <div className="flex-1 min-w-0 text-left">
                                                    <h6 className="text-sm font-bold text-gray-800 dark:text-zinc-100 truncate">{title}</h6>
                                                    <p className="text-[11px] text-[#8E7EFE] font-extrabold mt-0.5 truncate">
                                                        {Array.isArray(movie.genres) ? movie.genres.join(" / ") : movie.genres}
                                                    </p>
                                                    {movie.duration && (
                                                        <span className="text-[10px] text-gray-400 font-semibold">{movie.duration}m</span>
                                                    )}
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Divider */}
                        {filteredMovies.length > 0 && filteredComplexes.length > 0 && (
                            <div className="border-t border-slate-100 dark:border-zinc-800" />
                        )}

                        {/* Cinema Complexes section */}
                        {filteredComplexes.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <h5 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider px-1 text-left">
                                    {language === "vi" ? "Rạp chiếu" : "Cinemas"}
                                </h5>
                                <div className="flex flex-col gap-1.5">
                                    {filteredComplexes.map(complex => {
                                        const logo = getComplexLogo(complex);
                                        return (
                                            <Link
                                                key={complex.cinemaComplexId}
                                                to={`/cinemas/${complex.cinemaComplexId}`}
                                                onClick={() => {
                                                    setSearchQuery("");
                                                    setSearchDropdownOpen(false);
                                                    setIsOpen(false);
                                                }}
                                                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors"
                                            >
                                                {logo.startsWith('http') || logo.includes('/') ? (
                                                    <img src={logo} alt={complex.name || undefined} className="w-10 h-10 object-contain rounded-lg p-0.5 border border-slate-100 dark:border-zinc-800 bg-white" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-zinc-900 flex items-center justify-center text-lg">{logo}</div>
                                                )}
                                                <div className="flex-1 min-w-0 text-left">
                                                    <h6 className="text-sm font-bold text-gray-800 dark:text-zinc-100 truncate">{complex.name}</h6>
                                                    <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">
                                                        {complex.address}
                                                    </p>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    const isAnimatedPath = true;

    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        if (!isAnimatedPath) {
            setIsVisible(true);
            return;
        }

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // Scrolling down -> hide header
                setIsVisible(false);
            } else {
                // Scrolling up -> show header
                setIsVisible(true);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY, isAnimatedPath]);

    const redirectQuery = `?redirect=${encodeURIComponent(location.pathname + location.search)}`;

    return (
        <header className={`sticky top-0 z-50 w-full bg-[#F6F3F9] dark:bg-zinc-900 border-b border-[#EAE6F0] dark:border-zinc-800/50 shadow-sm ${isAnimatedPath
            ? "transition-transform duration-300 animate__animated animate__fadeInDown"
            : ""
            } ${isVisible ? "translate-y-0" : "-translate-y-full"}`}>
            <div className="mx-auto flex max-w-[85%] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                {/* Left: Logo and Brand Name */}
                <Link to="/" className={`flex items-center gap-0 shrink-0 ${isAnimatedPath ? "group" : ""}`} aria-label="Mievoh Homepage">
                    <img
                        src="/images/mievoh_logo.png"
                        alt="Mievoh Logo"
                        className={`h-8 w-8 sm:h-12 sm:w-12 rounded-full object-cover ${isAnimatedPath ? "group-hover:scale-105 transition-transform duration-200" : ""}`}
                    />
                    <span
                        className={`logo-text-gradient h-32 my-[-3.0rem] ml-[-1.0rem] sm:h-48 sm:my-[-4.6rem] sm:ml-[-1.5rem] w-auto ${isAnimatedPath ? "transition-transform duration-200 group-hover:scale-[1.02]" : ""}`}
                        aria-label="mievoh"
                    />
                </Link>

                {/* Center: Nav links */}
                <nav className="hidden items-center gap-4 lg:gap-8 md:flex">
                    {navItems.map((item) => {
                        // Determine if current link is active
                        const isActive =
                            location.pathname === item.href ||
                            (location.pathname.startsWith(item.href) && item.href !== "/");

                        const translatedLabel =
                            item.label === "Movies"
                                ? t("nav_movies")
                                : item.label === "Cinemas"
                                    ? t("nav_cinemas")
                                    : item.label === "News"
                                        ? t("nav_news")
                                        : item.label;

                        return (
                            <Link
                                key={item.label}
                                to={item.href}
                                className={`relative py-2 text-base transition-all duration-200 whitespace-nowrap ${isActive
                                    ? "nav-active font-bold"
                                    : "text-gray-600 dark:text-violet-400 font-semibold hover:text-[#5B21B6] dark:hover:text-violet-200"
                                    }`}
                            >
                                {translatedLabel}
                                {isActive && (
                                    <span className={`nav-active-underline absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${isAnimatedPath ? "animate-slide-in" : ""}`} />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right: Search, Auth actions and Hamburger */}
                <div className="flex items-center gap-3 lg:gap-6">
                    {/* Search Bar (desktop only) */}
                    <div className="relative hidden lg:flex" ref={searchContainerRef}>
                        <SearchInput
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={handleSearchFocus}
                            containerClassName="w-full"
                            className="w-44 lg:w-72 border-violet-100/80 dark:border-zinc-800 bg-violet-50/10 dark:bg-zinc-800/30 hover:border-violet-300 hover:bg-violet-50/20 hover:shadow-[0_4px_12px_rgba(124,58,237,0.05)] focus:w-56 lg:focus:w-[26rem] focus:ring-2 focus:ring-violet-100 dark:focus:ring-zinc-800"
                        />
                        {renderSearchDropdown(false)}
                    </div>

                    {/* Auth Actions (desktop only) */}
                    <div className="hidden items-center gap-2.5 lg:gap-4 md:flex">
                        <button
                            onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
                            className="flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer outline-none border-none text-sm font-extrabold text-violet-800 dark:text-violet-400 shrink-0 select-none"
                            aria-label="Toggle language"
                        >
                            <Globe className="h-5 w-5" />
                            <span>{language.toUpperCase()}</span>
                        </button>

                        {/* Light/Dark Toggle Icon Button */}
                        <button
                            onClick={toggleTheme}
                            className="flex items-center justify-center h-10 w-10 rounded-full bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer outline-none border-none shrink-0"
                            aria-label="Toggle theme"
                        >
                            {theme === "light" ? (
                                <Moon className="h-5 w-5 text-[#343A40] fill-[#343A40]" />
                            ) : (
                                <Sun className="h-5 w-5 text-amber-500 fill-amber-500" />
                            )}
                        </button>

                        {/* Notifications Icon Button */}
                        {isAuthenticated && (
                            <div className="relative animate__animated animate__fadeIn animate__faster" ref={notiRef}>
                                <button
                                    onClick={() => {
                                        setNotiMenuOpen((v) => !v);
                                        if (notiMenuOpen) setShowAllNotifications(false);
                                    }}
                                    className="flex items-center justify-center h-10 w-10 rounded-full bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer outline-none border-none shrink-0 relative"
                                    aria-label="Notifications"
                                >
                                    <Bell className="h-5 w-5 text-violet-800 dark:text-violet-400" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-900 animate__animated animate__bounceIn">
                                            {unreadCount > 99 ? "99+" : unreadCount}
                                        </span>
                                    )}
                                </button>
                                {notiMenuOpen && (
                                    <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl border border-violet-100/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 shadow-[0_12px_40px_rgba(124,58,237,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] z-50 animate__animated animate__fadeIn animate__faster">
                                        <div className="flex items-center justify-between px-1 pb-3 border-b border-violet-50/80 dark:border-zinc-800/80 mb-3">
                                            <span className="text-[19px] sm:text-[21px] font-extrabold text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                                                {t("notifications")}
                                            </span>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
                                                            await markAllAsReadApi();
                                                            if (user?.email) {
                                                                emitMarkAllAsRead(user.email);
                                                            }
                                                        } catch (e) {
                                                            console.error("Failed to mark all as read:", e);
                                                        }
                                                    }}
                                                    className="text-[14px] sm:text-[15px] font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors duration-250 cursor-pointer border-none bg-transparent outline-none select-none hover:underline"
                                                >
                                                    {language === "vi" ? "Đánh dấu đã đọc" : "Mark all as read"}
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2.5 max-h-[45rem] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-violet-100/80 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-violet-200">
                                            {notifications.length === 0 ? (
                                                <div className="text-center py-8 text-sm text-gray-400 dark:text-zinc-500 font-medium">
                                                    {t("no_notifications")}
                                                </div>
                                            ) : (
                                                (showAllNotifications ? notifications : notifications.slice(0, 5)).map(n => (
                                                    <div
                                                        key={n.id}
                                                        onClick={async () => {
                                                            try {
                                                                setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));
                                                                await markAsReadApi(n.id);
                                                                if (user?.email) {
                                                                    emitMarkAsRead(n.id, user.email);
                                                                }
                                                                setNotiMenuOpen(false);
                                                                if (n.link) {
                                                                    navigate(n.link);
                                                                }
                                                            } catch (e) {
                                                                console.error("Failed to mark notification as read:", e);
                                                            }
                                                        }}
                                                        className={`flex gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-all duration-300 text-left border ${
                                                            n.isRead 
                                                                ? "bg-transparent hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 border-transparent hover:border-slate-100/80 dark:hover:border-zinc-800/50" 
                                                                : "bg-violet-50/35 dark:bg-violet-950/10 hover:bg-violet-50/55 dark:hover:bg-violet-955/20 border-violet-100/30 dark:border-violet-900/10 hover:border-violet-100 dark:hover:border-violet-900/20 shadow-[0_2px_8px_rgba(124,58,237,0.02)]"
                                                        }`}
                                                    >
                                                        {/* Left Icon with unread indicator dot */}
                                                        <div className="relative shrink-0 self-start mt-0.5">
                                                            <div className={`flex items-center justify-center h-10 w-10 rounded-2xl transition-colors duration-300 ${
                                                                n.isRead 
                                                                    ? "bg-slate-100/80 dark:bg-zinc-800/80 text-slate-400 dark:text-zinc-500" 
                                                                    : "bg-violet-100/80 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400"
                                                            }`}>
                                                                <Bell className="h-5 w-5" />
                                                            </div>
                                                            {!n.isRead && (
                                                                <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-violet-600 dark:bg-violet-400 ring-2 ring-white dark:ring-zinc-900 shrink-0" />
                                                            )}
                                                        </div>

                                                        {/* Right Content */}
                                                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                                                            <span className={`text-[13px] leading-snug font-bold ${
                                                                n.isRead 
                                                                    ? "text-gray-700 dark:text-zinc-300" 
                                                                    : "text-gray-900 dark:text-zinc-100"
                                                            }`}>
                                                                {language === "vi" ? n.title : n.titleEn}
                                                            </span>
                                                            <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-normal font-medium break-words">
                                                                {language === "vi" ? n.description : n.descriptionEn}
                                                            </p>
                                                            <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-semibold mt-1 self-start">
                                                                {language === "vi" ? n.time : n.timeEn}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        {notifications.length > 5 && (
                                            <div className="flex justify-center mt-3 pt-3 border-t border-violet-50/60 dark:border-zinc-800/60">
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm" 
                                                    onClick={() => setShowAllNotifications(prev => !prev)}
                                                    className="w-full text-[13px] py-2 font-bold"
                                                >
                                                    {showAllNotifications 
                                                        ? (language === "vi" ? "Thu gọn" : "Show less") 
                                                        : (language === "vi" ? "Xem tất cả" : "View all")}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {isAuthenticated ? (
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setUserMenuOpen((v) => !v)}
                                    className="flex items-center gap-2.5 h-10 px-4 text-sm sm:text-[15px] font-extrabold bg-white dark:bg-zinc-800 border border-violet-200/85 dark:border-zinc-700 hover:border-violet-300 text-violet-800 dark:!text-violet-400 hover:bg-violet-50/50 dark:hover:bg-zinc-700/50 shadow-sm rounded-full transition-all duration-300 hover:scale-[1.04] active:scale-[0.96] select-none cursor-pointer outline-none shrink-0 w-fit min-w-fit"
                                >
                                    <img
                                        src={user?.avatar || "/images/avatar.jpg"}
                                        alt={user?.name || "avatar"}
                                        className="h-7.5 w-7.5 rounded-full object-cover border border-violet-100 dark:border-zinc-700 shrink-0"
                                    />
                                    <span className="font-extrabold text-violet-800 dark:!text-violet-400 whitespace-nowrap">{user?.name || t("profile")}</span>
                                </button>
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-violet-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 shadow-2xl z-50 animate__animated animate__fadeIn animate__faster">
                                        {/* User Header */}
                                        <div className="flex items-center gap-3 px-3 py-3 border-b border-violet-50/60 dark:border-zinc-800 mb-1">
                                            <img
                                                src={user?.avatar || "/images/avatar.jpg"}
                                                alt={user?.name || "avatar"}
                                                className="h-10 w-10 rounded-full object-cover border-2 border-violet-200 dark:border-zinc-700"
                                            />
                                            <div className="flex flex-col min-w-0">
                                                <div className="text-sm font-bold text-gray-800 dark:text-zinc-200 truncate">{user?.name}</div>
                                                <div className="text-xs text-gray-400 dark:text-zinc-400 truncate">{user?.email}</div>
                                            </div>
                                        </div>

                                        {/* Menu List */}
                                        <div className="flex flex-col gap-0.5">
                                            <Link
                                                to="/profile?tab=info"
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-600 dark:text-zinc-300 hover:bg-violet-50 dark:hover:bg-zinc-800 hover:text-violet-700 dark:hover:text-violet-400 transition-all duration-200"
                                            >
                                                <User className="h-4.5 w-4.5 text-violet-500" />
                                                <span>{t("profile")}</span>
                                            </Link>

                                            <Link
                                                to="/profile?tab=tickets"
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-600 dark:text-zinc-300 hover:bg-violet-50 dark:hover:bg-zinc-800 hover:text-violet-700 dark:hover:text-violet-400 transition-all duration-200"
                                            >
                                                <Ticket className="h-4.5 w-4.5 text-violet-500" />
                                                <span>{t("booked_tickets")}</span>
                                            </Link>

                                            <Link
                                                to="/profile?tab=password"
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-600 dark:text-zinc-300 hover:bg-violet-50 dark:hover:bg-zinc-800 hover:text-violet-700 dark:hover:text-violet-400 transition-all duration-200"
                                            >
                                                <Lock className="h-4.5 w-4.5 text-violet-500" />
                                                <span>{t("change_password")}</span>
                                            </Link>
                                        </div>

                                        {isAdminOrStaff && (
                                            <div className="border-t border-violet-50/60 dark:border-zinc-800 mt-1 pt-1">
                                                <button
                                                    onClick={() => { setUserMenuOpen(false); handleSwitchToAdmin(); }}
                                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-zinc-800 hover:text-violet-850 dark:hover:text-violet-200 transition-all duration-200 cursor-pointer"
                                                >
                                                    <LayoutDashboard className="h-4.5 w-4.5 text-violet-500" />
                                                    <span>Trang quản trị</span>
                                                </button>
                                            </div>
                                        )}

                                        <div className="border-t border-violet-50/60 dark:border-zinc-800 mt-1 pt-1">
                                            <button
                                                onClick={() => { setUserMenuOpen(false); dispatch(logout()); }}
                                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-zinc-800 hover:text-violet-850 dark:hover:text-violet-200 transition-all duration-200 cursor-pointer"
                                            >
                                                <LogOut className="h-4.5 w-4.5 text-violet-500" />
                                                <span>{t("logout")}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Button
                                    variant="outline-purple"
                                    href={`/login${redirectQuery}`}
                                    size="sm"
                                >
                                    {t("login")}
                                </Button>
                                <Button
                                    variant="primary"
                                    href={`/register${redirectQuery}`}
                                    size="md"
                                >
                                    {t("register")}
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile Language Toggle Button */}
                    <button
                        onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
                        className="flex items-center justify-center gap-1 h-9 px-2.5 rounded-full bg-[#F1F3F5] dark:bg-zinc-800 hover:bg-[#E9ECEF] dark:hover:bg-zinc-700 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer outline-none border-none text-xs font-extrabold text-violet-800 dark:text-violet-400 shrink-0 md:hidden select-none"
                        aria-label="Toggle language"
                    >
                        <Globe className="h-3.5 w-3.5" />
                        <span>{language.toUpperCase()}</span>
                    </button>

                    {/* Mobile Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className="flex items-center justify-center h-9 w-9 rounded-full bg-[#F1F3F5] dark:bg-zinc-800 hover:bg-[#E9ECEF] dark:hover:bg-zinc-700 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer outline-none border-none shrink-0 md:hidden"
                        aria-label="Toggle theme"
                    >
                        {theme === "light" ? (
                            <Moon className="h-4.5 w-4.5 text-[#343A40] fill-[#343A40]" />
                        ) : (
                            <Sun className="h-4.5 w-4.5 text-amber-500 fill-amber-500" />
                        )}
                    </button>

                    {/* Mobile menu button */}
                    <button
                        ref={mobileButtonRef}
                        type="button"
                        className="inline-flex items-center rounded-lg border border-gray-200 dark:border-zinc-800 p-2 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-700 dark:hover:text-zinc-200 md:hidden transition-colors cursor-pointer"
                        onClick={() => setIsOpen((v) => !v)}
                        aria-label="Toggle menu"
                        aria-expanded={isOpen}
                    >
                        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile nav dropdown */}
            {isOpen && (
                <div
                    ref={mobileMenuRef}
                    className={`absolute right-6 top-20 w-64 rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xl z-50 md:hidden ${isAnimatedPath ? "animate-in fade-in slide-in-from-top-2 duration-200" : ""
                        }`}
                >
                    <nav className="flex flex-col gap-2">
                        {/* Mobile Search input */}
                        <div className="relative mb-2 w-full" ref={mobileSearchContainerRef}>
                            <SearchInput
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={handleSearchFocus}
                                size="sm"
                                containerClassName="w-full"
                                className="w-full border-violet-100 dark:border-zinc-800 bg-violet-50/10 dark:bg-zinc-800/30"
                            />
                            {renderSearchDropdown(true)}
                        </div>

                        {navItems.map((item) => {
                            const isActive =
                                location.pathname === item.href ||
                                (location.pathname.startsWith(item.href) && item.href !== "/");

                            const translatedLabel =
                                item.label === "Movies"
                                    ? t("nav_movies")
                                    : item.label === "Cinemas"
                                        ? t("nav_cinemas")
                                        : item.label === "News"
                                            ? t("nav_news")
                                            : item.label;

                            return (
                                <Link
                                    key={item.label}
                                    to={item.href}
                                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isActive
                                        ? "bg-violet-50 dark:bg-zinc-800 text-violet-700 dark:text-violet-400"
                                        : "text-gray-700 dark:text-violet-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-violet-600 dark:hover:text-violet-200"
                                        }`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    {translatedLabel}
                                </Link>
                            );
                        })}

                        <div className="mt-2 border-t border-gray-100 dark:border-zinc-800 pt-3">
                             {isAuthenticated ? (
                                  <>
                                      <div className="flex items-center gap-3 px-2 py-2 border-b border-violet-50 dark:border-zinc-800 mb-2">
                                          <img
                                              src={user?.avatar || "/images/avatar.jpg"}
                                              alt={user?.name || "avatar"}
                                              className="h-10 w-10 rounded-full object-cover border-2 border-violet-200 dark:border-zinc-700"
                                          />
                                          <div className="flex flex-col min-w-0">
                                              <div className="text-sm font-bold text-gray-800 dark:text-zinc-200 truncate">{user?.name}</div>
                                              <div className="text-xs text-gray-400 dark:text-zinc-400 truncate">{user?.email}</div>
                                          </div>
                                      </div>
                                      <div className="relative">
                                          <button
                                              onClick={() => setNotiMenuOpen(v => !v)}
                                              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 dark:text-zinc-300 hover:bg-violet-50 dark:hover:bg-zinc-800 hover:text-violet-700 dark:hover:text-violet-400 transition-colors cursor-pointer border-none bg-transparent outline-none"
                                          >
                                              <div className="flex items-center gap-3">
                                                  <Bell className="h-4 w-4 text-violet-500" />
                                                  <span>{t("notifications")}</span>
                                              </div>
                                              {unreadCount > 0 && (
                                                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white shadow-sm">{unreadCount > 99 ? "99+" : unreadCount}</span>
                                              )}
                                          </button>
                                          {notiMenuOpen && (
                                              <div className="mt-2 flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-search-scrollbar border border-violet-100 dark:border-zinc-800 rounded-xl p-2 bg-slate-50 dark:bg-zinc-950">
                                                  {notifications.length === 0 ? (
                                                      <div className="text-center py-4 text-xs text-gray-400 dark:text-zinc-500">
                                                          {t("no_notifications")}
                                                      </div>
                                                  ) : (
                                                      notifications.map(n => (
                                                          <div
                                                              key={n.id}
                                                              onClick={async () => {
                                                                  try {
                                                                      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));
                                                                      await markAsReadApi(n.id);
                                                                      if (user?.email) {
                                                                          emitMarkAsRead(n.id, user.email);
                                                                      }
                                                                  } catch (e) {
                                                                      console.error("Failed to mark notification as read:", e);
                                                                  }
                                                              }}
                                                              className={`flex flex-col gap-1 p-2 rounded-lg cursor-pointer transition-colors text-left ${
                                                                  n.isRead 
                                                                      ? "hover:bg-slate-100 dark:hover:bg-zinc-900" 
                                                                      : "bg-violet-100/30 dark:bg-violet-900/10 hover:bg-violet-100/50 dark:hover:bg-violet-900/20"
                                                              }`}
                                                          >
                                                              <div className="flex items-start justify-between gap-2">
                                                                  <span className="text-[11px] font-bold text-gray-800 dark:text-zinc-300">
                                                                      {language === "vi" ? n.title : n.titleEn}
                                                                  </span>
                                                                  {!n.isRead && (
                                                                      <span className="h-1.5 w-1.5 rounded-full bg-violet-600 dark:bg-violet-400 shrink-0 mt-1" />
                                                                  )}
                                                              </div>
                                                              <p className="text-[10px] text-gray-550 dark:text-zinc-400 leading-normal">
                                                                  {language === "vi" ? n.description : n.descriptionEn}
                                                              </p>
                                                          </div>
                                                      ))
                                                  )}
                                              </div>
                                          )}
                                      </div>
                                      <Link
                                          to="/profile?tab=info"
                                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 dark:text-zinc-300 hover:bg-violet-50 dark:hover:bg-zinc-800 hover:text-violet-700 dark:hover:text-violet-400 transition-colors"
                                          onClick={() => setIsOpen(false)}
                                      >
                                          <User className="h-4 w-4 text-violet-500" />
                                          <span>{t("profile")}</span>
                                      </Link>
                                      <Link
                                          to="/profile?tab=tickets"
                                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 dark:text-zinc-300 hover:bg-violet-50 dark:hover:bg-zinc-800 hover:text-violet-700 dark:hover:text-violet-400 transition-colors"
                                          onClick={() => setIsOpen(false)}
                                      >
                                          <Ticket className="h-4 w-4 text-violet-500" />
                                          <span>{t("booked_tickets")}</span>
                                      </Link>
                                      <Link
                                          to="/profile?tab=password"
                                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 dark:text-zinc-300 hover:bg-violet-50 dark:hover:bg-zinc-800 hover:text-violet-700 dark:hover:text-violet-400 transition-colors"
                                          onClick={() => setIsOpen(false)}
                                      >
                                          <Lock className="h-4 w-4 text-violet-500" />
                                          <span>{t("change_password")}</span>
                                      </Link>
                                      {isAdminOrStaff && (
                                          <div className="border-t border-violet-50 dark:border-zinc-800 mt-2 pt-2">
                                              <button
                                                  onClick={() => { setIsOpen(false); handleSwitchToAdmin(); }}
                                                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-zinc-800 hover:text-violet-850 dark:hover:text-violet-200 transition-colors cursor-pointer"
                                              >
                                                  <LayoutDashboard className="h-4 w-4 text-violet-500" />
                                                  <span>Trang quản trị</span>
                                              </button>
                                          </div>
                                      )}
                                      <div className="border-t border-violet-50 dark:border-zinc-800 mt-2 pt-2">
                                          <button
                                              onClick={() => { setIsOpen(false); dispatch(logout()); }}
                                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-zinc-800 hover:text-violet-850 dark:hover:text-violet-200 transition-colors cursor-pointer"
                                          >
                                              <LogOut className="h-4 w-4 text-violet-500" />
                                              <span>{t("logout")}</span>
                                          </button>
                                      </div>
                                  </>
                             ) : (
                                 <div className="flex flex-col gap-2">
                                     <Button
                                         variant="outline-purple"
                                         href={`/login${redirectQuery}`}
                                         className="w-full text-center py-2 text-sm"
                                         onClick={() => setIsOpen(false)}
                                     >
                                         {t("login")}
                                     </Button>
                                     <Button
                                         variant="primary"
                                         href={`/register${redirectQuery}`}
                                         className="w-full text-center py-2 text-sm"
                                         onClick={() => setIsOpen(false)}
                                     >
                                         {t("register")}
                                     </Button>
                                 </div>
                             )}
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
