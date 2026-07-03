import { useState, useMemo, useEffect } from "react";
import MovieHero from "./MovieHero/MovieHero.tsx";
import MovieFilters from "./MovieFilters/MovieFilters.tsx";
import MovieGrid from "./MovieGrid/MovieGrid.tsx";
import { useLanguage } from "../../../contextAPI/LanguageContext.tsx";
import { getNowShowingMoviesApi, getComingSoonMoviesApi } from "../../../axios/movie.tsx";
import type { Movie } from "../../../axios/movie.tsx";

interface MappedMovie {
    id: string;
    title: string;
    title_vi: string;
    title_en: string;
    image: string;
    rating: number;
    genres: string[];
    status: "now_showing" | "coming_soon";
    releaseDate?: string;
}

export default function Movies() {
    const { language, t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<"all" | "now_showing" | "coming_soon">("all");
    const [selectedGenre, setSelectedGenre] = useState("");
    const [sortBy, setSortBy] = useState("rating-desc");

    const [moviesList, setMoviesList] = useState<MappedMovie[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllMovies = async () => {
            try {
                // Fetch now showing and coming soon movies in parallel
                const [nowShowingRes, comingSoonRes] = await Promise.all([
                    getNowShowingMoviesApi({ page: 1, pageSize: 50 }),
                    getComingSoonMoviesApi({ page: 1, pageSize: 50 })
                ]);

                const nowShowingRaw = nowShowingRes.data as unknown as { data?: Movie[]; movies?: Movie[] } & Movie[];
                const nowShowing = nowShowingRaw.data || nowShowingRaw.movies || (Array.isArray(nowShowingRaw) ? nowShowingRaw : []);

                const comingSoonRaw = comingSoonRes.data as unknown as { data?: Movie[]; movies?: Movie[] } & Movie[];
                const comingSoon = comingSoonRaw.data || comingSoonRaw.movies || (Array.isArray(comingSoonRaw) ? comingSoonRaw : []);

                const mapMovie = (m: Movie, status: "now_showing" | "coming_soon"): MappedMovie => {
                    let genresArr: string[] = [];
                    if (Array.isArray(m.genres)) {
                        genresArr = m.genres;
                    } else if (typeof m.genres === 'string') {
                        genresArr = m.genres.split(',').map((g: string) => g.trim());
                    } else if (m.genres) {
                        genresArr = [m.genres];
                    }

                    // Build image URL
                    let image = m.imageUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80";
                    if (m.imageUrl && !m.imageUrl.startsWith('http')) {
                        const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://api.mievoh.io.vn/api';
                        const domain = apiBase.replace('/api', '');
                        image = `${domain}/movies/${m.imageUrl}`;
                    }

                    return {
                        id: m.movieId,
                        title: m.title_vi || m.title_en || "Phim",
                        title_vi: m.title_vi || "",
                        title_en: m.title_en || "",
                        image,
                        rating: m.averageRating ?? 0,
                        genres: genresArr,
                        status,
                        releaseDate: m.releaseDate ? new Date(m.releaseDate).toLocaleDateString() : undefined
                    };
                };

                const mappedNowShowing = nowShowing.map((m) => mapMovie(m, "now_showing"));
                const mappedComingSoon = comingSoon.map((m) => mapMovie(m, "coming_soon"));

                const combined = [...mappedNowShowing, ...mappedComingSoon];
                
                if (combined.length > 0) {
                    setMoviesList(combined);
                } else {
                    setMoviesList([]);
                }
            } catch (err) {
                console.error("Lỗi khi lấy danh sách phim:", err);
                setMoviesList([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAllMovies();
    }, []);

    const localizedMovies = useMemo(() => {
        return moviesList.map(movie => ({
            ...movie,
            title: language === "vi" ? (movie.title_vi || movie.title) : (movie.title_en || movie.title),
        }));
    }, [language, moviesList]);

    // Extract all unique genres from initial list
    const genres = useMemo(() => {
        const set = new Set<string>();
        localizedMovies.forEach((movie) => {
            movie.genres.forEach((genre: string) => set.add(genre));
        });
        return Array.from(set);
    }, [localizedMovies]);

    // Filter and Sort Movies
    const filteredMovies = useMemo(() => {
        return localizedMovies.filter((movie) => {
            const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = selectedStatus === "all" || movie.status === selectedStatus;
            const matchesGenre = selectedGenre === "" || movie.genres.includes(selectedGenre);
            return matchesSearch && matchesStatus && matchesGenre;
        }).sort((a, b) => {
            if (sortBy === "rating-desc") {
                return b.rating - a.rating;
            }
            if (sortBy === "title-asc") {
                return a.title.localeCompare(b.title, "vi");
            }
            if (sortBy === "title-desc") {
                return b.title.localeCompare(a.title, "vi");
            }
            return 0;
        });
    }, [searchQuery, selectedStatus, selectedGenre, sortBy, localizedMovies]);

    return (
        <div className="w-full bg-[#EFEBF4] pb-16">
            {/* Hero Section */}
            <MovieHero />

            {/* Content Section */}
            <div className="mx-auto max-w-[85%] px-4 sm:px-6 lg:px-8 mt-10">
                {/* Filters */}
                <div className="animate__animated animate__fadeInUp">
                    <MovieFilters
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedStatus={selectedStatus}
                        setSelectedStatus={setSelectedStatus}
                        selectedGenre={selectedGenre}
                        setSelectedGenre={setSelectedGenre}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        genres={genres}
                    />
                </div>

                {/* Movies Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-650 mb-4"></div>
                        <p className="text-gray-500 font-semibold">{t("loading") || "Đang tải danh sách phim..."}</p>
                    </div>
                ) : (
                    <div className="mt-8 animate__animated animate__fadeInUp [animation-delay:200ms]">
                        <MovieGrid movies={filteredMovies} />
                    </div>
                )}
            </div>
        </div>
    );
}
