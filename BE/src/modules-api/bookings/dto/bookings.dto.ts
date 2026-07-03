import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FoodItemDto {
  @ApiProperty({ description: 'ID món ăn' })
  @IsString()
  @IsNotEmpty()
  foodId!: string;

  @ApiProperty({ description: 'Số lượng mua', default: 1 })
  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CreateBookingDto {
  @ApiProperty({ description: 'ID Suất chiếu' })
  @IsString()
  @IsNotEmpty()
  showtimeId!: string;

  @ApiProperty({ description: 'Danh sách ID ghế khách chọn', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  seats!: string[];

  @ApiProperty({
    description: 'Danh sách đồ ăn khách chọn mua',
    type: [FoodItemDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FoodItemDto)
  foods?: FoodItemDto[];

  @ApiProperty({ description: 'Mã giảm giá (Nếu có)', required: false })
  @IsOptional()
  @IsString()
  voucherCode?: string;

  @ApiProperty({
    description: 'URL chuyển hướng về lại App/Web sau khi thanh toán VNPay',
    required: false,
    example: 'myapp://vnpay-return',
  })
  @IsOptional()
  @IsString()
  returnUrl?: string;
}
