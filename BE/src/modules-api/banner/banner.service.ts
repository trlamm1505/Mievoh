import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../modules-system/prisma/prisma.service';
import { DOMAIN_SERVER } from '../../common/constant/app.constant';
import { deleteFile } from '../../common/helper/delete-file.helper';

@Injectable()
export class BannerService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    // Lấy tất cả banner
    const banners = await this.prisma.banner.findMany({
      select: {
        bannerId: true,
        movieId: true,
        imageUrl: true,
        Movie: {
          select: {
            title_vi: true,
            title_en: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        bannerId: 'asc',
      },
    });

    return {
      data: banners,
      total: banners.length,
    };
  }

  async uploadImage(movieId: string, filename: string) {
    // Kiểm tra phim có tồn tại không
    const movie = await this.prisma.movie.findUnique({
      where: { movieId: movieId },
    });

    if (!movie) {
      throw new NotFoundException('Không tìm thấy phim');
    }

    // Tìm và xóa tất cả banner cũ của phim này
    const oldBanners = await this.prisma.banner.findMany({
      where: { movieId: movieId },
      select: { bannerId: true, imageUrl: true },
    });

    // Xóa file ảnh cũ
    for (const banner of oldBanners) {
      if (banner.imageUrl) {
        deleteFile(banner.imageUrl);
      }
    }

    // Xóa records banner cũ khỏi database
    if (oldBanners.length > 0) {
      await this.prisma.banner.deleteMany({
        where: { movieId: movieId },
      });
    }

    // Tạo banner mới
    const newBanner = await this.prisma.banner.create({
      data: {
        movieId: movieId,
        imageUrl: `${DOMAIN_SERVER}/banners/${filename}`,
      },
      select: {
        bannerId: true,
        movieId: true,
        imageUrl: true,
      },
    });

    return {
      newBanner,
    };
  }

  async deleteBanner(bannerId: string) {
    const banner = await this.prisma.banner.findUnique({
      where: { bannerId: bannerId },
    });

    if (!banner) {
      throw new NotFoundException('Không tìm thấy banner');
    }

    // Xóa file ảnh nếu có
    if (banner.imageUrl) {
      deleteFile(banner.imageUrl);
    }

    await this.prisma.banner.delete({
      where: { bannerId: bannerId },
    });

    return true;
  }
}
