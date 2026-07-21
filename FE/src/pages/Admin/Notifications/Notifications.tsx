import { useEffect, useState, useCallback } from 'react';
import { Bell, Send, Link as LinkIcon, Trash2 } from 'lucide-react';
import { useLanguage } from '../../../contextAPI/LanguageContext';
import toast from 'react-hot-toast';
import {
    broadcastNotificationApi,
    getBroadcastsApi,
    deleteBroadcastApi,
} from '../../../axios/admin';
import type { BroadcastNotification } from '../../../axios/admin';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';

export default function NotificationsManagement() {
    const { t } = useLanguage();
    const [broadcasts, setBroadcasts] = useState<BroadcastNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Delete
    const [deleteTarget, setDeleteTarget] = useState<BroadcastNotification | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Form
    const [form, setForm] = useState({ title: '', message: '', link: '' });

    const fetchBroadcasts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getBroadcastsApi({ page, pageSize });
            const inner = res.data;
            const list = Array.isArray(inner) ? inner : (Array.isArray(inner?.data) ? inner.data : []);
            setBroadcasts(list);
            setTotalPages(inner?.totalPages || Math.ceil((inner?.total || list.length) / pageSize) || 1);
        } catch {
            toast.error('Không thể tải danh sách thông báo');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { fetchBroadcasts(); }, [fetchBroadcasts]);

    const openCreate = () => { setForm({ title: '', message: '', link: '' }); setModalOpen(true); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.message) {
            toast.error('Vui lòng nhập tiêu đề và nội dung');
            return;
        }
        setSaving(true);
        try {
            const payload: any = { title: form.title, message: form.message };
            if (form.link) payload.link = form.link;

            await broadcastNotificationApi(payload);
            toast.success('Gửi thông báo thành công');
            setModalOpen(false);
            fetchBroadcasts();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        const targetId = (deleteTarget as any).broadcastId || deleteTarget._id;
        setDeleting(true);
        try {
            await deleteBroadcastApi(targetId);
            toast.success('Xóa thông báo thành công');
            setDeleteTarget(null);
            fetchBroadcasts();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể xóa thông báo');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('noti_title')}</h1>
                    <p className="text-gray-500 mt-1">{t('noti_subtitle')}</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium text-sm shadow-sm">
                    <Send className="w-4 h-4" /> Gửi thông báo mới
                </button>
            </div>

            {/* Broadcasts List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">Đang tải...</div>
                ) : broadcasts.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                        <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400">{t('noti_none')}</p>
                    </div>
                ) : (
                    broadcasts.map((b) => (
                        <div key={(b as any).broadcastId || b._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Bell className="w-4 h-4 text-violet-500 flex-shrink-0" />
                                        <h3 className="font-bold text-gray-900 truncate">{b.title}</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{b.message}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                        {b.link && (
                                            <span className="flex items-center gap-1">
                                                <LinkIcon className="w-3 h-3" /> {b.link}
                                            </span>
                                        )}
                                        <span>{b.createdAt ? new Date(b.createdAt).toLocaleString('vi-VN') : '—'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDeleteTarget(b)}
                                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                                    title="Xóa thông báo"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

            {/* Create/Edit Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Gửi thông báo mới" size="md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                        <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="VD: Cập nhật hệ thống"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung *</label>
                        <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4}
                            placeholder="Nội dung thông báo..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Đường dẫn (tùy chọn)</label>
                        <input type="text" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })}
                            placeholder="/promotions hoặc https://..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Hủy</button>
                        <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                            {saving && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                            Gửi thông báo
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Xóa thông báo"
                message={`Bạn có chắc chắn muốn xóa thông báo "${deleteTarget?.title || ''}" không?`}
                confirmText="Xóa"
                loading={deleting}
            />
        </div>
    );
}
