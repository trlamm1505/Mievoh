import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UploadBannerImageDto {
  @ApiProperty({ example: '60d5ecb8b392d700155b3f12', description: 'Mã phim' })
  @IsNotEmpty({ message: 'Mã phim không được để trống' })
  @IsString({ message: 'Mã phim phải là chuỗi' })
  movieId!: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File ảnh banner',
  })
  @IsOptional()
  image?: any;
}
