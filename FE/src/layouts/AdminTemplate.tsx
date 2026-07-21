import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/index.tsx';
import { logout, updateUser } from '../pages/User/Login/slice.ts';
import { useTheme } from '../contextAPI/ThemeContext.tsx';
import { useLanguage } from '../contextAPI/LanguageContext.tsx';
import {
  LayoutDashboard,
  Film,
  Building2,
  MapPin,
  Monitor,
  Calendar,
  Popcorn,
  Image,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Home,
  UserRound,
  Globe,
  Sun,
  Moon,
  Users,
  Ticket,
  Bell,
  Brain,
  BarChart3,
} from 'lucide-react';

// `roles` xác định vai trò nào được phép thấy mục này.
// Admin quản lý toàn bộ hệ thống; Staff chỉ vận hành trong phạm vi một cụm rạp
// (phòng chiếu, lịch chiếu, đồ ăn & combo) nên không thấy các mục cấp hệ thống.
const navItems = [
  { to: '/admin', icon: LayoutDashboard, labelKey: 'admin_dashboard' as const, end: true, roles: ['admin', 'staff'] },
  { to: '/admin/statistics', icon: BarChart3, labelKey: 'admin_statistics' as const, roles: ['admin'] },
  { to: '/admin/movies', icon: Film, labelKey: 'admin_movies' as const, roles: ['admin', 'staff'] },
  { to: '/admin/cinema-systems', icon: Building2, labelKey: 'admin_cinema_systems' as const, roles: ['admin'] },
  { to: '/admin/cinema-complexes', icon: MapPin, labelKey: 'admin_cinema_complexes' as const, roles: ['admin'] },
  { to: '/admin/cinemas', icon: Monitor, labelKey: 'admin_cinemas' as const, roles: ['admin', 'staff'] },
  { to: '/admin/showtimes', icon: Calendar, labelKey: 'admin_showtimes' as const, roles: ['admin', 'staff'] },
  { to: '/admin/foods', icon: Popcorn, labelKey: 'admin_foods' as const, roles: ['admin', 'staff'] },
  { to: '/admin/banners', icon: Image, labelKey: 'admin_banners' as const, roles: ['admin'] },
  { to: '/admin/vouchers', icon: Ticket, labelKey: 'admin_vouchers' as const, roles: ['admin', 'staff'] },
  { to: '/admin/users', icon: Users, labelKey: 'admin_users' as const, roles: ['admin'] },
  { to: '/admin/staff', icon: UserRound, labelKey: 'admin_staff' as const, roles: ['admin'] },
  { to: '/admin/notifications', icon: Bell, labelKey: 'admin_notifications' as const, roles: ['admin'] },
  { to: '/admin/recommendations', icon: Brain, labelKey: 'admin_recommendations' as const, roles: ['admin'] },
];

export default function AdminTemplate() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const user = useSelector((state: RootState) => state.login.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Cho phép admin chuyển sang trải nghiệm với vai trò người dùng (user).
  // Lưu lại vai trò gốc vào realRole để có thể quay lại trang quản trị.
  const handleSwitchToUser = () => {
    const original = user?.realRole || user?.role || user?.userType;
    dispatch(updateUser({ role: 'USER', realRole: original }));
    navigate('/');
  };

  // Redirect non-admin/staff users
  const role = user?.role?.toLowerCase() || user?.userType?.toLowerCase() || '';
  if (!user || (role !== 'admin' && role !== 'staff')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('admin_access_denied')}</h1>
          <p className="text-gray-600 mb-4">{t('admin_no_permission')}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            {t('login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <img src="/mievoh_logo_rounded.svg" alt="Mievoh" className="w-9 h-9" />
          <span className="text-lg font-bold text-violet-700">
            {role === 'admin' ? t('admin_title_admin') : t('admin_title_staff')}
          </span>
          <button className="lg:hidden ml-auto p-1" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.filter(item => item.roles.includes(role)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                  ? 'bg-violet-50 text-violet-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 p-3 space-y-2">
          {/* Segmented role toggle: Member / Admin */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={handleSwitchToUser}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-white hover:text-violet-700 transition-all"
            >
              <UserRound className="w-4 h-4" />
              <span>{t('admin_switch_member')}</span>
            </button>
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-white text-violet-700 shadow-sm cursor-default"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{role === 'staff' ? 'Staff' : t('admin_switch_admin')}</span>
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-20 h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-4 lg:px-6">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>

          <div className="hidden lg:block" />

          {/* Language & Theme toggles + User info */}
          <div className="flex items-center gap-2">

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer outline-none border-none text-xs font-extrabold text-violet-700 dark:text-violet-400 shrink-0 select-none"
              aria-label="Toggle language"
            >
              <Globe className="h-4 w-4" />
              <span>{language.toUpperCase()}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer outline-none border-none shrink-0"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="h-4.5 w-4.5 text-gray-700 fill-gray-700" />
              ) : (
                <Sun className="h-4.5 w-4.5 text-amber-500 fill-amber-500" />
              )}
            </button>

            {/* User info */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <img
                  src={user?.avatar || '/images/avatar.jpg'}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover border-2 border-violet-200"
                />
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.fullName || user?.name || user?.username}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.fullName || user?.username}</p>
                      <p className="text-xs text-gray-500 capitalize">{role}</p>
                    </div>
                    <Link
                      to="/"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Home className="w-4 h-4" />
                      {language === 'vi' ? 'Về trang chủ' : 'Go to Homepage'}
                    </Link>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
