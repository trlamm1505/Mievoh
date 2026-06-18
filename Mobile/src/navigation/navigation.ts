import { useRouter } from 'expo-router';

export const ROUTES = {
  HOME: '/' as any,
  LOGIN: '/login' as any,
  REGISTER: '/register' as any,
  FORGOT_PASSWORD: '/forgot-password' as any,
  PERSONAL_INFO: '/personal-info' as any,
  MOVIE_HISTORY: '/movie-history' as any,
  CHANGE_PASSWORD: '/change-password' as any,
  MOVIE_DETAIL: '/movie-detail' as any,
  NOTIFICATIONS: '/notifications' as any,
  // Booking flow
  SELECT_SHOWTIME: '/booking/select-showtime' as any,
  SELECT_SEAT: '/booking/select-seat' as any,
  SELECT_COMBO: '/booking/select-combo' as any,
  PAYMENT: '/booking/payment' as any,
  TICKET_RESULT: '/booking/ticket-result' as any,
  // Cinema-first booking flow
  CINEMA_SHOWTIME: '/cinema-booking/cinema-showtime' as any,
} as const;

export type RoutePath = string;

export function useAppNavigation() {
  const router = useRouter();

  return {
    goToHome: () => router.replace(ROUTES.HOME),
    goToLogin: () => router.push(ROUTES.LOGIN),
    goToRegister: () => router.push(ROUTES.REGISTER),
    goToForgotPassword: () => router.push(ROUTES.FORGOT_PASSWORD),
    goToPersonalInfo: () => router.push(ROUTES.PERSONAL_INFO),
    goToMovieHistory: () => router.push(ROUTES.MOVIE_HISTORY),
    goToChangePassword: () => router.push(ROUTES.CHANGE_PASSWORD),
    goToMovieDetail: (id: string) => router.push({ pathname: ROUTES.MOVIE_DETAIL, params: { id } }),
    goToNotifications: () => router.push(ROUTES.NOTIFICATIONS),
    // Booking flow
    goToSelectShowtime: () => router.push(ROUTES.SELECT_SHOWTIME),
    goToSelectSeat: () => router.push(ROUTES.SELECT_SEAT),
    goToSelectCombo: () => router.push(ROUTES.SELECT_COMBO),
    goToPayment: () => router.push(ROUTES.PAYMENT),
    goToTicketResult: () => router.push(ROUTES.TICKET_RESULT),
    // Cinema-first booking flow
    goToCinemaShowtime: () => router.push(ROUTES.CINEMA_SHOWTIME),
    goBack: () => router.back(),
    push: (path: RoutePath) => router.push(path as any),
    replace: (path: RoutePath) => router.replace(path as any),
  };
}

