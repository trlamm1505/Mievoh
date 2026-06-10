export interface BookingEntity {
  bookingId: string;
  username: string;
  bookingDate: string;
  totalPrice: number;
  paymentStatus: string;
  paymentMethod: string | null;
  ticketCode: string;
  movieTitleVi: string;
  movieTitleEn: string;
  movieImageUrl: string;
  cinemaName: string;
  showDateTime: string;
  seats: string; // Comma separated list of seat names
  foods: string; // JSON string of BookingFood[]
}
