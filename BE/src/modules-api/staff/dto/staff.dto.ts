import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateStaffDto {
    @ApiProperty({ example: 'staff01@cinema.com', description: 'Email (dùng để đăng nhập)' })
    @IsNotEmpty({ message: 'Email không được để trống' })
    @IsString()
    email!: string;

    @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ tên nhân viên' })
    @IsNotEmpty({ message: 'Họ tên không được để trống' })
    @IsString()
    fullName!: string;

    @ApiPropertyOptional({ example: '0901234567', description: 'Số điện thoại' })
    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @ApiProperty({ example: '123456', description: 'Mật khẩu' })
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
    @IsString()
    password!: string;

    @ApiProperty({
        example: '60d5ecb8b392d700155b3f11',
        description: 'Mã cụm rạp được phân công quản lý',
    })
    @IsNotEmpty({ message: 'Mã cụm rạp không được để trống' })
    @IsString()
    cinemaComplexId!: string;
}

export class UpdateStaffDto {
    @ApiPropertyOptional({ example: 'Nguyễn Văn B', description: 'Họ tên mới' })
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiPropertyOptional({ example: '0901234567', description: 'Số điện thoại mới' })
    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @ApiPropertyOptional({ example: '123456', description: 'Mật khẩu mới (nếu muốn đổi)' })
    @IsOptional()
    @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
    @IsString()
    password?: string;

    @ApiPropertyOptional({
        example: '60d5ecb8b392d700155b3f11',
        description: 'Mã cụm rạp quản lý mới',
    })
    @IsOptional()
    @IsString()
    cinemaComplexId?: string;
}
