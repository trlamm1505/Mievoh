import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { DisplayBranch } from "../Cinemas/CinemaBranches/CinemaBranches.tsx";
import CinemaHeader from "./CinemaHeader/CinemaHeader.tsx";
import DateSelector from "./DateSelector/DateSelector.tsx";
import type { DateOption } from "./DateSelector/DateSelector.tsx";
import MovieShowtimesList from "./MovieShowtimesList/MovieShowtimesList.tsx";
import { Search } from "lucide-react";
import { getCinemaComplexDetailApi } from "../../../axios/cinemas.tsx";

export default function CinemaDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState<DateOption | null>(null);
    const [activeBranch, setActiveBranch] = useState<DisplayBranch | null>(null);
    const [loading, setLoading] = useState(true);

    // Scroll to top and fetch complex details
    useEffect(() => {
        window.scrollTo(0, 0);
        if (!id) return;

        const fetchComplexDetail = async () => {
            try {
                setLoading(true);
                const res = await getCinemaComplexDetailApi(id);
                const comp = res.data;

                if (comp) {
                    const sysName = comp.CinemaSystem?.name || "Cinema";
                    const sysLogo = comp.CinemaSystem?.logo || "";
                    const sysNameLower = sysName.toLowerCase();
                    
                    let rating = 4.5;
                    let priceRange = "70,000 VND - 120,000 VND";
                    let phone = "1900 1000";

                    if (sysNameLower.includes("cgv")) {
                        rating = 4.8;
                        priceRange = "80,000 VND - 160,000 VND";
                        phone = "1900 6017";
                    } else if (sysNameLower.includes("bhd")) {
                        rating = 4.6;
                        priceRange = "65,000 VND - 120,000 VND";
                        phone = "1900 2099";
                    } else if (sysNameLower.includes("lotte")) {
                        rating = 4.7;
                        priceRange = "70,000 VND - 130,000 VND";
                        phone = "028 3775 2524";
                    } else if (sysNameLower.includes("cine")) {
                        rating = 4.4;
                        priceRange = "45,000 VND - 90,000 VND";
                        phone = "028 7300 8881";
                    } else if (sysNameLower.includes("beta")) {
                        rating = 4.3;
                        priceRange = "50,000 VND - 100,000 VND";
                        phone = "024 7302 8885";
                    }

                    let logoUrl = sysLogo || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=120&q=80";
                    if (sysLogo && !sysLogo.startsWith('http')) {
                        const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://api.mievoh.io.vn/api';
                        const domain = apiBase.replace('/api', '');
                        logoUrl = `${domain}/cinema-system/${sysLogo}`;
                    }

                    const address = comp.address || "";
                    let city = "Ho Chi Minh City";
                    if (address.toLowerCase().includes("hà nội") || address.toLowerCase().includes("hanoi")) {
                        city = "Hanoi";
                    } else if (address.toLowerCase().includes("đà nẵng") || address.toLowerCase().includes("da nang")) {
                        city = "Da Nang";
                    } else if (address.toLowerCase().includes("bình dương") || address.toLowerCase().includes("binh duong")) {
                        city = "Binh Duong";
                    }

                    setActiveBranch({
                        id: comp.cinemaComplexId,
                        name: comp.name || "Cụm rạp",
                        address,
                        phone,
                        city,
                        rating,
                        priceRange,
                        image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
                        chainName: sysName,
                        chainLogo: logoUrl
                    });
                } else {
                    setActiveBranch(null);
                }
            } catch (err) {
                console.error("Lỗi khi tải chi tiết cụm rạp:", err);
                setActiveBranch(null);
            } finally {
                setLoading(false);
            }
        };

        fetchComplexDetail();
    }, [id]);

    if (loading) {
        return (
            <div className="bg-[#EFEBF4] min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-650"></div>
            </div>
        );
    }

    if (!activeBranch) {
        return (
            <div className="bg-[#FAF9FC] min-h-screen py-16 px-4 md:px-8 font-sans flex items-center justify-center">
                <div className="bg-white border border-gray-100 p-12 rounded-3xl text-center shadow-lg max-w-md w-full">
                    <div className="h-16 w-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4 text-violet-500">
                        <Search className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Cinema branch not found</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        Sorry, this link does not exist or the cinema has ceased operations.
                    </p>
                    <button
                        onClick={() => navigate("/cinemas")}
                        className="mt-6 text-sm font-bold text-violet-600 hover:text-white bg-violet-50 hover:bg-violet-600 px-6 py-3 rounded-2xl transition-all duration-300 cursor-pointer w-full border border-violet-100 hover:border-violet-600"
                    >
                        Go back to cinemas
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#EFEBF4] min-h-screen pb-16 font-sans">
            {/* Full-bleed Cinema info banner */}
            <CinemaHeader branch={activeBranch} />

            {/* Main Content Area - constrained to elegant max-w-5xl */}
            <div className="max-w-5xl mx-auto px-4 md:px-6 mt-8">
                {/* Day option scheduler select row */}
                <DateSelector selectedDate={selectedDate} onSelectDate={setSelectedDate} />

                {/* Grid schedule display */}
                <h2 className="text-xs font-extrabold text-slate-800 mb-6 tracking-widest uppercase border-l-4 border-[#6C5CE7] pl-3">
                    Showtimes at {activeBranch.name}
                </h2>
                <MovieShowtimesList complexId={activeBranch.id.toString()} selectedDate={selectedDate} cinemaName={activeBranch.name} />
            </div>
        </div>
    );
}
