import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
  Query,
} from '@nestjs/common';
import { CinemaComplexesService } from './cinema-complexes.service';
import { Roles } from '../../common/decorators/role.decorator';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CreateCinemaComplexDto,
  UpdateCinemaComplexDto,
} from './dto/cinema-complexes.dto';
import { RoleGuard } from '../../common/guards/role.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Cinema Complexes')
@ApiExtraModels(CreateCinemaComplexDto, UpdateCinemaComplexDto)
@Controller('cinema-complexes')
export class CinemaComplexesController {
  constructor(
    private readonly cinemaComplexesService: CinemaComplexesService,
  ) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Tạo cụm rạp mới (ADMIN)' })
  @ApiResponse({ status: 201, description: 'Tạo cụm rạp thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hệ thống rạp' })
  createCinemaComplex(@Body() body: CreateCinemaComplexDto) {
    return this.cinemaComplexesService.create(body);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Lấy danh sách cụm rạp (có thể lọc theo hệ thống rạp)',
  })
  @ApiQuery({
    name: 'cinemaSystemId',
    required: false,
    description: 'Mã hệ thống rạp để lọc',
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hệ thống rạp' })
  getCinemaComplexes(@Query('cinemaSystemId') cinemaSystemId?: string) {
    if (cinemaSystemId) {
      return this.cinemaComplexesService.getCinemaComplexesBySystemId(
        cinemaSystemId,
      );
    }
    return this.cinemaComplexesService.findAll();
  }

  @Get('/:cinemaComplexId')
  @Public()
  @ApiOperation({ summary: 'Lấy chi tiết cụm rạp' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cụm rạp' })
  findById(@Param('cinemaComplexId') cinemaComplexId: string) {
    return this.cinemaComplexesService.findById(cinemaComplexId);
  }

  @Put()
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật cụm rạp (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Cập nhật cụm rạp thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền' })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy cụm rạp hoặc hệ thống rạp',
  })
  updateCinemaComplex(@Body() body: UpdateCinemaComplexDto) {
    return this.cinemaComplexesService.update(body);
  }

  @Delete('/:cinemaComplexId')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa cụm rạp (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Xóa cụm rạp thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cụm rạp' })
  deleteCinemaComplex(@Param('cinemaComplexId') cinemaComplexId: string) {
    return this.cinemaComplexesService.delete(cinemaComplexId);
  }
}
