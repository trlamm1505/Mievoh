import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import {
  GOOGLE_CALLBACK_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from '../constant/app.constant';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    // Gọi hàm khởi tạo của PassportStrategy với các thông tin cấu hình từ Google
    super({
      clientID: GOOGLE_CLIENT_ID || '',
      clientSecret: GOOGLE_CLIENT_SECRET || '',
      callbackURL:
        GOOGLE_CALLBACK_URL || 'http://localhost:3069/api/auth/google/callback', // Đường dẫn callback sau khi user xác thực xong
      scope: ['email', 'profile'],
    });
  }

  // Hàm validate tự động được gọi sau khi Google trả về kết quả đăng nhập thành công
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    // Trích xuất các thông tin cần thiết từ đối tượng profile do Google trả về
    const { name, emails, photos, id } = profile;

    // Tạo object user chứa dữ liệu đã được tinh gọn để chuyển cho controller/service xử lý tiếp
    const user = {
      googleId: id,
      email: emails[0].value,
      fullName: name.givenName + ' ' + (name.familyName || ''),
      avatar: photos[0].value,
      accessToken,
    };

    // Gọi hàm done để nhét thông tin user vừa tạo vào biến `req.user` ở các bước tiếp theo
    done(null, user);
  }
}
