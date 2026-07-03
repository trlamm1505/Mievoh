import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from '../../modules-system/prisma/prisma.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { SocketService } from '../../modules-system/socket/socket.service';
import * as crypto from 'crypto';
import * as qs from 'qs';
import { sortObject } from '../../common/helper/vnpay.helper';
import {
  VNP_TMNCODE,
  VNP_HASHSECRET,
  VNP_URL,
  VNP_RETURN_URL,
} from '../../common/constant/app.constant';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly socketService: SocketService,
    @Inject('EMAIL_SERVICE') private readonly emailClient: ClientProxy,
  ) {}

  async createPaymentUrl(
    bookingId: string,
    ipAddr: string,
    clientReturnUrl?: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingId },
    });

    if (!booking) throw new NotFoundException('Không tìm thấy hóa đơn');
    if (booking.paymentStatus !== 'Pending') {
      throw new BadRequestException(
        'Hóa đơn này đã được thanh toán hoặc đã hủy',
      );
    }

    const tmnCode = VNP_TMNCODE!;
    const secretKey = VNP_HASHSECRET!;
    let vnpUrl = VNP_URL!;
    const returnUrl = clientReturnUrl || VNP_RETURN_URL!;

    if (!tmnCode || !secretKey || !vnpUrl) {
      throw new BadRequestException(
        `Debug ENV: TMN=${tmnCode}, SECRET=${secretKey}, URL=${vnpUrl}`,
      );
    }

    // Helper to format date in Vietnam (GMT+7) timezone: YYYYMMDDHHmmss
    const formatVN = (d: Date) => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(d);
      const partMap = Object.fromEntries(parts.map((p) => [p.type, p.value]));
      return `${partMap.year}${partMap.month}${partMap.day}${partMap.hour}${partMap.minute}${partMap.second}`;
    };

    const date = new Date();
    const createDate = formatVN(date);
    const expireDate = formatVN(new Date(date.getTime() + 15 * 60 * 1000)); // cho phép thời gian thanh toán tối đa là 15 phút

    const finalPrice = booking.totalPrice - booking.discountAmount;
    const amount = finalPrice > 0 ? finalPrice * 100 : 10000; // VNPay không nhận số tiền <= 0
    const bankCode = 'NCB'; // mặc định dùng thẻ test NCB của vnpay

    let vnp_Params: any = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = bookingId;
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan ve xem phim ma ' + bookingId;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr; // Gắn cứng IP tĩnh để tránh lỗi IPv6 ::1 của localhost làm VNPay từ chối
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params['vnp_ExpireDate'] = expireDate;
    if (bankCode) {
      vnp_Params['vnp_BankCode'] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;

    vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });

    return { url: vnpUrl };
  }

  async vnpayReturn(vnp_Params: any) {
    let secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    const secretKey = VNP_HASHSECRET!;
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
      // chữ ký điện tử hợp lệ hoàn toàn
      if (vnp_Params['vnp_ResponseCode'] == '00') {
        return { code: '00', message: 'Giao dịch thành công' };
      } else {
        return { code: '97', message: 'Giao dịch thất bại / Đã hủy' };
      }
    } else {
      return { code: '97', message: 'Chữ ký không hợp lệ' };
    }
  }

  async vnpayIpn(vnp_Params: any) {
    let secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);
    const secretKey = VNP_HASHSECRET!;
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
      const bookingId = vnp_Params['vnp_TxnRef'];
      const rspCode = vnp_Params['vnp_ResponseCode'];
      const amount = vnp_Params['vnp_Amount'] / 100; // hệ thống thanh toán gửi số tiền nhân 100, cần chia lại để khớp dữ liệu

      const booking = await this.prisma.booking.findUnique({
        where: { bookingId },
        include: {
          BookingDetails: { include: { Seat: true } },
          Showtime: { include: { Movie: true, Cinema: true } },
        },
      });

      if (!booking) {
        return { RspCode: '01', Message: 'Hóa đơn không tồn tại' };
      }

      const expectedAmount = booking.totalPrice - booking.discountAmount;
      if (expectedAmount !== amount) {
        return { RspCode: '04', Message: 'Số tiền không khớp' };
      }

      if (booking.paymentStatus !== 'Pending') {
        return { RspCode: '02', Message: 'Hóa đơn đã được xử lý' };
      }

      // nếu khách hàng hoàn tất thủ tục thanh toán thành công
      if (rspCode === '00') {
        // tự động sinh mã vé ngẫu nhiên gồm 6 ký tự để làm mã quét lúc vào rạp
        const ticketCode = Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase();

        await this.prisma.booking.update({
          where: { bookingId },
          data: {
            paymentStatus: 'Success',
            paymentMethod: 'VNPay',
            ticketCode,
          },
        });

        // Tích điểm thưởng cho User (VD: 1,000 VNĐ = 1 điểm)
        const earnedPoints = Math.floor(expectedAmount / 1000);
        await this.prisma.user.updateMany({
          where: { email: booking.email },
          data: { rewardPoints: { increment: earnedPoints } },
        });

        // Đánh dấu đã sử dụng Voucher nếu có
        if (booking.voucherId) {
          await this.prisma.voucherUsage.create({
            data: {
              voucherId: booking.voucherId,
              email: booking.email,
              bookingId: booking.bookingId,
            },
          });
          await this.prisma.voucher.update({
            where: { voucherId: booking.voucherId },
            data: { usedCount: { increment: 1 } },
          });
        }

        // giao dịch hoàn tất, tiến hành xóa khóa ghế trong redis để chính thức chuyển sang trạng thái đã bán
        for (const detail of booking.BookingDetails) {
          await this.cacheManager.del(
            `hold:${booking.showtimeId}:${detail.seatId}`,
          );
        }

        // Bắn sự kiện gửi email xác nhận mua vé
        if (booking.Showtime && booking.Showtime.Movie && booking.Showtime.Cinema) {
          this.emailClient.emit('booking_success', {
            to: booking.email,
            ticketCode,
            movieTitle: booking.Showtime.Movie.title_vi || booking.Showtime.Movie.title_en,
            cinemaName: booking.Showtime.Cinema.name,
            showTime: booking.Showtime.showDateTime?.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
            seats: booking.BookingDetails.map(d => d.Seat?.name).join(', '),
            amount: expectedAmount,
          });
        }

        // Lưu thông báo vào DB
        const notif = await this.prisma.notification.create({
          data: {
            email: booking.email,
            title: 'Thanh toán thành công',
            message: `Hóa đơn mua vé xem phim của bạn đã được thanh toán. Mã vé: ${ticketCode}. Bạn được cộng thêm ${earnedPoints} điểm thưởng.`,
            link: `/profile?tab=tickets`, // redirect về trang lịch sử mua vé
          },
        });

        // Bắn Socket Realtime cho user ngay tức khắc
        this.socketService.emitNotification(booking.email, {
          title: notif.title,
          message: notif.message,
          link: notif.link,
        });

        return { RspCode: '00', Message: 'Thành công' };
      } else {
        // khách hàng chủ động hủy giao dịch hoặc thẻ bị từ chối
        await this.prisma.booking.update({
          where: { bookingId },
          data: {
            paymentStatus: 'Failed',
            paymentMethod: 'VNPay',
          },
        });

        // giải phóng ghế khỏi redis ngay lập tức để người khác có thể đặt
        for (const detail of booking.BookingDetails) {
          await this.cacheManager.del(
            `hold:${booking.showtimeId}:${detail.seatId}`,
          );
        }

        return { RspCode: '00', Message: 'Giao dịch lỗi' };
      }
    } else {
      return { RspCode: '97', Message: 'Checksum không hợp lệ' };
    }
  }
}
