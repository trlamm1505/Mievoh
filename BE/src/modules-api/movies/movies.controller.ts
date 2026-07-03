import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { MoviesService } from './movies.service';
import { CreateMovieDto, UpdateMovieDto } from './dto/movies.dto';
import { RoleGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/role.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerMoviesConfig } from '../../common/configs/multer.config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiExtraModels,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Movies')
@ApiExtraModels(CreateMovieDto, UpdateMovieDto)
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get('/now-showing')
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách phim Đang Chiếu (có phân trang)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số trang (mặc định 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Số lượng (mặc định 10)',
  })
  @ApiQuery({
    name: 'filters',
    required: false,
    type: String,
    description: 'Chuỗi JSON bộ lọc (VD: {"title_vi": "Avatar"})',
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findNowShowing(@Query() query: any) {
    return this.moviesService.findNowShowing(query);
  }

  @Get('/coming-soon')
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách phim Sắp Chiếu (có phân trang)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số trang (mặc định 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Số lượng (mặc định 10)',
  })
  @ApiQuery({
    name: 'filters',
    required: false,
    type: String,
    description: 'Chuỗi JSON bộ lọc (VD: {"title_vi": "Avatar"})',
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findComingSoon(@Query() query: any) {
    return this.moviesService.findComingSoon(query);
  }

  @Get()
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy danh sách toàn bộ phim (ADMIN, STAFF)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số trang (mặc định 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Số lượng (mặc định 10)',
  })
  @ApiQuery({
    name: 'filters',
    required: false,
    type: String,
    description: 'Chuỗi JSON bộ lọc (VD: {"title": "Avatar"})',
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findAll(@Query() query: any) {
    return this.moviesService.findAll(query);
  }

  @Get('/:movieId')
  @Public()
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một phim' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phim' })
  findById(@Param('movieId') movieId: string) {
    return this.moviesService.findById(movieId);
  }

  @Post()
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('image', multerMoviesConfig))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Thêm phim mới (ADMIN, STAFF)' })
  @ApiResponse({ status: 201, description: 'Tạo phim thành công' })
  create(
    @Body() body: CreateMovieDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.moviesService.create(body, file?.filename);
  }

  @Put('/:movieId')
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('image', multerMoviesConfig))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Cập nhật phim (ADMIN, STAFF)' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phim' })
  update(
    @Param('movieId') movieId: string,
    @Body() body: UpdateMovieDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.moviesService.update(movieId, body, file?.filename);
  }

  @Delete('/:movieId')
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa phim (ADMIN, STAFF)' })
  @ApiResponse({ status: 200, description: 'Xóa phim thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phim' })
  delete(@Param('movieId') movieId: string) {
    return this.moviesService.delete(movieId);
  }
}
