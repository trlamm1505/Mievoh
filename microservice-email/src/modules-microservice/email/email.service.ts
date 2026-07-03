import { Injectable, Logger } from '@nestjs/common';
import { transporter } from '../../common/config/mailer';
import { EMAIL_USER, FRONTEND_URL } from '../../common/constant/app.constant';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendRecommendationEmail(data: { email: string; movies: any[] }) {
    try {
      const { email, movies } = data;

      let htmlContent = `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #110826; color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #2e1a5a;">
          <div style="background: linear-gradient(135deg, #8b5cf6, #4c1d95); padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">MIEVOH CINEMA</h1>
            <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 500;">Tuyệt tác điện ảnh dành riêng cho bạn</p>
          </div>
          <div style="padding: 40px 30px;">
            <p style="font-size: 16px; line-height: 1.6; color: #e4e4e7; margin-top: 0;">Chào bạn,</p>
            <p style="font-size: 16px; line-height: 1.6; color: #a1a1aa;">Dựa trên gu thưởng thức điện ảnh tinh tế của bạn, Hệ thống của chúng tôi đã chọn lọc ra những siêu phẩm sau đây. Đảm bảo bạn sẽ không thể rời mắt khỏi màn hình!</p>
            
            <div style="margin-top: 40px;">
      `;

      movies.forEach((movie) => {
        htmlContent += `
          <div style="background-color: #1a0f35; border-radius: 12px; overflow: hidden; margin-bottom: 24px; border: 1px solid #2e1a5a; display: table; width: 100%;">
            <div style="display: table-cell; width: 120px; vertical-align: middle;">
              <img src="${movie.imageUrl}" alt="${movie.name}" style="width: 120px; height: 180px; display: block; object-fit: cover;" />
            </div>
            <div style="display: table-cell; padding: 20px; vertical-align: top;">
              <h3 style="margin: 0 0 12px; color: #ffffff; font-size: 20px; font-weight: 600;">${movie.name}</h3>
              <div style="display: inline-block; background-color: rgba(139, 92, 246, 0.15); color: #a78bfa; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 700; border: 1px solid rgba(139, 92, 246, 0.3); margin-bottom: 20px;">
                Độ phù hợp: ${movie.matchScore}%
              </div>
              <br>
              <a href="${FRONTEND_URL}/movie/${movie.movieId}" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; text-align: center;">Xem chi tiết</a>
            </div>
          </div>
        `;
      });

      htmlContent += `
            </div>
            <p style="font-size: 16px; color: #e4e4e7; text-align: center; margin-top: 40px;">Hãy đặt vé ngay hôm nay để có chỗ ngồi đẹp nhất!</p>
          </div>
        </div>
      `;

      const info = await transporter.sendMail({
        from: `"MieVoh Cinema" <noreply@mievoh.io.vn>`,
        to: email,
        subject: 'Gợi ý những bộ phim bạn không nên bỏ lỡ',
        html: htmlContent,
      });

      this.logger.log(
        `[Recommendation Email] Đã gửi thành công đến ${info.messageId}`,
      );
    } catch (error) {
      this.logger.error(`[Recommendation Email] Lỗi khi gửi email: ${error}`);
      throw error;
    }
  }

  async sendOtpEmail(data: { to: string; fullName: string; otp: string; type: 'register' | 'forgot_password' }) {
    try {
      const { to, fullName, otp, type } = data;
      const isRegister = type === 'register';
      const subject = isRegister ? 'Xác thực tài khoản đăng ký Mievoh' : 'Xác thực khôi phục mật khẩu Mievoh';
      const actionText = isRegister ? 'Xác Thực Tài Khoản Đăng Ký' : 'Yêu Cầu Khôi Phục Mật Khẩu';
      const descText = isRegister 
        ? 'Bạn vừa yêu cầu lấy mã OTP để đăng ký tài khoản. Vui lòng sử dụng mã bảo mật dưới đây để hoàn tất quá trình:'
        : 'Bạn vừa yêu cầu lấy mã OTP để khôi phục mật khẩu. Vui lòng sử dụng mã bảo mật dưới đây để đổi mật khẩu mới:';
      const ignoreText = isRegister 
        ? 'Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.'
        : 'Nếu bạn không yêu cầu đổi mật khẩu, có thể ai đó đang cố truy cập tài khoản của bạn. Vui lòng bỏ qua email này.';

      const html = `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #110826; color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #2e1a5a;">
          <div style="background: linear-gradient(135deg, #8b5cf6, #4c1d95); padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: 1px;">MIEVOH CINEMA</h1>
            <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 500;">${actionText}</p>
          </div>
          <div style="padding: 40px 30px;">
            <p style="font-size: 16px; line-height: 1.6; color: #e4e4e7; margin-top: 0;">Chào ${fullName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #a1a1aa;">${descText}</p>
            <div style="margin: 30px 0; text-align: center;">
              <div style="display: inline-block; background-color: #1a0f35; color: #8b5cf6; padding: 15px 30px; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 4px; border: 1px solid #2e1a5a;">${otp}</div>
            </div>
            <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa; text-align: center;">Mã này sẽ hết hạn sau <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai để đảm bảo an toàn.</p>
            <div style="text-align: center; margin-top: 40px; border-top: 1px solid #2e1a5a; padding-top: 30px;">
              <p style="color: #a1a1aa; font-size: 14px; margin: 0;">${ignoreText}</p>
              <h2 style="color: #8b5cf6; margin: 15px 0 0; font-size: 20px; font-weight: 700;">Đội ngũ MIEVOH</h2>
            </div>
          </div>
        </div>
      `;

      const info = await transporter.sendMail({
        from: `"MieVoh Cinema" <noreply@mievoh.io.vn>`,
        to,
        subject,
        html,
      });

      this.logger.log(`[OTP Email] Đã gửi thành công đến ${info.messageId}`);
    } catch (error) {
      this.logger.error(`[OTP Email] Lỗi khi gửi email: ${error}`);
      throw error;
    }
  }

  async sendBookingSuccessEmail(data: {
    to: string;
    ticketCode: string;
    movieTitle: string;
    cinemaName: string;
    showTime: string;
    seats: string;
    amount: number;
  }) {
    try {
      const {
        to,
        ticketCode,
        movieTitle,
        cinemaName,
        showTime,
        seats,
        amount,
      } = data;

      const htmlContent = `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #110826; color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #2e1a5a;">
          <div style="background: linear-gradient(135deg, #8b5cf6, #4c1d95); padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: 1px;">MIEVOH CINEMA</h1>
            <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 18px;">Xác Nhận Đặt Vé Thành Công</p>
          </div>
          <div style="padding: 40px 30px;">
            <p style="font-size: 16px; color: #e4e4e7;">Cảm ơn bạn đã lựa chọn MieVoh Cinema. Dưới đây là thông tin vé của bạn:</p>
            
            <div style="background-color: #1e1040; border-radius: 12px; padding: 20px; margin-top: 20px; border: 1px dashed #8b5cf6;">
              <h2 style="margin-top: 0; color: #a78bfa; font-size: 20px; text-align: center;">${movieTitle}</h2>
              <hr style="border: none; border-top: 1px solid rgba(139, 92, 246, 0.3); margin: 15px 0;" />
              <p style="margin: 8px 0; font-size: 15px;"><strong style="color: #c4b5fd;">Rạp:</strong> ${cinemaName}</p>
              <p style="margin: 8px 0; font-size: 15px;"><strong style="color: #c4b5fd;">Suất chiếu:</strong> ${showTime}</p>
              <p style="margin: 8px 0; font-size: 15px;"><strong style="color: #c4b5fd;">Ghế:</strong> ${seats}</p>
              <p style="margin: 8px 0; font-size: 15px;"><strong style="color: #c4b5fd;">Tổng tiền:</strong> ${amount.toLocaleString('vi-VN')} VNĐ</p>
            </div>

            <div style="margin-top: 30px; text-align: center;">
              <p style="font-size: 15px; color: #a1a1aa; margin-bottom: 10px;">Vui lòng xuất trình mã vé này tại quầy để nhận vé giấy:</p>
              
              <div style="margin-bottom: 20px;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticketCode}" alt="QR Code" style="border: 4px solid #ffffff; border-radius: 8px;" />
              </div>

              <div style="display: inline-block; background-color: #ffffff; color: #000000; padding: 15px 30px; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 4px;">
                ${ticketCode}
              </div>
            </div>

            <p style="font-size: 14px; color: #71717a; text-align: center; margin-top: 40px;">Chúc bạn có một trải nghiệm xem phim tuyệt vời.</p>
          </div>
        </div>
      `;

      const info = await transporter.sendMail({
        from: `"MieVoh Cinema" <noreply@mievoh.io.vn>`,
        to,
        subject: `Xác nhận đặt vé thành công: ${movieTitle}`,
        html: htmlContent,
      });

      this.logger.log(
        `[Booking Email] Đã gửi thành công đến ${info.messageId}`,
      );
    } catch (error) {
      this.logger.error(`[Booking Email] Lỗi khi gửi email: ${error}`);
      throw error;
    }
  }
}
