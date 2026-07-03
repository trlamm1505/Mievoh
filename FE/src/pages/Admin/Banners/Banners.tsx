import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Image as ImageIcon, Plus, Trash2, Upload, X } from 'lucide-react';
import {
    getBannersApi,
    createBannerApi,
    deleteBannerApi,
    getMoviesAdminApi,
    type Banner,
    type Movie,
} from '../../../axios/admin.tsx';
import Modal from '../components/Modal.tsx';
import ConfirmDialog from '../components/ConfirmDialog.tsx';
import resolveImageUrl from '../utils/imageUrl.ts';
import { useLanguage } from '../../../contextAPI/LanguageContext';

export default function Banners() {
    const { t } = useLanguage();
    const [banners, setBanners] = useState<Banner[]>([]);
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [movieId, setMovieId] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState('');

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [target, setTarget] = useState<Banner | null>(null);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const res = await getBannersApi();
            setBanners(res.data || []);
        } catch {
            toast.error('Không tải được danh sách banner');
        } finally {
            setLoading(false);
        }
    };

    const fetchMovies = async () => {
        try {
            const res = await getMoviesAdminApi({ page: 1, pageSize: 100 });
            setMovies(res.data?.data || []);
        } catch {
            // ignore — phim chỉ dùng để gắn vào banner
        }
    };

    useEffect(() => {
        fetchBanners();
        fetchMovies();
    }, []);

    const openCreate = () => {
        setMovieId('');
        setImageFile(null);
        setImagePreview('');
        setModalOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile) {
            toast.error('Vui lòng chọn ảnh banner');
            return;
        }
        if (!movieId) {
            toast.error('Vui lòng chọn phim cho banner');
            return;
        }
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('movieId', movieId);
            await createBannerApi(formData);
            toast.success('Đã thêm banner');
            setModalOpen(false);
            fetchBanners();
        } catch {
            toast.error('Lưu banner thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!target) return;
        setDeleting(true);
        try {
            await deleteBannerApi(target.bannerId);
            toast.success('Đã xóa banner');
            setConfirmOpen(false);
            setTarget(null);
            fetchBanners();
        } catch {
            toast.error('Xóa banner thất bại');
        } finally {
            setDeleting(false);
        }
    };

    const movieTitle = (id: string | null) => {
        if (!id) return null;
        const m = movies.find((mv) => mv.movieId === id);
        return m?.title_vi || m?.title_en || null;
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('ban_title')}</h1>
                    <p className="text-gray-500 mt-1">{t('ban_subtitle')}</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors shadow-sm shadow-violet-300"
                >
                    <Plus className="w-4 h-4" />
                    {t('ban_add')}
                </button>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : banners.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                    <ImageIcon className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-gray-500">{t('ban_none')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {banners.map((banner) => (
                        <div
                            key={banner.bannerId}
                            className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
                        >
                            <div className="aspect-video bg-gray-100 overflow-hidden">
                                {banner.imageUrl ? (
                                    <img
                                        src={resolveImageUrl(banner.imageUrl)}
                                        alt="banner"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon className="w-8 h-8 text-gray-300" />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-between px-4 py-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {movieTitle(banner.movieId) || 'Không gắn phim'}
                                    </p>
                                    <span
                                        className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${banner.isActive
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-500'
                                            }`}
                                    >
                                        {banner.isActive ? 'Đang hiển thị' : 'Ẩn'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        setTarget(banner);
                                        setConfirmOpen(true);
                                    }}
                                    className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                    title="Xóa"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Thêm banner" size="md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh banner *</label>
                        <div className="flex items-center gap-4">
                            <div className="w-40 aspect-video rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden relative">
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImageFile(null);
                                                setImagePreview('');
                                            }}
                                            className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </>
                                ) : (
                                    <ImageIcon className="w-7 h-7 text-gray-300" />
                                )}
                            </div>
                            <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 cursor-pointer transition-colors">
                                <Upload className="w-4 h-4" />
                                Chọn ảnh
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gắn với phim *</label>
                        <select
                            value={movieId}
                            onChange={(e) => setMovieId(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        >
                            <option value="">-- Chọn phim --</option>
                            {movies.map((m) => (
                                <option key={m.movieId} value={m.movieId}>
                                    {m.title_vi || m.title_en || m.movieId}
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
                            {saving ? 'Đang lưu...' : 'Thêm banner'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Xóa banner"
                message="Bạn có chắc muốn xóa banner này?"
                confirmText="Xóa"
                loading={deleting}
            />
        </div>
    );
}
