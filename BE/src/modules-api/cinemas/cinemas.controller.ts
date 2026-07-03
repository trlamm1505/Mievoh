import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Put,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { User } from '../../common/decorators/user.decorator';
import type { User as PrismaUser } from '../../modules-system/prisma/generated/prisma/client';
import { CinemasService } from './cinemas.service';
import { Roles } from '../../common/decorators/role.decorator';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateCinemaDto, UpdateCinemaDto } from './dto/cinemas.dto';
import { RoleGuard } from '../../common/guards/role.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Cinemas')
@ApiExtraModels(CreateCinemaDto, UpdateCinemaDto)
@Controller('cinemas')
export class CinemasController {
  constructor(private readonly cinemasService: CinemasService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Tạo rạp chiếu mới (ADMIN, STAFF)' })
  @ApiResponse({ status: 201, description: 'Tạo rạp chiếu thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cụm rạp' })
  createCinema(@Body() body: CreateCinemaDto, @User() user: PrismaUser) {
    return this.cinemasService.create(body, user);
  }

  @Get()
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy danh sách rạp chiếu thuộc một cụm rạp (ADMIN, STAFF)',
  })
  @ApiQuery({
    name: 'cinemaComplexId',
    required: true,
    description: 'Mã cụm rạp',
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  @ApiResponse({ status: 400, description: 'Thiếu mã cụm rạp' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cụm rạp' })
  getCinemas(
    @Query('cinemaComplexId') cinemaComplexId: string,
    @User() user: PrismaUser,
  ) {
    if (!cinemaComplexId) {
      throw new BadRequestException(
        'Vui lòng cung cấp mã cụm rạp (cinemaComplexId)',
      );
    }
    return this.cinemasService.getCinemasByComplexId(cinemaComplexId, user);
  }

  @Get('/:cinemaId')
  @Public()
  @ApiOperation({ summary: 'Lấy chi tiết rạp chiếu' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy rạp chiếu' })
  findById(@Param('cinemaId') cinemaId: string) {
    return this.cinemasService.findById(cinemaId);
  }

  @Put()
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật rạp chiếu (ADMIN, STAFF)' })
  @ApiResponse({ status: 200, description: 'Cập nhật rạp chiếu thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền' })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy rạp chiếu hoặc cụm rạp',
  })
  updateCinema(@Body() body: UpdateCinemaDto, @User() user: PrismaUser) {
    return this.cinemasService.update(body, user);
  }

  @Delete('/:cinemaId')
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa rạp chiếu (ADMIN, STAFF)' })
  @ApiResponse({ status: 200, description: 'Xóa rạp chiếu thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy rạp chiếu' })
  deleteCinema(@Param('cinemaId') cinemaId: string, @User() user: PrismaUser) {
    return this.cinemasService.delete(cinemaId, user);
  }
}
