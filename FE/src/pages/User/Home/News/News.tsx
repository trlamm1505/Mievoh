import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";
import { Sparkles, Tv, Volume2, Heart } from "lucide-react";
import ImaxImg from "../../../../assets/IMAX.jpg";
import DolbyImg from "../../../../assets/Dolby.jpg";
import SweetboxImg from "../../../../assets/Sweetbox.png";

interface ExperienceCard {
    id: number;
    titleVi: string;
    titleEn: string;
    taglineVi: string;
    taglineEn: string;
    descVi: string;
    descEn: string;
    image: string;
    icon: any;
    color: string;
}

export default function News() {
    const { language } = useLanguage();

    const experiences: ExperienceCard[] = [
        {
            id: 1,
            titleVi: "Màn Chiếu Cực Đại IMAX Laser",
            titleEn: "IMAX Laser Screen",
            taglineVi: "TỐI ƯU THỊ GIÁC",
            taglineEn: "MAXIMUM VISUALS",
            descVi: "Trải nghiệm điện ảnh đỉnh cao với màn hình cong kích thước khổng lồ, công nghệ chiếu Laser sắc nét gấp 4 lần và tỷ lệ tương phản vượt trội.",
            descEn: "Experience ultimate cinema with a giant curved screen, laser projection tech for 4x sharper resolution, and incredible contrast ratios.",
            image: ImaxImg,
            icon: Tv,
            color: "from-blue-500 to-cyan-400",
        },
        {
            id: 2,
            titleVi: "Âm Thanh Vòm Dolby Atmos",
            titleEn: "Dolby Atmos Surround Sound",
            taglineVi: "CHÂN THỰC TỪNG RUNG ĐỘNG",
            taglineEn: "IMMERSIVE AUDIO",
            descVi: "Hệ thống âm thanh ba chiều đỉnh cao bao phủ toàn bộ phòng chiếu, đưa bạn vào trung tâm của bộ phim, sống động đến từng tiếng động nhỏ nhất.",
            descEn: "Three-dimensional audio tech wrapping around the entire hall, bringing you right into the center of the action with lifelike precision.",
            image: DolbyImg,
            icon: Volume2,
            color: "from-purple-500 to-indigo-400",
        },
        {
            id: 3,
            titleVi: "Ghế Đôi Sweetbox Riêng Tư",
            titleEn: "Sweetbox Cozy Seating",
            taglineVi: "TRỌN VẸN KHOẢNH KHẮC",
            taglineEn: "SWEET MOMENTS",
            descVi: "Thiết kế vách ngăn cao tạo không gian riêng tư, ghế đệm êm ái sang trọng, là lựa chọn hoàn hảo cho các cặp đôi tận hưởng bộ phim ngọt ngào.",
            descEn: "Specially designed partition walls for absolute privacy with luxurious, cozy double cushions. The perfect choice for romantic dates.",
            image: SweetboxImg,
            icon: Heart,
            color: "from-pink-500 to-rose-400",
        },
    ];

    return (
        <section className="mx-auto max-w-[85%] px-4 py-16 sm:py-20 font-sans">
            {/* Title Block */}
            <div className="flex flex-col items-start gap-4 mb-12 text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-violet-100 to-purple-100 dark:from-zinc-800 dark:to-zinc-800 text-[#6D28D9] dark:text-violet-400 text-xs font-black uppercase tracking-wider shadow-sm border border-[#EAE6F0] dark:border-zinc-700/60 select-none">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    <span>{language === "vi" ? "Trải Nghiệm Đỉnh Cao" : "Premium Offerings"}</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-zinc-100 tracking-tight leading-tight">
                    {language === "vi" ? "Trải Nghiệm Điện Ảnh Tại " : "The Cinematic Experience at "}
                    <span className="bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-300">
                        Mievoh
                    </span>
                </h2>
                <p className="text-gray-500 dark:text-zinc-400 text-sm sm:text-base max-w-2xl leading-relaxed">
                    {language === "vi"
                        ? "Khám phá các tiêu chuẩn công nghệ rạp chiếu hiện đại nhất, nâng tầm mọi thước phim trở thành ký ức không thể nào quên."
                        : "Discover our state-of-the-art cinema technology standard, making every frame an unforgettable memory."}
                </p>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {experiences.map((exp) => {
                    const Icon = exp.icon;
                    return (
                        <div
                            key={exp.id}
                            className="group relative flex flex-col rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 shadow-md hover:shadow-2xl hover:shadow-purple-500/10 dark:hover:shadow-violet-500/5 transition-all duration-500 transform hover:-translate-y-2 cursor-default"
                        >
                            {/* Card Image */}
                            <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
                                <img
                                    src={exp.image}
                                    alt={language === "vi" ? exp.titleVi : exp.titleEn}
                                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                    loading="lazy"
                                />
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-65" />
                                
                                {/* Icon Badge floating */}
                                <div className={`absolute bottom-4 right-4 p-3 rounded-2xl bg-gradient-to-br ${exp.color} text-white shadow-lg shadow-black/10 transform transition-transform duration-500 group-hover:scale-110`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex flex-col p-6 text-left flex-1">
                                {/* Tagline */}
                                <span className="text-[10px] font-black tracking-widest text-[#6D28D9] dark:text-violet-400 uppercase select-none">
                                    {language === "vi" ? exp.taglineVi : exp.taglineEn}
                                </span>

                                {/* Title */}
                                <h3 className="text-xl font-extrabold text-gray-900 dark:text-zinc-100 mt-2 mb-3 transition-colors duration-300 group-hover:text-[#6D28D9] dark:group-hover:text-violet-400">
                                    {language === "vi" ? exp.titleVi : exp.titleEn}
                                </h3>

                                {/* Description */}
                                <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed flex-1">
                                    {language === "vi" ? exp.descVi : exp.descEn}
                                </p>
                            </div>

                            {/* Card Bottom Accent Line */}
                            <div className={`h-1.5 w-full bg-gradient-to-r ${exp.color} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
