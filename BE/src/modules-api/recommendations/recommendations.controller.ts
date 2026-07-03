import { Controller, Get, Post, Body, UseGuards, Delete } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { RecommendationsService } from './recommendations.service';
import { ConfigCronDto, DeleteCronDto } from './dto/recommendations.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { RoleGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/role.decorator';
import { User } from '../../common/decorators/user.decorator';
import type { User as PrismaUser } from '../../modules-system/prisma/generated/prisma/client';
import { SocketService } from '../../modules-system/socket/socket.service';
@ApiTags('Recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
    private readonly socketService: SocketService,
  ) {}

  @Get('my-movies')
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff', 'user')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy ra top 3 phim được recommend' })
  getMyMovies(@User() user: PrismaUser) {
    return this.recommendationsService.getMyMovies(user.email);
  }

  @Post('trigger-analysis')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Force Run - Ép Worker tính toán recommend system (ADMIN)',
  })
  triggerAnalysis(@User() user: PrismaUser) {
    return this.recommendationsService.triggerAnalysis(user.email);
  }

  @Post('trigger-email')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Force Run - Ép Worker quét và gửi Email Marketing ngay lập tức (ADMIN)',
  })
  triggerEmail() {
    return this.recommendationsService.triggerEmail();
  }

  @Post('config-cron')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Thêm mới cấu hình cronjob cho maketing email và phân tích recommend system (ADMIN)',
  })
  @ApiBody({ type: ConfigCronDto })
  configCron(@Body() configDto: ConfigCronDto) {
    return this.recommendationsService.configCron(configDto);
  }

  @Delete('cron')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Xóa một Cronjob đang hoạt động (ADMIN)',
  })
  @ApiBody({ type: DeleteCronDto })
  deleteCron(@Body() dto: DeleteCronDto) {
    return this.recommendationsService.deleteCron(dto.repeatKey);
  }

  @Get('crons')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy danh sách các Cron Job đang hoạt động (ADMIN)',
  })
  getListCronJobs() {
    return this.recommendationsService.getListCronJobs();
  }

  @Get('campaign-stats')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Thống kê chiến dịch Marketing Email (ADMIN)',
  })
  getCampaignStats() {
    return this.recommendationsService.getCampaignStats();
  }

  // bắt sự kiện UPDATE_PROGRESS từ RabbitMQ do Python gửi
  @EventPattern('UPDATE_PROGRESS')
  handleProgressUpdate(@Payload() data: { progress: number; userId: string }) {
    console.log(
      `[+] Nhận được tiến độ phân tích AI từ Python: ${data.progress}% (Admin: ${data.userId})`,
    );
    this.socketService.emitAnalysisProgress(data.userId, data.progress);
  }
}
