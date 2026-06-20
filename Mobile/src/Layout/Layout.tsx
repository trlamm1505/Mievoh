import React, { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import OfflineScreen from '../screen/Offline/OfflineScreen';
import LoadingScreen from '../screen/Loading/LoadingScreen';
import { useTheme } from '../contextAPI/Theme/ThemeContext';

type TabKey = 'home' | 'rap' | 'phim' | 'uudai' | 'profile';

interface LayoutProps {
  children: React.ReactNode;
  activeTab?: TabKey;
  onTabChange?: (tab: TabKey) => void;
  skipInitialLoading?: boolean;
}

export default function Layout({ children, activeTab, onTabChange, skipInitialLoading = false }: LayoutProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isOffline, setIsOffline] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(!skipInitialLoading);

  const checkConnection = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('https://clients3.google.com/generate_204', {
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);
      
      if (response.status === 204 || response.ok) {
        setIsOffline((prev) => {
          if (prev === true) {
            // Transition from offline to online: trigger data reloading overlay
            setIsLoadingData(true);
          }
          return false;
        });
      } else {
        setIsOffline(true);
      }
    } catch (error) {
      setIsOffline(true);
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Check connection every 10 seconds
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  if (isOffline) {
    return <OfflineScreen />;
  }

  return (
    <View 
      style={{ flex: 1, backgroundColor: isDark ? '#0F0C20' : '#FFFFFF' }}
      className="relative"
    >
      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <ScrollView 
        style={{ flex: 1, backgroundColor: isDark ? '#0F0C20' : '#FFFFFF' }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      {/* Footer */}
      <Footer activeTab={activeTab} onTabChange={onTabChange} />

      {/* Loading overlay to cover screen while fetching background data */}
      {isLoadingData && (
        <LoadingScreen onFinished={() => setIsLoadingData(false)} />
      )}
    </View>
  );
}
