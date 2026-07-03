import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../modules-system/prisma/prisma.service';
import { CreateReviewDto } from './dto/reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async getReviewsByMovieId(movieId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { movieId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          User: {
            select: {
              fullName: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where: { movieId } }),
    ]);

    return {
      data: reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createReview(email: string, createReviewDto: CreateReviewDto) {
    const { movieId, rating, comment } = createReviewDto;

    // 1. Kiểm tra phim có tồn tại không
    const movie = await this.prisma.movie.findUnique({
      where: { movieId },
    });
    if (!movie) {
      throw new NotFoundException('Không tìm thấy phim');
    }

    // 2. Logic Verified Purchaser: Kiểm tra xem User đã mua vé phim này thành công chưa
    const hasBooked = await this.prisma.booking.findFirst({
      where: {
        email,
        paymentStatus: 'Success',
        Showtime: {
          movieId,
        },
      },
    });

    if (!hasBooked) {
      throw new ForbiddenException(
        'Tính năng dành cho khách hàng thực tế. Bạn phải mua vé và xem bộ phim này trước khi để lại đánh giá!',
      );
    }

    // 3. Logic Duy nhất 1 lần (Upsert)
    const existingReview = await this.prisma.review.findFirst({
      where: {
        email,
        movieId,
      },
    });

    if (existingReview) {
      // Cập nhật đánh giá cũ
      const updatedReview = await this.prisma.review.update({
        where: { reviewId: existingReview.reviewId },
        data: {
          rating,
          comment,
        },
        include: {
          User: { select: { fullName: true, avatar: true } },
        },
      });
      
      // Tính toán lại điểm số trung bình của phim
      await this.updateMovieRating(movieId);
      
      return {
        message: 'Cập nhật đánh giá thành công',
        review: updatedReview,
      };
    } else {
      // Tạo đánh giá mới
      const newReview = await this.prisma.review.create({
        data: {
          email,
          movieId,
          rating,
          comment,
        },
        include: {
          User: { select: { fullName: true, avatar: true } },
        },
      });
      
      // Tính toán lại điểm số trung bình của phim
      await this.updateMovieRating(movieId);
      
      return {
        message: 'Cảm ơn bạn đã để lại đánh giá',
        review: newReview,
      };
    }
  }

  async deleteReview(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { reviewId },
    });
    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    await this.prisma.review.delete({
      where: { reviewId },
    });

    // Cập nhật lại điểm sau khi xóa đánh giá
    await this.updateMovieRating(review.movieId);

    return { message: 'Đã xóa đánh giá thành công' };
  }

  // Hàm helper dùng để tính lại điểm Rating trung bình của phim
  private async updateMovieRating(movieId: string) {
    const aggregate = await this.prisma.review.aggregate({
      where: { movieId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const averageRating = aggregate._avg.rating || 0;
    const totalReviews = aggregate._count.rating || 0;

    await this.prisma.movie.update({
      where: { movieId },
      data: {
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews,
      },
    });
  }
}
