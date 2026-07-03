import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../modules-system/prisma/prisma.service';
import { CreateStaffDto, UpdateStaffDto } from './dto/staff.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StaffService {
    constructor(private readonly prisma: PrismaService) { }

    async create(body: CreateStaffDto) {
        // Kiểm tra email đã tồn tại chưa
        const existing = await this.prisma.user.findUnique({
            where: { email: body.email },
        });
        if (existing) {
            throw new BadRequestException('Email đã tồn tại');
        }

        // Kiểm tra cụm rạp tồn tại
        const complex = await this.prisma.cinemaComplex.findUnique({
            where: { cinemaComplexId: body.cinemaComplexId },
        });
        if (!complex) {
            throw new NotFoundException('Cụm rạp không tồn tại');
        }

        // Tạo staff
        const staff = await this.prisma.user.create({
            data: {
                email: body.email,
                fullName: body.fullName,
                phoneNumber: body.phoneNumber || null,
                password: bcrypt.hashSync(body.password, 10),
                authProvider: 'local',
                userType: 'staff',
                cinemaComplexId: body.cinemaComplexId,
            },
        });

        const { password, ...result } = staff;
        return result;
    }

    async findAll() {
        const staffList = await this.prisma.user.findMany({
            where: { userType: 'staff' },
            select: {
                email: true,
                fullName: true,
                phoneNumber: true,
                userType: true,
                cinemaComplexId: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return staffList;
    }

    async findOne(email: string) {
        const staff = await this.prisma.user.findFirst({
            where: { email, userType: 'staff' },
            select: {
                email: true,
                fullName: true,
                phoneNumber: true,
                userType: true,
                cinemaComplexId: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!staff) {
            throw new NotFoundException('Không tìm thấy nhân viên');
        }
        return staff;
    }

    async update(email: string, body: UpdateStaffDto) {
        const staff = await this.prisma.user.findFirst({
            where: { email, userType: 'staff' },
        });
        if (!staff) {
            throw new NotFoundException('Không tìm thấy nhân viên');
        }

        // Nếu đổi cụm rạp, kiểm tra cụm rạp mới tồn tại
        if (body.cinemaComplexId) {
            const complex = await this.prisma.cinemaComplex.findUnique({
                where: { cinemaComplexId: body.cinemaComplexId },
            });
            if (!complex) {
                throw new NotFoundException('Cụm rạp không tồn tại');
            }
        }

        const updateData: any = {};
        if (body.fullName !== undefined) updateData.fullName = body.fullName;
        if (body.phoneNumber !== undefined) updateData.phoneNumber = body.phoneNumber || null;
        if (body.cinemaComplexId !== undefined) updateData.cinemaComplexId = body.cinemaComplexId;
        if (body.password) {
            updateData.password = bcrypt.hashSync(body.password, 10);
        }

        const updated = await this.prisma.user.update({
            where: { email },
            data: updateData,
        });

        const { password, ...result } = updated;
        return result;
    }

    async delete(email: string) {
        const staff = await this.prisma.user.findFirst({
            where: { email, userType: 'staff' },
        });
        if (!staff) {
            throw new NotFoundException('Không tìm thấy nhân viên');
        }

        await this.prisma.user.delete({
            where: { email },
        });

        return { message: 'Xóa nhân viên thành công' };
    }
}
