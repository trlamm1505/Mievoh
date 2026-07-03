import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { Roles } from '../../common/decorators/role.decorator';
import { RoleGuard } from '../../common/guards/role.guard';
import {
    ApiBearerAuth,
    ApiExtraModels,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { CreateStaffDto, UpdateStaffDto } from './dto/staff.dto';

@ApiTags('Staff')
@ApiExtraModels(CreateStaffDto, UpdateStaffDto)
@Controller('staff')
@UseGuards(RoleGuard)
@Roles('admin')
@ApiBearerAuth('JWT-auth')
export class StaffController {
    constructor(private readonly staffService: StaffService) { }

    @Post()
    @ApiOperation({ summary: 'Tạo tài khoản nhân viên (ADMIN)' })
    @ApiResponse({ status: 201, description: 'Tạo nhân viên thành công' })
    @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
    @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
    @ApiResponse({ status: 403, description: 'Không có quyền' })
    create(@Body() body: CreateStaffDto) {
        return this.staffService.create(body);
    }

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách nhân viên (ADMIN)' })
    @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
    @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
    @ApiResponse({ status: 403, description: 'Không có quyền' })
    findAll() {
        return this.staffService.findAll();
    }

    @Patch('/:email')
    @ApiOperation({ summary: 'Cập nhật nhân viên (ADMIN)' })
    @ApiResponse({ status: 200, description: 'Cập nhật nhân viên thành công' })
    @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
    @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
    @ApiResponse({ status: 403, description: 'Không có quyền' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy nhân viên' })
    update(@Param('email') email: string, @Body() body: UpdateStaffDto) {
        return this.staffService.update(email, body);
    }

    @Delete('/:email')
    @ApiOperation({ summary: 'Xóa nhân viên (ADMIN)' })
    @ApiResponse({ status: 200, description: 'Xóa nhân viên thành công' })
    @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
    @ApiResponse({ status: 403, description: 'Không có quyền' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy nhân viên' })
    delete(@Param('email') email: string) {
        return this.staffService.delete(email);
    }
}
