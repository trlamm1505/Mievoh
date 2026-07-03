import { useEffect, useState } from 'react';
import { getProfileApi } from '../axios/profile';
import {
    getCinemaComplexesApi,
    type CinemaComplex,
} from '../axios/admin';

/**
 * Xác định ngữ cảnh cụm rạp cho người dùng hiện tại.
 *
 * - Admin: không bị khóa cụm rạp (isStaff = false) -> trang tự render bộ chọn hệ thống/cụm rạp.
 * - Staff: bị khóa vào đúng cụm rạp được phân công (cinemaComplexId từ profile),
 *   trang sẽ ẩn bộ chọn và dùng luôn complexId này.
 *
 * Cách dùng:
 *   const { isStaff, complexId, complex, ready } = useStaffComplex();
 */
export interface UseStaffComplexResult {
    /** true nếu user hiện tại là staff (bị khóa cụm rạp) */
    isStaff: boolean;
    /** cinemaComplexId được phân công (chỉ có khi isStaff) */
    complexId: string;
    /** thông tin đầy đủ của cụm rạp (tên, địa chỉ, hệ thống) */
    complex: CinemaComplex | null;
    /** đã resolve xong (kể cả khi không phải staff) */
    ready: boolean;
}

const readStoredRole = (): string => {
    try {
        const raw = localStorage.getItem('auth_user');
        if (!raw) return '';
        const u = JSON.parse(raw);
        return (u?.role || u?.userType || '').toString().toLowerCase();
    } catch {
        return '';
    }
};

export default function useStaffComplex(): UseStaffComplexResult {
    const [isStaff, setIsStaff] = useState<boolean>(false);
    const [complexId, setComplexId] = useState<string>('');
    const [complex, setComplex] = useState<CinemaComplex | null>(null);
    const [ready, setReady] = useState<boolean>(false);

    useEffect(() => {
        let cancelled = false;

        const resolve = async () => {
            const role = readStoredRole();

            // Admin (hoặc role không xác định) -> không khóa cụm rạp
            if (role !== 'staff') {
                if (!cancelled) {
                    setIsStaff(false);
                    setReady(true);
                }
                return;
            }

            // Staff -> lấy cinemaComplexId từ profile (nguồn tin cậy)
            try {
                const profileRes = await getProfileApi();
                const cid = profileRes.data?.cinemaComplexId || '';
                if (cancelled) return;

                setIsStaff(true);
                setComplexId(cid);

                if (cid) {
                    // Lấy chi tiết cụm rạp (tên, địa chỉ, hệ thống) từ danh sách công khai
                    try {
                        const listRes = await getCinemaComplexesApi();
                        const found = (listRes.data || []).find(
                            (c) => c.cinemaComplexId === cid,
                        );
                        if (!cancelled) setComplex(found || null);
                    } catch {
                        /* bỏ qua, vẫn dùng được complexId */
                    }
                }
            } catch {
                // Không lấy được profile: coi như staff nhưng chưa có cụm rạp
                if (!cancelled) {
                    setIsStaff(true);
                    setComplexId('');
                }
            } finally {
                if (!cancelled) setReady(true);
            }
        };

        resolve();
        return () => {
            cancelled = true;
        };
    }, []);

    return { isStaff, complexId, complex, ready };
}
