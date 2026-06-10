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
    goBack: () => router.back(),
    push: (path: RoutePath) => router.push(path as any),
    replace: (path: RoutePath) => router.replace(path as any),
  };
}
