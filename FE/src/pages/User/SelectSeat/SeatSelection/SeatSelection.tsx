import { useMemo } from "react";
import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";

interface SeatSelectionProps {
    selectedSeats: string[];
    handleSeatClick: (seatName: string) => void;
    seatsList: any[];
}

export default function SeatSelection({
    selectedSeats,
    handleSeatClick,
    seatsList
}: SeatSelectionProps) {
    const { t } = useLanguage();

    // Group seats by their row letter (first character of seat name, e.g., "A")
    const seatsByRow = useMemo(() => {
        const groups: { [row: string]: any[] } = {};
        seatsList.forEach(seat => {
            if (!seat.name) return;
            const row = seat.name[0];
            if (!groups[row]) {
                groups[row] = [];
            }
            groups[row].push(seat);
        });

        // Sort the seats inside each row by their column number (numeric suffix of name)
        Object.keys(groups).forEach(row => {
            groups[row].sort((a, b) => {
                const numA = parseInt(a.name.substring(1), 10) || 0;
                const numB = parseInt(b.name.substring(1), 10) || 0;
                return numA - numB;
            });
        });

        return groups;
    }, [seatsList]);

    // Sorted list of unique row names (A, B, C, etc.)
    const sortedRows = useMemo(() => {
        return Object.keys(seatsByRow).sort();
    }, [seatsByRow]);

    const hasVip = useMemo(() => {
        return seatsList.some(s => s.seatType?.toUpperCase() === "VIP");
    }, [seatsList]);

    const hasCouple = useMemo(() => {
        return seatsList.some(s => {
            const t = s.seatType?.toUpperCase();
            return t === "COUPLE" || t === "SWEETBOX";
        });
    }, [seatsList]);

    return (
        <div className="bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-4 sm:p-6 shadow-sm overflow-hidden flex flex-col items-center animate__animated animate__fadeIn w-full min-w-0">
            {/* Screen Visualizer */}
            <div className="w-[85%] max-w-lg mb-14 text-center relative">
                <div className="w-full h-1 border-t-4 border-[#8E7EFE] rounded-[50%] filter blur-[1px] shadow-[0_4px_12px_rgba(142,126,254,0.6)]" />
                <div className="w-full h-16 bg-gradient-to-b from-[#8E7EFE]/10 to-transparent absolute top-0 left-0 rounded-[50%] blur-md pointer-events-none" />
                <span className="text-[10px] font-black tracking-[0.3em] text-[#8E7EFE]/80 uppercase block mt-3">{t("screen")}</span>
            </div>

            {/* Grid container */}
            <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent min-w-0">
                <div className="min-w-[580px] flex flex-col gap-2.5 items-center px-4">
                    {sortedRows.map(row => {
                        const seatsInRow = seatsByRow[row];
                        return (
                            <div key={row} className="flex items-center gap-3.5">
                                <span className="w-5 text-center text-xs font-black text-slate-400 dark:text-zinc-550 select-none">{row}</span>
                                <div className="flex gap-2">
                                    {seatsInRow.map(seat => {
                                        const isBooked = seat.status === "SOLD" || seat.status === "HELD";
                                        const isSelected = selectedSeats.includes(seat.name);
                                        const seatTypeUpper = seat.seatType?.toUpperCase();
                                        const isCouple = seatTypeUpper === "COUPLE" || seatTypeUpper === "SWEETBOX";

                                        let seatColorClass: string;
                                        if (isBooked) {
                                            seatColorClass = "bg-slate-200/60 border-slate-200 text-slate-400 dark:bg-zinc-800/40 dark:border-zinc-850 dark:text-zinc-650 cursor-not-allowed";
                                        } else if (isSelected) {
                                            seatColorClass = "bg-gradient-to-tr from-[#9E90FD] to-[#8E7EFE] border-[#8E7EFE] text-white shadow-md shadow-[#8E7EFE]/30 scale-105 font-bold";
                                        } else {
                                            if (seatTypeUpper === "VIP") {
                                                seatColorClass = "bg-indigo-50 border-indigo-400 text-indigo-900 hover:bg-indigo-100 hover:border-indigo-500 hover:text-indigo-955 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-200 dark:hover:bg-indigo-900/60 dark:hover:text-white dark:hover:border-indigo-500";
                                            } else if (isCouple) {
                                                seatColorClass = "bg-rose-50 border-rose-400 text-rose-900 hover:bg-rose-100 hover:border-rose-500 hover:text-rose-955 dark:bg-rose-950/20 dark:border-rose-800 dark:text-rose-200 dark:hover:bg-rose-900/60 dark:hover:text-white dark:hover:border-rose-500";
                                            } else {
                                                // NORMAL / STANDARD
                                                seatColorClass = "bg-white border-slate-350 text-slate-800 hover:bg-violet-50/60 hover:text-[#8E7EFE] hover:border-[#8E7EFE] dark:bg-zinc-800 dark:border-zinc-500 dark:text-white dark:hover:bg-zinc-700 dark:hover:text-white dark:hover:border-zinc-400";
                                            }
                                        }

                                        const num = seat.name.substring(1);
                                        if (isCouple) {
                                            return (
                                                <button
                                                    key={seat.seatId}
                                                    disabled={isBooked}
                                                    onClick={() => handleSeatClick(seat.name)}
                                                    className={`w-[78px] h-8 rounded-xl border flex items-center justify-center text-xs font-bold transition-all duration-200 select-none cursor-pointer ${seatColorClass} ${isBooked ? "" : "active:scale-95"}`}
                                                >
                                                    {isBooked ? "✖" : seat.name}
                                                </button>
                                            );
                                        }

                                        return (
                                            <button
                                                key={seat.seatId}
                                                disabled={isBooked}
                                                onClick={() => handleSeatClick(seat.name)}
                                                className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-bold transition-all duration-200 select-none cursor-pointer ${seatColorClass} ${isBooked ? "" : "active:scale-95"}`}
                                            >
                                                {isBooked ? "✖" : num}
                                            </button>
                                        );
                                    })}
                                </div>
                                <span className="w-5 text-center text-xs font-black text-slate-400 dark:text-zinc-550 select-none">{row}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Seat Legend */}
            <div className="w-full border-t border-slate-100 dark:border-zinc-800/80 mt-6 pt-6 flex flex-wrap justify-center gap-y-4 gap-x-6 text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-300 max-w-2xl mx-auto px-4 sm:px-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-4.5 h-4.5 rounded bg-white border border-slate-350 dark:bg-zinc-800 dark:border-zinc-550" />
                    <span>{t("seat_type_regular")}</span>
                </div>
                {hasVip && (
                    <div className="flex items-center gap-2.5">
                        <div className="w-4.5 h-4.5 rounded bg-indigo-50 border border-indigo-400 dark:bg-indigo-950/40 dark:border-indigo-800" />
                        <span>{t("seat_type_vip")}</span>
                    </div>
                )}
                {hasCouple && (
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-4.5 rounded bg-rose-50 border border-rose-400 dark:bg-rose-950/20 dark:border-rose-800" />
                        <span>{t("seat_type_sweetbox")}</span>
                    </div>
                )}
                <div className="flex items-center gap-2.5">
                    <div className="w-4.5 h-4.5 rounded bg-[#8E7EFE] border border-[#8E7EFE]" />
                    <span>{t("seat_status_selected")}</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="w-4.5 h-4.5 rounded bg-slate-200/60 border border-slate-200 dark:bg-zinc-800/40 dark:border-zinc-850 flex items-center justify-center text-[9px] text-slate-400 dark:text-zinc-550 font-black">✖</div>
                    <span>{t("seat_status_booked")}</span>
                </div>
            </div>
        </div>
    );
}
