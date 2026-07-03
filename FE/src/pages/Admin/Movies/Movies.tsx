import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Eye, Film } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    getMoviesAdminApi,
    createMovieApi,
    updateMovieApi,
    deleteMovieApi,
    getReviewsByMovieIdApi,
    deleteReviewApi,
} from '../../../axios/admin';
import type { Movie, Review } from '../../../axios/admin';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import resolveImageUrl from '../utils/imageUrl';
import { useLanguage } from '../../../contextAPI/LanguageContext';

export default function MoviesManagement() {
    const { t } = useLanguage();
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const pageSize = 10;

    // Modal states
    const [modalOpen, setModalOpen] = useState(false);
    const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
    const [detailMovie, setDetailMovie] = useState<Movie | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Reviews states
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);

    // Delete states
    const [deleteTarget, setDeleteTarget] = useState<Movie | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Form states
    const [form, setForm] = useState({
        title_vi: '',
        title_en: '',
        trailerUrl: '',
        description_vi: '',
        description_en: '',
        releaseDate: '',
        duration: '',
        language_vi: '',
        language_en: '',
        ageRestriction: '',
        genres: '',
        director: '',
        cast: '',
        isHot: false,
        isShowing: true,
        isComingSoon: false,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState('');

    const fetchMovies = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getMoviesAdminApi({ page, pageSize, filters: search || undefined });
            setMovies(res.data.data || []);
            setTotalPages(res.data.totalPages || 1);
        } catch {
            toast.error('Không thể tải danh sách phim');
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => { fetchMovies(); }, [fetchMovies]);

    const fetchMovieReviews = useCallback(async (movieId: string) => {
        setLoadingReviews(true);
        try {
            const res = await getReviewsByMovieIdApi(movieId);
            setReviews(res.data || []);
        } catch {
            toast.error('Không thể tải danh sách đánh giá');
            setReviews([]);
        } finally {
            setLoadingReviews(false);
        }
    }, []);

    useEffect(() => {
        if (detailOpen && detailMovie?.movieId) {
            fetchMovieReviews(detailMovie.movieId);
        } else {
            setReviews([]);
        }
    }, [detailOpen, detailMovie, fetchMovieReviews]);

    const handleDeleteReview = async (reviewId: string) => {
        try {
            await deleteReviewApi(reviewId);
            toast.success('Đã xóa đánh giá thành công');
            if (detailMovie?.movieId) {
                fetchMovieReviews(detailMovie.movieId);
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể xóa đánh giá');
        }
    };

    const resetForm = () => {
        setForm({
            title_vi: '',
            title_en: '',
            trailerUrl: '',
            description_vi: '',
            description_en: '',
            releaseDate: '',
            duration: '',
            language_vi: '',
            language_en: '',
            ageRestriction: '',
            genres: '',
            director: '',
            cast: '',
            isHot: false,
            isShowing: true,
            isComingSoon: false,
        });
        setImageFile(null);
        setImagePreview('');
    };

    const openCreate = () => {
        setEditingMovie(null);
        resetForm();
        setModalOpen(true);
    };

    const openEdit = (movie: Movie) => {
        setEditingMovie(movie);
        setForm({
            title_vi: movie.title_vi || '',
            title_en: movie.title_en || '',
            trailerUrl: movie.trailerUrl || '',
            description_vi: movie.description_vi || '',
            description_en: movie.description_en || '',
            releaseDate: movie.releaseDate ? movie.releaseDate.split('T')[0] : '',
            duration: movie.duration?.toString() || '',
            language_vi: movie.language_vi || '',
            language_en: movie.language_en || '',
            ageRestriction: movie.ageRestriction || '',
            genres: movie.genres || '',
            director: movie.director || '',
            cast: movie.cast || '',
            isHot: movie.isHot || false,
            isShowing: movie.isShowing || false,
            isComingSoon: movie.isComingSoon || false,
        });
        setImageFile(null);
        setImagePreview(resolveImageUrl(movie.imageUrl));
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title_vi && !form.title_en) {
            toast.error('Vui lòng nhập tên phim');
            return;
        }
        setSaving(true);
        try {
            const formData = new FormData();
            if (form.title_vi) formData.append('title_vi', form.title_vi);
            if (form.title_en) formData.append('title_en', form.title_en);
            if (form.trailerUrl) formData.append('trailerUrl', form.trailerUrl);
            if (form.description_vi) formData.append('description_vi', form.description_vi);
            if (form.description_en) formData.append('description_en', form.description_en);
            if (form.releaseDate) formData.append('releaseDate', form.releaseDate);
            if (form.duration) formData.append('duration', form.duration);
            if (form.language_vi) formData.append('language_vi', form.language_vi);
            if (form.language_en) formData.append('language_en', form.language_en);
            if (form.ageRestriction) formData.append('ageRestriction', form.ageRestriction);
            if (form.genres) formData.append('genres', form.genres);
            if (form.director) formData.append('director', form.director);
            if (form.cast) formData.append('cast', form.cast);
            formData.append('isHot', String(form.isHot));
            formData.append('isShowing', String(form.isShowing));
            formData.append('isComingSoon', String(form.isComingSoon));
            if (imageFile) formData.append('image', imageFile);

            if (editingMovie) {
                await updateMovieApi(editingMovie.movieId, formData);
                toast.success('Cập nhật phim thành công');
            } else {
                await createMovieApi(formData);
                toast.success('Thêm phim thành công');
            }
            setModalOpen(false);
            fetchMovies();
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
            await deleteMovieApi(deleteTarget.movieId);
            toast.success('Xóa phim thành công');
            setDeleteTarget(null);
            fetchMovies();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể xóa phim');
        } finally {
            setDeleting(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchMovies();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('mov_title')}</h1>
                    <p className="text-gray-500 mt-1">{t('mov_subtitle')}</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium text-sm shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    {t('mov_add')}
                </button>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('mov_search')}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                </div>
                <button
                    type="submit"
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                    Tìm
                </button>
            </form>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-left">
                                <th className="px-4 py-3 font-medium text-gray-500 w-16">{t('mov_col_image')}</th>
                                <th className="px-4 py-3 font-medium text-gray-500">{t('mov_col_title')}</th>
                                <th className="px-4 py-3 font-medium text-gray-500">{t('mov_col_duration')}</th>
                                <th className="px-4 py-3 font-medium text-gray-500">{t('adm_status')}</th>
                                <th className="px-4 py-3 font-medium text-gray-500">{t('mov_col_category')}</th>
                                <th className="px-4 py-3 font-medium text-gray-500 text-right">{t('adm_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                                        Đang tải...
                                    </td>
                                </tr>
                            ) : movies.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                                        Không tìm thấy phim nào
                                    </td>
                                </tr>
                            ) : (
                                movies.map((movie) => (
                                    <tr key={movie.movieId} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            {movie.imageUrl ? (
                                                <img
                                                    src={resolveImageUrl(movie.imageUrl)}
                                                    alt={movie.title_vi || ''}
                                                    className="w-12 h-16 object-cover rounded-lg"
                                                />
                                            ) : (
                                                <div className="w-12 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <Film className="w-5 h-5 text-gray-300" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900">{movie.title_vi || movie.title_en || '—'}</p>
                                            {movie.title_en && movie.title_vi && (
                                                <p className="text-xs text-gray-400 mt-0.5">{movie.title_en}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {movie.duration ? `${movie.duration} phút` : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {movie.isShowing && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Đang chiếu</span>
                                                )}
                                                {movie.isComingSoon && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Sắp chiếu</span>
                                                )}
                                                {movie.isHot && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Hot</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {movie.ageRestriction || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => { setDetailMovie(movie); setDetailOpen(true); }}
                                                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-violet-600 transition-colors"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openEdit(movie)}
                                                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-violet-600 transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(movie)}
                                                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Xóa"
                                                >
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
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingMovie ? 'Chỉnh sửa phim' : 'Thêm phim mới'}
                size="xl"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Title VI */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên phim (Tiếng Việt)</label>
                            <input
                                type="text"
                                value={form.title_vi}
                                onChange={(e) => setForm({ ...form, title_vi: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                placeholder="Nhập tên phim tiếng Việt"
                            />
                        </div>
                        {/* Title EN */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên phim (Tiếng Anh)</label>
                            <input
                                type="text"
                                value={form.title_en}
                                onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                placeholder="Enter movie title in English"
                            />
                        </div>
                        {/* Trailer */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trailer URL</label>
                            <input
                                type="url"
                                value={form.trailerUrl}
                                onChange={(e) => setForm({ ...form, trailerUrl: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                placeholder="https://youtube.com/..."
                            />
                        </div>
                        {/* Duration */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Thời lượng (phút)</label>
                            <input
                                type="number"
                                value={form.duration}
                                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                placeholder="120"
                            />
                        </div>
                        {/* Release Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày phát hành</label>
                            <input
                                type="date"
                                value={form.releaseDate}
                                onChange={(e) => setForm({ ...form, releaseDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                        {/* Age Restriction */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phân loại độ tuổi</label>
                            <select
                                value={form.ageRestriction}
                                onChange={(e) => setForm({ ...form, ageRestriction: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                            >
                                <option value="">Chọn phân loại</option>
                                <option value="P">P - Phổ biến</option>
                                <option value="C13">C13 - Trên 13 tuổi</option>
                                <option value="C16">C16 - Trên 16 tuổi</option>
                                <option value="C18">C18 - Trên 18 tuổi</option>
                            </select>
                        </div>
                        {/* Language VI */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ (VI)</label>
                            <input
                                type="text"
                                value={form.language_vi}
                                onChange={(e) => setForm({ ...form, language_vi: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                placeholder="Tiếng Việt"
                            />
                        </div>
                        {/* Language EN */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ (EN)</label>
                            <input
                                type="text"
                                value={form.language_en}
                                onChange={(e) => setForm({ ...form, language_en: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                placeholder="English"
                            />
                        </div>
                        {/* Genres */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Thể loại</label>
                            <input
                                type="text"
                                value={form.genres}
                                onChange={(e) => setForm({ ...form, genres: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                placeholder="Hành động, Phiêu lưu"
                            />
                        </div>
                        {/* Director */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Đạo diễn</label>
                            <input
                                type="text"
                                value={form.director}
                                onChange={(e) => setForm({ ...form, director: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                placeholder="Tên đạo diễn"
                            />
                        </div>
                    </div>

                    {/* Cast */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Diễn viên</label>
                        <input
                            type="text"
                            value={form.cast}
                            onChange={(e) => setForm({ ...form, cast: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                            placeholder="Diễn viên 1, Diễn viên 2"
                        />
                    </div>

                    {/* Description VI */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả (Tiếng Việt)</label>
                        <textarea
                            value={form.description_vi}
                            onChange={(e) => setForm({ ...form, description_vi: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                            placeholder="Mô tả nội dung phim..."
                        />
                    </div>

                    {/* Description EN */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả (Tiếng Anh)</label>
                        <textarea
                            value={form.description_en}
                            onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                            placeholder="Movie description in English..."
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh poster</label>
                        <div className="flex items-center gap-4">
                            {imagePreview && (
                                <img src={imagePreview} alt="Preview" className="w-16 h-22 object-cover rounded-lg border" />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                            />
                        </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="flex flex-wrap gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.isShowing}
                                onChange={(e) => setForm({ ...form, isShowing: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                            />
                            <span className="text-sm text-gray-700">Đang chiếu</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.isComingSoon}
                                onChange={(e) => setForm({ ...form, isComingSoon: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                            />
                            <span className="text-sm text-gray-700">Sắp chiếu</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.isHot}
                                onChange={(e) => setForm({ ...form, isHot: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                            />
                            <span className="text-sm text-gray-700">Phim Hot</span>
                        </label>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
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
                            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving && (
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            )}
                            {editingMovie ? 'Cập nhật' : 'Thêm mới'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Detail Modal */}
            <Modal
                isOpen={detailOpen}
                onClose={() => setDetailOpen(false)}
                title="Chi tiết phim"
                size="lg"
            >
                {detailMovie && (
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            {detailMovie.imageUrl && (
                                <img
                                    src={resolveImageUrl(detailMovie.imageUrl)}
                                    alt={detailMovie.title_vi || ''}
                                    className="w-32 h-44 object-cover rounded-xl"
                                />
                            )}
                            <div className="flex-1 space-y-2">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {detailMovie.title_vi || detailMovie.title_en}
                                </h3>
                                {detailMovie.title_en && detailMovie.title_vi && (
                                    <p className="text-sm text-gray-500">{detailMovie.title_en}</p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {detailMovie.isShowing && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Đang chiếu</span>}
                                    {detailMovie.isComingSoon && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Sắp chiếu</span>}
                                    {detailMovie.isHot && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Hot</span>}
                                    {detailMovie.ageRestriction && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{detailMovie.ageRestriction}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><span className="text-gray-500">Thời lượng:</span> <span className="font-medium">{detailMovie.duration ? `${detailMovie.duration} phút` : '—'}</span></div>
                            <div><span className="text-gray-500">Ngày phát hành:</span> <span className="font-medium">{detailMovie.releaseDate ? new Date(detailMovie.releaseDate).toLocaleDateString('vi-VN') : '—'}</span></div>
                            <div><span className="text-gray-500">Đạo diễn:</span> <span className="font-medium">{detailMovie.director || '—'}</span></div>
                            <div><span className="text-gray-500">Thể loại:</span> <span className="font-medium">{detailMovie.genres || '—'}</span></div>
                            <div className="col-span-2"><span className="text-gray-500">Diễn viên:</span> <span className="font-medium">{detailMovie.cast || '—'}</span></div>
                        </div>
                        {detailMovie.description_vi && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Mô tả:</p>
                                <p className="text-sm text-gray-700">{detailMovie.description_vi}</p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-100 mt-6">
                            <h4 className="text-md font-bold text-gray-900 mb-3 flex items-center gap-2">
                                Đánh giá của người dùng
                            </h4>
                            {loadingReviews ? (
                                <p className="text-sm text-gray-500 text-center py-4">Đang tải đánh giá...</p>
                            ) : reviews.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-lg">Chưa có đánh giá nào</p>
                            ) : (
                                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                    {reviews.map((review) => (
                                        <div key={review._id} className="bg-gray-50 rounded-lg p-3 relative group border border-gray-100">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xs shrink-0">
                                                        {review.userName?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{review.userName || 'Người dùng'}</p>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-yellow-500 text-xs">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                                                            <span className="text-xs text-gray-400 ml-2">
                                                                {review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Bạn có chắc chắn muốn xóa đánh giá spam này?')) {
                                                            handleDeleteReview(review._id);
                                                        }
                                                    }}
                                                    className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all absolute top-2 right-2"
                                                    title="Xóa đánh giá spam"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Confirm Delete */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Xóa phim"
                message={`Bạn có chắc chắn muốn xóa phim "${deleteTarget?.title_vi || deleteTarget?.title_en}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                loading={deleting}
            />
        </div>
    );
}
