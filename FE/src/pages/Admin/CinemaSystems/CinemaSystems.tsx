import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Building2, Search } from 'lucide-react';
import {
    getCinemaSystemsApi,
    createCinemaSystemApi,
    updateCinemaSystemApi,
    deleteCinemaSystemApi,
    type CinemaSystem,
} from '../../../axios/admin';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { resolveImageUrl } from '../utils/imageUrl';
import { useLanguage } from '../../../contextAPI/LanguageContext';

interface FormState {
    name: string;
    logoFile: File | null;
    logoPreview: string;
}

const emptyForm: FormState = { name: '', logoFile: null, logoPreview: '' };

export default function CinemaSystems() {
    const { t } = useLanguage();
    const [systems, setSystems] = useState<CinemaSystem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<CinemaSystem | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [saving, setSaving] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [target, setTarget] = useState<CinemaSystem | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchSystems = async () => {
        setLoading(true);
        try {
            const res = await getCinemaSystemsApi();
            setSystems(res.data || []);
        } catch {
            toast.error('Không thể tải danh sách hệ thống rạp');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSystems();
    }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setModalOpen(true);
    };

    const openEdit = (sys: CinemaSystem) => {
        setEditing(sys);
        setForm({
            name: sys.name || '',
            logoFile: null,
            logoPreview: resolveImageUrl(sys.logo),
        });
        setModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setForm((f) => ({ ...f, logoFile: file, logoPreview: URL.createObjectURL(file) }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Vui lòng nhập tên hệ thống rạp');
            return;
        }
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('name', form.name.trim());
            if (form.logoFile) fd.append('logo', form.logoFile);

            if (editing) {
                fd.append('cinemaSystemId', editing.cinemaSystemId);
                await updateCinemaSystemApi(fd);
                toast.success('Cập nhật hệ thống rạp thành công');
            } else {
                await createCinemaSystemApi(fd);
                toast.success('Thêm hệ thống rạp thành công');
            }
            setModalOpen(false);
            fetchSystems();
        } catch {
            toast.error('Lưu hệ thống rạp thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!target) return;
        setDeleting(true);
        try {
            await deleteCinemaSystemApi(target.cinemaSystemId);
            toast.success('Xóa hệ thống rạp thành công');
            setConfirmOpen(false);
            setTarget(null);
            fetchSystems();
        } catch {
            toast.error('Xóa hệ thống rạp thất bại');
        } finally {
            setDeleting(false);
        }
    };

    const filtered = systems.filter((s) =>
        (s.name || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('sys_title')}</h1>
                    <p className="text-gray-500 text-sm mt-1">{t('sys_subtitle')}</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors shadow-sm shadow-violet-200"
                >
                    <Plus className="w-4 h-4" />
                    {t('sys_add')}
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('sys_search')}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p>{t('sys_none')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((sys) => (
                        <div
                            key={sys.cinemaSystemId}
                            className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-violet-200 transition-all"
                        >
                            <div className="flex items-center justify-center h-24 mb-4 bg-gray-50 rounded-xl overflow-hidden">
                                {sys.logo ? (
                                    <img
                                        src={resolveImageUrl(sys.logo)}
                                        alt={sys.name || ''}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                ) : (
                                    <Building2 className="w-10 h-10 text-gray-300" />
                                )}
                            </div>
                            <h3 className="font-semibold text-gray-900 text-center truncate mb-1">{sys.name}</h3>
                            <p className="text-xs text-gray-400 text-center mb-4">
                                {sys.CinemaComplexes?.length ?? 0} cụm rạp
                            </p>
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => openEdit(sys)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Sửa
                                </button>
                                <button
                                    onClick={() => {
                                        setTarget(sys);
                                        setConfirmOpen(true);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Xóa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Cập nhật hệ thống rạp' : 'Thêm hệ thống rạp'}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Tên hệ thống <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            placeholder="VD: CGV, Lotte Cinema..."
                            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Logo</label>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-20 h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                                {form.logoPreview ? (
                                    <img src={form.logoPreview} alt="preview" className="max-h-full max-w-full object-contain" />
                                ) : (
                                    <Building2 className="w-8 h-8 text-gray-300" />
                                )}
                            </div>
                            <label className="flex-1 cursor-pointer">
                                <div className="px-4 py-2.5 text-sm text-center text-violet-600 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors font-medium">
                                    Chọn ảnh logo
                                </div>
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setModalOpen(false)}
                            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm mới'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirm */}
            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Xóa hệ thống rạp"
                message={`Bạn có chắc muốn xóa hệ thống rạp "${target?.name}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                loading={deleting}
            />
        </div>
    );
}
