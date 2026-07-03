import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";
import CinemaCard from "../../../../components/CinemaCard/CinemaCard.tsx";
import type { CinemaData } from "../../../../components/CinemaCard/CinemaCard.tsx";
import { getCinemaSystemsApi, getCinemaComplexesApi } from "../../../../axios/cinemas.tsx";

export default function Cinemas() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [cinemas, setCinemas] = useState<CinemaData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCinemas = async () => {
            try {
                setLoading(true);
                const [systemsRes, complexesRes] = await Promise.all([
                    getCinemaSystemsApi(),
                    getCinemaComplexesApi()
                ]);

                const systems = (systemsRes.data as any)?.data || [];
                const complexes = (complexesRes.data as any)?.data || [];

                const mapped = complexes.map((comp: any, idx: number) => {
                    const sys = systems.find((s: any) => s.cinemaSystemId === comp.cinemaSystemId);
                    const sysNameLower = sys?.name?.toLowerCase() || "";

                    let rating = 4.5;
                    if (sysNameLower.includes("cgv")) rating = 4.8;
                    else if (sysNameLower.includes("bhd")) rating = 4.6;
                    else if (sysNameLower.includes("lotte")) rating = 4.7;
                    else if (sysNameLower.includes("cine")) rating = 4.4;
                    else if (sysNameLower.includes("beta")) rating = 4.3;

                    const finalRating = parseFloat((rating + (idx % 3) * 0.1 - 0.1).toFixed(1));

                    // Build full URL for system logo
                    let logoUrl = sys?.logo || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=120&q=80";
                    if (sys?.logo && !sys.logo.startsWith('http')) {
                        const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://api.mievoh.io.vn/api';
                        const domain = apiBase.replace('/api', '');
                        logoUrl = `${domain}/cinema-system/${sys.logo}`;
                    }

                    // Determine city from address
                    const address = comp.address || "";
                    let city = "Ho Chi Minh City";
                    if (address.toLowerCase().includes("hà nội") || address.toLowerCase().includes("hanoi")) {
                        city = "Hanoi";
                    } else if (address.toLowerCase().includes("đà nẵng") || address.toLowerCase().includes("da nang")) {
                        city = "Da Nang";
                    } else if (address.toLowerCase().includes("bình dương") || address.toLowerCase().includes("binh duong")) {
                        city = "Binh Duong";
                    }

                    // Alternate cover images for visual variety
                    const imagesList = [
                        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
                        "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80",
                        "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&q=80",
                        "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80",
                        "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80"
                    ];
                    const randomImage = imagesList[idx % imagesList.length];

                    return {
                        id: comp.cinemaComplexId,
                        name: comp.name || "",
                        address: comp.address || "",
                        rating: finalRating,
                        image: randomImage,
                        city: city,
                        chainName: sys?.name || "",
                        chainLogo: logoUrl,
                    };
                });

                // Sort by rating descending and take the first 3 for home page 3-column display
                const sortedByRating = [...mapped].sort((a, b) => b.rating - a.rating);
                setCinemas(sortedByRating.slice(0, 3));
            } catch (error) {
                console.error("Lỗi khi tải thông tin rạp tại Home:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCinemas();
    }, []);

    return (
        <section className="mx-auto max-w-[85%] px-4 py-16 sm:py-20 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    {t("featured_cinemas")}
                </h2>
                <a 
                    href="/cinemas" 
                    className="text-sm font-semibold text-[#6D28D9] hover:text-[#5B21B6] transition-colors flex items-center gap-1 group"
                >
                    <span>{t("see_all")}</span>
                    <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
                </a>
            </div>

            {/* Cinemas Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-650"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                    {cinemas.map((cinema) => (
                        <div key={cinema.id} className="h-full">
                            <CinemaCard 
                                cinema={cinema}
                                layout="branch"
                                onClick={() => navigate(`/cinemas/${cinema.id}`)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
