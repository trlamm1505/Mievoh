import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Monitor, Plus, Pencil, Trash2, Armchair, Grid3x3, X } from 'lucide-react';
import {
    getCinemaSystemsApi,
    getCinemaComplexesApi,
    getCinemasApi,
    createCinemaApi,
    updateCinemaApi,
    deleteCinemaApi,
    getSeatsApi,
    generateSeatsApi,
    createSeatApi,
    updateSeatApi,
    deleteSeatApi,
    type CinemaSystem,
    type CinemaComplex,
    type Cinema,
    type Seat,
} from '../../../axios/admin';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import useStaffComplex from '../../../hooks/useStaffComplex';
import { Building2, MapPin } from 'lucide-react';
import { useLanguage } from '../../../contextAPI/LanguageContext';

const SEAT_TYPES = [
    { value: 'Standard', label: 'Thường', color: 'bg-white text-gray-500 border-gray-200 hover:border-violet-300' },
    { value: 'VIP', label: 'VIP', color: 'bg-amber-100 text-amber-700 border-amber-300' },
    { value: 'Couple', label: 'Đôi', color: 'bg-pink-100 text-pink-700 border-pink-300' },
    { value: 'Đôi', label: 'Đôi', color: 'bg-pink-100 text-pink-700 border-pink-300' },
];

function seatTypeStyle(type: string) {
    return SEAT_TYPES.find((t) => t.value === type)?.color || SEAT_TYPES[0].color;
}

export default function CinemasPage() {
    const { t } = useLanguage();
    // Staff bị khóa vào cụm rạp được phân công; admin được tự chọn.
    const { isStaff, complexId: staffComplexId, complex: staffComplex, ready: staffReady } = useStaffComplex();

    // Cascading filters
    const [systems, setSystems] = useState<CinemaSystem[]>([]);
    const [complexes, setComplexes] = useState<CinemaComplex[]>([]);
    const [cinemas, setCinemas] = useState<Cinema[]>([]);
    const [systemId, setSystemId] = useState('');
    const [complexId, setComplexId] = useState('');
    const [loading, setLoading] = useState(false);

    // Cinema room modal
    const [roomModalOpen, setRoomModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Cinema | null>(null);
    const [roomName, setRoomName] = useState('');
    const [saving, setSaving] = useState(false);

    // Delete room
    const [deleteRoom, setDeleteRoom] = useState<Cinema | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Seats management
    const [seatCinema, setSeatCinema] = useState<Cinema | null>(null);
    const [seats, setSeats] = useState<Seat[]>([]);
    const [seatsLoading, setSeatsLoading] = useState(false);

    // ---- Load systems on mount (chỉ admin cần chọn hệ thống) ----
    useEffect(() => {
        if (!staffReady || isStaff) return;
        getCinemaSystemsApi()
            .then((res) => setSystems(res.data || []))
            .catch(() => toast.error('Không tải được hệ thống rạp'));
    }, [staffReady, isStaff]);

    // ---- Staff: khóa luôn vào cụm rạp được phân công ----
    useEffect(() => {
        if (!staffReady || !isStaff) return;
        if (staffComplexId) {
            setComplexId(staffComplexId);
        }
    }, [staffReady, isStaff, staffComplexId]);

    // ---- Load complexes when system changes (admin) ----
    useEffect(() => {
        if (isStaff) return;
        setComplexId('');
        setCinemas([]);
        if (!systemId) {
            setComplexes([]);
            return;
        }
        getCinemaComplexesApi(systemId)
            .then((res) => setComplexes(res.data || []))
            .catch(() => toast.error('Không tải được cụm rạp'));
    }, [systemId, isStaff]);

    // ---- Load cinemas when complex changes ----
    const loadCinemas = () => {
        if (!complexId) {
            setCinemas([]);
            return;
        }
        setLoading(true);
        getCinemasApi(complexId)
            .then((res) => setCinemas(res.data || []))
            .catch(() => toast.error('Không tải được danh sách phòng chiếu'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadCinemas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [complexId]);

    // ---- Room CRUD ----
    const openCreateRoom = () => {
        setEditingRoom(null);
        setRoomName('');
        setRoomModalOpen(true);
    };

    const openEditRoom = (room: Cinema) => {
        setEditingRoom(room);
        setRoomName(room.name || '');
        setRoomModalOpen(true);
    };

    const handleSaveRoom = async () => {
        if (!roomName.trim()) {
            toast.error('Vui lòng nhập tên phòng chiếu');
            return;
        }
        setSaving(true);
        try {
            if (editingRoom) {
                await updateCinemaApi({ cinemaId: editingRoom.cinemaId, name: roomName.trim() });
                toast.success('Cập nhật phòng chiếu thành công');
            } else {
                await createCinemaApi({ name: roomName.trim(), cinemaComplexId: complexId });
                toast.success('Tạo phòng chiếu thành công');
            }
            setRoomModalOpen(false);
            loadCinemas();
        } catch {
            toast.error('Lưu phòng chiếu thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRoom = async () => {
        if (!deleteRoom) return;
        setDeleting(true);
        try {
            await deleteCinemaApi(deleteRoom.cinemaId);
            toast.success('Đã xóa phòng chiếu');
            setDeleteRoom(null);
            loadCinemas();
        } catch {
            toast.error('Xóa phòng chiếu thất bại');
        } finally {
            setDeleting(false);
        }
    };

    // ---- Seats ----
    const openSeats = (cinema: Cinema) => {
        setSeatCinema(cinema);
        setSeats([]);
        setSeatsLoading(true);
        getSeatsApi(cinema.cinemaId)
            .then((res) => setSeats(res.data || []))
            .catch(() => toast.error('Không tải được sơ đồ ghế'))
            .finally(() => setSeatsLoading(false));
    };

    const reloadSeats = () => {
        if (!seatCinema) return;
        setSeatsLoading(true);
        getSeatsApi(seatCinema.cinemaId)
            .then((res) => setSeats(res.data || []))
            .catch(() => toast.error('Không tải được sơ đồ ghế'))
            .finally(() => setSeatsLoading(false));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('cin_title')}</h1>
                <p className="text-gray-500 mt-1">
                    {isStaff ? t('cin_subtitle_staff') : t('cin_subtitle_admin')}
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
                            <p className="text-xs text-gray-500">Staff</p>
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
                                    <option key={s.cinemaSystemId} value={s.cinemaSystemId}>
                                        {s.name}
                                    </option>
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
                                    <option key={c.cinemaComplexId} value={c.cinemaComplexId}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Rooms list */}
            {complexId && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">{t('cin_room_list')}</h2>
                        <button
                            onClick={openCreateRoom}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            {t('cin_add_room')}
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-10 text-center text-gray-400">{t('adm_loading')}</div>
                    ) : cinemas.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">
                            <Monitor className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                            {t('cin_no_rooms')}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                            {cinemas.map((room) => (
                                <div
                                    key={room.cinemaId}
                                    className="border border-gray-200 rounded-xl p-4 hover:border-violet-300 hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-50 text-violet-600">
                                                <Monitor className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{room.name}</p>
                                                <p className="text-xs text-gray-400">{t('cin_room')}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                        <button
                                            onClick={() => openSeats(room)}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
                                        >
                                            <Armchair className="w-4 h-4" />
                                            {t('cin_seats')}
                                        </button>
                                        <button
                                            onClick={() => openEditRoom(room)}
                                            className="p-1.5 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteRoom(room)}
                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Room modal */}
            <Modal
                isOpen={roomModalOpen}
                onClose={() => setRoomModalOpen(false)}
                title={editingRoom ? t('adm_update') : t('cin_add_room')}
                size="sm"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('cin_room_name')}</label>
                        <input
                            type="text"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            placeholder="VD: Phòng 1"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
                        />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            onClick={() => setRoomModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            {t('adm_cancel')}
                        </button>
                        <button
                            onClick={handleSaveRoom}
                            disabled={saving}
                            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
                        >
                            {saving ? t('adm_saving') : editingRoom ? t('adm_update') : t('adm_add')}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete room confirm */}
            <ConfirmDialog
                isOpen={!!deleteRoom}
                onClose={() => setDeleteRoom(null)}
                onConfirm={handleDeleteRoom}
                title={t('cin_delete_room')}
                message={`"${deleteRoom?.name}" — ${t('cin_delete_room_msg')}`}
                confirmText={t('adm_delete')}
                loading={deleting}
            />

            {/* Seats modal */}
            {seatCinema && (
                <SeatManager
                    cinema={seatCinema}
                    seats={seats}
                    loading={seatsLoading}
                    onClose={() => setSeatCinema(null)}
                    onChanged={reloadSeats}
                />
            )}
        </div>
    );
}

// ============================================
// Seat Manager (modal-like full panel)
// ============================================
interface SeatManagerProps {
    cinema: Cinema;
    seats: Seat[];
    loading: boolean;
    onClose: () => void;
    onChanged: () => void;
}

function SeatManager({ cinema, seats, loading, onClose, onChanged }: SeatManagerProps) {
    const [genFromRow, setGenFromRow] = useState('A');
    const [genToRow, setGenToRow] = useState('J');
    const [genPerRow, setGenPerRow] = useState(10);
    const [vipRowsStr, setVipRowsStr] = useState('');
    const [sweetboxRowsStr, setSweetboxRowsStr] = useState('');
    const [generating, setGenerating] = useState(false);

    // Manual add seat
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState('Standard');
    const [adding, setAdding] = useState(false);

    const [editingSeat, setEditingSeat] = useState<Seat | null>(null);

    const handleGenerate = async () => {
        if (!genFromRow || !genToRow || genPerRow < 1) {
            toast.error('Vui lòng nhập đầy đủ thông tin hàng ghế');
            return;
        }
        // Parse vipRows và sweetboxRows: nhập chữ, cách nhau bằng dấu phẩy
        const vipRows = vipRowsStr
            .split(',')
            .map((s) => s.trim().toUpperCase())
            .filter((s) => s.length === 1 && s >= 'A' && s <= 'Z');
        const sweetboxRows = sweetboxRowsStr
            .split(',')
            .map((s) => s.trim().toUpperCase())
            .filter((s) => s.length === 1 && s >= 'A' && s <= 'Z');
        setGenerating(true);
        try {
            await generateSeatsApi({
                cinemaId: cinema.cinemaId,
                rowLetterStart: genFromRow.toUpperCase(),
                rowLetterEnd: genToRow.toUpperCase(),
                seatsPerRow: genPerRow,
                vipRows: vipRows.length ? vipRows : undefined,
                sweetboxRows: sweetboxRows.length ? sweetboxRows : undefined,
            });
            toast.success('Tạo sơ đồ ghế thành công');
            onChanged();
        } catch {
            toast.error('Tạo sơ đồ ghế thất bại');
        } finally {
            setGenerating(false);
        }
    };

    const handleAddSeat = async () => {
        if (!newName.trim()) {
            toast.error('Vui lòng nhập tên ghế');
            return;
        }
        setAdding(true);
        try {
            await createSeatApi({ name: newName.trim(), seatType: newType, cinemaId: cinema.cinemaId });
            toast.success('Đã thêm ghế');
            setNewName('');
            onChanged();
        } catch {
            toast.error('Thêm ghế thất bại');
        } finally {
            setAdding(false);
        }
    };

    const handleUpdateSeatType = async (seat: Seat, seatType: string) => {
        try {
            await updateSeatApi({ seatId: seat.seatId, seatType });
            toast.success('Đã cập nhật ghế');
            onChanged();
        } catch {
            toast.error('Cập nhật ghế thất bại');
        }
    };

    const handleDeleteSeat = async (seat: Seat) => {
        try {
            await deleteSeatApi(seat.seatId);
            onChanged();
        } catch {
            toast.error('Xóa ghế thất bại');
        }
    };

    // group seats by row (first char(s) before number)
    const grouped = seats.reduce<Record<string, Seat[]>>((acc, s) => {
        const row = (s.name.match(/^[A-Za-z]+/)?.[0] || '#').toUpperCase();
        (acc[row] = acc[row] || []).push(s);
        return acc;
    }, {});
    const rowKeys = Object.keys(grouped).sort();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Sơ đồ ghế · {cinema.name}</h2>
                        <p className="text-xs text-gray-400">Tổng {seats.length} ghế</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                    {/* Generate panel */}
                    <div className="bg-violet-50/60 border border-violet-100 rounded-xl p-4">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-violet-700 mb-3">
                            <Grid3x3 className="w-4 h-4" /> Tạo sơ đồ ghế tự động
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Hàng từ</label>
                                <input
                                    type="text"
                                    maxLength={1}
                                    value={genFromRow}
                                    onChange={(e) => setGenFromRow(e.target.value.toUpperCase())}
                                    placeholder="A"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none uppercase"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Đến hàng</label>
                                <input
                                    type="text"
                                    maxLength={1}
                                    value={genToRow}
                                    onChange={(e) => setGenToRow(e.target.value.toUpperCase())}
                                    placeholder="J"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none uppercase"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Ghế / hàng</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={genPerRow}
                                    onChange={(e) => setGenPerRow(Number(e.target.value))}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Hàng VIP (vd: G,H)</label>
                                <input
                                    type="text"
                                    value={vipRowsStr}
                                    onChange={(e) => setVipRowsStr(e.target.value.toUpperCase())}
                                    placeholder="G,H"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none uppercase"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Hàng Sweetbox (vd: J)</label>
                                <input
                                    type="text"
                                    value={sweetboxRowsStr}
                                    onChange={(e) => setSweetboxRowsStr(e.target.value.toUpperCase())}
                                    placeholder="J"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none uppercase"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-3">
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
                            >
                                {generating ? 'Đang tạo...' : 'Tạo sơ đồ'}
                            </button>
                        </div>
                        <p className="text-xs text-amber-600 mt-2">
                            Lưu ý: tạo tự động có thể thay thế các ghế hiện có tùy theo cấu hình backend.
                        </p>
                    </div>

                    {/* Manual add */}
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="flex-1 min-w-[140px]">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Thêm ghế thủ công</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="VD: A1"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
                            />
                        </div>
                        <div>
                            <select
                                value={newType}
                                onChange={(e) => setNewType(e.target.value)}
                                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
                            >
                                {SEAT_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleAddSeat}
                            disabled={adding}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4" /> Thêm
                        </button>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                        {SEAT_TYPES.map((t) => (
                            <span key={t.value} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border ${t.color}`}>
                                <span className="w-3 h-3 rounded-sm bg-current opacity-40" /> {t.label}
                            </span>
                        ))}
                    </div>

                    {/* Seat map */}
                    {loading ? (
                        <div className="p-10 text-center text-gray-400">Đang tải ghế...</div>
                    ) : seats.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">
                            <Armchair className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                            Chưa có ghế nào. Hãy tạo sơ đồ tự động hoặc thêm thủ công.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="text-center text-xs text-gray-400 border-b-2 border-gray-200 pb-2 mb-3">
                                MÀN HÌNH
                            </div>
                            {rowKeys.map((row) => (
                                <div key={row} className="flex items-center gap-2">
                                    <span className="w-6 text-xs font-semibold text-gray-400">{row}</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {grouped[row]
                                            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
                                            .map((seat) => (
                                                <div key={seat.seatId} className="relative group">
                                                    <button
                                                        onClick={() => setEditingSeat(editingSeat?.seatId === seat.seatId ? null : seat)}
                                                        className={`w-9 h-9 rounded-md border text-[11px] font-medium flex items-center justify-center transition ${seatTypeStyle(
                                                            seat.seatType
                                                        )} hover:ring-2 hover:ring-violet-300`}
                                                        title={`${seat.name} · ${seat.seatType}`}
                                                    >
                                                        {seat.name}
                                                    </button>
                                                    {editingSeat?.seatId === seat.seatId && (
                                                        <div className="absolute z-10 top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-36">
                                                            <p className="text-[11px] font-semibold text-gray-700 mb-1.5 text-center">{seat.name}</p>
                                                            <select
                                                                value={seat.seatType}
                                                                onChange={(e) => {
                                                                    handleUpdateSeatType(seat, e.target.value);
                                                                    setEditingSeat(null);
                                                                }}
                                                                className="w-full text-xs rounded border border-gray-200 px-1.5 py-1 mb-1.5 outline-none"
                                                            >
                                                                {SEAT_TYPES.map((t) => (
                                                                    <option key={t.value} value={t.value}>
                                                                        {t.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                onClick={() => {
                                                                    handleDeleteSeat(seat);
                                                                    setEditingSeat(null);
                                                                }}
                                                                className="w-full text-xs text-red-600 hover:bg-red-50 rounded py-1 transition-colors"
                                                            >
                                                                Xóa ghế
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
