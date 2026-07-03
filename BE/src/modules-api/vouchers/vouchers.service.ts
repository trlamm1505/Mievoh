import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../modules-system/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ApplyVoucherDto,
  CreateVoucherDto,
  UpdateVoucherDto,
} from './dto/vouchers.dto';
import { User as PrismaUser } from '../../modules-system/prisma/generated/prisma/client';

// Helper parse date DD/MM/YYYY hoặc ISO sang Date object
function parseVnDate(dateStr: string): Date {
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month}-${day}T00:00:00Z`);
  }
  return new Date(dateStr);
}

@Injectable()
export class VouchersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createVoucher(dto: CreateVoucherDto, user: PrismaUser) {
    // 1. Kiểm tra quyền của Staff
    let targetCinemaComplexId = dto.cinemaComplexId || null;

    if (user.userType === 'staff') {
      if (!user.cinemaComplexId) {
        throw new ForbiddenException(
          'Tài khoản Staff của bạn chưa được gán với Cụm rạp nào.',
        );
      }
      // Staff chỉ được tạo mã cho cụm rạp của mình
      targetCinemaComplexId = user.cinemaComplexId;
    }

    // 2. Format mã giảm giá (Viết hoa, xóa khoảng trắng)
    const code = dto.code.toUpperCase().replace(/\s+/g, '');

    // 3. Kiểm tra mã tồn tại
    const existing = await this.prisma.voucher.findUnique({ where: { code } });
    if (existing) {
      throw new BadRequestException('Mã giảm giá này đã tồn tại!');
    }

    if (parseVnDate(dto.startDate) >= parseVnDate(dto.endDate)) {
      throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu!');
    }

    // 4. Tạo Voucher
    const voucher = await this.prisma.voucher.create({
      data: {
        code,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        maxDiscount: dto.maxDiscount || null,
        minPurchase: dto.minPurchase || null,
        startDate: parseVnDate(dto.startDate),
        endDate: parseVnDate(dto.endDate),
        usageLimit: dto.usageLimit || null,
        cinemaComplexId: targetCinemaComplexId,
        createdByEmail: user.email,
      },
    });

    // 5. Nếu có yêu cầu Broadcast
    if (dto.isBroadcast) {
      const discountText =
        dto.discountType === 'PERCENTAGE'
          ? `${dto.discountValue}%`
          : `${dto.discountValue.toLocaleString()}đ`;

      await this.notificationsService.broadcastNotification(
        {
          title: '🎟️ Tặng bạn Mã Giảm Giá mới!',
          message: `Nhanh tay nhập mã ${code} để được giảm ngay ${discountText}. Số lượng có hạn!`,
        },
        user.email,
      );
    }

    return {
      message: 'Tạo mã giảm giá thành công!',
      data: voucher,
    };
  }

  async getPublicVouchers(cinemaComplexId?: string) {
    const now = new Date();
    return this.prisma.voucher.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        // Lấy mã toàn quốc hoặc mã thuộc cụm rạp chỉ định
        OR: [{ cinemaComplexId: null }, { cinemaComplexId }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyVouchers(email: string) {
    const now = new Date();
    // Lấy tất cả mã đang active
    const activeVouchers = await this.prisma.voucher.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    // Lọc ra các mã mà User này đã dùng
    const userUsages = await this.prisma.voucherUsage.findMany({
      where: { email },
      select: { voucherId: true },
    });

    const usedVoucherIds = new Set(userUsages.map((u) => u.voucherId));

    // Lọc ra các mã chưa dùng và chưa hết lượt
    const eligibleVouchers = activeVouchers.filter((v) => {
      // Bỏ qua nếu đã dùng
      if (usedVoucherIds.has(v.voucherId)) return false;
      // Bỏ qua nếu đã hết lượt
      if (v.usageLimit && v.usedCount >= v.usageLimit) return false;
      return true;
    });

    return {
      message: 'Lấy danh sách mã giảm giá thành công',
      data: eligibleVouchers,
    };
  }

  async updateVoucher(id: string, dto: UpdateVoucherDto, user: PrismaUser) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { voucherId: id },
    });

    if (!voucher) throw new NotFoundException('Không tìm thấy mã giảm giá');

    if (user.userType === 'staff' && voucher.cinemaComplexId !== user.cinemaComplexId) {
      throw new ForbiddenException('Bạn không có quyền sửa mã giảm giá của rạp khác!');
    }

    const updated = await this.prisma.voucher.update({
      where: { voucherId: id },
      data: {
        discountValue: dto.discountValue,
        maxDiscount: dto.maxDiscount,
        minPurchase: dto.minPurchase,
        startDate: dto.startDate ? parseVnDate(dto.startDate) : undefined,
        endDate: dto.endDate ? parseVnDate(dto.endDate) : undefined,
        usageLimit: dto.usageLimit,
        isActive: dto.isActive,
      },
    });

    return { message: 'Cập nhật thành công', data: updated };
  }

  async deleteVoucher(id: string, user: PrismaUser) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { voucherId: id },
    });

    if (!voucher) throw new NotFoundException('Không tìm thấy mã giảm giá');

    if (user.userType === 'staff' && voucher.cinemaComplexId !== user.cinemaComplexId) {
      throw new ForbiddenException('Bạn không có quyền xóa mã giảm giá của rạp khác!');
    }

    await this.prisma.voucher.delete({ where: { voucherId: id } });

    return { message: 'Xóa mã giảm giá thành công' };
  }

  async applyVoucher(dto: ApplyVoucherDto, email: string) {
    // 1. Tìm đơn hàng Booking
    const booking = await this.prisma.booking.findUnique({
      where: { bookingId: dto.bookingId },
      include: {
        Showtime: { select: { cinemaId: true } },
      },
    });

    if (!booking) throw new NotFoundException('Không tìm thấy đơn hàng (Booking)!');
    if (booking.email !== email) throw new ForbiddenException('Đây không phải là đơn hàng của bạn!');
    if (booking.paymentStatus === 'Success') throw new BadRequestException('Đơn hàng đã thanh toán không thể áp mã!');

    // 2. Tìm thông tin rạp để so sánh cinemaComplexId
    const cinema = await this.prisma.cinema.findUnique({
      where: { cinemaId: booking.Showtime?.cinemaId || '' },
      select: { cinemaComplexId: true },
    });

    // 3. Lấy thông tin Voucher
    const code = dto.code.toUpperCase().replace(/\s+/g, '');
    const voucher = await this.prisma.voucher.findUnique({ where: { code } });

    if (!voucher) throw new NotFoundException('Mã giảm giá không tồn tại!');
    if (!voucher.isActive) throw new BadRequestException('Mã giảm giá đã bị khóa!');

    const now = new Date();
    if (now < voucher.startDate) throw new BadRequestException('Mã giảm giá chưa đến ngày sử dụng!');
    if (now > voucher.endDate) throw new BadRequestException('Mã giảm giá đã hết hạn!');

    // Kiểm tra giới hạn rạp
    if (voucher.cinemaComplexId && voucher.cinemaComplexId !== cinema?.cinemaComplexId) {
      throw new BadRequestException('Mã giảm giá không áp dụng cho cụm rạp này!');
    }

    // Kiểm tra số lượt
    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng!');
    }

    // Kiểm tra User đã dùng chưa
    const alreadyUsed = await this.prisma.voucherUsage.findFirst({
      where: { voucherId: voucher.voucherId, email },
    });
    if (alreadyUsed) {
      throw new BadRequestException('Bạn đã sử dụng mã giảm giá này rồi!');
    }

    // Kiểm tra giá trị đơn hàng tối thiểu
    if (voucher.minPurchase && booking.totalPrice < voucher.minPurchase) {
      throw new BadRequestException(`Đơn hàng tối thiểu phải từ ${voucher.minPurchase.toLocaleString()}đ!`);
    }

    // 4. Tính toán số tiền giảm
    let discountAmount = 0;
    if (voucher.discountType === 'FIXED') {
      discountAmount = voucher.discountValue;
    } else if (voucher.discountType === 'PERCENTAGE') {
      discountAmount = Math.floor((booking.totalPrice * voucher.discountValue) / 100);
      if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
        discountAmount = voucher.maxDiscount;
      }
    }

    // Không được giảm lố tiền đơn hàng
    if (discountAmount > booking.totalPrice) {
      discountAmount = booking.totalPrice;
    }

    return {
      message: 'Mã giảm giá hợp lệ!',
      data: {
        discountAmount,
        originalPrice: booking.totalPrice,
        finalPrice: booking.totalPrice - discountAmount,
        voucherId: voucher.voucherId,
      },
    };
  }
}
