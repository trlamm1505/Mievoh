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
            setCronJobs(Array.isArray(cronsData) ? cronsData : (Array.isArray(cronsData?.data) ? cronsData.data : []));
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
        if (!cronForm.cronExpression) {
            toast.error('Vui lòng nhập biểu thức Cron');
            return;
        }
        setSavingCron(true);
        try {
            await configCronApi({
                type: cronForm.type,
                cronExpression: cronForm.cronExpression,
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
                        onClick={() => { setCronForm({ type: 'email', cronExpression: '', name: '' }); setCronModalOpen(true); }}
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
                                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{cron.cronExpression || cron.pattern || '—'}</span>
                                                <span className="capitalize">{cron.type || '—'}</span>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('rec_cron_expr')} *</label>
                        <input type="text" value={cronForm.cronExpression} onChange={(e) => setCronForm({ ...cronForm, cronExpression: e.target.value })}
                            placeholder="0 8 * * *" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        <p className="text-xs text-gray-400 mt-1">{t('rec_cron_expr_hint')}</p>
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
