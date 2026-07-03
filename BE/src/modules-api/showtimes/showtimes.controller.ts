import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { User } from '../../common/decorators/user.decorator';
import type { User as PrismaUser } from '../../modules-system/prisma/generated/prisma/client';
import { ShowtimesService } from './showtimes.service';
import { CreateShowtimeDto, UpdateShowtimeDto } from './dto/showtimes.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { RoleGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/role.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Showtimes')
@Controller('showtimes')
export class ShowtimesController {
  constructor(private readonly showtimesService: ShowtimesService) {}

  @Get('/movie/:movieId')
  @Public()
  @ApiOperation({
    summary: 'Lấy lịch chiếu của 1 Phim (Gom nhóm theo Hệ thống rạp)',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Ngày chiếu (DD/MM/YYYY)',
  })
  @ApiResponse({ status: 200, description: 'Lấy lịch chiếu thành công' })
  findByMovie(@Param('movieId') movieId: string, @Query('date') date: string) {
    return this.showtimesService.findByMovie(movieId, date);
  }

  @Get('/complex/:complexId')
  @Public()
  @ApiOperation({
    summary: 'Lấy lịch chiếu của 1 Cụm rạp (Gom nhóm theo Phim)',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Ngày chiếu (DD/MM/YYYY)',
  })
  @ApiResponse({ status: 200, description: 'Lấy lịch chiếu thành công' })
  findByComplex(
    @Param('complexId') complexId: string,
    @Query('date') date: string,
  ) {
    return this.showtimesService.findByComplex(complexId, date);
  }

  @Get('/:showtimeId')
  @Public()
  @ApiOperation({
    summary: 'Lấy thông tin tóm tắt 1 Suất chiếu (Dùng cho Header Chọn ghế)',
  })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  findById(@Param('showtimeId') showtimeId: string) {
    return this.showtimesService.findById(showtimeId);
  }

  @Post()
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo suất chiếu mới (Có check trùng giờ) (ADMIN, STAFF)',
  })
  @ApiResponse({ status: 201, description: 'Tạo suất chiếu thành công' })
  @ApiResponse({ status: 409, description: 'Trùng lịch chiếu' })
  create(
    @Body() createShowtimeDto: CreateShowtimeDto,
    @User() user: PrismaUser,
  ) {
    return this.showtimesService.create(createShowtimeDto, user);
  }

  @Put()
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật suất chiếu (ADMIN, STAFF)' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 403, description: 'Đã có vé bán, không thể sửa' })
  update(
    @Body() updateShowtimeDto: UpdateShowtimeDto,
    @User() user: PrismaUser,
  ) {
    return this.showtimesService.update(updateShowtimeDto, user);
  }

  @Delete('/:showtimeId')
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa suất chiếu (ADMIN, STAFF)' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 403, description: 'Đã có vé bán, không thể xóa' })
  delete(@Param('showtimeId') showtimeId: string, @User() user: PrismaUser) {
    return this.showtimesService.delete(showtimeId, user);
  }
}
