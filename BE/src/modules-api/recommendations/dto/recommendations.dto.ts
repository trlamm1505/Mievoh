import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export enum CronJobType {
  EMAIL = 'email',
  ANALYSIS = 'analysis',
}

export class ConfigCronDto {
  @ApiProperty({
    example: CronJobType.EMAIL,
    enum: CronJobType,
    description:
      'Chọn "email" để hẹn giờ gửi Mail Marketing, hoặc "analysis" để hẹn giờ chạy AI Python.',
  })
  @IsEnum(CronJobType, {
    message: 'Loại Cronjob chỉ được là email hoặc analysis',
  })
  @IsNotEmpty({ message: 'Type không được để trống' })
  type!: CronJobType;

  @ApiProperty({
    example: '0 8 * * *',
    description: `Biểu thức Cron tiêu chuẩn (Linux format). 
  - Dấu * nghĩa là "Mọi".
  - Cấu trúc: [Phút] [Giờ] [Ngày trong tháng] [Tháng] [Ngày trong tuần].
  - Các ví dụ phổ biến:
    + "0 8 * * *" : Chạy lúc 8h00 sáng mỗi ngày.
    + "30 20 * * *" : Chạy lúc 20h30 mỗi ngày.
    + "0 2 * * 0" : Chạy lúc 2h00 sáng mỗi Chủ Nhật.
    + "0 0 1 * *" : Chạy lúc 0h00 sáng ngày mùng 1 hàng tháng.`,
  })
  @IsString({ message: 'Biểu thức Cron phải là chuỗi' })
  @IsNotEmpty({ message: 'Biểu thức Cron không được để trống' })
  cronExpression!: string;

  @ApiProperty({
    example: 'chien_dich_mua_he',
    required: false,
    description: 'Tên định danh cho Cronjob (giúp dễ quản lý và xóa sau này). Nếu không điền sẽ dùng tên mặc định.',
  })
  @IsString()
  name?: string;
}

export class DeleteCronDto {
  @ApiProperty({ description: 'Khóa (key) của cronjob cần xóa (Lấy từ API getListCronJobs)' })
  @IsString()
  @IsNotEmpty()
  repeatKey!: string;
}
