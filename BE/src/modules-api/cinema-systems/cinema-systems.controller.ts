import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/role.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerHeThongRapConfig } from '../../common/configs/multer.config';
import { RoleGuard } from '../../common/guards/role.guard';
import { CinemaSystemsService } from './cinema-systems.service';
import {
  CreateCinemaSystemDto,
  UpdateCinemaSystemDto,
} from './dto/cinema-systems.dto';

@ApiTags('Cinema Systems')
@Controller('cinema-systems')
export class CinemaSystemsController {
  constructor(private readonly CinemaSystemsService: CinemaSystemsService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('logo', multerHeThongRapConfig))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Tạo hệ thống rạp mới (ADMIN)' })
  @ApiResponse({ status: 201, description: 'Tạo hệ thống rạp thành công' })  
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc chỉ chấp nhận file ảnh',
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền' })
  createHeThongRap(
    @Body() body: CreateCinemaSystemDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.CinemaSystemsService.create(body, file.filename);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách hệ thống rạp' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findAll() {
    return this.CinemaSystemsService.findAll();
  }

  @Get('/:cinemaSystemId')
  @Public()
  @ApiOperation({ summary: 'Lấy chi tiết hệ thống rạp' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hệ thống rạp' })
  findById(@Param('cinemaSystemId') cinemaSystemId: string) {
    return this.CinemaSystemsService.findById(cinemaSystemId);
  }

  @Put()
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('logo', multerHeThongRapConfig))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Cập nhật hệ thống rạp (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Cập nhật hệ thống rạp thành công' })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc chỉ chấp nhận file ảnh',
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hệ thống rạp' })
  updateHeThongRap(
    @Body() body: UpdateCinemaSystemDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.CinemaSystemsService.update(body, file?.filename);
  }

  @Delete('/:cinemaSystemId')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa hệ thống rạp (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Xóa hệ thống rạp thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hệ thống rạp' })
  deleteHeThongRap(@Param('cinemaSystemId') cinemaSystemId: string) {
    return this.CinemaSystemsService.delete(cinemaSystemId);
  }
}
