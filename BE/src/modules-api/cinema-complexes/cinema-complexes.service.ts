import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateCinemaComplexDto,
  UpdateCinemaComplexDto,
} from './dto/cinema-complexes.dto';
import { PrismaService } from '../../modules-system/prisma/prisma.service';

@Injectable()
export class CinemaComplexesService {
  constructor(private prisma: PrismaService) {}

  async create(body: CreateCinemaComplexDto) {
    const cinemaSystemId = body.cinemaSystemId;

    const cinemaSystem = await this.prisma.cinemaSystem.findUnique({
      where: { cinemaSystemId },
    });

    if (!cinemaSystem) {
      throw new NotFoundException('Không tìm thấy hệ thống rạp');
    }

    const cinemaComplex = await this.prisma.cinemaComplex.create({
      data: {
        name: body.name,
        address: body.address,
        cinemaSystemId,
      },
    });

    return cinemaComplex;
  }

  async findAll() {
    const data = await this.prisma.cinemaComplex.findMany({
      orderBy: { cinemaComplexId: 'asc' },
      include: {
        CinemaSystem: {
          select: {
            cinemaSystemId: true,
            name: true,
            logo: true,
          },
        },
      },
    });
    return { data, total: data.length };
  }

  async getCinemaComplexesBySystemId(cinemaSystemId: string) {
    // Kiểm tra hệ thống rạp có tồn tại không
    const cinemaSystem = await this.prisma.cinemaSystem.findUnique({
      where: { cinemaSystemId },
    });

    if (!cinemaSystem) {
      throw new NotFoundException('Không tìm thấy hệ thống rạp');
    }

    const data = await this.prisma.cinemaComplex.findMany({
      where: { cinemaSystemId },
      orderBy: {
        cinemaComplexId: 'asc',
      },
      include: {
        CinemaSystem: {
          select: {
            cinemaSystemId: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    return {
      data,
      total: data.length,
    };
  }

  async findById(cinemaComplexId: string) {
    const data = await this.prisma.cinemaComplex.findUnique({
      where: { cinemaComplexId },
      include: {
        CinemaSystem: {
          select: {
            cinemaSystemId: true,
            name: true,
            logo: true,
          },
        },
        Cinemas: true,
      },
    });

    if (!data) {
      throw new NotFoundException('Không tìm thấy cụm rạp');
    }

    return data;
  }

  async update(body: UpdateCinemaComplexDto) {
    const cinemaComplexId = body.cinemaComplexId;

    // Kiểm tra cụm rạp có tồn tại không
    const cinemaComplex = await this.prisma.cinemaComplex.findUnique({
      where: { cinemaComplexId },
    });

    if (!cinemaComplex) {
      throw new NotFoundException('Không tìm thấy cụm rạp');
    }

    // Nếu có cinemaSystemId mới, kiểm tra có tồn tại không
    if (body.cinemaSystemId) {
      const cinemaSystemId = body.cinemaSystemId;
      const cinemaSystem = await this.prisma.cinemaSystem.findUnique({
        where: { cinemaSystemId },
      });

      if (!cinemaSystem) {
        throw new NotFoundException('Không tìm thấy hệ thống rạp');
      }
    }

    // Chuẩn bị data để update
    const dataToUpdate: any = {};
    if (body.name) dataToUpdate.name = body.name;
    if (body.address) dataToUpdate.address = body.address;
    if (body.cinemaSystemId) dataToUpdate.cinemaSystemId = body.cinemaSystemId;

    const updated = await this.prisma.cinemaComplex.update({
      where: { cinemaComplexId },
      data: dataToUpdate,
    });

    return updated;
  }

  async delete(cinemaComplexId: string) {
    const cinemaComplex = await this.prisma.cinemaComplex.findUnique({
      where: { cinemaComplexId },
    });

    if (!cinemaComplex) {
      throw new NotFoundException('Không tìm thấy cụm rạp');
    }

    await this.prisma.cinemaComplex.delete({
      where: { cinemaComplexId },
    });

    return true;
  }
}
