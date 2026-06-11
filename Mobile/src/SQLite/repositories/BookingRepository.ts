import { db } from '../database/AppDatabase';
import { BookingEntity } from '../models/BookingModel';
import { getBookingHistoryApi, BookingHistoryItem } from '../../axios/profile';

export class BookingRepository {
  /**
   * Save booking history lists into local SQLite database for offline sync
   */
  static saveBookings(email: string, items: BookingHistoryItem[]): void {
    try {
      db.withTransactionSync(() => {
        // Clear previous bookings for this user to sync with latest state
        db.runSync('DELETE FROM bookings WHERE email = ?', [email]);

        const statement = db.prepareSync(`
          INSERT INTO bookings (
            bookingId, email, bookingDate, totalPrice, paymentStatus, paymentMethod, ticketCode,
            movieTitleVi, movieTitleEn, movieImageUrl, cinemaName, showDateTime, seats, foods
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        try {
          for (const item of items) {
            const seatsStr = item.BookingDetails
              ? item.BookingDetails.map((d: any) => d.Seat?.name || '').filter(Boolean).join(', ')
              : '';
            const foodsStr = JSON.stringify(item.BookingFoods || []);

            statement.executeSync([
              item.bookingId,
              email,
              item.bookingDate || '',
              item.totalPrice || 0,
              item.paymentStatus || '',
              item.paymentMethod || null,
              item.ticketCode || '',
              item.Showtime?.Movie?.title_vi || '',
              item.Showtime?.Movie?.title_en || '',
              item.Showtime?.Movie?.imageUrl || '',
              item.Showtime?.Cinema?.CinemaComplex?.name || '',
              item.Showtime?.showDateTime || '',
              seatsStr,
              foodsStr
            ]);
          }
        } finally {
          statement.finalizeSync();
        }
      });
      console.log(`Saved ${items.length} bookings to SQLite for user ${email}.`);
    } catch (error) {
      console.error('Failed to save bookings to SQLite:', error);
    }
  }

  /**
   * Fetch cached bookings for offline mode
   */
  static getBookings(email: string): BookingHistoryItem[] {
    try {
      const rows = db.getAllSync<BookingEntity>(
        'SELECT * FROM bookings WHERE email = ? ORDER BY bookingDate DESC',
        [email]
      );

      return rows.map(row => {
        let bookingFoods: any[] = [];
        try {
          bookingFoods = row.foods ? JSON.parse(row.foods) : [];
        } catch (e) {
          console.error('Failed to parse foods JSON:', e);
        }

        const bookingDetails = row.seats
          ? row.seats.split(', ').map(seatName => ({
              Seat: {
                name: seatName,
                seatType: 'Regular'
              }
            }))
          : [];

        return {
          bookingId: row.bookingId,
          email: row.email,
          showtimeId: '',
          bookingDate: row.bookingDate,
          totalPrice: row.totalPrice,
          paymentStatus: row.paymentStatus,
          paymentMethod: row.paymentMethod,
          ticketCode: row.ticketCode,
          createdAt: row.bookingDate,
          updatedAt: row.bookingDate,
          Showtime: {
            showtimeId: '',
            cinemaId: '',
            movieId: '',
            showDateTime: row.showDateTime,
            format: '2D',
            Movie: {
              title_vi: row.movieTitleVi,
              title_en: row.movieTitleEn,
              imageUrl: row.movieImageUrl
            },
            Cinema: {
              CinemaComplex: {
                name: row.cinemaName,
                address: ''
              }
            }
          },
          BookingDetails: bookingDetails,
          BookingFoods: bookingFoods
        } as BookingHistoryItem;
      });
    } catch (error) {
      console.error('Failed to query bookings from SQLite:', error);
      return [];
    }
  }

  /**
   * Compare two booking lists to see if there are any updates or additions
   */
  static hasBookingChanges(local: BookingHistoryItem[], remote: BookingHistoryItem[]): boolean {
    if (local.length !== remote.length) return true;

    for (const r of remote) {
      const l = local.find(x => x.bookingId === r.bookingId);
      if (!l) return true; // New booking not found in local cache
      if (l.paymentStatus !== r.paymentStatus) return true; // Status changed (e.g. Pending -> Success)
      if (l.updatedAt !== r.updatedAt) return true; // Info updated on backend
    }

    return false;
  }

  /**
   * Fetch from server, compare with SQLite, and save only if there are updates
   */
  static async syncBookingsWithServer(email: string): Promise<void> {
    try {
      const res = await getBookingHistoryApi();
      const remoteData = (res && (res as any).data) ? (res as any).data : res;

      if (Array.isArray(remoteData)) {
        const localData = this.getBookings(email);
        
        if (this.hasBookingChanges(localData, remoteData)) {
          console.log('Detecting new/updated booking history. Syncing to SQLite...');
          this.saveBookings(email, remoteData);
        } else {
          console.log('Booking history in SQLite is up-to-date. Skipping write.');
        }
      }
    } catch (error) {
      console.error('Failed to sync booking history in background:', error);
      throw error;
    }
  }
}
