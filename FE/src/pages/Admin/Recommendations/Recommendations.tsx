import { useEffect, useState, useCallback } from 'react';
import { Play, Trash2, Plus, Clock, Mail, Brain, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    triggerAnalysisApi,
    triggerEmailApi,
    configCronApi,
    deleteCronApi,
    getCronJobsApi,
    getCampaignStatsApi,
} from '../../../axios/admin';
import Modal from '../components/Modal';
import { useLanguage } from '../../../contextAPI/LanguageContext';
import ConfirmDialog from '../components/ConfirmDialog';

function parseVietnameseNaturalLanguageToCron(input: string): string {
    const clean = input.toLowerCase().trim()
        .replace(/\s+/g, ' ')
        .replace(/h/g, ' ')
        .replace(/:/g, ' ')
        .trim();

    // 1. Every hour
    if (clean === "mỗi giờ" || clean === "hàng giờ" || clean === "hang gio" || clean === "moi gio" || clean === "hằng giờ") {
        return "0 * * * *";
    }

    // 2. Every minute
    if (clean === "mỗi phút" || clean === "hàng phút" || clean === "hang phut" || clean === "moi phut" || clean === "hằng phút") {
        return "* * * * *";
    }

    // 3. Every X minutes
    let match = clean.match(/(?:mỗi|hàng|hằng|moi|hang)\s+(\d+)\s*(?:phút|phut)/);
    if (match) {
        return `*/${match[1]} * * * *`;
    }

    // 4. "mỗi ngày lúc X giờ"
    match = clean.match(/(?:mỗi ngày|hàng ngày|hằng ngày|moi ngay|hang ngay)\s*(?:lúc|luc)?\s*(\d+)(?:\s+(\d+))?/);
    if (match) {
        const hour = parseInt(match[1]);
        const minute = match[2] ? parseInt(match[2]) : 0;
        if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
            return `${minute} ${hour} * * *`;
        }
    }

    // 5. "hàng tuần lúc X giờ vào thứ Y"
    let dayOfWeek = "";
    if (clean.includes("chủ nhật") || clean.includes("chu nhat") || clean.includes("cn")) dayOfWeek = "0";
    else if (clean.includes("thứ hai") || clean.includes("thu hai") || clean.includes("t2") || clean.includes("thứ 2")) dayOfWeek = "1";
    else if (clean.includes("thứ ba") || clean.includes("thu ba") || clean.includes("t3") || clean.includes("thứ 3")) dayOfWeek = "2";
    else if (clean.includes("thứ tư") || clean.includes("thu tu") || clean.includes("t4") || clean.includes("thứ 4")) dayOfWeek = "3";
    else if (clean.includes("thứ năm") || clean.includes("thu nam") || clean.includes("t5") || clean.includes("thứ 5")) dayOfWeek = "4";
    else if (clean.includes("thứ sáu") || clean.includes("thu sau") || clean.includes("t6") || clean.includes("thứ 6")) dayOfWeek = "5";
    else if (clean.includes("thứ bảy") || clean.includes("thu bay") || clean.includes("t7") || clean.includes("thứ 7")) dayOfWeek = "6";

    if (dayOfWeek !== "") {
        const timeMatch = clean.match(/(?:lúc|luc)\s*(\d+)(?:\s+(\d+))?/);
        if (timeMatch) {
            const hour = parseInt(timeMatch[1]);
            const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
            if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
                return `${minute} ${hour} * * ${dayOfWeek}`;
            }
        }
    }

    // 6. "hàng tháng vào ngày X lúc Y giờ"
    match = clean.match(/(?:mỗi tháng|hàng tháng|hằng tháng|moi thang|hang thang)\s*(?:vào ngày|vao ngay)?\s*(\d+)\s*(?:lúc|luc)?\s*(\d+)(?:\s+(\d+))?/);
    if (match) {
        const dayOfMonth = parseInt(match[1]);
        const hour = parseInt(match[2]);
        const minute = match[3] ? parseInt(match[3]) : 0;
        if (dayOfMonth >= 1 && dayOfMonth <= 31 && hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
            return `${minute} ${hour} ${dayOfMonth} * *`;
        }
    }

    // 7. Simple time
    const simpleTime = clean.match(/^(?:lúc\s+)?(\d+)(?:\s+(\d+))?$/);
    if (simpleTime) {
        const hour = parseInt(simpleTime[1]);
        const minute = simpleTime[2] ? parseInt(simpleTime[2]) : 0;
        if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
            return `${minute} ${hour} * * *`;
        }
    }

    return "";
}

export default function RecommendationsManagement() {
    const { t } = useLanguage();
    const [cronJobs, setCronJobs] = useState<any[]>([]);
    const [campaignStats, setCampaignStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [triggeringAnalysis, setTriggeringAnalysis] = useState(false);
    const [triggeringEmail, setTriggeringEmail] = useState(false);

    // Cron Modal
    const [cronModalOpen, setCronModalOpen] = useState(false);
    const [savingCron, setSavingCron] = useState(false);
    const [cronForm, setCronForm] = useState({
        type: 'email' as 'email' | 'analysis',
        cronExpression: '',
        name: '',
    });

    const [freqType, setFreqType] = useState('daily');
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [selectedHour, setSelectedHour] = useState(8);
    const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([0]); // 0 = Sunday, 1 = Monday, etc.
    const [selectedDayOfMonth, setSelectedDayOfMonth] = useState(1);
    const [naturalInput, setNaturalInput] = useState('');
    const [customCronInput, setCustomCronInput] = useState('0 8 * * *');

    const getCronExpression = () => {
        if (freqType === 'hourly') {
            return `${selectedMinute} * * * *`;
        }
        if (freqType === 'daily') {
            return `${selectedMinute} ${selectedHour} * * *`;
        }
        if (freqType === 'weekly') {
            const days = selectedDaysOfWeek.length > 0 ? selectedDaysOfWeek.join(',') : '*';
            return `${selectedMinute} ${selectedHour} * * ${days}`;
        }
        if (freqType === 'monthly') {
            return `${selectedMinute} ${selectedHour} ${selectedDayOfMonth} * *`;
        }
        if (freqType === 'custom_natural') {
            return parseVietnameseNaturalLanguageToCron(naturalInput);
        }
        return customCronInput;
    };

    // Delete Cron
    const [deleteCronTarget, setDeleteCronTarget] = useState<any>(null);
    const [deletingCron, setDeletingCron] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [cronsRes, statsRes] = await Promise.all([
                getCronJobsApi(),
                getCampaignStatsApi(),
            ]);
            const cronsData = cronsRes.data;
            if (cronsData && (cronsData.emailCron || cronsData.analysisCron)) {
                const emailCrons = (cronsData.emailCron || []).map((c: any) => ({ ...c, type: 'email' }));
                const analysisCrons = (cronsData.analysisCron || []).map((c: any) => ({ ...c, type: 'analysis' }));
                setCronJobs([...emailCrons, ...analysisCrons]);
            } else {
                setCronJobs(Array.isArray(cronsData) ? cronsData : (Array.isArray(cronsData?.data) ? cronsData.data : []));
            }
            setCampaignStats(statsRes.data);
        } catch {
            // Silently fail, data might not be available
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleTriggerAnalysis = async () => {
        setTriggeringAnalysis(true);
        try {
            await triggerAnalysisApi();
            toast.success('Đã kích hoạt phân tích Recommend System');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể kích hoạt');
        } finally {
            setTriggeringAnalysis(false);
        }
    };

    const handleTriggerEmail = async () => {
        setTriggeringEmail(true);
        try {
            await triggerEmailApi();
            toast.success('Đã kích hoạt gửi Email Marketing');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể kích hoạt');
        } finally {
            setTriggeringEmail(false);
        }
    };

    const handleCreateCron = async (e: React.FormEvent) => {
        e.preventDefault();
        const cronExpr = getCronExpression();
        if (!cronExpr) {
            toast.error('Vui lòng chọn hoặc nhập biểu thức thời gian hợp lệ');
            return;
        }
        setSavingCron(true);
        try {
            await configCronApi({
                type: cronForm.type,
                cronExpression: cronExpr,
                name: cronForm.name || undefined,
            });
            toast.success('Tạo CronJob thành công');
            setCronModalOpen(false);
            setCronForm({ type: 'email', cronExpression: '', name: '' });
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setSavingCron(false);
        }
    };

    const handleDeleteCron = async () => {
        if (!deleteCronTarget) return;
        setDeletingCron(true);
        try {
            await deleteCronApi({ repeatKey: deleteCronTarget.key || deleteCronTarget.repeatKey || deleteCronTarget.name });
            toast.success('Xóa CronJob thành công');
            setDeleteCronTarget(null);
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể xóa');
        } finally {
            setDeletingCron(false);
        }
    };

    const statCards = campaignStats ? [
        { label: t('rec_emails_sent'), value: campaignStats.totalSent ?? campaignStats.total ?? '—', icon: Mail, color: 'bg-blue-100 text-blue-600' },
    ] : [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('rec_title')}</h1>
                <p className="text-gray-500 mt-1">{t('rec_subtitle')}</p>
            </div>

            {/* Force Run Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{t('rec_analysis_title')}</h3>
                            <p className="text-xs text-gray-500">{t('rec_analysis_desc')}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleTriggerAnalysis}
                        disabled={triggeringAnalysis}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        {triggeringAnalysis ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        {triggeringAnalysis ? t('rec_running') : t('rec_force_analysis')}
                    </button>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{t('rec_email_title')}</h3>
                            <p className="text-xs text-gray-500">{t('rec_email_desc')}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleTriggerEmail}
                        disabled={triggeringEmail}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        {triggeringEmail ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        {triggeringEmail ? t('rec_sending') : t('rec_force_email')}
                    </button>
                </div>
            </div>

            {/* Campaign Stats */}
            {campaignStats && statCards.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">{t('rec_campaign_stats')}</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {statCards.map((card) => (
                            <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500">{card.label}</p>
                                        <p className="text-xl font-bold text-gray-900 mt-1">{card.value}</p>
                                    </div>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                                        <card.icon className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Cron Jobs */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">{t('rec_active_cron')}</h2>
                    <button
                        onClick={() => {
                            setCronForm({ type: 'email', cronExpression: '', name: '' });
                            setFreqType('daily');
                            setSelectedMinute(0);
                            setSelectedHour(8);
                            setSelectedDaysOfWeek([0]);
                            setSelectedDayOfMonth(1);
                            setNaturalInput('');
                            setCustomCronInput('0 8 * * *');
                            setCronModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" /> {t('rec_add_cron')}
                    </button>
                </div>
                <div className="p-6">
                    {loading ? (
                        <p className="text-center text-gray-400 py-8">{t('adm_loading')}</p>
                    ) : cronJobs.length === 0 ? (
                        <div className="text-center py-8">
                            <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400">{t('rec_no_cron')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cronJobs.map((cron, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cron.type === 'email' ? 'bg-blue-100' : 'bg-violet-100'}`}>
                                            {cron.type === 'email' ? <Mail className="w-4 h-4 text-blue-600" /> : <Brain className="w-4 h-4 text-violet-600" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{cron.name || cron.key || `CronJob #${idx + 1}`}</p>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
                                                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{cron.cronExpression || cron.pattern || '—'}</span>
                                                <span className="capitalize">{cron.type || '—'}</span>
                                                {cron.nextExecution && (
                                                    <span className="text-gray-400">
                                                        • {t('rec_next_run')}: {new Date(cron.nextExecution).toLocaleString('vi-VN')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setDeleteCronTarget(cron)}
                                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Cron Modal */}
            <Modal isOpen={cronModalOpen} onClose={() => setCronModalOpen(false)} title={t('rec_create_cron')} size="md">
                <form onSubmit={handleCreateCron} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('rec_cron_type')} *</label>
                        <select value={cronForm.type} onChange={(e) => setCronForm({ ...cronForm, type: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                            <option value="email">Email Marketing</option>
                            <option value="analysis">{t('rec_cron_type_analysis')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chu kỳ hoạt động *</label>
                        <select value={freqType} onChange={(e) => setFreqType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 mb-3">
                            <option value="hourly">Hằng giờ</option>
                            <option value="daily">Hằng ngày</option>
                            <option value="weekly">Hằng tuần</option>
                            <option value="monthly">Hằng tháng</option>
                            <option value="custom_natural">Nhập ngôn ngữ tự nhiên (tiếng Việt)</option>
                            <option value="custom_cron">Nhập biểu thức Linux Cron trực tiếp</option>
                        </select>

                        {/* HOURLY: Select Minute */}
                        {freqType === 'hourly' && (
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Phút chạy mỗi giờ</label>
                                    <select value={selectedMinute} onChange={(e) => setSelectedMinute(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                                        {Array.from({ length: 60 }).map((_, i) => (
                                            <option key={i} value={i}>Phút thứ {i < 10 ? `0${i}` : i}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* DAILY: Select Hour & Minute */}
                        {freqType === 'daily' && (
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Giờ</label>
                                    <select value={selectedHour} onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                                        {Array.from({ length: 24 }).map((_, i) => (
                                            <option key={i} value={i}>{i < 10 ? `0${i}` : i}:00</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Phút</label>
                                    <select value={selectedMinute} onChange={(e) => setSelectedMinute(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                                        {Array.from({ length: 60 }).map((_, i) => (
                                            <option key={i} value={i}>Phút thứ {i < 10 ? `0${i}` : i}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* WEEKLY: Select Days of Week & Time */}
                        {freqType === 'weekly' && (
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Chọn các ngày trong tuần</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { label: 'CN', val: 0 },
                                            { label: 'T2', val: 1 },
                                            { label: 'T3', val: 2 },
                                            { label: 'T4', val: 3 },
                                            { label: 'T5', val: 4 },
                                            { label: 'T6', val: 5 },
                                            { label: 'T7', val: 6 },
                                        ].map((day) => {
                                            const active = selectedDaysOfWeek.includes(day.val);
                                            return (
                                                <button
                                                    key={day.val}
                                                    type="button"
                                                    onClick={() => {
                                                        if (active) {
                                                            setSelectedDaysOfWeek(selectedDaysOfWeek.filter(d => d !== day.val));
                                                        } else {
                                                            setSelectedDaysOfWeek([...selectedDaysOfWeek, day.val].sort());
                                                        }
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                        active 
                                                            ? 'bg-violet-600 text-white shadow-sm' 
                                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {day.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Giờ</label>
                                        <select value={selectedHour} onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                                            {Array.from({ length: 24 }).map((_, i) => (
                                                <option key={i} value={i}>{i < 10 ? `0${i}` : i}:00</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Phút</label>
                                        <select value={selectedMinute} onChange={(e) => setSelectedMinute(parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                                            {Array.from({ length: 60 }).map((_, i) => (
                                                <option key={i} value={i}>Phút thứ {i < 10 ? `0${i}` : i}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MONTHLY: Select Day of Month & Time */}
                        {freqType === 'monthly' && (
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Ngày trong tháng</label>
                                        <select value={selectedDayOfMonth} onChange={(e) => setSelectedDayOfMonth(parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                                            {Array.from({ length: 31 }).map((_, i) => (
                                                <option key={i + 1} value={i + 1}>Ngày {i + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Giờ</label>
                                        <select value={selectedHour} onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                                            {Array.from({ length: 24 }).map((_, i) => (
                                                <option key={i} value={i}>{i < 10 ? `0${i}` : i}:00</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Phút</label>
                                        <select value={selectedMinute} onChange={(e) => setSelectedMinute(parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                                            {Array.from({ length: 60 }).map((_, i) => (
                                                <option key={i} value={i}>Phút thứ {i < 10 ? `0${i}` : i}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CUSTOM NATURAL: Free text input */}
                        {freqType === 'custom_natural' && (
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Mô tả chu kỳ (bằng tiếng Việt)</label>
                                <input type="text" value={naturalInput} onChange={(e) => setNaturalInput(e.target.value)}
                                    placeholder="Ví dụ: mỗi ngày lúc 14 giờ 30, hàng giờ, mỗi 15 phút, hàng tuần lúc 8 giờ thứ hai..."
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                                <p className="text-[10px] text-gray-400 mt-1">Hỗ trợ: "mỗi ngày lúc X giờ Y phút", "mỗi X phút", "hàng tuần lúc X giờ thứ Y", "mỗi giờ"</p>
                            </div>
                        )}

                        {/* CUSTOM CRON: Raw Cron expression */}
                        {freqType === 'custom_cron' && (
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Biểu thức Linux Cron</label>
                                <input type="text" value={customCronInput} onChange={(e) => setCustomCronInput(e.target.value)}
                                    placeholder="0 8 * * *" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-500" />
                                <p className="text-[10px] text-gray-400 mt-1">{t('rec_cron_expr_hint')}</p>
                            </div>
                        )}

                        {/* Real-time calculated cron preview */}
                        <div className="mt-3 bg-violet-50 border border-violet-100 rounded-lg p-2.5 text-xs text-violet-800">
                            <span className="font-semibold">Biểu thức Linux Cron truyền vào payload API: </span>
                            <code className="bg-white px-1.5 py-0.5 rounded font-mono ml-1 border border-violet-200">{getCronExpression() || '(Chưa thể nhận diện được)'}</code>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('rec_cron_name')}</label>
                        <input type="text" value={cronForm.name} onChange={(e) => setCronForm({ ...cronForm, name: e.target.value })}
                            placeholder="VD: chien_dich_mua_he" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={() => setCronModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">{t('adm_cancel')}</button>
                        <button type="submit" disabled={savingCron} className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                            {savingCron && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                            {t('rec_add_cron')}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteCronTarget} onClose={() => setDeleteCronTarget(null)} onConfirm={handleDeleteCron}
                title={t('rec_delete_cron')} message={`"${deleteCronTarget?.name || deleteCronTarget?.key}" — ${t('rec_delete_cron_msg')}`}
                confirmText={t('adm_delete')} loading={deletingCron}
            />
        </div>
    );
}
