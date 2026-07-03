import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/protect.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/role.decorator';
import { User } from '../../common/decorators/user.decorator';
import type { User as PrismaUser } from '../../modules-system/prisma/generated/prisma/client';
import {
  BroadcastNotificationDto,
  UpdateNotificationDto,
} from './dto/notifications.dto';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thông báo của User (Phân trang)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số trang (mặc định 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Số lượng (mặc định 10)',
  })
  getMyNotifications(
    @User() user: PrismaUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ) {
    return this.notificationsService.getMyNotifications(
      user.email,
      page,
      pageSize,
    );
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Đánh dấu đã đọc TẤT CẢ thông báo' })
  markAllAsRead(@User() user: PrismaUser) {
    return this.notificationsService.markAllAsRead(user.email);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Đánh dấu 1 thông báo là đã đọc' })
  markAsRead(@Param('id') id: string, @User() user: PrismaUser) {
    return this.notificationsService.markAsRead(user.email, id);
  }

  @Post('broadcast')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Gửi thông báo toàn hệ thống (ADMIN)' })
  broadcastNotification(
    @Body() dto: BroadcastNotificationDto,
    @User() user: PrismaUser,
  ) {
    return this.notificationsService.broadcastNotification(dto, user.email);
  }

  // =====================================
  // QUẢN LÝ BROADCAST
  // =====================================

  @Get('broadcasts')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Lấy danh sách các Broadcast đã phát (ADMIN)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số trang (mặc định 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Số lượng (mặc định 10)',
  })
  getAllBroadcastsAdmin(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ) {
    return this.notificationsService.getAllBroadcastsAdmin(page, pageSize);
  }

  @Put('broadcasts/:id')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiOperation({
    summary: 'Cập nhật thông báo toàn hệ thống (ADMIN)',
  })
  updateBroadcastAdmin(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationDto,
  ) {
    return this.notificationsService.updateBroadcastAdmin(id, dto);
  }

  @Delete('broadcasts/:id')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiOperation({
    summary: 'Xóa thông báo toàn hệ thống (ADMIN)',
  })
  deleteBroadcastAdmin(@Param('id') id: string) {
    return this.notificationsService.deleteBroadcastAdmin(id);
  }
}
