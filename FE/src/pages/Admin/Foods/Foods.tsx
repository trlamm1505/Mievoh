import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Popcorn, Plus, Pencil, Trash2, Search, Building2, MapPin } from 'lucide-react';
import {
    getCinemaSystemsApi,
    getCinemaComplexesApi,
    getFoodsByComplexApi,
    createFoodApi,
    updateFoodApi,
    deleteFoodApi,
    type CinemaSystem,
    type CinemaComplex,
    type Food,
} from '../../../axios/admin';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import resolveImageUrl from '../utils/imageUrl';
import useStaffComplex from '../../../hooks/useStaffComplex';
import { useLanguage } from '../../../contextAPI/LanguageContext';

interface FoodForm {
    name: string;
    description: string;
    price: string;
    isActive: boolean;
    imageFile: File | null;
    imagePreview: string;
}

const emptyForm: FoodForm = {
    name: '',
    description: '',
    price: '',
    isActive: true,
    imageFile: null,
    imagePreview: '',
};

export default function FoodsPage() {
    const { t } = useLanguage();
    // Staff bị khóa vào cụm rạp được phân công; admin được tự chọn.
    const { isStaff, complexId: staffComplexId, complex: staffComplex, ready: staffReady } = useStaffComplex();

    const [systems, setSystems] = useState<CinemaSystem[]>([]);
    const [complexes, setComplexes] = useState<CinemaComplex[]>([]);
    const [systemId, setSystemId] = useState('');
    const [complexId, setComplexId] = useState('');

    const [foods, setFoods] = useState<Food[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Food | null>(null);
    const [form, setForm] = useState<FoodForm>(emptyForm);
    const [saving, setSaving] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<Food | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Admin: load hệ thống để chọn. Staff: bỏ qua.
    useEffect(() => {
        if (!staffReady || isStaff) return;
        getCinemaSystemsApi().then((r) => setSystems(r.data || [])).catch(() => { });
    }, [staffReady, isStaff]);

    // Staff: khóa luôn vào cụm rạp được phân công.
    useEffect(() => {
        if (!staffReady || !isStaff) return;
        if (staffComplexId) setComplexId(staffComplexId);
    }, [staffReady, isStaff, staffComplexId]);

    // Admin: load cụm rạp khi đổi hệ thống.
    useEffect(() => {
        if (isStaff) return;
        setComplexId('');
        setFoods([]);
        if (!systemId) { setComplexes([]); return; }
        getCinemaComplexesApi(systemId).then((r) => setComplexes(r.data || [])).catch(() => { });
    }, [systemId, isStaff]);

    useEffect(() => {
        if (!complexId) { setFoods([]); return; }
        loadFoods();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [complexId]);

    const loadFoods = async () => {
        if (!complexId) return;
        setLoading(true);
        try {
            const res = await getFoodsByComplexApi(complexId);
            setFoods(res.data || []);
        } catch {
            toast.error('Không tải được menu đồ ăn');
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setModalOpen(true);
    };

    const openEdit = (food: Food) => {
        setEditing(food);
        setForm({
            name: food.name,
            description: food.description || '',
            price: food.price.toString(),
            isActive: food.isActive,
            imageFile: null,
            imagePreview: resolveImageUrl(food.imageUrl),
        });
        setModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setForm((f) => ({ ...f, imageFile: file, imagePreview: URL.createObjectURL(file) }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) { toast.error('Vui lòng nhập tên'); return; }
        if (!form.price || Number(form.price) <= 0) { toast.error('Vui lòng nhập giá hợp lệ'); return; }

        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('name', form.name.trim());
            fd.append('description', form.description.trim());
            fd.append('price', form.price);
            fd.append('isActive', String(form.isActive));
            fd.append('cinemaComplexId', complexId);
            if (form.imageFile) fd.append('image', form.imageFile);

            if (editing) {
                await updateFoodApi(editing.foodId, fd);
                toast.success('Cập nhật thành công');
            } else {
                await createFoodApi(fd);
                toast.success('Thêm món thành công');
            }
            setModalOpen(false);
            loadFoods();
        } catch {
            toast.error('Lưu thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteFoodApi(deleteTarget.foodId);
            toast.success('Đã xóa');
            setDeleteTarget(null);
            loadFoods();
        } catch {
            toast.error('Xóa thất bại');
        } finally {
            setDeleting(false);
        }
    };

    const filtered = foods.filter(
        (f) => !search || f.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('food_title')}</h1>
                <p className="text-gray-500 mt-1">
                    {isStaff ? t('food_subtitle_staff') : t('food_subtitle_admin')}
                </p>
            </div>

            {/* Filters: admin chọn hệ thống/cụm rạp; staff bị khóa vào cụm rạp được phân công */}
            {isStaff ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-violet-50 text-violet-600 shrink-0">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{t('adm_assigned_complex')}</p>
                            <p className="font-semibold text-gray-900">
                                {staffComplex?.name || (staffReady ? t('adm_not_assigned') : t('adm_loading'))}
                            </p>
                            {staffComplex?.address && (
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3" />
                                    {staffComplex.address}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('adm_system_label')}</label>
                            <select
                                value={systemId}
                                onChange={(e) => setSystemId(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
                            >
                                <option value="">{t('adm_select_system')}</option>
                                {systems.map((s) => (
                                    <option key={s.cinemaSystemId} value={s.cinemaSystemId}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('adm_complex_label')}</label>
                            <select
                                value={complexId}
                                onChange={(e) => setComplexId(e.target.value)}
                                disabled={!systemId}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                            >
                                <option value="">{t('adm_select_complex')}</option>
                                {complexes.map((c) => (
                                    <option key={c.cinemaComplexId} value={c.cinemaComplexId}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            {complexId && (
                <div>
                    {/* Search + Add */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t('food_search')}
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                            />
                        </div>
                        <button
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> {t('food_add')}
                        </button>
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div className="p-10 text-center text-gray-400">{t('adm_loading')}</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">
                            <Popcorn className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                            {t('food_none')}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filtered.map((food) => (
                                <div
                                    key={food.foodId}
                                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-violet-200 transition-all"
                                >
                                    <div className="h-36 bg-gray-50 flex items-center justify-center overflow-hidden">
                                        {food.imageUrl ? (
                                            <img
                                                src={resolveImageUrl(food.imageUrl)}
                                                alt={food.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Popcorn className="w-10 h-10 text-gray-300" />
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-1">
                                            <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">{food.name}</h3>
                                            <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${food.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {food.isActive ? 'Hoạt động' : 'Ẩn'}
                                            </span>
                                        </div>
                                        {food.description && (
                                            <p className="text-xs text-gray-400 mb-2 line-clamp-2">{food.description}</p>
                                        )}
                                        <p className="text-sm font-bold text-violet-600 mb-3">
                                            {food.price.toLocaleString('vi-VN')}đ
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEdit(food)}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" /> Sửa
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(food)}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> Xóa
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Cập nhật món' : 'Thêm món mới'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Tên món <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="VD: Combo bỏng nước"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={2}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none resize-none"
                            placeholder="Mô tả ngắn về sản phẩm..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Giá (VNĐ) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                placeholder="50000"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái</label>
                            <select
                                value={String(form.isActive)}
                                onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
                            >
                                <option value="true">Hoạt động</option>
                                <option value="false">Ẩn</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Ảnh</label>
                        <div className="flex items-center gap-4">
                            {form.imagePreview && (
                                <img src={form.imagePreview} alt="preview" className="w-16 h-16 rounded-lg object-cover border" />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
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
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Xóa món"
                message={`Bạn có chắc muốn xóa "${deleteTarget?.name}"?`}
                confirmText="Xóa"
                loading={deleting}
            />
        </div>
    );
}
