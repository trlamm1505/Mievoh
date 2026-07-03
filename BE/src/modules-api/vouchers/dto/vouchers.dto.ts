import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateVoucherDto {
  @ApiProperty({ description: 'Mã giảm giá (ví dụ: SALE50)' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({
    description: 'Loại giảm giá (PERCENTAGE hoặc FIXED)',
    enum: ['PERCENTAGE', 'FIXED'],
  })
  @IsEnum(['PERCENTAGE', 'FIXED'])
  discountType!: string;

  @ApiProperty({ description: 'Giá trị giảm (VD: 50% hoặc 50000)' })
  @IsInt()
  @Min(1)
  discountValue!: number;

  @ApiProperty({
    description: 'Số tiền giảm tối đa (Áp dụng cho PERCENTAGE)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxDiscount?: number;

  @ApiProperty({
    description: 'Đơn hàng tối thiểu để được giảm',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minPurchase?: number;

  @ApiProperty({ description: 'Ngày bắt đầu có hiệu lực (DD/MM/YYYY)', example: '08/06/2026' })
  @IsString()
  startDate!: string;

  @ApiProperty({ description: 'Ngày kết thúc (DD/MM/YYYY)', example: '08/07/2026' })
  @IsString()
  endDate!: string;

  @ApiProperty({ description: 'Tổng số lượt sử dụng tối đa', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @ApiProperty({
    description:
      'ID Cụm rạp áp dụng (Nếu Admin để trống thì áp dụng toàn quốc)',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  cinemaComplexId?: string;

  @ApiProperty({
    description: 'Có gửi Thông báo Broadcast cho toàn bộ hệ thống hay không?',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isBroadcast?: boolean;
}

export class UpdateVoucherDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  discountValue?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxDiscount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  minPurchase?: number;

  @ApiProperty({ description: 'Ngày bắt đầu mới (DD/MM/YYYY)', required: false, example: '08/06/2026' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ description: 'Ngày kết thúc mới (DD/MM/YYYY)', required: false, example: '08/07/2026' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ApplyVoucherDto {
  @ApiProperty({ description: 'Mã giảm giá' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ description: 'ID của Booking cần áp dụng mã' })
  @IsMongoId()
  @IsNotEmpty()
  bookingId!: string;
}
