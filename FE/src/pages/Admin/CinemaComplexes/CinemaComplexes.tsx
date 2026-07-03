import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MapPin, Plus, Pencil, Trash2, Building2, Search } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useLanguage } from '../../../contextAPI/LanguageContext';
import {
    getCinemaSystemsApi,
    getCinemaComplexesApi,
    createCinemaComplexApi,
    updateCinemaComplexApi,
    deleteCinemaComplexApi,
    type CinemaSystem,
    type CinemaComplex,
} from '../../../axios/admin';

interface ComplexForm {
    name: string;
    address: string;
    cinemaSystemId: string;
}

const emptyForm: ComplexForm = { name: '', address: '', cinemaSystemId: '' };

export default function CinemaComplexes() {
    const { t } = useLanguage();
    const [systems, setSystems] = useState<CinemaSystem[]>([]);
    const [complexes, setComplexes] = useState<CinemaComplex[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterSystemId, setFilterSystemId] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<CinemaComplex | null>(null);
    const [form, setForm] = useState<ComplexForm>(emptyForm);
    const [saving, setSaving] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<CinemaComplex | null>(null);
    const [deleting, setDeleting] = useState(false);

    const loadSystems = async () => {
        try {
            const res = await getCinemaSystemsApi();
            setSystems(res.data || []);
        } catch {
            toast.error('Không tải được danh sách hệ thống rạp');
        }
    };

    const loadComplexes = async () => {
        setLoading(true);
        try {
            const res = await getCinemaComplexesApi(filterSystemId || undefined);
            setComplexes(res.data || []);
        } catch {
            toast.error('Không tải được danh sách cụm rạp');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSystems();
    }, []);

    useEffect(() => {
        loadComplexes();
    }, [filterSystemId]);

    const openCreate = () => {
        setEditing(null);
        setForm({ ...emptyForm, cinemaSystemId: filterSystemId || systems[0]?.cinemaSystemId || '' });
        setModalOpen(true);
    };

    const openEdit = (item: CinemaComplex) => {
        setEditing(item);
        setForm({
            name: item.name || '',
            address: item.address || '',
            cinemaSystemId: item.cinemaSystemId || '',
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Vui lòng nhập tên cụm rạp');
            return;
        }
        if (!form.cinemaSystemId) {
            toast.error('Vui lòng chọn hệ thống rạp');
            return;
        }
        setSaving(true);
        try {
            if (editing) {
                await updateCinemaComplexApi({
                    cinemaComplexId: editing.cinemaComplexId,
                    name: form.name.trim(),
                    address: form.address.trim(),
                    cinemaSystemId: form.cinemaSystemId,
                });
                toast.success('Cập nhật cụm rạp thành công');
            } else {
                await createCinemaComplexApi({
                    name: form.name.trim(),
                    address: form.address.trim(),
                    cinemaSystemId: form.cinemaSystemId,
                });
                toast.success('Thêm cụm rạp thành công');
            }
            setModalOpen(false);
            loadComplexes();
        } catch {
            toast.error('Lưu cụm rạp thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteCinemaComplexApi(deleteTarget.cinemaComplexId);
            toast.success('Đã xóa cụm rạp');
            setConfirmOpen(false);
            setDeleteTarget(null);
            loadComplexes();
        } catch {
            toast.error('Xóa cụm rạp thất bại');
        } finally {
            setDeleting(false);
        }
    };

    const systemName = (id: string | null) =>
        systems.find((s) => s.cinemaSystemId === id)?.name || '—';

    const filtered = complexes.filter(
        (c) =>
            !search.trim() ||
            (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (c.address || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('cpx_title')}</h1>
                    <p className="text-sm text-gray-500 mt-1">{t('cpx_subtitle')}</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors shadow-sm shadow-violet-300"
                >
                    <Plus className="w-4 h-4" />
                    Thêm cụm rạp
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-5">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('cpx_search')}
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                </div>
                <select
                    value={filterSystemId}
                    onChange={(e) => setFilterSystemId(e.target.value)}
                    className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                >
                    <option value="">Tất cả hệ thống</option>
                    {systems.map((s) => (
                        <option key={s.cinemaSystemId} value={s.cinemaSystemId}>
                            {s.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">Đang tải...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">{t('cpx_none')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50/50">
                                    <th className="px-6 py-3 font-medium">{t('cpx_col_name')}</th>
                                    <th className="px-6 py-3 font-medium">{t('cpx_col_address')}</th>
                                    <th className="px-6 py-3 font-medium">{t('adm_system_label')}</th>
                                    <th className="px-6 py-3 font-medium">{t('cpx_col_rooms')}</th>
                                    <th className="px-6 py-3 font-medium text-right">{t('adm_actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((item) => (
                                    <tr key={item.cinemaComplexId} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-gray-900">{item.name}</td>
                                        <td className="px-6 py-3 text-gray-600 max-w-xs truncate">{item.address || '—'}</td>
                                        <td className="px-6 py-3">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-medium">
                                                <Building2 className="w-3 h-3" />
                                                {systemName(item.cinemaSystemId)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-gray-600">{item.Cinemas?.length ?? 0}</td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => openEdit(item)}
                                                    className="p-2 rounded-lg text-gray-400 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                                                    title="Sửa"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setDeleteTarget(item);
                                                        setConfirmOpen(true);
                                                    }}
                                                    className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Chỉnh sửa cụm rạp' : 'Thêm cụm rạp'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Tên cụm rạp <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="VD: CGV Vincom Center"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ</label>
                        <input
                            type="text"
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            placeholder="VD: 72 Lê Thánh Tôn, Q.1, TP.HCM"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Hệ thống rạp <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.cinemaSystemId}
                            onChange={(e) => setForm({ ...form, cinemaSystemId: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                        >
                            <option value="">-- Chọn hệ thống --</option>
                            {systems.map((s) => (
                                <option key={s.cinemaSystemId} value={s.cinemaSystemId}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm mới'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Xóa cụm rạp"
                message={`Bạn có chắc muốn xóa cụm rạp "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                loading={deleting}
            />
        </div>
    );
}
