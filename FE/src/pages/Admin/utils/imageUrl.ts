import { API_BASE_URL } from '../../../config/constant/constant.tsx';

/**
 * Backend phục vụ ảnh tĩnh tại gốc server (vd: https://api.mievoh.io.vn/images/...),
 * trong khi API_BASE_URL có hậu tố /api. Helper này dựng URL ảnh đầy đủ từ tên file
 * hoặc đường dẫn mà backend trả về.
 */
const SERVER_ROOT = API_BASE_URL.replace(/\/api\/?$/, '');

export function resolveImageUrl(path: string | null | undefined): string {
    if (!path) return '';
    // Đã là URL tuyệt đối
    if (/^https?:\/\//i.test(path)) return path;
    // Đã có tiền tố /images
    if (path.startsWith('/images') || path.startsWith('images')) {
        return `${SERVER_ROOT}/${path.replace(/^\//, '')}`;
    }
    // Chỉ là tên file
    return `${SERVER_ROOT}/images/${path.replace(/^\//, '')}`;
}

export default resolveImageUrl;
