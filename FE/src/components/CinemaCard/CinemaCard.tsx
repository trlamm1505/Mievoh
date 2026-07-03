import { Star, MapPin } from "lucide-react";
import Button from "../Button/Button.tsx";
import CountUp from "react-countup";
import { useLanguage } from "../../contextAPI/LanguageContext.tsx";

export interface CinemaData {
    id: string | number;
    name: string;
    address: string;
    rating: number;
    image?: string;
    logo?: string;
    votes?: string;
    city?: string;
    chainName?: string;
    chainLogo?: string;
}

interface CinemaCardProps {
    cinema: CinemaData;
    layout: "home" | "branch";
    isSelected?: boolean; // Used for "home" layout border highlight
    onClick?: () => void;
}

const parseVotes = (votesStr: string) => {
    const match = votesStr.match(/^([\d.]+)(k)?(\+)?$/);
    if (match) {
        const val = parseFloat(match[1]);
        const hasK = !!match[2];
        const hasPlus = !!match[3];
        const decimals = match[1].includes(".") ? 1 : 0;
        return {
            value: val,
            decimals,
            suffix: `${hasK ? "k" : ""}${hasPlus ? "+" : ""}`
        };
    }
    return { value: 0, decimals: 0, suffix: "" };
};

export default function CinemaCard({
    cinema,
    layout,
    isSelected = false,
    onClick,
}: CinemaCardProps) {
    const { t } = useLanguage();
    const CountUpComponent = (CountUp as any).default || CountUp;

    if (layout === "home") {
        return (
            <div 
                onClick={onClick}
                className={`group flex flex-col justify-between overflow-hidden rounded-2xl bg-[#F6F3F9] p-5 shadow-md hover:shadow-lg transition-all duration-300 border cursor-pointer hover:scale-[1.01] ${
                    isSelected 
                        ? "border-[#6D28D9] ring-2 ring-[#F3E8FF]" 
                        : "border-[#EAE6F0]"
                }`}
            >
                {/* Rating and Votes */}
                <div className="flex items-center justify-center gap-1 text-xs font-bold text-[#6D28D9] bg-[#F3E8FF]/60 px-3 py-1 rounded-full w-fit mx-auto mb-4">
                    <Star className="h-3 w-3 fill-[#6D28D9] text-[#6D28D9]" />
                    <span>
                        <CountUpComponent end={cinema.rating} decimals={1} duration={1.5} enableScrollSpy scrollSpyOnce />
                        {cinema.votes && (
                            <>
                                {" ("}
                                {(() => {
                                    const { value, decimals, suffix } = parseVotes(cinema.votes);
                                    return <CountUpComponent end={value} decimals={decimals} suffix={suffix} duration={1.5} enableScrollSpy scrollSpyOnce />;
                                })()}
                                {")"}
                            </>
                        )}
                    </span>
                </div>

                {/* Logo */}
                <div className="relative h-14 w-14 rounded-full overflow-hidden border border-gray-100 flex items-center justify-center bg-gray-50 mb-3 mx-auto shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <img
                        src={cinema.logo || cinema.image || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=120&q=80"}
                        alt={cinema.name}
                        className="h-full w-full object-cover"
                    />
                </div>

                {/* Info */}
                <div className="text-center flex-grow flex flex-col justify-between">
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#6D28D9] transition-colors duration-200 line-clamp-1 mb-2">
                        {cinema.name}
                    </h3>

                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4 flex items-start gap-1 justify-center max-w-[200px] mx-auto min-h-[36px]">
                        <MapPin className="h-3 w-3 flex-none mt-0.5 text-gray-400" />
                        <span>{cinema.address}</span>
                    </p>
                </div>

                {/* Button */}
                <div className="mt-auto">
                    <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full text-center border-gray-200 hover:border-[#6D28D9]"
                    >
                        {t("view_showtimes")}
                    </Button>
                </div>
            </div>
        );
    }

    // "branch" layout
    return (
        <div
            onClick={onClick}
            className="bg-white rounded-3xl overflow-hidden border border-violet-100/60 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer h-full"
        >
            {/* Cover Image with Brand Badge */}
            <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                <img
                    src={cinema.image || cinema.logo || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80"}
                    alt={cinema.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Chain overlay tag */}
                {cinema.chainName && (
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white py-1.5 px-3 rounded-full flex items-center gap-1.5 border border-white/10 text-xs font-bold">
                        {cinema.chainLogo && (
                            <img 
                                src={cinema.chainLogo} 
                                alt={cinema.chainName} 
                                className="h-4 w-4 rounded-full object-cover border border-white/20" 
                            />
                        )}
                        <span>{cinema.chainName}</span>
                    </div>
                )}
                {/* Rating badge */}
                <div className="absolute top-4 right-4 bg-violet-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                    <Star className="h-3.5 w-3.5 fill-white text-white" />
                    <span>
                        <CountUpComponent end={cinema.rating} decimals={1} duration={1.5} enableScrollSpy scrollSpyOnce />
                    </span>
                </div>
            </div>

            {/* Information Details */}
            <div className="p-6 flex-grow flex flex-col justify-between">
                <div>
                    {cinema.city && (
                        <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-2 py-0.5 rounded-md w-fit mb-2.5 block">
                            {cinema.city}
                        </span>
                    )}
                    
                    <h3 className="text-base font-extrabold text-gray-900 group-hover:text-violet-700 transition-colors duration-200 line-clamp-1 mb-2">
                        {cinema.name}
                    </h3>

                    <div className="space-y-2 mt-2 text-xs text-gray-500">
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
                            <span className="leading-relaxed line-clamp-3">{cinema.address}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
