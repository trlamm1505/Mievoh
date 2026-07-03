import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCinemaSystemDto {
  @ApiProperty({ example: 'CGV', description: 'Tên hệ thống rạp' })
  @IsNotEmpty({ message: 'Tên hệ thống rạp không được để trống' })
  @IsString({ message: 'Tên hệ thống rạp phải là chuỗi' })
  name!: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File logo hệ thống rạp',
  })
  @IsOptional()
  logo?: any;
}

export class UpdateCinemaSystemDto {
  @ApiProperty({
    example: '60d5ecb8b392d700155b3f11',
    description: 'Mã hệ thống rạp',
  })
  @IsNotEmpty({ message: 'Mã hệ thống rạp không được để trống' })
  @IsString({ message: 'Mã hệ thống rạp phải là chuỗi' })
  cinemaSystemId!: string;

  @ApiProperty({
    example: 'CGV Cinemas',
    description: 'Tên hệ thống rạp',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Tên hệ thống rạp phải là chuỗi' })
  name?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'File logo mới (Tùy chọn)',
  })
  @IsOptional()
  logo?: any;
}
