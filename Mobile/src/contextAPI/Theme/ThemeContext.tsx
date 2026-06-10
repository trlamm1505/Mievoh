import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme } from "nativewind";

export type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("light");

    useEffect(() => {
        AsyncStorage.getItem("mievoh_theme").then((stored) => {
            if (stored === "dark" || stored === "light") {
                setThemeState(stored as Theme);
                colorScheme.set(stored);
            } else {
                const initial = colorScheme.get() === "dark" ? "dark" : "light";
                setThemeState(initial);
                colorScheme.set(initial);
            }
        });
    }, []);

    const setTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);
        colorScheme.set(newTheme);
        await AsyncStorage.setItem("mievoh_theme", newTheme);
    };

    const toggleTheme = async () => {
        const nextTheme = theme === "light" ? "dark" : "light";
        setThemeState(nextTheme);
        colorScheme.set(nextTheme);
        await AsyncStorage.setItem("mievoh_theme", nextTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
