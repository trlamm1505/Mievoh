import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'ID của phim cần đánh giá',
    example: '64b1c2...',
  })
  @IsNotEmpty({ message: 'Vui lòng cung cấp ID phim' })
  @IsString()
  movieId!: string;

  @ApiProperty({ description: 'Số sao đánh giá (từ 1 đến 5)', example: 5 })
  @IsNotEmpty({ message: 'Vui lòng chọn số sao' })
  @IsInt({ message: 'Số sao phải là số nguyên' })
  @Min(1, { message: 'Đánh giá thấp nhất là 1 sao' })
  @Max(5, { message: 'Đánh giá cao nhất là 5 sao' })
  rating!: number;

  @ApiPropertyOptional({
    description: 'Nội dung bình luận',
    example: 'Phim rất hay!',
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
