import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { RoleGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/role.decorator';
import { User } from '../../common/decorators/user.decorator';
import type { User as PrismaUser } from '../../modules-system/prisma/generated/prisma/client';
import { GetRevenueChartDto, GetTopMoviesDto } from './dto/statistics.dto';

@ApiTags('Statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiOperation({
    summary: 'Lấy các thông số tổng quan (Doanh thu, Vé, User, Phim)',
  })
  getOverview(@User() user: PrismaUser) {
    return this.statisticsService.getOverview(user);
  }

  @Get('revenue-chart')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiOperation({
    summary: 'Biểu đồ doanh thu theo chu kỳ ngày (mặc định 7 ngày)',
  })
  getRevenueChart(
    @Query() query: GetRevenueChartDto,
    @User() user: PrismaUser,
  ) {
    const period = query.days ? Number(query.days) : 7;
    return this.statisticsService.getRevenueChart(period, user);
  }

  @Get('top-movies')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Top phim có doanh thu cao nhất' })
  getTopMovies(@Query() query: GetTopMoviesDto, @User() user: PrismaUser) {
    const size = query.limit ? Number(query.limit) : 5;
    return this.statisticsService.getTopMovies(size, user);
  }

  @Get('revenue-by-complex')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Phân bổ doanh thu theo từng cụm rạp (Chỉ Admin)' })
  getRevenueByComplex() {
    return this.statisticsService.getRevenueByComplex();
  }
}
