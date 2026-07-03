import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";

export default function CinemaHero() {
    const { t } = useLanguage();
    return (
        <div className="relative w-full py-16 md:py-24 overflow-hidden mb-10 shadow-md bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80')` }}>
            {/* Dark & Purple gradient overlay to match our color scheme */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-[#1E1B4B]/85 to-[#090514]/90 pointer-events-none" />
            
            <div className="max-w-[90%] mx-auto px-4 md:px-8 relative z-10 animate__animated animate__fadeIn flex flex-col items-center text-center">
                <span className="bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
                    {t("cinema_chains_label")}
                </span>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white max-w-3xl leading-tight">
                    {t("cinema_network_title")}
                </h1>
                <p className="text-gray-300 mt-4 text-sm md:text-base max-w-2xl leading-relaxed">
                    {t("cinema_network_desc")}
                </p>
            </div>
        </div>
    );
}
