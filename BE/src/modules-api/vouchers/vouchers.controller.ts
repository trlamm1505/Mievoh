import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { VouchersService } from './vouchers.service';
import { RoleGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/role.decorator';
import { User } from '../../common/decorators/user.decorator';
import type { User as PrismaUser } from '../../modules-system/prisma/generated/prisma/client';
import {
  ApplyVoucherDto,
  CreateVoucherDto,
  UpdateVoucherDto,
} from './dto/vouchers.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Vouchers')
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách mã giảm giá đang áp dụng' })
  @ApiQuery({ name: 'cinemaComplexId', required: false, type: String })
  getPublicVouchers(@Query('cinemaComplexId') cinemaComplexId?: string) {
    return this.vouchersService.getPublicVouchers(cinemaComplexId);
  }

  @Get('my-vouchers')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy mã giảm giá khả dụng của tôi' })
  getMyVouchers(@User() user: PrismaUser) {
    return this.vouchersService.getMyVouchers(user.email);
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Tạo mã giảm giá (ADMIN, STAFF)' })
  createVoucher(@Body() dto: CreateVoucherDto, @User() user: PrismaUser) {
    return this.vouchersService.createVoucher(dto, user);
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Cập nhật mã giảm giá (ADMIN, STAFF)' })
  updateVoucher(
    @Param('id') id: string,
    @Body() dto: UpdateVoucherDto,
    @User() user: PrismaUser,
  ) {
    return this.vouchersService.updateVoucher(id, dto, user);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Xóa mã giảm giá (ADMIN, STAFF)' })
  deleteVoucher(@Param('id') id: string, @User() user: PrismaUser) {
    return this.vouchersService.deleteVoucher(id, user);
  }

  @Post('apply')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Kiểm tra mã giảm giá (áp dụng trước khi thanh toán)' })
  applyVoucher(@Body() dto: ApplyVoucherDto, @User() user: PrismaUser) {
    return this.vouchersService.applyVoucher(dto, user.email);
  }
}
