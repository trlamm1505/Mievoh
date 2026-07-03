import { ForbiddenException } from '@nestjs/common';
import { User as PrismaUser } from '../../modules-system/prisma/generated/prisma/client';

/**
 * Kiểm tra xem người dùng có quyền thao tác trên cụm rạp mục tiêu hay không.
 * - Admin: Quản lý toàn bộ hệ thống
 * - Staff: Chỉ quản lý cụm rạp được phân công
 * - User: Không có quyền truy cập
 *
 * @param user Thông tin user lấy từ Req (thông qua JwtStrategy)
 * @param targetComplexId ID của cụm rạp mà thao tác đang hướng tới
 */
export function validateStaffComplex(user: PrismaUser | any, targetComplexId: string | null) {
  if (!user || !user.userType) {
    return; // Các API Public sẽ không có user, Guard RoleGuard sẽ chặn nếu cần thiết, helper này bỏ qua
  }

  // Admin có toàn quyền truy cập bất kỳ cụm rạp nào
  if (user.userType === 'admin') {
    return true;
  }

  // Staff bị giới hạn ở 1 cụm rạp duy nhất
  if (user.userType === 'staff') {
    if (!user.cinemaComplexId) {
      throw new ForbiddenException(
        'Tài khoản Staff này chưa được phân bổ vào cụm rạp nào. Vui lòng liên hệ Admin.',
      );
    }
    if (user.cinemaComplexId !== targetComplexId) {
      throw new ForbiddenException(
        'Bạn không có quyền quản lý hệ thống cụm rạp này.',
      );
    }
  }

  // Nếu là user thường nhưng lại lọt vào đây (ví dụ API lỗi Guard), chặn luôn
  if (user.userType === 'user') {
    throw new ForbiddenException('User không có quyền thực hiện thao tác này.');
  }

  return true;
}
