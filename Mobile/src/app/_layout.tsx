import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../contextAPI/Auth/AuthContext";
import { ThemeProvider } from "../contextAPI/Theme/ThemeContext";
import { LanguageProvider } from "../contextAPI/Language/LanguageContext";
import { BookingProvider } from "../contextAPI/Booking/BookingContext";
import { ToastContainer } from "../components/Toast/Toast";
import { configureReanimatedLogger, ReanimatedLogLevel } from "react-native-reanimated";
import { initDatabase } from "../SQLite/database/AppDatabase";
import "../global.css";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export default function RootLayout() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <BookingProvider>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }} />
            <ToastContainer />
          </BookingProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
