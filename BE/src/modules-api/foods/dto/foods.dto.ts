import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFoodDto {
  @ApiProperty({ description: 'Tên món ăn/Combo', example: 'Combo 1 Bắp 2 Nước' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Mô tả món ăn', example: 'Bao gồm 1 bắp ngọt lớn và 2 ly coca cỡ vừa' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Giá bán (VND)', example: 120000 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @ApiProperty({ description: 'ID của cụm rạp sở hữu menu này' })
  @IsString()
  @IsNotEmpty()
  cinemaComplexId!: string;

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động', default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Ảnh món ăn (Tùy chọn)',
  })
  @IsOptional()
  image?: any;
}

export class UpdateFoodDto {
  @ApiPropertyOptional({ description: 'Tên món ăn/Combo', example: 'Combo 1 Bắp 2 Nước' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Mô tả món ăn', example: 'Bao gồm 1 bắp ngọt lớn và 2 ly coca cỡ vừa' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Giá bán (VND)', example: 120000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ description: 'ID của cụm rạp sở hữu menu này' })
  @IsOptional()
  @IsString()
  cinemaComplexId?: string;

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động', default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Ảnh món ăn mới (Tùy chọn, bỏ qua nếu không muốn đổi ảnh)',
  })
  @IsOptional()
  image?: any;
}
