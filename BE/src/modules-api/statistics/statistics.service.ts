import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../modules-system/prisma/prisma.service';
import type { User as PrismaUser } from '../../modules-system/prisma/generated/prisma/client';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(user: PrismaUser) {
    const isStaff = user.userType === 'staff';
    const complexId = isStaff ? user.cinemaComplexId : undefined;

    // Filter cho Booking: Nếu là staff thì lọc theo complexId của họ
    const bookingFilter: any = {
      paymentStatus: 'Success',
    };
    if (complexId) {
      bookingFilter.Showtime = {
        Cinema: {
          cinemaComplexId: complexId,
        },
      };
    }

    // Lấy tất cả bookings thành công kèm chi tiết để đếm vé
    const bookings = await this.prisma.booking.findMany({
      where: bookingFilter,
      include: {
        _count: {
          select: { BookingDetails: true },
        },
      },
    });

    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const totalTickets = bookings.reduce((sum, b) => sum + b._count.BookingDetails, 0);

    // Filter cho User: Lọc user thường
    const totalUsers = await this.prisma.user.count({
      where: { userType: 'user' },
    });

    // Filter cho Phim:
    const totalMoviesShowing = await this.prisma.movie.count({
      where: { isShowing: true },
    });

    return {
      totalRevenue,
      totalTickets,
      totalUsers,
      totalMoviesShowing,
    };
  }

  async getRevenueChart(days: number, user: PrismaUser) {
    const isStaff = user.userType === 'staff';
    const complexId = isStaff ? user.cinemaComplexId : undefined;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const bookingFilter: any = {
      paymentStatus: 'Success',
      createdAt: { gte: startDate },
    };

    if (complexId) {
      bookingFilter.Showtime = {
        Cinema: { cinemaComplexId: complexId },
      };
    }

    const bookings = await this.prisma.booking.findMany({
      where: bookingFilter,
      select: {
        createdAt: true,
        totalPrice: true,
      },
    });

    // Gom nhóm theo ngày
    const revenueMap = new Map<string, number>();

    // Khởi tạo mảng các ngày với doanh thu = 0
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      revenueMap.set(dateStr, 0);
    }

    // Cộng dồn doanh thu
    for (const b of bookings) {
      const dateStr = b.createdAt.toISOString().split('T')[0];
      if (revenueMap.has(dateStr)) {
        revenueMap.set(dateStr, revenueMap.get(dateStr)! + b.totalPrice);
      }
    }

    return Array.from(revenueMap.entries()).map(([date, revenue]) => ({
      date,
      revenue,
    }));
  }

  async getTopMovies(limit: number, user: PrismaUser) {
    const isStaff = user.userType === 'staff';
    const complexId = isStaff ? user.cinemaComplexId : undefined;

    const bookingFilter: any = {
      paymentStatus: 'Success',
    };

    if (complexId) {
      bookingFilter.Showtime = {
        Cinema: { cinemaComplexId: complexId },
      };
    }

    const bookings = await this.prisma.booking.findMany({
      where: bookingFilter,
      include: {
        Showtime: {
          include: {
            Movie: {
              select: { movieId: true, title_vi: true, title_en: true, imageUrl: true },
            },
          },
        },
      },
    });

    const movieMap = new Map<string, { movie: any; revenue: number }>();

    for (const b of bookings) {
      const movie = b.Showtime?.Movie;
      if (!movie) continue;

      if (!movieMap.has(movie.movieId)) {
        movieMap.set(movie.movieId, { movie, revenue: 0 });
      }
      movieMap.get(movie.movieId)!.revenue += b.totalPrice;
    }

    const topMovies = Array.from(movieMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    return topMovies;
  }

  async getRevenueByComplex() {
    // Chỉ Admin/System mới được dùng hàm này nên không cần filter theo token staff
    const bookings = await this.prisma.booking.findMany({
      where: {
        paymentStatus: 'Success',
      },
      include: {
        Showtime: {
          include: {
            Cinema: {
              include: {
                CinemaComplex: {
                  select: { cinemaComplexId: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    const complexMap = new Map<string, { complexId: string; name: string; revenue: number }>();

    for (const b of bookings) {
      const complex = b.Showtime?.Cinema?.CinemaComplex;
      if (!complex) continue;

      if (!complexMap.has(complex.cinemaComplexId)) {
        complexMap.set(complex.cinemaComplexId, {
          complexId: complex.cinemaComplexId,
          name: complex.name || 'Unknown',
          revenue: 0,
        });
      }
      complexMap.get(complex.cinemaComplexId)!.revenue += b.totalPrice;
    }

    return Array.from(complexMap.values()).sort((a, b) => b.revenue - a.revenue);
  }
}
