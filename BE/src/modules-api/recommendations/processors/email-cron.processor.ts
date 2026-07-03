import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../modules-system/prisma/prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { SocketService } from '../../../modules-system/socket/socket.service';

@Processor('email_cron_queue')
@Injectable()
export class RecommendationsProcessor extends WorkerHost {
  private readonly logger = new Logger(RecommendationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('EMAIL_SERVICE') private readonly emailClient: ClientProxy,
    private readonly socketService: SocketService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const triggerType = job.data?.manual ? '[THỦ CÔNG]' : '[TỰ ĐỘNG]';
    this.logger.log(
      `[BullMQ] ${triggerType} [${job.name}] Bắt đầu quét database để gửi Email Marketing...`,
    );

    const pendingRecs = await this.prisma.userRecommendation.findMany({
      where: { isEmailSent: false },
      include: {
        User: { select: { email: true, fullName: true } },
        Movie: { select: { movieId: true, title_vi: true, imageUrl: true } },
      },
      take: 100, // Test nhẹ 100 record mỗi đợt
    });

    if (pendingRecs.length === 0) {
      this.logger.log('[BullMQ] Không có email nào cần gửi.');
      return;
    }

    const groupedData: Record<string, { email: string; movies: any[] }> = {};
    const idsToUpdate: string[] = [];

    for (const rec of pendingRecs) {
      const email = rec.email;
      if (!email) continue;

      if (!groupedData[email]) {
        groupedData[email] = { email, movies: [] };
      }

      // Gửi chung cả 3 phim vào 1 Email theo yêu cầu test của Admin
      groupedData[email].movies.push({
        movieId: rec.movieId,
        name: rec.Movie?.title_vi || 'Phim hay',
        imageUrl:
          rec.Movie?.imageUrl ||
          'https://via.placeholder.com/150x220?text=No+Image',
        matchScore: rec.matchScore,
      });
      idsToUpdate.push(rec.recommendationId);
    }

    const notificationsToInsert: any[] = [];

    for (const [email, payload] of Object.entries(groupedData)) {
      this.emailClient.emit('SEND_CAMPAIGN_EMAIL', {
        email,
        movies: payload.movies,
      });

      const title = 'Ting ting! Gợi ý phim nóng hổi!';
      const message =
        'MieVoh vừa "bói" ra 3 siêu phẩm cực kỳ hợp gu của bạn. Nhấn vào xem ngay đi nàooo! 🍿🔥';
      const link = '/'; // redirect về home

      notificationsToInsert.push({
        email: payload.email,
        title,
        message,
        link,
      });

      // Bắn Notification Realtime tới đúng User
      this.socketService.emitNotification(payload.email, {
        title,
        message,
        link,
      });
    }

    if (notificationsToInsert.length > 0) {
      await this.prisma.notification.createMany({
        data: notificationsToInsert,
      });
    }

    if (idsToUpdate.length > 0) {
      await this.prisma.userRecommendation.updateMany({
        where: { recommendationId: { in: idsToUpdate } },
        data: { isEmailSent: true },
      });
    }

    this.logger.log(
      `[BullMQ] [${job.name}] Đã đẩy ${Object.keys(groupedData).length} emails vào RabbitMQ.`,
    );
  }
}
