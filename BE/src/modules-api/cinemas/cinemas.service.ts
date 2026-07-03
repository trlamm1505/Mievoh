import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCinemaDto, UpdateCinemaDto } from './dto/cinemas.dto';
import { PrismaService } from '../../modules-system/prisma/prisma.service';

import { validateStaffComplex } from '../../common/helper/staff.helper';
import type { User as PrismaUser } from '../../modules-system/prisma/generated/prisma/client';

@Injectable()
export class CinemasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateCinemaDto, user: PrismaUser) {
    validateStaffComplex(user, body.cinemaComplexId);
    // Kiểm tra cụm rạp có tồn tại không
    const cinemaComplex = await this.prisma.cinemaComplex.findUnique({
      where: { cinemaComplexId: body.cinemaComplexId },
    });

    if (!cinemaComplex) {
      throw new NotFoundException('Không tìm thấy cụm rạp');
    }

    // Tạo rạp
    const cinema = await this.prisma.cinema.create({
      data: {
        name: body.name,
        cinemaComplexId: body.cinemaComplexId,
      },
      include: {
        CinemaComplex: {
          select: {
            cinemaComplexId: true,
            name: true,
            CinemaSystem: {
              select: {
                cinemaSystemId: true,
                name: true,
              },
            },
          },
        },
      },
    });
    return cinema;
  }



  async findById(cinemaId: string) {
    const data = await this.prisma.cinema.findUnique({
      where: { cinemaId },
      include: {
        CinemaComplex: {
          select: {
            cinemaComplexId: true,
            name: true,
            CinemaSystem: {
              select: {
                cinemaSystemId: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!data) {
      throw new NotFoundException('Không tìm thấy rạp chiếu');
    }

    return data;
  }

  async getCinemasByComplexId(cinemaComplexId: string, user: PrismaUser) {
    validateStaffComplex(user, cinemaComplexId);
    const cinemaComplex = await this.prisma.cinemaComplex.findUnique({
      where: { cinemaComplexId },
    });

    if (!cinemaComplex) {
      throw new NotFoundException('Không tìm thấy cụm rạp');
    }

    const data = await this.prisma.cinema.findMany({
      where: { cinemaComplexId },
      orderBy: { cinemaId: 'asc' },
      include: {
        CinemaComplex: {
          select: {
            cinemaComplexId: true,
            name: true,
            CinemaSystem: {
              select: {
                cinemaSystemId: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return { data, total: data.length };
  }

  async update(body: UpdateCinemaDto, user: PrismaUser) {
    const cinemaId = body.cinemaId;

    const cinema = await this.prisma.cinema.findUnique({
      where: { cinemaId },
    });

    if (!cinema) {
      throw new NotFoundException('Không tìm thấy rạp chiếu');
    }

    // Xác thực quyền của Staff trên cụm rạp cũ
    validateStaffComplex(user, cinema.cinemaComplexId);

    if (body.cinemaComplexId) {
      const cinemaComplexId = body.cinemaComplexId;
      const cinemaComplex = await this.prisma.cinemaComplex.findUnique({
        where: { cinemaComplexId },
      });

      if (!cinemaComplex) {
        throw new NotFoundException('Không tìm thấy cụm rạp');
      }

      // Xác thực quyền của Staff trên cụm rạp mới (nếu họ đổi rạp chiếu sang cụm rạp khác)
      validateStaffComplex(user, cinemaComplexId);
    }

    const dataToUpdate: any = {};
    if (body.name) dataToUpdate.name = body.name;
    if (body.cinemaComplexId)
      dataToUpdate.cinemaComplexId = body.cinemaComplexId;

    const updated = await this.prisma.cinema.update({
      where: { cinemaId },
      data: dataToUpdate,
    });

    return updated;
  }

  async delete(cinemaId: string, user: PrismaUser) {
    const cinema = await this.prisma.cinema.findUnique({
      where: { cinemaId },
    });

    if (!cinema) {
      throw new NotFoundException('Không tìm thấy rạp chiếu');
    }

    validateStaffComplex(user, cinema.cinemaComplexId);

    await this.prisma.cinema.delete({
      where: { cinemaId },
    });

    return true;
  }
}
