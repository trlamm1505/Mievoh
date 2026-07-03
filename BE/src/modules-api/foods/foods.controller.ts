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
} from '@nestjs/common';
import { User } from '../../common/decorators/user.decorator';
import type { User as PrismaUser } from '../../modules-system/prisma/generated/prisma/client';
import { FoodsService } from './foods.service';
import { CreateFoodDto, UpdateFoodDto } from './dto/foods.dto';
import { RoleGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/role.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerFoodsConfig } from '../../common/configs/multer.config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';

@ApiTags('Foods')
@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Get('/complex/:complexId')
  @Public()
  @ApiOperation({ summary: 'Lấy menu đồ ăn/combo của một cụm rạp' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findByComplex(@Param('complexId') complexId: string) {
    return this.foodsService.findByComplex(complexId);
  }

  @Post()
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Tạo món ăn mới (ADMIN, STAFF)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerFoodsConfig))
  @ApiResponse({ status: 201, description: 'Tạo món ăn thành công' })
  create(
    @Body() createFoodDto: CreateFoodDto,
    @User() user: PrismaUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.foodsService.create(createFoodDto, user, file);
  }

  @Put('/:foodId')
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật món ăn (ADMIN, STAFF)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerFoodsConfig))
  @ApiResponse({ status: 200, description: 'Cập nhật món ăn thành công' })
  update(
    @Param('foodId') foodId: string,
    @Body() updateFoodDto: UpdateFoodDto,
    @User() user: PrismaUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.foodsService.update(foodId, updateFoodDto, user, file);
  }

  @Delete('/:foodId')
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa món ăn (ADMIN, STAFF)' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({
    status: 400,
    description: 'Không thể xóa vì đã có người đặt vé mua món này',
  })
  delete(@Param('foodId') foodId: string, @User() user: PrismaUser) {
    return this.foodsService.delete(foodId, user);
  }
}
