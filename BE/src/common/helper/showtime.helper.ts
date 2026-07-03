import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../../modules-system/prisma/prisma.service';
import { TimeCalculatorHelper } from './time-calculator.helper';

export class ShowtimeHelper {
  /**
   * Kiểm tra trùng lịch chiếu (Overlapping) bằng cách lấy DB lên để đối soát
   * Hỗ trợ excludeShowtimeId để dùng cho chức năng Update (bỏ qua chính nó)
   */
  static async checkShowtimeConflict(
    prisma: PrismaService,
    cinemaId: string,
    newStart: Date,
    newEnd: Date,
    bufferTime: number = 15,
    excludeShowtimeId?: string,
  ) {
    // lấy vùng khoanh ngày để query cho nhẹ (chỉ lấy các phim chiếu trong ngày hôm đó)
    const { startOfDay, endOfDay } = TimeCalculatorHelper.getStartAndEndOfDay(newStart);

    const existingShowtimes = await prisma.showtime.findMany({
      where: {
        cinemaId,
        status: 'Active',
        showDateTime: {
          gte: startOfDay,
          lt: endOfDay,
        },
        // loại trừ suất chiếu đang sửa (nếu có)
        ...(excludeShowtimeId ? { showtimeId: { not: excludeShowtimeId } } : {}),
      },
      include: {
        Movie: { select: { duration: true } },
      },
    });

    for (const ex of existingShowtimes) {
      const exDuration = ex.Movie?.duration || 120;
      const exStart = ex.showDateTime ? new Date(ex.showDateTime) : new Date();
      const exEnd = TimeCalculatorHelper.calculateEndTime(exStart, exDuration, bufferTime);

      // báo lỗi nếu thời gian chiếu đè lên nhau
      if (TimeCalculatorHelper.isOverlapping(newStart, newEnd, exStart, exEnd)) {
        throw new ConflictException(
          `Trùng lịch chiếu! Phòng này đã có suất chiếu từ ${exStart.toLocaleTimeString()} đến ${exEnd.toLocaleTimeString()}`,
        );
      }
    }
  }
}
