import { useEffect, useState, useCallback } from 'react';
import { Search, Eye, Ban, UserRound, Mail } from 'lucide-react';
import { useLanguage } from '../../../contextAPI/LanguageContext';
import toast from 'react-hot-toast';
import { getUsersApi, deleteUserApi } from '../../../axios/admin';
import type { User } from '../../../axios/admin';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import resolveImageUrl from '../utils/imageUrl';

export default function UsersManagement() {
    const { t } = useLanguage();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [userTypeFilter, setUserTypeFilter] = useState('');
    const limit = 10;

    // Detail modal
    const [detailUser, setDetailUser] = useState<User | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    // Deactivate
    const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
    const [deactivating, setDeactivating] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { page, limit };
            if (userTypeFilter) params.userType = userTypeFilter;
            const res = await getUsersApi(params);
            const inner = res.data;
            const list = Array.isArray(inner) ? inner : (Array.isArray(inner?.data) ? inner.data : []);
            setUsers(list);
            setTotalPages(inner?.totalPages || Math.ceil((inner?.total || list.length) / limit) || 1);
        } catch {
            toast.error('Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    }, [page, userTypeFilter]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleDeactivate = async () => {
        if (!deactivateTarget) return;
        setDeactivating(true);
        try {
            await deleteUserApi(deactivateTarget.email);
            toast.success('Vô hiệu hóa tài khoản thành công');
            setDeactivateTarget(null);
            fetchUsers();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể vô hiệu hóa');
        } finally {
            setDeactivating(false);
        }
    };

    const filteredUsers = search
        ? users.filter(u =>
            (u.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            (u.phoneNumber || '').includes(search)
        )
        : users;

    const getRoleBadge = (type: string | null) => {
        switch (type?.toLowerCase()) {
            case 'admin': return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Admin</span>;
            case 'staff': return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Staff</span>;
            default: return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">User</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('usr_title')}</h1>
                <p className="text-gray-500 mt-1">{t('usr_subtitle')}</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('usr_search')}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                </div>
                <select
                    value={userTypeFilter}
                    onChange={(e) => { setUserTypeFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                >
                    <option value="">{t('usr_all_roles')}</option>
                    <option value="user">User</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-left">
                                <th className="px-4 py-3 font-medium text-gray-500 w-12"></th>
                                <th className="px-4 py-3 font-medium text-gray-500">{t('usr_col_name')}</th>
                                <th className="px-4 py-3 font-medium text-gray-500">Email</th>
                                <th className="px-4 py-3 font-medium text-gray-500">{t('usr_col_phone')}</th>
                                <th className="px-4 py-3 font-medium text-gray-500">{t('usr_col_role')}</th>
                                <th className="px-4 py-3 font-medium text-gray-500">{t('login')}</th>
                                <th className="px-4 py-3 font-medium text-gray-500 text-right">{t('adm_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Đang tải...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Không tìm thấy người dùng nào</td></tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.email} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            {user.avatar ? (
                                                <img src={resolveImageUrl(user.avatar)} alt="" className="w-9 h-9 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
                                                    <UserRound className="w-4 h-4 text-violet-500" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{user.fullName || '—'}</td>
                                        <td className="px-4 py-3 text-gray-600">{user.email}</td>
                                        <td className="px-4 py-3 text-gray-600">{user.phoneNumber || '—'}</td>
                                        <td className="px-4 py-3">{getRoleBadge(user.userType)}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                                                {user.authProvider || 'local'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => { setDetailUser(user); setDetailOpen(true); }}
                                                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-violet-600 transition-colors"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {user.userType?.toLowerCase() !== 'admin' && (
                                                    <button
                                                        onClick={() => setDeactivateTarget(user)}
                                                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"
                                                        title="Vô hiệu hóa"
                                                    >
                                                        <Ban className="w-4 h-4" />
                                                    </button>
                                                )}
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

            {/* Detail Modal */}
            <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Chi tiết người dùng" size="lg">
                {detailUser && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            {detailUser.avatar ? (
                                <img src={resolveImageUrl(detailUser.avatar)} alt="" className="w-16 h-16 rounded-full object-cover" />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
                                    <UserRound className="w-8 h-8 text-violet-500" />
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{detailUser.fullName || 'Chưa cập nhật'}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    {getRoleBadge(detailUser.userType)}
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                                        {detailUser.authProvider || 'local'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-500">Email:</span>
                                <span className="font-medium">{detailUser.email}</span>
                            </div>
                            <div><span className="text-gray-500">SĐT:</span> <span className="font-medium">{detailUser.phoneNumber || '—'}</span></div>
                            <div><span className="text-gray-500">Giới tính:</span> <span className="font-medium">{detailUser.gender || '—'}</span></div>
                            <div><span className="text-gray-500">Ngày sinh:</span> <span className="font-medium">{detailUser.dateOfBirth ? new Date(detailUser.dateOfBirth).toLocaleDateString('vi-VN') : '—'}</span></div>
                            <div className="col-span-2"><span className="text-gray-500">Địa chỉ:</span> <span className="font-medium">{detailUser.address || '—'}</span></div>
                            <div><span className="text-gray-500">CCCD:</span> <span className="font-medium">{detailUser.cccd || '—'}</span></div>
                            <div><span className="text-gray-500">Ngày tạo:</span> <span className="font-medium">{detailUser.createdAt ? new Date(detailUser.createdAt).toLocaleDateString('vi-VN') : '—'}</span></div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Confirm Deactivate */}
            <ConfirmDialog
                isOpen={!!deactivateTarget}
                onClose={() => setDeactivateTarget(null)}
                onConfirm={handleDeactivate}
                title="Vô hiệu hóa tài khoản"
                message={`Bạn có chắc chắn muốn vô hiệu hóa tài khoản "${deactivateTarget?.email}"?`}
                confirmText="Vô hiệu hóa"
                loading={deactivating}
            />
        </div>
    );
}
