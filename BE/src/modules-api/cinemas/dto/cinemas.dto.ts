import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCinemaDto {
  @ApiProperty({ example: 'Rạp 1', description: 'Tên rạp' })
  @IsNotEmpty({ message: 'Tên rạp không được để trống' })
  @IsString({ message: 'Tên rạp phải là chuỗi' })
  name!: string;

  @ApiProperty({ example: '60d5ecb8b392d700155b3f12', description: 'Mã cụm rạp' })
  @IsNotEmpty({ message: 'Mã cụm rạp không được để trống' })
  @IsString({ message: 'Mã cụm rạp phải là chuỗi' })
  cinemaComplexId!: string;
}

export class UpdateCinemaDto {
  @ApiProperty({ example: '60d5ecb8b392d700155b3f13', description: 'Mã rạp' })
  @IsNotEmpty({ message: 'Mã rạp không được để trống' })
  @IsString({ message: 'Mã rạp phải là chuỗi' })
  cinemaId!: string;

  @ApiProperty({
    example: 'Rạp 1 - Premium',
    description: 'Tên rạp',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Tên rạp phải là chuỗi' })
  name?: string;

  @ApiProperty({ example: '60d5ecb8b392d700155b3f12', description: 'Mã cụm rạp', required: false })
  @IsOptional()
  @IsString({ message: 'Mã cụm rạp phải là chuỗi' })
  cinemaComplexId?: string;
}
