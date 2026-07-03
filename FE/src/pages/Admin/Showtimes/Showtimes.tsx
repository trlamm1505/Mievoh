import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Calendar, Plus, Pencil, Trash2, Clock } from 'lucide-react';
import {
    getCinemaSystemsApi,
    getCinemaComplexesApi,
    getCinemasApi,
    getMoviesAdminApi,
    createShowtimeApi,
    updateShowtimeApi,
    deleteShowtimeApi,
    type CinemaSystem,
    type CinemaComplex,
    type Cinema,
    type Movie,
    type Showtime,
} from '../../../axios/admin';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../../../config/axios/axiosConfig';
import useStaffComplex from '../../../hooks/useStaffComplex';
import { Building2, MapPin } from 'lucide-react';
import { useLanguage } from '../../../contextAPI/LanguageContext';

export default function ShowtimesPage() {
    const { t } = useLanguage();
    // Staff bị khóa vào cụm rạp được phân công; admin được tự chọn.
    const { isStaff, complexId: staffComplexId, complex: staffComplex, ready: staffReady } = useStaffComplex();

    // Cascading filters
    const [systems, setSystems] = useState<CinemaSystem[]>([]);
    const [complexes, setComplexes] = useState<CinemaComplex[]>([]);
    const [cinemas, setCinemas] = useState<Cinema[]>([]);
    const [movies, setMovies] = useState<Movie[]>([]);

    const [systemId, setSystemId] = useState('');
    const [complexId, setComplexId] = useState('');

    // Showtimes list (fetched by complex)
    const [showtimes, setShowtimes] = useState<Showtime[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Showtime | null>(null);
    const [form, setForm] = useState({
        cinemaId: '',
        movieId: '',
        showDateTime: '',
        format: '2D Phụ Đề',
        ticketPrice: '',
        status: 'Active',
    });
    const [saving, setSaving] = useState(false);

    // Delete
    const [deleteTarget, setDeleteTarget] = useState<Showtime | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Load movies on mount (cả admin & staff)
    useEffect(() => {
        getMoviesAdminApi({ page: 1, pageSize: 200 }).then((r) => setMovies(r.data.data || [])).catch(() => { });
    }, []);

    // Load systems on mount (chỉ admin cần chọn hệ thống)
    useEffect(() => {
        if (!staffReady || isStaff) return;
        getCinemaSystemsApi().then((r) => setSystems(r.data || [])).catch(() => { });
    }, [staffReady, isStaff]);

    // Staff: khóa luôn vào cụm rạp được phân công
    useEffect(() => {
        if (!staffReady || !isStaff) return;
        if (staffComplexId) setComplexId(staffComplexId);
    }, [staffReady, isStaff, staffComplexId]);

    // Load complexes when system changes (admin)
    useEffect(() => {
        if (isStaff) return;
        setComplexId('');
        setCinemas([]);
        setShowtimes([]);
        if (!systemId) { setComplexes([]); return; }
        getCinemaComplexesApi(systemId).then((r) => setComplexes(r.data || [])).catch(() => { });
    }, [systemId, isStaff]);

    // Load cinemas + showtimes when complex changes
    useEffect(() => {
        setCinemas([]);
        setShowtimes([]);
        if (!complexId) return;
        getCinemasApi(complexId).then((r) => setCinemas(r.data || [])).catch(() => { });
        loadShowtimes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [complexId]);

    const loadShowtimes = async () => {
        if (!complexId) return;
        setLoading(true);
        try {
            // Use showtimes/complex/:complexId to get all showtimes for a complex
            const res = await api.get<{ data: Showtime[] }>(`/showtimes/complex/${complexId}`);
            setShowtimes(res.data.data || []);
        } catch {
            // If the endpoint doesn't exist, set empty
            setShowtimes([]);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditing(null);
        setForm({
            cinemaId: cinemas[0]?.cinemaId || '',
            movieId: movies[0]?.movieId || '',
            showDateTime: '',
            format: '2D Phụ Đề',
            ticketPrice: '100000',
            status: 'Active',
        });
        setModalOpen(true);
    };

    const openEdit = (st: Showtime) => {
        setEditing(st);
        setForm({
            cinemaId: st.cinemaId || '',
            movieId: st.movieId || '',
            showDateTime: st.showDateTime ? st.showDateTime.slice(0, 16) : '',
            format: st.format || '2D Phụ Đề',
            ticketPrice: st.ticketPrice?.toString() || '',
            status: st.status || 'Active',
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.cinemaId || !form.movieId || !form.showDateTime) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                cinemaId: form.cinemaId,
                movieId: form.movieId,
                showDateTime: new Date(form.showDateTime).toISOString(),
                format: form.format || undefined,
                ticketPrice: form.ticketPrice ? Number(form.ticketPrice) : undefined,
            };

            if (editing) {
                await updateShowtimeApi({ showtimeId: editing.showtimeId, ...payload, status: form.status });
                toast.success('Cập nhật suất chiếu thành công');
            } else {
                await createShowtimeApi(payload);
                toast.success('Tạo suất chiếu thành công');
            }
            setModalOpen(false);
            loadShowtimes();
        } catch {
            toast.error('Lưu suất chiếu thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteShowtimeApi(deleteTarget.showtimeId);
            toast.success('Đã xóa suất chiếu');
            setDeleteTarget(null);
            loadShowtimes();
        } catch {
            toast.error('Xóa suất chiếu thất bại');
        } finally {
            setDeleting(false);
        }
    };

    const movieName = (id: string | null) => {
        const m = movies.find((mv) => mv.movieId === id);
        return m?.title_vi || m?.title_en || '—';
    };

    const cinemaName = (id: string | null) =>
        cinemas.find((c) => c.cinemaId === id)?.name || '—';

    const formatDateTime = (dt: string | null) => {
        if (!dt) return '—';
        const d = new Date(dt);
        return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('sho_title')}</h1>
                <p className="text-gray-500 mt-1">
                    {isStaff ? t('sho_subtitle_staff') : t('sho_subtitle_admin')}
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
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">{t('sho_list')}</h2>
                        <button
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            {t('sho_add')}
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-10 text-center text-gray-400">{t('adm_loading')}</div>
                    ) : showtimes.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">
                            <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                            {t('sho_none')}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50/50">
                                        <th className="px-5 py-3 font-medium">{t('sho_col_movie')}</th>
                                        <th className="px-5 py-3 font-medium">{t('sho_col_room')}</th>
                                        <th className="px-5 py-3 font-medium">{t('sho_col_time')}</th>
                                        <th className="px-5 py-3 font-medium">{t('sho_col_format')}</th>
                                        <th className="px-5 py-3 font-medium">{t('sho_col_price')}</th>
                                        <th className="px-5 py-3 font-medium">{t('adm_status')}</th>
                                        <th className="px-5 py-3 font-medium text-right">{t('adm_actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {showtimes.map((st) => (
                                        <tr key={st.showtimeId} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                                                {st.Movie?.title_vi || st.Movie?.title_en || movieName(st.movieId)}
                                            </td>
                                            <td className="px-5 py-3 text-gray-600">{st.Cinema?.name || cinemaName(st.cinemaId)}</td>
                                            <td className="px-5 py-3 text-gray-600">
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                    {formatDateTime(st.showDateTime)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-gray-600">{st.format || '—'}</td>
                                            <td className="px-5 py-3 text-gray-600">
                                                {st.ticketPrice ? st.ticketPrice.toLocaleString('vi-VN') + 'đ' : '—'}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${st.status === 'Active'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {st.status === 'Active' ? 'Hoạt động' : 'Hủy'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => openEdit(st)}
                                                        className="p-2 rounded-lg text-gray-400 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(st)}
                                                        className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
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
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Cập nhật suất chiếu' : 'Thêm suất chiếu mới'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Phim <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={form.movieId}
                                onChange={(e) => setForm({ ...form, movieId: e.target.value })}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
                            >
                                <option value="">-- Chọn phim --</option>
                                {movies.map((m) => (
                                    <option key={m.movieId} value={m.movieId}>
                                        {m.title_vi || m.title_en}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Phòng chiếu <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={form.cinemaId}
                                onChange={(e) => setForm({ ...form, cinemaId: e.target.value })}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
                            >
                                <option value="">-- Chọn phòng --</option>
                                {cinemas.map((c) => (
                                    <option key={c.cinemaId} value={c.cinemaId}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Ngày giờ chiếu <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={form.showDateTime}
                                onChange={(e) => setForm({ ...form, showDateTime: e.target.value })}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Định dạng</label>
                            <select
                                value={form.format}
                                onChange={(e) => setForm({ ...form, format: e.target.value })}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
                            >
                                <option value="2D Phụ Đề">2D Phụ Đề</option>
                                <option value="2D Lồng Tiếng">2D Lồng Tiếng</option>
                                <option value="3D Phụ Đề">3D Phụ Đề</option>
                                <option value="3D Lồng Tiếng">3D Lồng Tiếng</option>
                                <option value="IMAX">IMAX</option>
                                <option value="4DX">4DX</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Giá vé (VNĐ)</label>
                            <input
                                type="number"
                                value={form.ticketPrice}
                                onChange={(e) => setForm({ ...form, ticketPrice: e.target.value })}
                                placeholder="100000"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
                            />
                        </div>
                        {editing && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
                                >
                                    <option value="Active">Hoạt động</option>
                                    <option value="Cancelled">Hủy</option>
                                </select>
                            </div>
                        )}
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
                            {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo mới'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Xóa suất chiếu"
                message="Bạn có chắc muốn xóa suất chiếu này? Hành động không thể hoàn tác."
                confirmText="Xóa"
                loading={deleting}
            />
        </div>
    );
}
