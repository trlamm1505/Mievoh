import { useMemo, useEffect } from "react";
import { Calendar } from "lucide-react";
import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";

export interface DateOption {
    label: string;      // e.g. "29/5"
    dayOfWeek: string;  // e.g. "Th 6"
    dateString: string;  // e.g. "2026-05-29"
}

interface DateSelectorProps {
    selectedDate: DateOption | null;
    onSelectDate: (date: DateOption) => void;
}

export default function DateSelector({ selectedDate, onSelectDate }: DateSelectorProps) {
    const { t, language } = useLanguage();
    
    const dates = useMemo(() => {
        const daysList: DateOption[] = [];
        const weekdays = language === "vi"
            ? ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
            : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const dayOfWeek = weekdays[d.getDay()];
            const label = `${d.getDate()}/${d.getMonth() + 1}`;
            
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const dateVal = String(d.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${dateVal}`;

            daysList.push({ label, dayOfWeek, dateString });
        }
        return daysList;
    }, [language]);

    // Set first day as default if not selected
    useEffect(() => {
        if (dates.length > 0 && !selectedDate) {
            onSelectDate(dates[0]);
        }
    }, [dates, selectedDate, onSelectDate]);

    // Keep selectedDate language details in sync
    useEffect(() => {
        if (selectedDate) {
            const matchingDate = dates.find(d => d.dateString === selectedDate.dateString);
            if (matchingDate && (matchingDate.dayOfWeek !== selectedDate.dayOfWeek || matchingDate.label !== selectedDate.label)) {
                onSelectDate(matchingDate);
            }
        }
    }, [language, dates, selectedDate, onSelectDate]);

    return (
        <div className="bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm mb-6 animate__animated animate__fadeIn">
            {/* Header label */}
            <div className="flex items-center gap-2 mb-4 text-slate-800 dark:text-zinc-300">
                <Calendar className="h-5 w-5 text-[#6C5CE7]" />
                <span className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">{t("select_date")}</span>
            </div>

            {/* Dates list row */}
            <div className="flex items-center md:justify-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {dates.map((dateOpt) => {
                    const isSelected = selectedDate?.dateString === dateOpt.dateString;
                    return (
                        <button
                            key={dateOpt.dateString}
                            onClick={() => onSelectDate(dateOpt)}
                            className={`flex flex-col items-center justify-center min-w-[80px] py-3 px-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                                isSelected
                                    ? "bg-gradient-to-tr from-[#9E90FD] to-[#806DF6] border-[#806DF6] text-white shadow-md shadow-[#806DF6]/20 scale-[1.02]"
                                    : "bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-200 dark:bg-zinc-800/40 dark:border-zinc-850 dark:text-zinc-400 dark:hover:bg-zinc-700/60 dark:hover:text-white dark:hover:border-zinc-700"
                            }`}
                        >
                            <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${isSelected ? "text-indigo-100" : "text-slate-400 dark:text-zinc-500"}`}>
                                {dateOpt.label}
                            </span>
                            <span className="text-sm font-extrabold">
                                {dateOpt.dayOfWeek}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
