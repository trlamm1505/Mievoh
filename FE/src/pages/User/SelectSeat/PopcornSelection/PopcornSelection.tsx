import { ChevronLeft } from "lucide-react";
import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";


interface PopcornSelectionProps {
    combos: any[];
    comboQuantities: Record<string, number>;
    updateComboQuantity: (id: string, delta: number) => void;
    setActiveStep: (step: number) => void;
    formatPrice: (value: number) => string;
}

export default function PopcornSelection({
    combos,
    comboQuantities,
    updateComboQuantity,
    setActiveStep,
    formatPrice
}: PopcornSelectionProps) {
    const { t } = useLanguage();
    return (
        <div className="bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm animate__animated animate__fadeIn flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    🍿 {t("popcorn_drinks_combos")}
                </h3>
                <span className="text-xs font-bold text-[#8E7EFE] bg-[#8E7EFE]/10 dark:bg-[#8E7EFE]/15 px-3 py-1 rounded-full">{t("popcorn_combo_discount_desc")}</span>
            </div>

            <div className="flex flex-col gap-4 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {combos.map(combo => {
                    const qty = comboQuantities[combo.id] || 0;
                    return (
                        <div key={combo.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-slate-100 dark:border-zinc-800/60 rounded-2xl hover:border-violet-100 dark:hover:border-[#8E7EFE]/40 transition-colors gap-3.5 bg-slate-50/40 dark:bg-zinc-800/20">
                            <div className="flex items-start gap-4">
                                <div className="w-24 h-12 rounded-xl bg-violet-50 dark:bg-zinc-800/80 flex items-center justify-center select-none shrink-0 shadow-inner overflow-hidden text-lg">
                                    <span className="whitespace-nowrap tracking-tight">{combo.image}</span>
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-base text-slate-850 dark:text-white">{combo.name}</h4>
                                    <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium mt-0.5 leading-snug">{combo.description}</p>
                                    <span className="text-base font-black text-[#8E7EFE] block mt-1.5">{formatPrice(combo.price)}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3.5 self-end sm:self-auto border border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 rounded-xl p-1 shadow-sm shrink-0">
                                <button 
                                    disabled={qty === 0}
                                    onClick={() => updateComboQuantity(combo.id, -1)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-base transition-colors cursor-pointer ${qty > 0 ? "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 active:scale-90" : "text-slate-350 dark:text-zinc-650 cursor-not-allowed"}`}
                                >
                                    -
                                </button>
                                <span className="w-6 text-center text-sm font-black text-slate-800 dark:text-zinc-100 select-none">{qty}</span>
                                <button 
                                    onClick={() => updateComboQuantity(combo.id, 1)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 active:scale-90 font-black text-base cursor-pointer"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Navigation buttons */}
            <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-6 flex justify-start">
                <button
                    onClick={() => setActiveStep(1)}
                    className="px-5 py-2.5 border border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 font-extrabold text-xs rounded-2xl transition-all cursor-pointer flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-800"
                >
                    <ChevronLeft className="h-4 w-4" />
                    {t("back_to_seats")}
                </button>
            </div>
        </div>
    );
}
