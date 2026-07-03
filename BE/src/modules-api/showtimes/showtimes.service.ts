import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../modules-system/prisma/prisma.service';
import { CreateShowtimeDto, UpdateShowtimeDto } from './dto/showtimes.dto';
import { TimeCalculatorHelper } from '../../common/helper/time-calculator.helper';
import { ShowtimeHelper } from '../../common/helper/showtime.helper';
import { validateStaffComplex } from '../../common/helper/staff.helper';
import type { User as PrismaUser } from '../../modules-system/prisma/generated/prisma/client';

@Injectable()
export class ShowtimesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateShowtimeDto, user: PrismaUser) {
    // lấy thông tin phim để tính thời lượng
    const movie = await this.prisma.movie.findUnique({
      where: { movieId: data.movieId },
      select: { duration: true, title_vi: true, title_en: true },
    });

    if (!movie) {
      throw new NotFoundException('Không tìm thấy phim');
    }

    const duration = movie.duration || 120;
    const bufferTime = 15; // thời gian dọn rạp
    
    const newStart = new Date(data.showDateTime);
    if (newStart < new Date()) {
      throw new ConflictException('Không thể tạo lịch chiếu trong thời gian quá khứ!');
    }

    const cinema = await this.prisma.cinema.findUnique({
      where: { cinemaId: data.cinemaId },
      select: { cinemaComplexId: true },
    });

    if (!cinema) {
      throw new NotFoundException('Không tìm thấy phòng chiếu');
    }

    // Xác thực quyền Staff đối với cụm rạp của phòng chiếu này
    validateStaffComplex(user, cinema.cinemaComplexId!);

    const newEnd = TimeCalculatorHelper.calculateEndTime(newStart, duration, bufferTime);

    // gọi helper để kiểm tra trùng giờ
    await ShowtimeHelper.checkShowtimeConflict(this.prisma, data.cinemaId, newStart, newEnd, bufferTime);

    // tạo lịch chiếu vào db
    const showtime = await this.prisma.showtime.create({
      data: {
        cinemaId: data.cinemaId,
        movieId: data.movieId,
        showDateTime: newStart,
        format: data.format,
        ticketPrice: data.ticketPrice,
      },
    });

    return showtime;
  }

  async update(data: UpdateShowtimeDto, user: PrismaUser) {
    const { showtimeId, ...updateData } = data;

    // kiểm tra sự tồn tại của lịch chiếu
    const existing = await this.prisma.showtime.findUnique({
      where: { showtimeId },
      include: {
        _count: {
          select: { Bookings: true },
        },
        Cinema: {
          select: { cinemaComplexId: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy lịch chiếu');
    }

    // chặn sửa nếu đã có vé đặt, trừ khi hủy suất
    if (existing._count.Bookings > 0 && data.status !== 'Cancelled') {
      throw new ForbiddenException(
        'Không thể sửa đổi lịch chiếu vì đã có khách hàng đặt vé. Chỉ có thể Hủy (Cancel).',
      );
    }

    // Xác thực quyền Staff trên suất chiếu cũ
    validateStaffComplex(user, existing.Cinema?.cinemaComplexId!);

    // nếu đổi ngày/giờ hoặc phòng chiếu -> phải check trùng lịch lại!
    if (data.showDateTime || data.cinemaId) {
      const targetCinemaId = data.cinemaId || existing.cinemaId;
      const targetStart = data.showDateTime ? new Date(data.showDateTime) : existing.showDateTime;

      if (targetCinemaId && targetStart) {
        if (targetStart < new Date()) {
          throw new ConflictException('Không thể dời lịch chiếu về thời gian quá khứ!');
        }

        if (data.cinemaId && data.cinemaId !== existing.cinemaId) {
          const newCinema = await this.prisma.cinema.findUnique({
            where: { cinemaId: data.cinemaId },
            select: { cinemaComplexId: true },
          });
          if (!newCinema) throw new NotFoundException('Không tìm thấy phòng chiếu mới');
          // Xác thực quyền Staff trên phòng chiếu mới
          validateStaffComplex(user, newCinema.cinemaComplexId!);
        }

        // lấy thời lượng phim hiện tại
        const movie = await this.prisma.movie.findUnique({
          where: { movieId: existing.movieId || '' },
          select: { duration: true },
        });

        const duration = movie?.duration || 120;
        const targetEnd = TimeCalculatorHelper.calculateEndTime(targetStart, duration, 15);

        // gọi helper kiểm tra trùng giờ (nhớ loại trừ ID của chính suất chiếu này)
        await ShowtimeHelper.checkShowtimeConflict(
          this.prisma,
          targetCinemaId,
          targetStart,
          targetEnd,
          15,
          showtimeId,
        );
      }
    }

    const updatedShowtime = await this.prisma.showtime.update({
      where: { showtimeId },
      data: {
        ...updateData,
        showDateTime: data.showDateTime ? new Date(data.showDateTime) : undefined,
      },
    });

    return updatedShowtime;
  }

  async delete(showtimeId: string, user: PrismaUser) {
    // kiểm tra sự tồn tại
    const existing = await this.prisma.showtime.findUnique({
      where: { showtimeId },
      include: {
        _count: {
          select: { Bookings: true },
        },
        Cinema: {
          select: { cinemaComplexId: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy lịch chiếu');
    }

    // Xác thực quyền Staff
    validateStaffComplex(user, existing.Cinema?.cinemaComplexId!);

    // chặn xóa nếu đã có khách mua vé
    if (existing._count.Bookings > 0) {
      throw new ForbiddenException(
        'KHÔNG THỂ XÓA! Lịch chiếu này đã có vé được bán ra. Vui lòng Hủy suất chiếu thay vì xóa cứng.',
      );
    }

    await this.prisma.showtime.delete({
      where: { showtimeId },
    });

    return { message: 'Xóa lịch chiếu thành công' };
  }

  async findByMovie(movieId: string, dateString: string) {
    // thiết lập ngày cần truy vấn
    const { startOfDay: targetDate, endOfDay: nextDay } = TimeCalculatorHelper.getStartAndEndOfDay(dateString);

    // lấy thông tin cơ bản của phim
    const movieInfo = await this.prisma.movie.findUnique({
      where: { movieId },
      select: {
        movieId: true,
        title_vi: true,
        title_en: true,
        imageUrl: true,
        ageRestriction: true,
        duration: true,
      },
    });

    if (!movieInfo) {
      throw new NotFoundException('Không tìm thấy phim');
    }

    // truy vấn toàn bộ suất chiếu của phim
    const showtimes = await this.prisma.showtime.findMany({
      where: {
        movieId,
        status: 'Active',
        showDateTime: {
          gte: targetDate,
          lt: nextDay,
        },
      },
      include: {
        Cinema: {
          include: {
            CinemaComplex: {
              include: {
                CinemaSystem: true,
              },
            },
          },
        },
      },
      orderBy: { showDateTime: 'asc' },
    });

    // gom nhóm dữ liệu theo cụm rạp
    const groupedData: any[] = [];

    for (const st of showtimes) {
      const cinema = st.Cinema;
      if (!cinema) continue;
      const complex = cinema.CinemaComplex;
      if (!complex) continue;
      const system = complex.CinemaSystem;
      if (!system) continue;

      // tìm hoặc tạo hệ thống rạp
      let sysObj = groupedData.find((s) => s.cinemaSystemId === system.cinemaSystemId);
      if (!sysObj) {
        sysObj = {
          cinemaSystemId: system.cinemaSystemId,
          name: system.name,
          logo: system.logo,
          cinemaComplexes: [],
        };
        groupedData.push(sysObj);
      }

      // tìm hoặc tạo cụm rạp
      let compObj = sysObj.cinemaComplexes.find((c: any) => c.cinemaComplexId === complex.cinemaComplexId);
      if (!compObj) {
        compObj = {
          cinemaComplexId: complex.cinemaComplexId,
          name: complex.name,
          address: complex.address,
          showtimes: [],
        };
        sysObj.cinemaComplexes.push(compObj);
      }

      // nhét suất chiếu vào mảng
      compObj.showtimes.push({
        showtimeId: st.showtimeId,
        cinemaId: cinema.cinemaId,
        cinemaName: cinema.name,
        showDateTime: st.showDateTime,
        format: st.format,
        ticketPrice: st.ticketPrice,
      });
    }

    // đếm tổng số lượng suất chiếu của mỗi hệ thống và sắp xếp cụm rạp bên trong
    for (const sys of groupedData) {
      sys.totalShowtimes = sys.cinemaComplexes.reduce((sum: number, c: any) => sum + c.showtimes.length, 0);
      
      // sắp xếp các cụm rạp theo số lượng suất chiếu giảm dần
      sys.cinemaComplexes.sort((c1: any, c2: any) => c2.showtimes.length - c1.showtimes.length);
    }

    // sắp xếp mảng hệ thống rạp theo tổng số lượng suất chiếu giảm dần
    groupedData.sort((a, b) => b.totalShowtimes - a.totalShowtimes);

    // xóa biến tạm totalShowtimes để trả về response sạch đẹp
    for (const sys of groupedData) {
      delete sys.totalShowtimes;
    }

    return {
      movie: movieInfo,
      cinemaSystems: groupedData,
    };
  }

  async findByComplex(cinemaComplexId: string, dateString: string) {
    // thiết lập khoảng thời gian truy vấn
    const { startOfDay: targetDate, endOfDay: nextDay } = TimeCalculatorHelper.getStartAndEndOfDay(dateString);

    // lấy id các rạp thuộc cụm
    const cinemas = await this.prisma.cinema.findMany({
      where: { cinemaComplexId },
      select: { cinemaId: true },
    });
    const cinemaIds = cinemas.map((c) => c.cinemaId);

    // lấy toàn bộ suất chiếu của cụm
    const showtimes = await this.prisma.showtime.findMany({
      where: {
        cinemaId: { in: cinemaIds },
        status: 'Active',
        showDateTime: {
          gte: targetDate,
          lt: nextDay,
        },
      },
      include: {
        Movie: true,
        Cinema: true,
      },
      orderBy: { showDateTime: 'asc' },
    });

    // gom nhóm dữ liệu theo từng bộ phim
    const groupedData: any[] = [];
    for (const st of showtimes) {
      if (!st.Movie) continue;
      const movie = st.Movie;

      // tìm hoặc khởi tạo object phim
      let movObj = groupedData.find((m) => m.movieId === movie.movieId);
      if (!movObj) {
        movObj = {
          movieId: movie.movieId,
          title_vi: movie.title_vi,
          title_en: movie.title_en,
          imageUrl: movie.imageUrl,
          ageRestriction: movie.ageRestriction,
          showtimes: [],
        };
        groupedData.push(movObj);
      }

      // đưa suất chiếu vào mảng của phim
      movObj.showtimes.push({
        showtimeId: st.showtimeId,
        cinemaId: st.Cinema?.cinemaId,
        cinemaName: st.Cinema?.name,
        showDateTime: st.showDateTime,
        format: st.format,
        ticketPrice: st.ticketPrice,
      });
    }

    // sắp xếp mảng phim theo số lượng suất chiếu giảm dần
    groupedData.sort((a, b) => b.showtimes.length - a.showtimes.length);

    return groupedData;
  }

  async findById(showtimeId: string) {
    // lấy thông tin chi tiết một suất chiếu
    const showtime = await this.prisma.showtime.findUnique({
      where: { showtimeId },
      include: {
        Movie: {
          select: { title_vi: true, title_en: true, imageUrl: true, ageRestriction: true, duration: true },
        },
        Cinema: {
          include: {
            CinemaComplex: {
              select: { name: true, address: true },
            },
          },
        },
      },
    });

    if (!showtime) throw new NotFoundException('Không tìm thấy suất chiếu');
    
    return showtime;
  }
}
