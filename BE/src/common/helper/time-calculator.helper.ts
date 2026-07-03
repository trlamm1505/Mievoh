export class TimeCalculatorHelper {
  /**
   * Tính toán thời gian kết thúc của một bộ phim (kèm thời gian dọn rạp)
   */
  static calculateEndTime(startTime: Date | string, durationMinutes: number, bufferMinutes: number = 15): Date {
    const start = new Date(startTime);
    const totalMinutes = durationMinutes + bufferMinutes;
    return new Date(start.getTime() + totalMinutes * 60000);
  }

  /**
   * Lấy thời điểm bắt đầu lúc 00:00:00 và kết thúc lúc 23:59:59 của một ngày
   */
  static getStartAndEndOfDay(targetDate?: Date | string): { startOfDay: Date; endOfDay: Date } {
    let startOfDay: Date;
    if (!targetDate) {
      startOfDay = new Date();
    } else if (typeof targetDate === 'string' && targetDate.includes('/')) {
      const [day, month, year] = targetDate.split('/');
      startOfDay = new Date(`${year}-${month}-${day}T00:00:00Z`);
    } else {
      startOfDay = new Date(targetDate);
    }

    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    return { startOfDay, endOfDay };
  }

  /**
   * Kiểm tra xem 2 khoảng thời gian có bị trùng đè (overlap) lên nhau không
   */
  static isOverlapping(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && start2 < end1;
  }

  /**
   * Chuyển Date object sang chuỗi định dạng "HH:mm:ss DD/MM/YYYY" theo múi giờ Việt Nam (UTC+7)
   */
  static formatToVietnamTime(date: Date | null): string | null {
    if (!date) return null;
    
    // Cộng thêm 7 tiếng cho UTC
    const vnDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    
    const dd = pad(vnDate.getUTCDate());
    const mm = pad(vnDate.getUTCMonth() + 1);
    const yyyy = vnDate.getUTCFullYear();
    
    const HH = pad(vnDate.getUTCHours());
    const minutes = pad(vnDate.getUTCMinutes());
    const ss = pad(vnDate.getUTCSeconds());
    
    return `${HH}:${minutes}:${ss} ${dd}/${mm}/${yyyy}`;
  }
}
