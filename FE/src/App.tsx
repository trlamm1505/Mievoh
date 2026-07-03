import { useEffect } from 'react'
import { BrowserRouter, Routes } from 'react-router-dom'
import { routes, generateRoutes } from './router/router.tsx'
import { Provider, useDispatch } from 'react-redux'
import { store } from './store/index.tsx'
import { ToastContainer, toast } from './components/Toast/Toast.tsx'
import { ThemeProvider } from './contextAPI/ThemeContext.tsx'
import { LanguageProvider, useLanguage } from './contextAPI/LanguageContext.tsx'
import { logout } from './pages/User/Login/slice.ts'

function TokenMonitor() {
  const dispatch = useDispatch();
  const { t } = useLanguage();

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            window
              .atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
          if (payload.exp && Date.now() >= payload.exp * 1000) {
            dispatch(logout());
            toast.error(t("session_expired"));
            window.location.href = '/login';
          }
        }
      } catch (e) {
        dispatch(logout());
        window.location.href = '/login';
      }
    };

    checkToken();
    const interval = setInterval(checkToken, 5000);
    return () => clearInterval(interval);
  }, [dispatch, t]);

  return null;
}

function App() {
  return (
    <Provider store={store}> 
      <ThemeProvider>
        <LanguageProvider>
          <BrowserRouter>
            <TokenMonitor />
            <Routes>
              {generateRoutes(routes)}
            </Routes>
            <ToastContainer />
          </BrowserRouter>
        </LanguageProvider>
      </ThemeProvider>
    </Provider>
  )
}

export default App

