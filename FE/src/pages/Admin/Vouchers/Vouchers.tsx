import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
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

export default function VouchersManagement() {
    const { t } = useLanguage();
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
            const [vRes, cRes] = await Promise.all([
                getVouchersPublicApi(),
                getCinemaComplexesApi(),
            ]);
            setVouchers(vRes.data || []);
            setComplexes(cRes.data || []);
        } catch {
            toast.error('Không thể tải danh sách mã giảm giá');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const resetForm = () => setForm({
        code: '', discountType: 'PERCENTAGE', discountValue: '', maxDiscount: '',
        minPurchase: '', startDate: '', endDate: '', usageLimit: '', cinemaComplexId: '', isBroadcast: false,
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
            cinemaComplexId: v.cinemaComplexId || '',
            isBroadcast: v.isBroadcast || false,
        });
        setModalOpen(true);
    };

    const formatDateForInput = (dateStr: string) => {
        // Support DD/MM/YYYY or ISO format
        if (dateStr.includes('/')) {
            const [d, m, y] = dateStr.split('/');
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        return dateStr.split('T')[0];
    };

    const formatDateForApi = (dateStr: string) => {
        // Convert YYYY-MM-DD to DD/MM/YYYY for API
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.code || !form.discountValue || !form.startDate || !form.endDate) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }
        setSaving(true);
        try {
            if (editing) {
                await updateVoucherApi(editing._id, {
                    discountValue: Number(form.discountValue),
                    maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
                    minPurchase: form.minPurchase ? Number(form.minPurchase) : undefined,
                    startDate: formatDateForApi(form.startDate),
                    endDate: formatDateForApi(form.endDate),
                    usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
                });
                toast.success('Cập nhật mã giảm giá thành công');
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
                toast.success('Tạo mã giảm giá thành công');
            }
            setModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteVoucherApi(deleteTarget._id);
            toast.success('Xóa mã giảm giá thành công');
            setDeleteTarget(null);
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể xóa');
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('vou_title')}</h1>
                    <p className="text-gray-500 mt-1">{t('vou_subtitle')}</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium text-sm shadow-sm">
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
                                <th className="px-4 py-3 font-medium text-gray-500">Mã</th>
                                <th className="px-4 py-3 font-medium text-gray-500">Loại</th>
                                <th className="px-4 py-3 font-medium text-gray-500">Giá trị</th>
                                <th className="px-4 py-3 font-medium text-gray-500">Giảm tối đa</th>
                                <th className="px-4 py-3 font-medium text-gray-500">Thời hạn</th>
                                <th className="px-4 py-3 font-medium text-gray-500">Đã dùng</th>
                                <th className="px-4 py-3 font-medium text-gray-500">Trạng thái</th>
                                <th className="px-4 py-3 font-medium text-gray-500 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">Đang tải...</td></tr>
                            ) : filteredVouchers.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">{t('vou_none')}</td></tr>
                            ) : (
                                filteredVouchers.map((v) => (
                                    <tr key={v._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="font-mono font-bold text-violet-700 bg-violet-50 px-2 py-1 rounded">{v.code}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.discountType === 'PERCENTAGE' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                {v.discountType === 'PERCENTAGE' ? 'Phần trăm' : 'Cố định'}
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
                                                ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Hết hạn</span>
                                                : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Đang áp dụng</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(v)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-violet-600 transition-colors" title="Chỉnh sửa">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setDeleteTarget(v)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors" title="Xóa">
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
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Cập nhật mã giảm giá' : 'Tạo mã giảm giá mới'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mã giảm giá *</label>
                            <input
                                type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                disabled={!!editing} placeholder="VD: SALE50"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm giá *</label>
                            <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as any })}
                                disabled={!!editing}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-gray-50">
                                <option value="PERCENTAGE">Phần trăm (%)</option>
                                <option value="FIXED">Cố định (VND)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị giảm *</label>
                            <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                                placeholder={form.discountType === 'PERCENTAGE' ? '50' : '50000'}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giảm tối đa (VND)</label>
                            <input type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                                placeholder="100000"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu (VND)</label>
                            <input type="number" value={form.minPurchase} onChange={(e) => setForm({ ...form, minPurchase: e.target.value })}
                                placeholder="200000"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn sử dụng</label>
                            <input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                                placeholder="Không giới hạn"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu *</label>
                            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc *</label>
                            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        </div>
                    </div>

                    {!editing && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cụm rạp áp dụng</label>
                                <select value={form.cinemaComplexId} onChange={(e) => setForm({ ...form, cinemaComplexId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                                    <option value="">Toàn quốc</option>
                                    {complexes.map(c => (
                                        <option key={c.cinemaComplexId} value={c.cinemaComplexId}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isBroadcast} onChange={(e) => setForm({ ...form, isBroadcast: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                                <span className="text-sm text-gray-700">Gửi thông báo Broadcast cho toàn hệ thống</span>
                            </label>
                        </>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Hủy</button>
                        <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                            {saving && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                            {editing ? 'Cập nhật' : 'Tạo mới'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
                title="Xóa mã giảm giá" message={`Bạn có chắc chắn muốn xóa mã "${deleteTarget?.code}"?`}
                confirmText="Xóa" loading={deleting}
            />
        </div>
    );
}
