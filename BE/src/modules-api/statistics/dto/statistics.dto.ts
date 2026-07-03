import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class GetRevenueChartDto {
  @ApiPropertyOptional({ description: 'Số ngày gần nhất lấy dữ liệu (Mặc định: 7)', default: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số ngày phải là một số nguyên' })
  @Min(1, { message: 'Số ngày tối thiểu là 1' })
  days?: number;
}

export class GetTopMoviesDto {
  @ApiPropertyOptional({ description: 'Số lượng phim trả về (Mặc định: 5)', default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit phải là một số nguyên' })
  @Min(1, { message: 'Limit tối thiểu là 1' })
  limit?: number;
}
