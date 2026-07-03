import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_ROLES } from '../decorators/role.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // lấy roles từ metadata
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(IS_ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // lấy thông tin user từ request sau khi đã được AuthGuard xác thực
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // kiểm tra user có đăng nhập và có userType không
    if (!user || !user.userType) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập tài nguyên này',
      );
    }

    // chuẩn hóa userType về chữ thường để so sánh
    const userRole = user.userType.toLowerCase();

    // kiểm tra role của user có nằm trong danh sách các role được cho phép không
    if (!requiredRoles.map((role) => role.toLowerCase()).includes(userRole)) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập tài nguyên này',
      );
    }

    return true;
  }
}
