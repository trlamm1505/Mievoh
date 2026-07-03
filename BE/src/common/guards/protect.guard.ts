import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TokenService } from '../../modules-system/token/token.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../modules-system/prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private tokenService: TokenService,
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Vui lòng cung cấp token');
    }
    try {
      const payload = await this.tokenService.verifyAccessToken(token);
      const userExits = await this.prisma.user.findUnique({
        where: {
          email: (payload as any).email,
        },
      });
      if (!userExits) {
        throw new UnauthorizedException();
      }
      // Loại bỏ mật khẩu trước khi gán vào request
      const { password, ...userWithoutPassword } = userExits;
      request['user'] = userWithoutPassword;
    } catch (err) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
