import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCinemaComplexDto {
  @ApiProperty({ example: 'CGV Vincom', description: 'Tên cụm rạp' })
  @IsNotEmpty({ message: 'Tên cụm rạp không được để trống' })
  @IsString({ message: 'Tên cụm rạp phải là chuỗi' })
  name!: string;

  @ApiProperty({ example: '123 Nguyễn Văn A, Quận 1', description: 'Địa chỉ' })
  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  address!: string;

  @ApiProperty({ example: '60d5ecb8b392d700155b3f11', description: 'Mã hệ thống rạp' })
  @IsNotEmpty({ message: 'Mã hệ thống rạp không được để trống' })
  @IsString({ message: 'Mã hệ thống rạp phải là chuỗi' })
  cinemaSystemId!: string;
}

export class UpdateCinemaComplexDto {
  @ApiProperty({ example: '60d5ecb8b392d700155b3f12', description: 'Mã cụm rạp' })
  @IsNotEmpty({ message: 'Mã cụm rạp không được để trống' })
  @IsString({ message: 'Mã cụm rạp phải là chuỗi' })
  cinemaComplexId!: string;

  @ApiProperty({
    example: 'CGV Vincom Center',
    description: 'Tên cụm rạp',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Tên cụm rạp phải là chuỗi' })
  name?: string;

  @ApiProperty({
    example: '456 Lê Văn B, Quận 2',
    description: 'Địa chỉ',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  address?: string;

  @ApiProperty({
    example: '60d5ecb8b392d700155b3f11',
    description: 'Mã hệ thống rạp',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Mã hệ thống rạp phải là chuỗi' })
  cinemaSystemId?: string;
}
