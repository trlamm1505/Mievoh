import { MapPin, Compass } from "lucide-react";
import type { DisplayBranch } from "../../Cinemas/CinemaBranches/CinemaBranches.tsx";
interface CinemaHeaderProps {
    branch: DisplayBranch;
}

export default function CinemaHeader({ branch }: CinemaHeaderProps) {
    const description = `${branch.chainName} - Modern cinema system with premium hall quality and immersive sound technology.`;

    return (
        <div className="relative w-full overflow-hidden shadow-lg border-b border-black/20 animate__animated animate__fadeIn">
            {/* Real Theater Background Image - clear and sharp */}
            <div className="absolute inset-0 z-0">
                <img
                    src={branch.image}
                    alt={branch.name}
                    className="w-full h-full object-cover"
                />
                {/* Cinematic Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 p-6 md:p-8 lg:py-12 flex flex-col justify-end min-h-[220px]">
                <div className="max-w-5xl mx-auto w-full px-4 md:px-6">
                    {/* Main Branch Info */}
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                        {/* Logo with clean white background and border */}
                        <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl overflow-hidden border-2 border-white/90 shrink-0 bg-white flex items-center justify-center shadow-lg">
                            <img
                                src={branch.chainLogo}
                                alt={branch.chainName}
                                className="h-full w-full object-cover"
                            />
                        </div>

                        {/* Meta texts in high-contrast white */}
                        <div className="flex-grow">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-white drop-shadow-md mb-3">
                                {branch.name}
                            </h1>

                            <div className="flex flex-wrap gap-4 text-xs font-semibold text-white/90 mb-4">
                                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/15 rounded-xl px-3 py-2 shadow-sm">
                                    <MapPin className="h-3.5 w-3.5 text-[#6C5CE7]" />
                                    <span>{branch.address}</span>
                                </div>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 bg-[#6C5CE7] hover:bg-[#5F27CD] text-white rounded-xl px-3.5 py-2 transition-all duration-200 shadow-md shadow-black/30 cursor-pointer font-bold hover:scale-[1.02] active:scale-95"
                                >
                                    <Compass className="h-3.5 w-3.5 text-white" />
                                    <span>View Map</span>
                                </a>
                            </div>

                            <p className="text-xs text-white/80 max-w-3xl leading-relaxed border-t border-white/10 pt-3 drop-shadow-sm">
                                {description}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
