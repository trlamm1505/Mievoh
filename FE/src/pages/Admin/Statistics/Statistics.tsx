import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, Users, Ticket, Film, DollarSign, BarChart3, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../../contextAPI/LanguageContext';
import {
    getStatisticsOverviewApi,
    getRevenueChartApi,
    getTopMoviesApi,
    getRevenueByComplexApi,
} from '../../../axios/admin';

export default function StatisticsPage() {
    const { t } = useLanguage();
    const [overview, setOverview] = useState<any>(null);
    const [revenueChart, setRevenueChart] = useState<any[]>([]);
    const [topMovies, setTopMovies] = useState<any[]>([]);
    const [revenueByComplex, setRevenueByComplex] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartDays, setChartDays] = useState(7);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [ovRes, chartRes, topRes, complexRes] = await Promise.all([
                getStatisticsOverviewApi(),
                getRevenueChartApi(chartDays),
                getTopMoviesApi(5),
                getRevenueByComplexApi(),
            ]);

            setOverview(ovRes.data);

            const chartData = ovRes.data?.revenueChart || chartRes.data;
            setRevenueChart(Array.isArray(chartData) ? chartData : (Array.isArray(chartData?.data) ? chartData.data : []));

            const topData = topRes.data;
            setTopMovies(Array.isArray(topData) ? topData : (Array.isArray(topData?.data) ? topData.data : []));

            const complexData = complexRes.data;
            setRevenueByComplex(Array.isArray(complexData) ? complexData : (Array.isArray(complexData?.data) ? complexData.data : []));
        } catch {
            toast.error(t('stat_load_error'));
        } finally {
            setLoading(false);
        }
    }, [chartDays]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const formatVND = (n: number) => {
        if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
        return new Intl.NumberFormat('vi-VN').format(n);
    };

    const formatFullVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + '₫';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin w-8 h-8 text-violet-600" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-gray-500 text-sm">{t('stat_loading')}</span>
                </div>
            </div>
        );
    }

    const overviewCards = [
        { label: t('stat_total_revenue'), value: formatVND(overview?.totalRevenue ?? 0), icon: DollarSign, color: 'bg-green-100 text-green-600' },
        { label: t('stat_tickets_sold'), value: overview?.totalBookings ?? overview?.totalTickets ?? 0, icon: Ticket, color: 'bg-violet-100 text-violet-600' },
        { label: t('stat_users'), value: overview?.totalUsers ?? 0, icon: Users, color: 'bg-blue-100 text-blue-600' },
        { label: t('stat_total_movies'), value: overview?.totalMovies ?? 0, icon: Film, color: 'bg-orange-100 text-orange-600' },
    ];

    // Find max revenue for chart scaling
    const maxRevenue = revenueChart.reduce((max, item) => Math.max(max, item.revenue || item.total || 0), 0) || 1;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('stat_title')}</h1>
                <p className="text-gray-500 mt-1">{t('stat_subtitle')}</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {overviewCards.map((card) => (
                    <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
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

            {/* Revenue Chart */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-violet-500" /> {t('stat_revenue_chart')}
                    </h2>
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        {[7, 14, 30].map((d) => (
                            <button
                                key={d} onClick={() => setChartDays(d)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${chartDays === d ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {d} {t('stat_days')}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="p-6">
                    {revenueChart.length === 0 ? (
                        <p className="text-center text-gray-400 py-12">{t('stat_no_revenue')}</p>
                    ) : (
                        <div className="flex items-end gap-2 h-52">
                            {revenueChart.map((item, idx) => {
                                const value = item.revenue || item.total || 0;
                                const height = Math.max((value / maxRevenue) * 100, 2);
                                const label = item.date || item._id || `#${idx + 1}`;
                                const shortLabel = typeof label === 'string' && label.includes('-')
                                    ? label.split('-').slice(1).join('/')
                                    : label;
                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 min-w-0 group">
                                        <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                            {formatVND(value)}
                                        </span>
                                        <div
                                            className="w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-md transition-all duration-300 hover:from-violet-700 hover:to-violet-500 cursor-pointer min-h-[4px]"
                                            style={{ height: `${height}%` }}
                                            title={`${shortLabel}: ${formatFullVND(value)}`}
                                        />
                                        <span className="text-[9px] text-gray-400 truncate w-full text-center">{shortLabel}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Movies */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-orange-500" /> {t('stat_top_movies')}
                        </h2>
                    </div>
                    <div className="p-6">
                        {topMovies.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">{t('stat_no_data')}</p>
                        ) : (
                            <div className="space-y-3">
                                {topMovies.map((movie, idx) => {
                                    const revenue = movie.totalRevenue || movie.revenue || 0;
                                    const maxRev = topMovies[0]?.totalRevenue || topMovies[0]?.revenue || 1;
                                    const width = Math.max((revenue / maxRev) * 100, 5);
                                    return (
                                        <div key={idx} className="flex items-center gap-3">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-gray-300 text-white' : idx === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                {idx + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{movie.title_vi || movie.title_en || movie.title || '—'}</p>
                                                <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                                                    <div className="bg-gradient-to-r from-violet-500 to-violet-400 h-2 rounded-full transition-all" style={{ width: `${width}%` }} />
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-gray-700 flex-shrink-0">{formatVND(revenue)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Revenue by Complex */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-pink-500" /> {t('stat_revenue_by_complex')}
                        </h2>
                    </div>
                    <div className="p-6">
                        {revenueByComplex.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">{t('stat_no_data')}</p>
                        ) : (
                            <div className="space-y-3">
                                {revenueByComplex.map((complex, idx) => {
                                    const revenue = complex.totalRevenue || complex.revenue || 0;
                                    const maxRev = revenueByComplex[0]?.totalRevenue || revenueByComplex[0]?.revenue || 1;
                                    const width = Math.max((revenue / maxRev) * 100, 5);
                                    const colors = ['from-pink-500 to-pink-400', 'from-blue-500 to-blue-400', 'from-green-500 to-green-400', 'from-orange-500 to-orange-400', 'from-violet-500 to-violet-400'];
                                    return (
                                        <div key={idx} className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colors[idx % colors.length]} flex-shrink-0`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{complex.name || complex.complexName || '—'}</p>
                                                <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                                                    <div className={`bg-gradient-to-r ${colors[idx % colors.length]} h-2 rounded-full transition-all`} style={{ width: `${width}%` }} />
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-gray-700 flex-shrink-0">{formatVND(revenue)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
