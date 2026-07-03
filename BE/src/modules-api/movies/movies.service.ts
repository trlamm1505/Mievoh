import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DOMAIN_SERVER } from '../../common/constant/app.constant';
import { deleteFile } from '../../common/helper/delete-file.helper';
import { PrismaService } from '../../modules-system/prisma/prisma.service';
import { buildQueryPrisma } from '../../common/helper/build-query-prisma.helper';
import { CreateMovieDto, UpdateMovieDto } from './dto/movies.dto';

@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateMovieDto = {}, filename?: string) {
    const { genres, releaseDate, duration, ...rest } = data;

    // xử lý lưu trữ hình ảnh nếu có upload
    let imageUrl: string | null = null;
    if (filename) {
      imageUrl = `${DOMAIN_SERVER}/movies/${filename}`;
    }

    // tách chuỗi thể loại thành mảng
    let parsedGenres: string[] = [];
    if (genres) {
      parsedGenres = genres
        .split(',')
        .map((g) => g.trim())
        .filter((g) => g);
    }

    // Lọc releaseDate và duration không hợp lệ
    const safeReleaseDate =
      releaseDate instanceof Date && !isNaN(releaseDate.getTime())
        ? releaseDate
        : undefined;
    const safeDuration =
      duration !== undefined && !isNaN(Number(duration)) ? duration : undefined;

    // tạo dữ liệu phim mới
    const movie = await this.prisma.movie.create({
      data: {
        ...rest,
        ...(safeReleaseDate ? { releaseDate: safeReleaseDate } : {}),
        ...(safeDuration !== undefined ? { duration: safeDuration } : {}),
        genres: parsedGenres,
        imageUrl,
      },
    });

    return movie;
  }

  // lấy danh sách toàn bộ phim (phân trang)
  async findAll(query: any) {
    const { where, index, pageSize } = buildQueryPrisma(query);

    const [data, total] = await Promise.all([
      this.prisma.movie.findMany({
        where,
        take: Number(pageSize) || 10,
        skip: Number(index) || 0,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.movie.count({ where }),
    ]);

    return { data, total };
  }

  // lấy danh sách phim đang chiếu (phân trang)
  async findNowShowing(query: any) {
    const { where, index, pageSize } = buildQueryPrisma(query);

    const condition = { ...where, isShowing: true };

    const [data, total] = await Promise.all([
      this.prisma.movie.findMany({
        where: condition,
        take: Number(pageSize) || 10,
        skip: Number(index) || 0,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.movie.count({ where: condition }),
    ]);

    return { data, total };
  }

  // lấy danh sách phim sắp chiếu (phân trang)
  async findComingSoon(query: any) {
    const { where, index, pageSize } = buildQueryPrisma(query);

    const condition = { ...where, isComingSoon: true };

    const [data, total] = await Promise.all([
      this.prisma.movie.findMany({
        where: condition,
        take: Number(pageSize) || 10,
        skip: Number(index) || 0,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.movie.count({ where: condition }),
    ]);

    return { data, total };
  }

  // lấy chi tiết 1 bộ phim theo id
  async findById(movieId: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { movieId },
    });

    if (!movie) {
      throw new NotFoundException('Không tìm thấy phim');
    }

    return movie;
  }

  async update(movieId: string, data: UpdateMovieDto = {}, filename?: string) {
    // kiểm tra phim có tồn tại không
    const existingMovie = await this.findById(movieId);

    const { genres, releaseDate, duration, ...rest } = data;

    let imageUrl = existingMovie.imageUrl;
    // nếu có upload ảnh mới thì xóa ảnh cũ trong ổ cứng và lưu ảnh mới
    if (filename) {
      if (existingMovie.imageUrl) {
        deleteFile(existingMovie.imageUrl);
      }
      imageUrl = `${DOMAIN_SERVER}/movies/${filename}`;
    }

    // xử lý lại mảng thể loại phim
    let parsedGenres = existingMovie.genres;
    if (genres !== undefined) {
      parsedGenres = genres
        .split(',')
        .map((g) => g.trim())
        .filter((g) => g);
    }

    // Lọc releaseDate và duration không hợp lệ
    const safeReleaseDate =
      releaseDate instanceof Date && !isNaN(releaseDate.getTime())
        ? releaseDate
        : undefined;
    const safeDuration =
      duration !== undefined && !isNaN(Number(duration)) ? duration : undefined;

    // cập nhật dữ liệu vào db
    const movie = await this.prisma.movie.update({
      where: { movieId },
      data: {
        ...rest,
        ...(safeReleaseDate ? { releaseDate: safeReleaseDate } : {}),
        ...(safeDuration !== undefined ? { duration: safeDuration } : {}),
        genres: parsedGenres,
        imageUrl,
      },
    });

    return movie;
  }

  async delete(movieId: string) {
    // kiểm tra phim có tồn tại không
    const existingMovie = await this.findById(movieId);

    // xóa file ảnh trong ổ cứng nếu có
    if (existingMovie.imageUrl) {
      deleteFile(existingMovie.imageUrl);
    }

    // xóa dữ liệu trong db
    await this.prisma.movie.delete({
      where: { movieId },
    });

    return { message: 'Xóa phim thành công' };
  }

  // Chạy lúc 00:00 mỗi ngày để cập nhật trạng thái phim
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateMovieStatusDaily() {
    this.logger.log(
      'Bắt đầu cron job: Cập nhật trạng thái phim dựa trên releaseDate...',
    );
    const now = new Date();

    // 1. Phim đến ngày chiếu: releaseDate <= now AND isComingSoon = true
    const toShowing = await this.prisma.movie.updateMany({
      where: {
        releaseDate: { lte: now },
        isComingSoon: true,
      },
      data: {
        isComingSoon: false,
        isShowing: true,
      },
    });

    // 2. Phim chưa đến ngày chiếu nhưng đang lỡ để isShowing = true
    const toComingSoon = await this.prisma.movie.updateMany({
      where: {
        releaseDate: { gt: now },
        isShowing: true,
      },
      data: {
        isComingSoon: true,
        isShowing: false,
      },
    });

    this.logger.log(
      `Hoàn tất. Chuyển thành Đang chiếu: ${toShowing.count} phim. Chuyển thành Sắp chiếu: ${toComingSoon.count} phim.`,
    );
  }
}
