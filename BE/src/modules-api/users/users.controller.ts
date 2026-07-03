import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../../common/decorators/user.decorator';
import type { User as PrismaUser } from '../../modules-system/prisma/generated/prisma/client';
import { CreateStaffDto, UpdateStaffDto, UpdateProfileDto } from './dto/users.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { RoleGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/role.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerUsersConfig } from '../../common/configs/multer.config';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff', 'user') // Hoặc bỏ Roles nếu chỉ cần JwtAuthGuard, nhưng cứ để cho đồng nhất
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy thông tin cá nhân (Profile)' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  getProfile(@User() user: PrismaUser) {
    return this.usersService.getProfile(user.email);
  }

  @Put('profile')
  @UseGuards(RoleGuard)
  @Roles('admin', 'staff', 'user')
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('avatar', multerUsersConfig))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  updateProfile(
    @User() user: PrismaUser,
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.usersService.updateProfile(user.email, updateProfileDto, file?.filename);
  }

  @Get()
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy danh sách người dùng (ADMIN)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (Mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng / trang (Mặc định: 10)' })
  @ApiQuery({ name: 'userType', required: false, type: String, description: 'Loại tài khoản (user, staff, admin)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  getAllUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('userType') userType?: string,
  ) {
    return this.usersService.getAllUsers(page, limit, userType);
  }

  @Get(':email')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy chi tiết 1 người dùng (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tài khoản' })
  getUserById(@Param('email') email: string) {
    return this.usersService.getUserById(email);
  }

  @Post('staff')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Tạo tài khoản nhân viên - Staff (ADMIN)' })
  @ApiResponse({ status: 201, description: 'Tạo tài khoản thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 409, description: 'Tài khoản hoặc email đã tồn tại' })
  createStaff(@Body() createStaffDto: CreateStaffDto) {
    return this.usersService.createStaff(createStaffDto);
  }

  @Put('staff/:email')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật tài khoản hoặc luân chuyển Cụm rạp cho Staff (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tài khoản hoặc cụm rạp' })
  updateStaff(
    @Param('email') email: string,
    @Body() updateStaffDto: UpdateStaffDto,
  ) {
    return this.usersService.updateStaff(email, updateStaffDto);
  }

  @Delete(':email')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Vô hiệu hóa tài khoản (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Vô hiệu hóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tài khoản' })
  deleteUser(@Param('email') email: string) {
    return this.usersService.deleteUser(email);
  }
}
