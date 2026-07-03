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
import { SeatsService } from './seats.service';
import {
  CreateSeatDto,
  GenerateSeatsDto,
  UpdateSeatDto,
} from './dto/seats.dto';
import { RoleGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/role.decorator';
import { Public } from '../../common/decorators/public.decorator';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Seats')
@ApiExtraModels(CreateSeatDto, UpdateSeatDto, GenerateSeatsDto)
@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Post('/generate')
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Tạo sơ đồ ghế tự động cho rạp (ADMIN, STAFF)' })
  @ApiResponse({ status: 201, description: 'Tạo danh sách ghế thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu cấu hình không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy rạp chiếu' })
  generateSeats(@Body() body: GenerateSeatsDto, @User() user: PrismaUser) {
    return this.seatsService.generateSeats(body, user);
  }

  @Get()
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy toàn bộ sơ đồ ghế tĩnh của một rạp (ADMIN, STAFF)',
  })
  @ApiQuery({
    name: 'cinemaId',
    required: true,
    description: 'Mã rạp chiếu (Phòng chiếu)',
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy rạp chiếu' })
  findAllByCinemaId(
    @Query('cinemaId') cinemaId: string,
    @User() user: PrismaUser,
  ) {
    return this.seatsService.findAllByCinemaId(cinemaId, user);
  }

  @Post()
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Thêm 1 ghế thủ công (ADMIN, STAFF)' })
  @ApiResponse({ status: 201, description: 'Tạo ghế thành công' })
  @ApiResponse({ status: 400, description: 'Tên ghế đã tồn tại' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy rạp chiếu' })
  createSeat(@Body() body: CreateSeatDto, @User() user: PrismaUser) {
    return this.seatsService.create(body, user);
  }

  @Put()
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật thông tin 1 ghế (ADMIN, STAFF)' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ghế' })
  updateSeat(@Body() body: UpdateSeatDto, @User() user: PrismaUser) {
    return this.seatsService.update(body, user);
  }

  @Delete('/:seatId')
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa 1 ghế (ADMIN, STAFF)' })
  @ApiResponse({ status: 200, description: 'Xóa ghế thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ghế' })
  deleteSeat(@Param('seatId') seatId: string, @User() user: PrismaUser) {
    return this.seatsService.delete(seatId, user);
  }
}
