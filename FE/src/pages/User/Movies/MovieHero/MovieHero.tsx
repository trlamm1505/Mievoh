import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";

export default function MovieHero() {
    const { t } = useLanguage();
    return (
        <div 
            className="relative py-16 md:py-20 bg-cover bg-center text-white"
            style={{ backgroundImage: "url('/images/movie_theater_bg.png')" }}
        >
            {/* Dark overlay with purple tint to maintain brand tone */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-[#2E1065]/80 to-black/85" />
            
            {/* Highlight glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15),transparent_60%)]" />

            <div className="relative mx-auto max-w-[85%] px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
                <div className="flex flex-col gap-3 items-center">
                    {/* Centered Title */}
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white md:leading-tight animate__animated animate__fadeInDown">
                        {t("movie_list_title")}
                    </h1>
                    
                    {/* Centered Subtitle */}
                    <p className="text-sm md:text-base text-gray-300 max-w-xl leading-relaxed font-medium animate__animated animate__fadeInUp animate__delay-1s">
                        {t("movie_list_subtitle")}
                    </p>
                </div>
            </div>
        </div>
    );
}
