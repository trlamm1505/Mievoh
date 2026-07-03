import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Ip,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/bookings.dto';
import { RoleGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/role.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User } from '../../common/decorators/user.decorator';
import type { User as PrismaUser } from '../../modules-system/prisma/generated/prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('/seats-status/:showtimeId')
  @Public()
  @ApiOperation({ summary: 'Lấy trạng thái tất cả ghế của suất chiếu (Kiểm tra DB + Redis)' })
  @ApiResponse({ status: 200, description: 'Lấy dữ liệu thành công' })
  getSeatsStatus(@Param('showtimeId') showtimeId: string) {
    return this.bookingsService.getSeatsStatus(showtimeId);
  }

  @Post()
  @UseGuards(RoleGuard)
  @Roles('user', 'admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Đặt vé (Khóa ghế 5 phút và tự động sinh URL VNPay)' })
  @ApiResponse({ status: 201, description: 'Đặt vé thành công, trả về Booking kèm URL VNPay' })
  @ApiResponse({ status: 409, description: 'Trùng lịch / Khách khác đang giữ ghế' })
  createBooking(
    @User() user: PrismaUser,
    @Ip() ipAddr: string,
    @Body() data: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(
      user.email,
      data,
      ipAddr || '127.0.0.1',
    );
  }

  @Get('my-history')
  @UseGuards(RoleGuard)
  @Roles('user', 'admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy lịch sử đặt vé của người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  getMyHistory(@User() user: PrismaUser) {
    const email = user.email;
    return this.bookingsService.getMyHistory(email);
  }

  @Get(':id')
  @UseGuards(RoleGuard)
  @Roles('user', 'admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một hóa đơn đặt vé' })
  @ApiResponse({ status: 200, description: 'Lấy dữ liệu thành công' })
  getBookingById(@User() user: PrismaUser, @Param('id') id: string) {
    return this.bookingsService.getBookingById(user.email, id);
  }
}
