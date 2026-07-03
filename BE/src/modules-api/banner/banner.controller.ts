import {
  Controller,
  Get,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { BannerService } from './banner.service';
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
import { multerBannersConfig } from '../../common/configs/multer.config';
import { UploadBannerImageDto } from './dto/banner.dto';
import { RoleGuard } from '../../common/guards/role.guard';

@ApiTags('Banners')
@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách ảnh banner' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách ảnh banner thành công',
  })
  findAll() {
    return this.bannerService.findAll();
  }

  @Post('')
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('image', multerBannersConfig))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload ảnh banner (ADMIN, STAFF)' })
  @ApiResponse({ status: 200, description: 'Upload ảnh banner thành công' })
  @ApiResponse({ status: 400, description: 'Chỉ chấp nhận file ảnh' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy banner' })
  uploadImage(
    @Body() body: UploadBannerImageDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.bannerService.uploadImage(body.movieId, file.filename);
  }

  @Delete('/:bannerId')
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa ảnh banner (ADMIN, STAFF)' })
  @ApiResponse({ status: 200, description: 'Xóa ảnh banner thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ảnh banner' })
  deleteBanner(@Param('bannerId') bannerId: string) {
    return this.bannerService.deleteBanner(bannerId);
  }
}
