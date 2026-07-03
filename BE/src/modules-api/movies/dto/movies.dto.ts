import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsNumber, IsDate } from 'class-validator';

export class CreateMovieDto {
  @ApiPropertyOptional({ description: 'Tên bộ phim (Tiếng Việt)' })
  @IsOptional()
  @IsString()
  title_vi?: string;

  @ApiPropertyOptional({ description: 'Tên bộ phim (Tiếng Anh)' })
  @IsOptional()
  @IsString()
  title_en?: string;

  @ApiPropertyOptional({ description: 'Link trailer YouTube' })
  @IsOptional()
  @IsString()
  trailerUrl?: string;

  @ApiPropertyOptional({ description: 'Mô tả phim (Tiếng Việt)' })
  @IsOptional()
  @IsString()
  description_vi?: string;

  @ApiPropertyOptional({ description: 'Mô tả phim (Tiếng Anh)' })
  @IsOptional()
  @IsString()
  description_en?: string;

  @ApiPropertyOptional({ description: 'Ngày phát hành', example: '2024-12-25' })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  releaseDate?: Date;

  @ApiPropertyOptional({ description: 'Thời lượng phim (phút)' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ description: 'Ngôn ngữ (Tiếng Việt)' })
  @IsOptional()
  @IsString()
  language_vi?: string;

  @ApiPropertyOptional({ description: 'Ngôn ngữ (Tiếng Anh)' })
  @IsOptional()
  @IsString()
  language_en?: string;

  @ApiPropertyOptional({ description: 'Phân loại độ tuổi', example: 'C18' })
  @IsOptional()
  @IsString()
  ageRestriction?: string;

  @ApiPropertyOptional({ description: 'Thể loại phim (ngăn cách bởi dấu phẩy)', example: 'Hành động,Viễn tưởng' })
  @IsOptional()
  @IsString()
  genres?: string;

  @ApiPropertyOptional({ description: 'Đạo diễn' })
  @IsOptional()
  @IsString()
  director?: string;

  @ApiPropertyOptional({ description: 'Danh sách diễn viên' })
  @IsOptional()
  @IsString()
  cast?: string;

  @ApiPropertyOptional({ description: 'Phim Hot (boolean)', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isHot?: boolean;

  @ApiPropertyOptional({ description: 'Đang chiếu (boolean)', default: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isShowing?: boolean;

  @ApiPropertyOptional({ description: 'Sắp chiếu (boolean)', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isComingSoon?: boolean;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'File ảnh (Poster)' })
  @IsOptional()
  image?: any;
}

export class UpdateMovieDto extends CreateMovieDto {}
