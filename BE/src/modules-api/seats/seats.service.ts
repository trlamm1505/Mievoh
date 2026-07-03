import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../../modules-system/prisma/prisma.service';
import { validateStaffComplex } from '../../common/helper/staff.helper';
import type { User as PrismaUser } from '../../modules-system/prisma/generated/prisma/client';
import {
  CreateSeatDto,
  GenerateSeatsDto,
  UpdateSeatDto,
} from './dto/seats.dto';

@Injectable()
export class SeatsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateSeats(body: GenerateSeatsDto, user: PrismaUser) {
    const {
      cinemaId,
      rowLetterStart,
      rowLetterEnd,
      seatsPerRow,
      vipRows,
      sweetboxRows,
    } = body;

    // Kiểm tra rạp có tồn tại không
    const cinema = await this.prisma.cinema.findUnique({
      where: { cinemaId },
    });
    if (!cinema) {
      throw new NotFoundException('Không tìm thấy rạp chiếu');
    }

    validateStaffComplex(user, cinema.cinemaComplexId!);

    // Convert ký tự chữ sang mã ASCII để lặp (VD: A -> 65, J -> 74)
    const startCode = rowLetterStart.toUpperCase().charCodeAt(0);
    const endCode = rowLetterEnd.toUpperCase().charCodeAt(0);

    if (startCode > endCode || startCode < 65 || endCode > 90) {
      throw new BadRequestException(
        'Ký tự hàng ghế không hợp lệ (Phải từ A-Z và Start <= End)',
      );
    }

    // Chuẩn bị dữ liệu để insert
    const seatsData: { name: string; seatType: string; cinemaId: string }[] =
      [];

    for (let i = startCode; i <= endCode; i++) {
      const rowChar = String.fromCharCode(i);

      // Xác định loại ghế của hàng này
      let rowSeatType = 'Thường';
      if (vipRows && vipRows.includes(rowChar)) {
        rowSeatType = 'VIP';
      } else if (sweetboxRows && sweetboxRows.includes(rowChar)) {
        rowSeatType = 'Đôi';
      }

      // Tạo ghế cho hàng này
      for (let j = 1; j <= seatsPerRow; j++) {
        const seatName = `${rowChar}${j}`;
        seatsData.push({
          name: seatName,
          seatType: rowSeatType,
          cinemaId: cinemaId,
        });
      }
    }

    // Xóa tất cả ghế cũ của rạp này trước khi tạo sơ đồ mới
    await this.prisma.seat.deleteMany({
      where: { cinemaId },
    });

    // Tạo mới bằng createMany (chạy nhanh hơn)
    await this.prisma.seat.createMany({
      data: seatsData,
    });

    return {
      status: 201,
      message: `Tạo thành công ${seatsData.length} ghế cho rạp.`,
    };
  }

  async findAllByCinemaId(cinemaId: string, user: PrismaUser) {
    const cinema = await this.prisma.cinema.findUnique({
      where: { cinemaId },
    });
    if (!cinema) {
      throw new NotFoundException('Không tìm thấy rạp chiếu');
    }

    validateStaffComplex(user, cinema.cinemaComplexId!);

    const data = await this.prisma.seat.findMany({
      where: { cinemaId },
      orderBy: { name: 'asc' }, // Sắp xếp theo tên ghế: A1, A2, B1...
    });

    return { data, total: data.length };
  }

  async create(body: CreateSeatDto, user: PrismaUser) {
    const cinema = await this.prisma.cinema.findUnique({
      where: { cinemaId: body.cinemaId },
    });
    if (!cinema) {
      throw new NotFoundException('Không tìm thấy rạp chiếu');
    }

    validateStaffComplex(user, cinema.cinemaComplexId!);

    // Check trùng tên ghế trong cùng 1 rạp
    const existingSeat = await this.prisma.seat.findFirst({
      where: { cinemaId: body.cinemaId, name: body.name },
    });
    if (existingSeat) {
      throw new BadRequestException('Tên ghế này đã tồn tại trong rạp');
    }

    const newSeat = await this.prisma.seat.create({
      data: {
        name: body.name,
        seatType: body.seatType,
        cinemaId: body.cinemaId,
      },
    });

    return newSeat;
  }

  async update(body: UpdateSeatDto, user: PrismaUser) {
    const seat = await this.prisma.seat.findUnique({
      where: { seatId: body.seatId },
    });
    if (!seat) {
      throw new NotFoundException('Không tìm thấy ghế');
    }

    const cinema = await this.prisma.cinema.findUnique({
      where: { cinemaId: seat.cinemaId },
    });
    if (cinema) {
      validateStaffComplex(user, cinema.cinemaComplexId!);
    }

    const dataToUpdate: any = {};
    if (body.name) dataToUpdate.name = body.name;
    if (body.seatType) dataToUpdate.seatType = body.seatType;

    const updatedSeat = await this.prisma.seat.update({
      where: { seatId: body.seatId },
      data: dataToUpdate,
    });

    return updatedSeat;
  }

  async delete(seatId: string, user: PrismaUser) {
    const seat = await this.prisma.seat.findUnique({
      where: { seatId },
    });
    if (!seat) {
      throw new NotFoundException('Không tìm thấy ghế');
    }

    const cinema = await this.prisma.cinema.findUnique({
      where: { cinemaId: seat.cinemaId },
    });
    if (cinema) {
      validateStaffComplex(user, cinema.cinemaComplexId!);
    }

    await this.prisma.seat.delete({
      where: { seatId },
    });

    return true;
  }
}
