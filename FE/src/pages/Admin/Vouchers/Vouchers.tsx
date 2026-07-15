import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Building2 } from 'lucide-react';
import { useLanguage } from '../../../contextAPI/LanguageContext';
import toast from 'react-hot-toast';
import {
    getVouchersPublicApi,
    createVoucherApi,
    updateVoucherApi,
    deleteVoucherApi,
    getCinemaComplexesApi,
} from '../../../axios/admin';
import type { Voucher, CinemaComplex } from '../../../axios/admin';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import useStaffComplex from '../../../hooks/useStaffComplex';

export default function VouchersManagement() {
    const { t } = useLanguage();
    const { isStaff, complexId, ready: staffReady } = useStaffComplex();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [complexes, setComplexes] = useState<CinemaComplex[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Voucher | null>(null);
    const [saving, setSaving] = useState(false);

    // Delete
    const [deleteTarget, setDeleteTarget] = useState<Voucher | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Form
    const [form, setForm] = useState({
        code: '',
        discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
        discountValue: '',
        maxDiscount: '',
        minPurchase: '',
        startDate: '',
        endDate: '',
        usageLimit: '',
        cinemaComplexId: '',
        isBroadcast: false,
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Staff chỉ xem voucher của cụm rạp mình + toàn quốc
            const params = isStaff && complexId ? complexId : undefined;
            const [vRes, cRes] = await Promise.all([
                getVouchersPublicApi(params),
                getCinemaComplexesApi(),
            ]);
            setVouchers(vRes.data || []);
            setComplexes(cRes.data || []);
        } catch {
            toast.error(t('vou_fetch_error'));
        } finally {
            setLoading(false);
        }
    }, [isStaff, complexId, t]);

    useEffect(() => { if (staffReady) fetchData(); }, [fetchData, staffReady]);

    // Khi staff context ready, set cinemaComplexId mặc định cho form
    useEffect(() => {
        if (staffReady && isStaff && complexId) {
            setForm(prev => ({ ...prev, cinemaComplexId: complexId }));
        }
    }, [staffReady, isStaff, complexId]);

    const resetForm = () => setForm({
        code: '', discountType: 'PERCENTAGE', discountValue: '', maxDiscount: '',
        minPurchase: '', startDate: '', endDate: '', usageLimit: '',
        cinemaComplexId: isStaff ? complexId : '',
        isBroadcast: false,
    });

    const openCreate = () => { setEditing(null); resetForm(); setModalOpen(true); };

    const openEdit = (v: Voucher) => {
        setEditing(v);
        setForm({
            code: v.code,
            discountType: v.discountType,
            discountValue: String(v.discountValue),
            maxDiscount: v.maxDiscount != null ? String(v.maxDiscount) : '',
            minPurchase: v.minPurchase != null ? String(v.minPurchase) : '',
            startDate: v.startDate ? formatDateForInput(v.startDate) : '',
            endDate: v.endDate ? formatDateForInput(v.endDate) : '',
            usageLimit: v.usageLimit != null ? String(v.usageLimit) : '',
            cinemaComplexId: isStaff ? complexId : (v.cinemaComplexId || ''),
            isBroadcast: v.isBroadcast || false,
        });
        setModalOpen(true);
    };

    const formatDateForInput = (dateStr: string) => {
        if (dateStr.includes('/')) {
            const [d, m, y] = dateStr.split('/');
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        return dateStr.split('T')[0];
    };

    const formatDateForApi = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.code || !form.discountValue || !form.startDate || !form.endDate) {
            toast.error(t('vou_form_required'));
            return;
        }
        setSaving(true);
        try {
            if (editing) {
                await updateVoucherApi(editing.voucherId, {
                    discountValue: Number(form.discountValue),
                    maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
                    minPurchase: form.minPurchase ? Number(form.minPurchase) : undefined,
                    startDate: formatDateForApi(form.startDate),
                    endDate: formatDateForApi(form.endDate),
                    usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
                });
                toast.success(t('vou_update_success'));
            } else {
                await createVoucherApi({
                    code: form.code.toUpperCase(),
                    discountType: form.discountType,
                    discountValue: Number(form.discountValue),
                    maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
                    minPurchase: form.minPurchase ? Number(form.minPurchase) : undefined,
                    startDate: formatDateForApi(form.startDate),
                    endDate: formatDateForApi(form.endDate),
                    usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
                    cinemaComplexId: form.cinemaComplexId || undefined,
                    isBroadcast: form.isBroadcast,
                });
                toast.success(t('vou_create_success'));
            }
            setModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || t('vou_fetch_error'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteVoucherApi(deleteTarget.voucherId);
            toast.success(t('vou_delete_success'));
            setDeleteTarget(null);
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || t('vou_fetch_error'));
        } finally {
            setDeleting(false);
        }
    };

    const isExpired = (endDate: string) => {
        try {
            let d: Date;
            if (endDate.includes('/')) {
                const [day, month, year] = endDate.split('/');
                d = new Date(`${year}-${month}-${day}`);
            } else {
                d = new Date(endDate);
            }
            return d < new Date();
        } catch { return false; }
    };

    const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + '₫';

    const filteredVouchers = search
        ? vouchers.filter(v => v.code.toLowerCase().includes(search.toLowerCase()))
        : vouchers;

    // Tìm tên cụm rạp cho staff
    const staffComplexName = complexes.find(c => c.cinemaComplexId === complexId)?.name || '';

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('vou_title')}</h1>
                    <p className="text-gray-500 mt-1">{t('vou_subtitle')}</p>
                    {isStaff && staffComplexName && (
                        <p className="text-sm text-violet-600 font-medium mt-1 flex items-center gap-1.5">
                            <Building2 className="w-4 h-4" />
                            {t('vou_staff_scope')} {staffComplexName}
                        </p>
                    )}
                </div>
                <button onClick={openCreate} disabled={isStaff && !complexId} className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    <Plus className="w-4 h-4" /> {t('vou_add')}
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('vou_search')} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-left">
                                <th className="px-4 py-3 font-medium text-gray-500">{t('vou_code')}</th>
                                <th className="px-4 py-3 font-medium text-gray-500">{t('vou_type')}</th>
                                <th className="px-4 py-3 font-medium text-gray-500">{t('vou_value')}</th>
                                <th className="px-4 py-3 font-medium text-gray-500">{t('vou_max_discount')}</th>
                                <th className="px-4 py-3 font-medium text-gray-500">{t('vou_validity')}</th>
                                <th className="px-4 py-3 font-medium text-gray-500">{t('vou_used')}</th>
                                <th className="px-4 py-3 font-medium text-gray-500">{t('vou_status')}</th>
                                <th className="px-4 py-3 font-medium text-gray-500 text-right">{t('vou_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">{t('vou_loading')}</td></tr>
                            ) : filteredVouchers.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">{t('vou_none')}</td></tr>
                            ) : (
                                filteredVouchers.map((v) => (
                                    <tr key={v.voucherId} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="font-mono font-bold text-violet-700 bg-violet-50 px-2 py-1 rounded">{v.code}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.discountType === 'PERCENTAGE' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                {v.discountType === 'PERCENTAGE' ? t('vou_type_percent') : t('vou_type_fixed')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-medium">
                                            {v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : formatVND(v.discountValue)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {v.maxDiscount ? formatVND(v.maxDiscount) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 text-xs">
                                            {v.startDate || '—'} → {v.endDate || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {v.usedCount || 0}/{v.usageLimit || '∞'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isExpired(v.endDate)
                                                ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{t('vou_expired')}</span>
                                                : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{t('vou_active')}</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(v)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-violet-600 transition-colors" title={t('vou_save')}>
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setDeleteTarget(v)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors" title={t('vou_delete_btn')}>
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('vou_edit_title') : t('vou_create_title')} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('vou_code_label')}</label>
                            <input
                                type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                disabled={!!editing} placeholder={t('vou_code_placeholder')}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('vou_type_label')}</label>
                            <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as any })}
                                disabled={!!editing}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-gray-50">
                                <option value="PERCENTAGE">{t('vou_type_percent')}</option>
                                <option value="FIXED">{t('vou_type_fixed')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('vou_value_label')}</label>
                            <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                                placeholder={form.discountType === 'PERCENTAGE' ? '50' : '50000'}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('vou_max_label')}</label>
                            <input type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                                placeholder="100000"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('vou_min_label')}</label>
                            <input type="number" value={form.minPurchase} onChange={(e) => setForm({ ...form, minPurchase: e.target.value })}
                                placeholder="200000"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('vou_limit_label')}</label>
                            <input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                                placeholder={t('vou_limit_placeholder')}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('vou_start_label')}</label>
                            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('vou_end_label')}</label>
                            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        </div>
                    </div>

                    {!editing && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('vou_complex_label')} {isStaff && <span className="text-violet-600 text-xs font-medium">{t('vou_staff_complex_hint')}</span>}
                                </label>
                                {isStaff ? (
                                    <div className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600 flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-violet-500" />
                                        {staffComplexName || t('vou_loading')}
                                    </div>
                                ) : (
                                    <select value={form.cinemaComplexId} onChange={(e) => setForm({ ...form, cinemaComplexId: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                                        <option value="">{t('vou_complex_default')}</option>
                                        {complexes.map(c => (
                                            <option key={c.cinemaComplexId} value={c.cinemaComplexId}>{c.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            {!isStaff && (
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.isBroadcast} onChange={(e) => setForm({ ...form, isBroadcast: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                                    <span className="text-sm text-gray-700">{t('vou_broadcast')}</span>
                                </label>
                            )}
                        </>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">{t('vou_cancel')}</button>
                        <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                            {saving && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                            {editing ? t('vou_save') : t('vou_create')}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
                title={t('vou_delete_title')}
                message={t('vou_delete_confirm', { code: deleteTarget?.code || '' })}
                confirmText={t('vou_delete_btn')} loading={deleting}
            />
        </div>
    );
}
