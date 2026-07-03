import SearchInput from "../../../../components/SearchInput/SearchInput";
import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";

interface MovieFiltersProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedStatus: "all" | "now_showing" | "coming_soon";
    setSelectedStatus: (status: "all" | "now_showing" | "coming_soon") => void;
    selectedGenre: string;
    setSelectedGenre: (genre: string) => void;
    sortBy: string;
    setSortBy: (sort: string) => void;
    genres: string[];
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

export default function MovieFilters({
    searchQuery,
    setSearchQuery,
    selectedStatus,
    setSelectedStatus,
    selectedGenre,
    setSelectedGenre,
    sortBy,
    setSortBy,
    genres,
}: MovieFiltersProps) {
    const { t } = useLanguage();
    return (
        <div className="w-full bg-white rounded-2xl border border-[#EAE6F0] dark:border-zinc-800/80 p-6 shadow-sm mb-8 flex flex-col gap-6 animate__animated animate__fadeIn">
            {/* Top row: Search, Status Tabs, Sorting */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Status Tabs */}
                <div className="flex bg-[#F6F3F9] dark:bg-zinc-900/50 p-1.5 rounded-full border border-[#EAE6F0] dark:border-zinc-800/80 w-full md:w-max select-none">
                    <button
                        type="button"
                        onClick={() => setSelectedStatus("all")}
                        className={`flex-grow md:flex-grow-0 px-6 py-2 rounded-full text-sm font-bold transition-all duration-200 cursor-pointer ${
                            selectedStatus === "all"
                                ? "bg-gradient-to-r from-[#9370DB] to-[#7B68EE] text-white shadow-sm"
                                : "text-gray-600 dark:!text-violet-400 hover:text-[#6D28D9] dark:hover:!text-violet-300"
                        }`}
                    >
                        {t("all_filter")}
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedStatus("now_showing")}
                        className={`flex-grow md:flex-grow-0 px-6 py-2 rounded-full text-sm font-bold transition-all duration-200 cursor-pointer ${
                            selectedStatus === "now_showing"
                                ? "bg-gradient-to-r from-[#9370DB] to-[#7B68EE] text-white shadow-sm"
                                : "text-gray-600 dark:!text-violet-400 hover:text-[#6D28D9] dark:hover:!text-violet-300"
                        }`}
                    >
                        {t("now_showing_filter")}
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedStatus("coming_soon")}
                        className={`flex-grow md:flex-grow-0 px-6 py-2 rounded-full text-sm font-bold transition-all duration-200 cursor-pointer ${
                            selectedStatus === "coming_soon"
                                ? "bg-gradient-to-r from-[#9370DB] to-[#7B68EE] text-white shadow-sm"
                                : "text-gray-600 dark:!text-violet-400 hover:text-[#6D28D9] dark:hover:!text-violet-300"
                        }`}
                    >
                        {t("coming_soon_filter")}
                    </button>
                </div>

                {/* Search & Sort Container */}
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    {/* Search Input */}
                    <SearchInput
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t("search_movies_placeholder")}
                        containerClassName="flex-grow sm:flex-grow-0"
                        className="w-full sm:w-64 border-violet-100 dark:border-zinc-800 bg-[#F6F3F9]/50 dark:bg-zinc-800/40 focus:ring-2 focus:ring-violet-100 dark:focus:ring-zinc-800"
                    />

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2">
                        <label htmlFor="sortBy" className="text-sm font-bold text-gray-600 shrink-0 filter-header-gradient">
                            {t("sort_by_label")}
                        </label>
                        <select
                            id="sortBy"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full sm:w-48 rounded-full border border-violet-100 dark:border-zinc-800 bg-[#F6F3F9]/50 dark:bg-zinc-800/40 py-2.5 px-4 text-sm text-gray-600 dark:!text-white outline-none transition-all duration-300 focus:border-violet-500 focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-violet-100 dark:focus:ring-zinc-800 cursor-pointer"
                        >
                            <option value="rating-desc">{t("highest_rating")}</option>
                            <option value="title-asc">{t("title_az")}</option>
                            <option value="title-desc">{t("title_za")}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Bottom row: Genre Filters */}
            <div className="border-t border-[#EAE6F0]/60 dark:border-zinc-800/50 pt-4">
                <span className="block text-sm font-bold text-gray-600 mb-3 filter-header-gradient">{t("genre_label")}</span>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setSelectedGenre("")}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                            selectedGenre === ""
                                ? "bg-[#6D28D9] text-white shadow-sm"
                                : "bg-[#F3E8FF]/60 text-[#6D28D9] hover:bg-[#E9D5FF]/80 dark:bg-zinc-800/60 dark:!text-violet-400 dark:hover:bg-[#6D28D9]/30 dark:hover:!text-violet-300"
                        }`}
                    >
                        {t("all_filter")}
                    </button>
                    {genres.map((genre) => {
                        const key = genreKeys[genre];
                        const displayGenre = key ? t(key as any) : genre;
                        return (
                            <button
                                key={genre}
                                type="button"
                                onClick={() => setSelectedGenre(genre)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                                    selectedGenre === genre
                                        ? "bg-[#6D28D9]"
                                        : "bg-[#F3E8FF]/60 text-[#6D28D9] hover:bg-[#E9D5FF]/80 dark:bg-zinc-800/60 dark:!text-violet-400"
                                }`}
                            >
                                {displayGenre}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
