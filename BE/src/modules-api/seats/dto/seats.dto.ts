import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class GenerateSeatsDto {
  @ApiProperty({ example: '60d5ecb8b392d700155b3f12', description: 'Mã rạp chiếu (Phòng chiếu)' })
  @IsNotEmpty({ message: 'Mã rạp chiếu không được để trống' })
  @IsString({ message: 'Mã rạp chiếu phải là chuỗi' })
  cinemaId!: string;

  @ApiProperty({ example: 'A', description: 'Ký tự bắt đầu của hàng ghế' })
  @IsNotEmpty({ message: 'Ký tự bắt đầu không được để trống' })
  @IsString()
  rowLetterStart!: string;

  @ApiProperty({ example: 'J', description: 'Ký tự kết thúc của hàng ghế' })
  @IsNotEmpty({ message: 'Ký tự kết thúc không được để trống' })
  @IsString()
  rowLetterEnd!: string;

  @ApiProperty({ example: 12, description: 'Số ghế mỗi hàng' })
  @IsNotEmpty({ message: 'Số ghế không được để trống' })
  @IsInt()
  @Min(1)
  @Max(50)
  seatsPerRow!: number;

  @ApiProperty({ example: ['G', 'H'], description: 'Danh sách các hàng là ghế VIP', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vipRows?: string[];

  @ApiProperty({ example: ['J'], description: 'Danh sách các hàng là ghế Đôi (Sweetbox)', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sweetboxRows?: string[];
}

export class CreateSeatDto {
  @ApiProperty({ example: '60d5ecb8b392d700155b3f12', description: 'Mã rạp chiếu (Phòng chiếu)' })
  @IsNotEmpty({ message: 'Mã rạp chiếu không được để trống' })
  @IsString({ message: 'Mã rạp chiếu phải là chuỗi' })
  cinemaId!: string;

  @ApiProperty({ example: 'A1', description: 'Tên ghế' })
  @IsNotEmpty({ message: 'Tên ghế không được để trống' })
  @IsString({ message: 'Tên ghế phải là chuỗi' })
  name!: string;

  @ApiProperty({ example: 'Thường', description: 'Loại ghế (Thường, VIP, Đôi)' })
  @IsNotEmpty({ message: 'Loại ghế không được để trống' })
  @IsString({ message: 'Loại ghế phải là chuỗi' })
  seatType!: string;
}

export class UpdateSeatDto {
  @ApiProperty({ example: '60d5ecb8b392d700155b3f12', description: 'Mã ghế' })
  @IsNotEmpty({ message: 'Mã ghế không được để trống' })
  @IsString({ message: 'Mã ghế phải là chuỗi' })
  seatId!: string;

  @ApiProperty({ example: 'A1', description: 'Tên ghế', required: false })
  @IsOptional()
  @IsString({ message: 'Tên ghế phải là chuỗi' })
  name?: string;

  @ApiProperty({ example: 'VIP', description: 'Loại ghế (Thường, VIP, Đôi)', required: false })
  @IsOptional()
  @IsString({ message: 'Loại ghế phải là chuỗi' })
  seatType?: string;
}
