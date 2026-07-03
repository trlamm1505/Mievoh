import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../modules-system/prisma/prisma.service';
import { CreateFoodDto, UpdateFoodDto } from './dto/foods.dto';
import { deleteFile } from '../../common/helper/delete-file.helper';
import { DOMAIN_SERVER } from '../../common/constant/app.constant';
import { unlinkSync } from 'fs';
import { validateStaffComplex } from '../../common/helper/staff.helper';
import type { User as PrismaUser } from '../../modules-system/prisma/generated/prisma/client';

@Injectable()
export class FoodsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByComplex(cinemaComplexId: string) {
    // Lấy menu đồ ăn đang mở bán (isActive = true) của 1 cụm rạp
    return this.prisma.food.findMany({
      where: {
        cinemaComplexId,
        isActive: true,
      },
    });
  }

  async create(data: CreateFoodDto, user: PrismaUser, file?: Express.Multer.File) {
    // Xác thực quyền của Staff
    validateStaffComplex(user, data.cinemaComplexId);

    // Check xem rạp có tồn tại không
    const complex = await this.prisma.cinemaComplex.findUnique({
      where: { cinemaComplexId: data.cinemaComplexId },
    });
    if (!complex) {
      if (file) unlinkSync(file.path);
      throw new NotFoundException('Không tìm thấy Cụm rạp để thêm món ăn');
    }

    const imageUrl = file ? `${DOMAIN_SERVER}/foods/${file.filename}` : null;

    return this.prisma.food.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        cinemaComplexId: data.cinemaComplexId,
        isActive: data.isActive !== undefined ? data.isActive : true,
        imageUrl,
      },
    });
  }

  async update(foodId: string, data: UpdateFoodDto, user: PrismaUser, file?: Express.Multer.File) {
    const existing = await this.prisma.food.findUnique({
      where: { foodId },
    });

    if (!existing) {
      if (file) unlinkSync(file.path);
      throw new NotFoundException('Không tìm thấy món ăn');
    }

    // Xác thực quyền Staff đối với cụm rạp cũ của món ăn
    validateStaffComplex(user, existing.cinemaComplexId);

    if (data.cinemaComplexId && data.cinemaComplexId !== existing.cinemaComplexId) {
      const complex = await this.prisma.cinemaComplex.findUnique({
        where: { cinemaComplexId: data.cinemaComplexId },
      });
      if (!complex) {
        if (file) unlinkSync(file.path);
        throw new NotFoundException('Không tìm thấy Cụm rạp được chỉ định');
      }

      // Xác thực quyền Staff đối với cụm rạp mới (nếu sửa đổi sang cụm rạp khác)
      validateStaffComplex(user, data.cinemaComplexId);
    }

    let imageUrl = existing.imageUrl;
    if (file) {
      imageUrl = `${DOMAIN_SERVER}/foods/${file.filename}`;
      // Xóa ảnh cũ nếu có
      if (existing.imageUrl) {
        deleteFile(existing.imageUrl);
      }
    }

    return this.prisma.food.update({
      where: { foodId },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        cinemaComplexId: data.cinemaComplexId,
        isActive: data.isActive,
        imageUrl,
      },
    });
  }

  async delete(foodId: string, user: PrismaUser) {
    const existing = await this.prisma.food.findUnique({
      where: { foodId },
    });

    if (!existing) throw new NotFoundException('Không tìm thấy món ăn');

    // Xác thực quyền Staff
    validateStaffComplex(user, existing.cinemaComplexId);

    // Kiểm tra xem đã có booking nào mua món này chưa
    const isBooked = await this.prisma.bookingFood.findFirst({
      where: { foodId },
    });

    if (isBooked) {
      throw new BadRequestException('Món ăn này đã có khách hàng mua trong hóa đơn, không thể xóa vật lý (chỉ nên ẩn trạng thái isActive)');
    }

    // Xóa vật lý
    if (existing.imageUrl) {
      deleteFile(existing.imageUrl);
    }

    await this.prisma.food.delete({
      where: { foodId },
    });

    return { message: 'Xóa món ăn thành công' };
  }
}
