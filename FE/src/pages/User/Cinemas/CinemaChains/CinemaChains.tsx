import type { TheaterChain } from "../../../../axios/cinemas.tsx";

interface CinemaChainsProps {
    selectedChainId: string;
    onSelectChain: (chainId: string) => void;
    filteredChains: TheaterChain[];
    totalMatchingBranches: number;
}

export default function CinemaChains({
    selectedChainId,
    onSelectChain,
    filteredChains,
    totalMatchingBranches,
}: CinemaChainsProps) {
    return (
        <div className="mb-10">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">
                Filter by Cinema Chain:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-8">
                <button
                    onClick={() => onSelectChain("all")}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                        selectedChainId === "all"
                            ? "bg-violet-500/5 border-violet-500 ring-2 ring-violet-100 text-violet-700"
                             : "bg-white border-gray-100 hover:border-violet-200 text-gray-700"
                    }`}
                >
                    <span className="text-sm font-extrabold uppercase">All</span>
                    <span className="text-[10px] text-gray-400 mt-1">({totalMatchingBranches} cinemas)</span>
                </button>

                {filteredChains.map(chain => {
                    const count = chain.branches.length;
                    const isSelected = selectedChainId === chain.id;
                    return (
                        <button
                            key={chain.id}
                            onClick={() => onSelectChain(chain.id)}
                            disabled={count === 0}
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 relative ${
                                count === 0 
                                    ? "opacity-40 cursor-not-allowed bg-gray-50 border-gray-100" 
                                    : isSelected
                                        ? "bg-violet-500/5 border-violet-500 ring-2 ring-violet-100 text-violet-700 cursor-pointer"
                                        : "bg-white border-gray-100 hover:border-violet-200 text-gray-700 cursor-pointer"
                            }`}
                        >
                            <div className="h-9 w-9 rounded-full overflow-hidden border border-gray-100 mb-1.5 flex items-center justify-center bg-gray-50">
                                <img src={chain.logo} alt={chain.name} className="h-full w-full object-cover" />
                            </div>
                            <span className="text-xs font-bold text-center truncate w-full">{chain.name}</span>
                            <span className="text-[10px] text-gray-400 mt-0.5">({count} cinemas)</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
