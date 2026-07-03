import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsDateString } from 'class-validator';

export class CreateShowtimeDto {
  @ApiProperty({ description: 'Mã phòng chiếu (Cinema ID)' })
  @IsString()
  cinemaId!: string;

  @ApiProperty({ description: 'Mã bộ phim (Movie ID)' })
  @IsString()
  movieId!: string;

  @ApiProperty({ description: 'Ngày giờ chiếu (Chuẩn ISO 8601)', example: '2026-06-05T12:00:00Z' })
  @IsDateString()
  showDateTime!: string;

  @ApiPropertyOptional({ description: 'Định dạng phim chiếu', default: '2D Phụ Đề' })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiPropertyOptional({ description: 'Giá vé cơ bản của suất chiếu này', example: 100000 })
  @IsOptional()
  @IsInt()
  ticketPrice?: number;
}

export class UpdateShowtimeDto {
  @ApiProperty({ description: 'Mã suất chiếu cần cập nhật (bắt buộc)' })
  @IsString()
  showtimeId!: string;

  @ApiPropertyOptional({ description: 'Mã phòng chiếu (Cinema ID)' })
  @IsOptional()
  @IsString()
  cinemaId?: string;

  @ApiPropertyOptional({ description: 'Mã bộ phim (Movie ID)' })
  @IsOptional()
  @IsString()
  movieId?: string;

  @ApiPropertyOptional({ description: 'Ngày giờ chiếu (Chuẩn ISO 8601)', example: '2026-06-05T12:00:00Z' })
  @IsOptional()
  @IsDateString()
  showDateTime?: string;

  @ApiPropertyOptional({ description: 'Định dạng phim chiếu' })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiPropertyOptional({ description: 'Giá vé cơ bản của suất chiếu này' })
  @IsOptional()
  @IsInt()
  ticketPrice?: number;

  @ApiPropertyOptional({ description: 'Trạng thái (Active, Cancelled)' })
  @IsOptional()
  @IsString()
  status?: string;
}
