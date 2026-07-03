import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../modules-system/prisma/prisma.service';
import { deleteFile } from '../../common/helper/delete-file.helper';
import { DOMAIN_SERVER } from '../../common/constant/app.constant';
import {
  CreateCinemaSystemDto,
  UpdateCinemaSystemDto,
} from './dto/cinema-systems.dto';

@Injectable()
export class CinemaSystemsService {
  constructor(private prisma: PrismaService) {}

  async create(body: CreateCinemaSystemDto, logoFilename: string) {
    // Lưu path với subfolder: cinema-system/filename
    const imagePath = `cinema-system/${logoFilename}`;
    const cinemaSystem = await this.prisma.cinemaSystem.create({
      data: {
        name: body.name,
        logo: `${DOMAIN_SERVER}/${imagePath}`,
      },
    });

    return cinemaSystem;
  }

  async findAll() {
    const data = await this.prisma.cinemaSystem.findMany({
      orderBy: {
        cinemaSystemId: 'asc',
      },
    });

    return {
      data,
      total: data.length,
    };
  }

  async findById(cinemaSystemId: string) {
    const data = await this.prisma.cinemaSystem.findUnique({
      where: { cinemaSystemId },
      include: {
        CinemaComplexes: {
          include: {
            Cinemas: true,
          }
        }
      }
    });

    if (!data) {
      throw new NotFoundException('Không tìm thấy hệ thống rạp');
    }

    return data;
  }

  async update(body: UpdateCinemaSystemDto, logoFilename?: string) {
    // Kiểm tra hệ thống rạp có tồn tại không
    const cinemaSystem = await this.prisma.cinemaSystem.findUnique({
      where: { cinemaSystemId: body.cinemaSystemId },
    });

    if (!cinemaSystem) {
      // nếu không tìm thấy hệ thống rạp, xóa file logo mới vừa upload nếu có
      if (logoFilename) {
        deleteFile(`cinema-systems/${logoFilename}`);
      }
      throw new NotFoundException('Không tìm thấy hệ thống rạp');
    }

    // Nếu có logo mới, xóa logo cũ
    if (logoFilename && cinemaSystem.logo) {
      deleteFile(cinemaSystem.logo);
    }

    // Chuẩn bị data để update
    const dataToUpdate: any = {};
    if (body.name) {
      dataToUpdate.name = body.name;
    }
    if (logoFilename) {
      dataToUpdate.logo = `${DOMAIN_SERVER}/cinema-systems/${logoFilename}`;
    }

    const updated = await this.prisma.cinemaSystem.update({
      where: { cinemaSystemId: body.cinemaSystemId },
      data: dataToUpdate,
    });

    return updated;
  }

  async delete(cinemaSystemId: string) {
    const cinemaSystem = await this.prisma.cinemaSystem.findUnique({
      where: { cinemaSystemId },
    });

    if (!cinemaSystem) {
      throw new NotFoundException('Không tìm thấy hệ thống rạp');
    }

    await this.prisma.cinemaSystem.delete({
      where: { cinemaSystemId },
    });

    return true;
  }
}
