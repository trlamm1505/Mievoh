import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../modules-system/prisma/prisma.service';
import { SocketService } from '../../modules-system/socket/socket.service';
import { BroadcastNotificationDto } from './dto/notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly socketService: SocketService,
  ) {}

  async getMyNotifications(
    email: string,
    page: number = 1,
    pageSize: number = 10,
  ) {
    const skip = (page - 1) * pageSize;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { email },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.notification.count({ where: { email } }),
      this.prisma.notification.count({ where: { email, isRead: false } }),
    ]);

    return {
      data: notifications,
      total,
      unreadCount,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async markAsRead(email: string, notificationId: string) {
    const notif = await this.prisma.notification.findUnique({
      where: { notificationId },
    });
    if (!notif) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }
    if (notif.email !== email) {
      throw new NotFoundException('Không có quyền truy cập thông báo này');
    }

    const updated = await this.prisma.notification.update({
      where: { notificationId },
      data: { isRead: true },
    });

    // Phát tín hiệu qua Socket để Frontend update UI realtime
    this.socketService.emitMarkAsRead(notificationId, email);

    return updated;
  }

  async markAllAsRead(email: string) {
    const updated = await this.prisma.notification.updateMany({
      where: { email, isRead: false },
      data: { isRead: true },
    });

    // Phát tín hiệu qua Socket
    this.socketService.emitMarkAllAsRead(email);

    return updated;
  }

  async broadcastNotification(
    dto: BroadcastNotificationDto,
    createdBy?: string,
  ) {
    // 1. Lấy tất cả user đang active
    const activeUsers = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { email: true },
    });

    if (activeUsers.length === 0)
      return { message: 'Không có user active nào' };

    // 2. Lưu bản ghi gốc vào bảng Broadcast
    const broadcastRecord = await this.prisma.broadcast.create({
      data: {
        title: dto.title,
        message: dto.message,
        link: dto.link || null,
        createdByEmail: createdBy || 'system',
      },
    });

    // 3. Tạo mảng data để insert nhiều dòng vào bảng Notification
    const dataToInsert = activeUsers.map((u) => ({
      email: u.email,
      title: dto.title,
      message: dto.message,
      link: dto.link || null,
      broadcastId: broadcastRecord.broadcastId, // Gắn ID để sau này quản lý
    }));

    // 4. Insert hàng loạt vào DB
    await this.prisma.notification.createMany({
      data: dataToInsert,
    });

    // 5. Bắn sự kiện broadcast qua Socket
    this.socketService.emitBroadcastNotification({
      title: dto.title,
      message: dto.message,
      link: dto.link,
    });

    return {
      message: `Đã gửi thông báo tới ${activeUsers.length} người dùng`,
      data: broadcastRecord,
    };
  }

  // =====================================
  // QUẢN LÝ BROADCAST (THÔNG BÁO HỆ THỐNG)
  // =====================================

  async getAllBroadcastsAdmin(page: number = 1, pageSize: number = 10) {
    const skip = (page - 1) * pageSize;

    const [broadcasts, total] = await Promise.all([
      this.prisma.broadcast.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.broadcast.count(),
    ]);

    return {
      data: broadcasts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async updateBroadcastAdmin(broadcastId: string, dto: any) {
    const broadcast = await this.prisma.broadcast.findUnique({
      where: { broadcastId },
    });
    if (!broadcast)
      throw new NotFoundException('Không tìm thấy bản ghi Broadcast');

    // 1. Cập nhật bản ghi gốc
    const updatedBroadcast = await this.prisma.broadcast.update({
      where: { broadcastId },
      data: dto,
    });

    // 2. Cập nhật hàng loạt tất cả Notification con của Broadcast này
    await this.prisma.notification.updateMany({
      where: { broadcastId },
      data: dto,
    });

    return {
      message: 'Đã cập nhật Broadcast và toàn bộ thông báo liên quan',
      data: updatedBroadcast,
    };
  }

  async deleteBroadcastAdmin(broadcastId: string) {
    const broadcast = await this.prisma.broadcast.findUnique({
      where: { broadcastId },
    });
    if (!broadcast)
      throw new NotFoundException('Không tìm thấy bản ghi Broadcast');

    // Nhờ có onDelete: Cascade trong Prisma/MongoDB,
    // khi xóa Broadcast, toàn bộ các Notification có chứa broadcastId này sẽ tự động bị xóa theo.
    await this.prisma.broadcast.delete({
      where: { broadcastId },
    });

    return {
      message:
        'Đã xóa Broadcast và thu hồi toàn bộ thông báo liên quan thành công',
    };
  }
}
