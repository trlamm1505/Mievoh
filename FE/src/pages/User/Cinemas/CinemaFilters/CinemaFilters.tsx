import { useState } from "react";
import { Film, ChevronDown, Check } from "lucide-react";
import type { TheaterChain } from "../../../../axios/cinemas.tsx";
import CityFilter from "../../../../components/CityFilter/CityFilter.tsx";
import SearchInput from "../../../../components/SearchInput/SearchInput";
import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";

interface CinemaFiltersProps {
    selectedCity: string;
    onSelectCity: (city: string) => void;
    selectedChainId: string;
    onSelectChain: (chainId: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    theaterChains: TheaterChain[];
    filteredChains: TheaterChain[];
    totalMatchingBranches: number;
}

export default function CinemaFilters({
    selectedCity,
    onSelectCity,
    selectedChainId,
    onSelectChain,
    searchQuery,
    onSearchChange,
    theaterChains,
    filteredChains,
    totalMatchingBranches,
}: CinemaFiltersProps) {
    const { t } = useLanguage();
    const [isChainOpen, setIsChainOpen] = useState(false);

    const activeChain = theaterChains.find(c => c.id === selectedChainId);

    const handleSelectChain = (chainId: string) => {
        onSelectChain(chainId);
        setIsChainOpen(false);
    };

    return (
        <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-violet-100/80 dark:border-zinc-800/80 shadow-xl shadow-violet-100/10 mb-8 relative z-30">
            {/* Global overlay to close dropdowns when clicking outside */}
            {isChainOpen && (
                <div 
                    className="fixed inset-0 z-45 bg-transparent" 
                    onClick={() => {
                        setIsChainOpen(false);
                    }}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-50">
                {/* Location Dropdown */}
                <CityFilter
                    selectedCity={selectedCity}
                    onSelectCity={onSelectCity}
                    label={t("filter_select_location")}
                />

                {/* Chain Selector Dropdown */}
                <div className="flex flex-col gap-2 relative">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider filter-header-gradient">
                        {t("filter_cinema_chain")}
                    </span>
                    <button
                        onClick={() => {
                            setIsChainOpen(!isChainOpen);
                        }}
                        className={`w-full flex items-center justify-between pl-4 pr-4 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 cursor-pointer outline-none border ${
                            isChainOpen 
                                ? "bg-white border-violet-500 text-gray-600 shadow-sm dark:bg-zinc-800 dark:border-violet-400 dark:!text-white" 
                                : "bg-[#F5F3F7]/80 border-violet-100 hover:bg-[#EBE8F0] text-gray-600 dark:bg-zinc-800/40 dark:border-zinc-800 dark:hover:bg-zinc-700/50 dark:!text-white"
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            {activeChain ? (
                                <img src={activeChain.logo} alt={activeChain.name} className="h-6 w-6 rounded-full object-cover border border-gray-200 shrink-0" />
                            ) : (
                                <Film className={`h-6 w-6 shrink-0 transition-colors duration-300 ${isChainOpen ? "text-violet-600" : "text-violet-500"}`} />
                            )}
                            <span className="truncate">
                                {activeChain ? activeChain.name : t("filter_all_chains", { count: totalMatchingBranches })}
                            </span>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isChainOpen ? "rotate-180 text-violet-500" : ""}`} />
                    </button>

                    {/* Dropdown Options List */}
                    {isChainOpen && (
                        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white dark:bg-zinc-800 border border-violet-200/90 dark:border-zinc-700 shadow-2xl shadow-violet-955/15 rounded-2xl py-2 z-50 animate__animated animate__fadeIn max-h-60 overflow-y-auto">
                            <button
                                onClick={() => handleSelectChain("all")}
                                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-left transition-colors duration-150 cursor-pointer ${
                                    selectedChainId === "all" 
                                        ? "bg-violet-55 text-violet-755 dark:bg-zinc-700/50 dark:!text-violet-400" 
                                        : "text-gray-700 hover:bg-violet-50/60 hover:text-violet-755 dark:!text-zinc-200 dark:hover:bg-zinc-700 dark:hover:!text-violet-404"
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Film className="h-6 w-6 text-gray-450 shrink-0" />
                                    <span>{t("filter_all_chains_with_count", { count: totalMatchingBranches })}</span>
                                </div>
                                {selectedChainId === "all" && <Check className="h-4 w-4 text-violet-600" />}
                            </button>
                            {theaterChains.map(chain => {
                                const count = filteredChains.find(c => c.id === chain.id)?.branches.length || 0;
                                const isSelected = selectedChainId === chain.id;
                                return (
                                    <button
                                        key={chain.id}
                                        onClick={() => handleSelectChain(chain.id)}
                                        disabled={count === 0}
                                        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-left transition-colors duration-150 ${
                                            count === 0 
                                                ? "opacity-40 cursor-not-allowed text-gray-400 dark:text-zinc-550" 
                                                : isSelected 
                                                    ? "bg-violet-50 text-violet-755 cursor-pointer dark:bg-zinc-700/50 dark:!text-violet-400" 
                                                    : "text-gray-700 hover:bg-violet-50/60 hover:text-violet-755 cursor-pointer dark:!text-zinc-200 dark:hover:bg-zinc-700 dark:hover:!text-violet-404"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <img src={chain.logo} alt={chain.name} className="h-6 w-6 rounded-full object-cover border border-gray-200 shrink-0" />
                                            <span className="truncate">{chain.name} ({count})</span>
                                        </div>
                                        {isSelected && <Check className="h-4 w-4 text-violet-600 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Search Input */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider filter-header-gradient">
                        {t("filter_quick_search")}
                    </span>
                    <SearchInput
                        size="lg"
                        placeholder={t("filter_search_placeholder")}
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-[#F5F3F7]/70 border-violet-100 hover:border-violet-300 rounded-2xl text-sm font-bold text-gray-755 focus:ring-2 focus:ring-violet-100 dark:bg-zinc-800/40 dark:border-zinc-800 dark:hover:border-zinc-700"
                    />
                </div>
            </div>
        </div>
    );
}
