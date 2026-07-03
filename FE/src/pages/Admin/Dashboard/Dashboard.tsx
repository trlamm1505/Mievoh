import { useEffect, useState } from 'react';
import { Film, Building2, MapPin, Image, TrendingUp, Clock, Star } from 'lucide-react';
import { getMoviesAdminApi, getCinemaSystemsApi, getCinemaComplexesApi, getBannersApi } from '../../../axios/admin';
import type { Movie } from '../../../axios/admin';
import { useLanguage } from '../../../contextAPI/LanguageContext';

interface Stats {
    totalMovies: number;
    nowShowing: number;
    comingSoon: number;
    hotMovies: number;
    cinemaSystems: number;
    cinemaComplexes: number;
    banners: number;
}

export default function Dashboard() {
    const { t } = useLanguage();
    const [stats, setStats] = useState<Stats>({
        totalMovies: 0,
        nowShowing: 0,
        comingSoon: 0,
        hotMovies: 0,
        cinemaSystems: 0,
        cinemaComplexes: 0,
        banners: 0,
    });
    const [recentMovies, setRecentMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const [moviesRes, systemsRes, complexesRes, bannersRes] = await Promise.all([
                getMoviesAdminApi({ page: 1, pageSize: 10 }),
                getCinemaSystemsApi(),
                getCinemaComplexesApi(),
                getBannersApi(),
            ]);

            const movies = moviesRes.data;
            const allMovies = movies.data || [];

            setStats({
                totalMovies: movies.total || allMovies.length,
                nowShowing: allMovies.filter((m) => m.isShowing).length,
                comingSoon: allMovies.filter((m) => m.isComingSoon).length,
                hotMovies: allMovies.filter((m) => m.isHot).length,
                cinemaSystems: systemsRes.data?.length || 0,
                cinemaComplexes: complexesRes.data?.length || 0,
                banners: bannersRes.data?.length || 0,
            });

            setRecentMovies(allMovies.slice(0, 5));
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { label: t('dash_total_movies'), value: stats.totalMovies, icon: Film, color: 'bg-violet-100 text-violet-600' },
        { label: t('dash_now_showing'), value: stats.nowShowing, icon: TrendingUp, color: 'bg-green-100 text-green-600' },
        { label: t('dash_coming_soon'), value: stats.comingSoon, icon: Clock, color: 'bg-blue-100 text-blue-600' },
        { label: t('dash_hot_movies'), value: stats.hotMovies, icon: Star, color: 'bg-orange-100 text-orange-600' },
        { label: t('dash_cinema_systems'), value: stats.cinemaSystems, icon: Building2, color: 'bg-indigo-100 text-indigo-600' },
        { label: t('dash_cinema_complexes'), value: stats.cinemaComplexes, icon: MapPin, color: 'bg-pink-100 text-pink-600' },
        { label: t('dash_banners'), value: stats.banners, icon: Image, color: 'bg-cyan-100 text-cyan-600' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin w-8 h-8 text-violet-600" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-gray-500 text-sm">{t('adm_loading_data')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('admin_dashboard')}</h1>
                    <p className="text-gray-500 mt-1">{t('dash_subtitle')}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <div
                        key={card.label}
                        className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">{card.label}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                                <card.icon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Movies */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">{t('dash_recent_movies')}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-left">
                                <th className="px-6 py-3 font-medium text-gray-500">{t('dash_col_title')}</th>
                                <th className="px-6 py-3 font-medium text-gray-500">{t('dash_col_duration')}</th>
                                <th className="px-6 py-3 font-medium text-gray-500">{t('dash_col_status')}</th>
                                <th className="px-6 py-3 font-medium text-gray-500">{t('dash_col_release')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {recentMovies.map((movie) => (
                                <tr key={movie.movieId} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-3 font-medium text-gray-900">
                                        {movie.title_vi || movie.title_en || '—'}
                                    </td>
                                    <td className="px-6 py-3 text-gray-600">
                                        {movie.duration ? `${movie.duration} ${t('dash_minutes')}` : '—'}
                                    </td>
                                    <td className="px-6 py-3">
                                        {movie.isShowing && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                {t('dash_status_showing')}
                                            </span>
                                        )}
                                        {movie.isComingSoon && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                {t('dash_status_coming')}
                                            </span>
                                        )}
                                        {!movie.isShowing && !movie.isComingSoon && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                {t('dash_status_stopped')}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-gray-600">
                                        {movie.releaseDate
                                            ? new Date(movie.releaseDate).toLocaleDateString('vi-VN')
                                            : '—'}
                                    </td>
                                </tr>
                            ))}
                            {recentMovies.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                        {t('dash_no_movies')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
