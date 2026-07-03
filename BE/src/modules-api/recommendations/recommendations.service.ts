import { Injectable, Inject, OnModuleInit, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from '../../modules-system/prisma/prisma.service';
import { ConfigCronDto, CronJobType } from './dto/recommendations.dto';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class RecommendationsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('RECOMMENDATION_SERVICE')
    private readonly recommendationClient: ClientProxy,
    @InjectQueue('email_cron_queue') private readonly emailCronQueue: Queue,
    @InjectQueue('analysis_cron_queue')
    private readonly analysisCronQueue: Queue,
  ) {}

  async onModuleInit() {
    // Kéo toàn bộ cấu hình Cron đang lưu trong Redis ra
    const existingEmailJobs = await this.emailCronQueue.getRepeatableJobs();
    const hasEmailCron = existingEmailJobs.length > 0;

    // Chỉ nạp lịch mặc định (8h sáng) nếu trong Redis chưa hề có
    if (!hasEmailCron) {
      await this.emailCronQueue.add(
        'DEFAULT Email 08h00 Mỗi Ngày',
        {},
        {
          jobId: 'default-email-cron',
          repeat: { pattern: '0 8 * * *', tz: 'Asia/Ho_Chi_Minh' },
        },
      );
    }

    const existingAnalysisJobs =
      await this.analysisCronQueue.getRepeatableJobs();
    const hasAnalysisCron = existingAnalysisJobs.length > 0;

    // Chỉ nạp lịch mặc định (2h sáng CN) nếu trong Redis chưa hề có
    if (!hasAnalysisCron) {
      await this.analysisCronQueue.add(
        'DEFAULT Analysis 02h00 Chủ Nhật',
        {},
        {
          jobId: 'default-analysis-cron',
          repeat: { pattern: '0 2 * * 0', tz: 'Asia/Ho_Chi_Minh' },
        },
      );
    }
  }

  async getMyMovies(email: string) {
    const recs = await this.prisma.userRecommendation.findMany({
      where: { email },
      include: {
        Movie: {
          select: { title_vi: true, imageUrl: true, averageRating: true },
        },
      },
      orderBy: { matchScore: 'desc' },
    });
    return { data: recs };
  }

  async triggerAnalysis(userId: string) {
    this.recommendationClient.emit('TRIGGER_ANALYSIS', {
      timestamp: new Date(),
      userId: userId,
    });
    return true;
  }

  async triggerEmail() {
    // Đẩy một Job thường (không lặp) vào hàng đợi để Processor nhai ngay lập tức
    await this.emailCronQueue.add('send_emails', { manual: true });
    return true;
  }

  async configCron(configDto: ConfigCronDto) {
    const queue =
      configDto.type === CronJobType.EMAIL
        ? this.emailCronQueue
        : this.analysisCronQueue;

    // Nếu Client có gửi name (tên tự đặt) thì xài, không thì dùng mặc định
    const jobName =
      configDto.name ||
      (configDto.type === CronJobType.EMAIL ? 'send_emails' : 'run_analysis');
    // Không xóa job cũ nữa, cho phép lưu nhiều lịch cùng lúc
    // Thêm job mới
    await queue.add(
      jobName,
      {},
      {
        jobId: jobName + '-' + Date.now(), // Đảm bảo ID duy nhất cho mỗi job lặp
        repeat: {
          pattern: configDto.cronExpression,
          tz: 'Asia/Ho_Chi_Minh',
        },
      },
    );

    return {
      message: `Thêm Cron Job [${jobName}] thành công!`,
      cronExpression: configDto.cronExpression,
    };
  }

  async deleteCron(repeatKey: string) {
    // Không cần truyền type, hệ thống tự động tìm và xóa ở cả 2 hàng đợi
    // Vì repeatKey là Unique nên chỉ có 1 hàng đợi xóa thành công
    const [emailRemoved, analysisRemoved] = await Promise.all([
      this.emailCronQueue.removeRepeatableByKey(repeatKey).catch(() => false),
      this.analysisCronQueue.removeRepeatableByKey(repeatKey).catch(() => false)
    ]);

    if (!emailRemoved && !analysisRemoved) {
      throw new NotFoundException('Không tìm thấy Cron Job với Key này hoặc đã bị xóa trước đó.');
    }

    return { message: 'Đã xóa Cron Job thành công' };
  }

  async getCampaignStats() {
    const totalSent = await this.prisma.userRecommendation.count({
      where: { isEmailSent: true },
    });
    const totalPending = await this.prisma.userRecommendation.count({
      where: { isEmailSent: false },
    });
    return { totalSent, totalPending };
  }

  async getListCronJobs() {
    const emailJobs = await this.emailCronQueue.getRepeatableJobs();
    const analysisJobs = await this.analysisCronQueue.getRepeatableJobs();

    return {
      emailCron: emailJobs.map((job) => ({
        key: job.key, // Thêm key để làm mã định danh khi gọi API xóa
        name: job.name,
        pattern: (job as any).cron || (job as any).pattern || null,
        nextExecution: job.next ? new Date(job.next) : null,
      })),
      analysisCron: analysisJobs.map((job) => ({
        key: job.key,
        name: job.name,
        pattern: (job as any).cron || (job as any).pattern || null,
        nextExecution: job.next ? new Date(job.next) : null,
      })),
    };
  }
}
