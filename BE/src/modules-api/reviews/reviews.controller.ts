import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/reviews.dto';
import { Public } from '../../common/decorators/public.decorator';
import { User } from '../../common/decorators/user.decorator';
import { RoleGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/role.decorator';
import type { User as PrismaUser } from '../../modules-system/prisma/generated/prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('movie/:movieId')
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách đánh giá của 1 bộ phim' })
  @ApiParam({ name: 'movieId', description: 'ID của phim' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số trang (Mặc định: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng / trang (Mặc định: 10)',
  })
  @ApiResponse({ status: 200, description: 'Thành công' })
  getReviewsByMovieId(
    @Param('movieId') movieId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.reviewsService.getReviewsByMovieId(movieId, page, limit);
  }

  @Post()
  @UseGuards(RoleGuard)
  @Roles('user', 'staff', 'admin') // Chỉ cần đăng nhập
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Đăng hoặc Cập nhật đánh giá (Yêu cầu phải mua vé thành công)',
  })
  @ApiResponse({ status: 201, description: 'Đánh giá thành công' })
  @ApiResponse({ status: 403, description: 'Forbidden: Chưa mua vé' })
  createReview(
    @User() user: PrismaUser,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(user.email, createReviewDto);
  }

  @Delete(':reviewId')
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa đánh giá rác/spam (ADMIN, STAFF)' })
  @ApiParam({ name: 'reviewId', description: 'ID của review' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  deleteReview(@Param('reviewId') reviewId: string) {
    return this.reviewsService.deleteReview(reviewId);
  }
}
