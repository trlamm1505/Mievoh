import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginAuthDto,
  RegisterAuthDto,
  VerifyRegisterOtpDto,
  VerifyEmailDto,
  VerifyResetOtpDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { User } from '../../common/decorators/user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { FRONTEND_URL } from '../../common/constant/app.constant';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập vào hệ thống bằng tài khoản Local' })
  @ApiResponse({
    status: 201,
    description: 'Đăng nhập thành công, trả về token.',
  })
  @ApiResponse({ status: 400, description: 'Sai tài khoản hoặc mật khẩu.' })
  login(@Body() loginDto: LoginAuthDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register/send-otp')
  @ApiOperation({ summary: 'Gửi mã OTP đăng ký tài khoản qua Email' })
  @ApiResponse({ status: 201, description: 'Gửi OTP thành công.' })
  @ApiResponse({
    status: 400,
    description: 'Email hoặc số điện thoại đã tồn tại.',
  })
  requestRegisterOtp(@Body() registerDto: RegisterAuthDto) {
    return this.authService.requestRegisterOtp(registerDto);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Xác thực OTP và tạo tài khoản' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công, trả về JWT Token.' })
  @ApiResponse({
    status: 400,
    description: 'Mã OTP không chính xác hoặc đã hết hạn.',
  })
  verifyRegisterOtp(@Body() verifyDto: VerifyRegisterOtpDto) {
    return this.authService.verifyRegisterOtp(verifyDto);
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Khởi tạo đăng nhập bằng Google (Chuyển hướng)' })
  @ApiResponse({
    status: 302,
    description: 'Chuyển hướng người dùng sang trang đăng nhập của Google.',
  })
  async googleAuth(@Req() req: Request) {
    // Passport sẽ tự động chuyển hướng sang Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Callback nhận dữ liệu từ Google trả về' })
  @ApiResponse({
    status: 302,
    description:
      'Xác thực Google thành công, chuyển hướng về Frontend với Token.',
  })
  async googleAuthRedirect(@Req() req: Request, @Res() res: any) {
    const result = await this.authService.googleLogin(req);
    const token = result.token.accessToken;
    const user = result.user;

    const frontendUrl = FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/login#token=${token}&email=${user.email}&fullName=${encodeURIComponent(user.fullName || '')}&avatar=${user.avatar || ''}&userType=${user.userType || 'USER'}`;

    return res.redirect(redirectUrl);
  }

  @Public()
  @Post('google/mobile')
  @ApiOperation({
    summary: 'Đăng nhập Google bằng idToken dành cho Mobile App',
  })
  @ApiResponse({
    status: 200,
    description: 'Xác thực thành công, trả về JWT và thông tin user.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token Google không hợp lệ hoặc đã hết hạn.',
  })
  async googleLoginMobile(@Body('idToken') idToken: string) {
    return this.authService.googleLoginMobile(idToken);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Gửi mã OTP khôi phục mật khẩu vào Email' })
  @ApiResponse({ status: 201, description: 'Gửi mã OTP thành công.' })
  @ApiResponse({ status: 404, description: 'Email chưa đăng ký.' })
  verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Public()
  @Post('forgot-password/verify-otp')
  @ApiOperation({ summary: 'Xác thực OTP và nhận mã Reset Token (bước 2)' })
  @ApiResponse({ status: 201, description: 'Xác thực thành công, trả về Reset Token.' })
  @ApiResponse({ status: 400, description: 'Mã OTP không chính xác hoặc đã hết hạn.' })
  verifyResetOtp(@Body() dto: VerifyResetOtpDto) {
    return this.authService.verifyResetOtp(dto);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Dùng Reset Token để đặt lại mật khẩu mới (bước 3)' })
  @ApiResponse({ status: 201, description: 'Đặt lại mật khẩu thành công.' })
  @ApiResponse({ status: 400, description: 'Reset Token không hợp lệ hoặc đã hết hạn.' })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('change-password')
  @ApiOperation({ summary: 'Thay đổi mật khẩu khi đang đăng nhập' })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công.' })
  @ApiResponse({
    status: 400,
    description: 'Mật khẩu cũ không chính xác hoặc tài khoản là OAuth.',
  })
  changePassword(
    @User() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.email, changePasswordDto);
  }
}
