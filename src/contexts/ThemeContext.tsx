import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeMode, lightTheme, darkTheme } from '../constants/theme';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  useSystemTheme: boolean;
  setUseSystemTheme: (use: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@theme_mode';
const USE_SYSTEM_THEME_KEY = '@use_system_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [useSystemTheme, setUseSystemThemeState] = useState<boolean>(true);
  const [theme, setTheme] = useState<Theme>(lightTheme);

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    if (useSystemTheme && systemColorScheme) {
      // Use system theme
      const systemTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
      setTheme(systemTheme === 'dark' ? darkTheme : lightTheme);
      setThemeModeState(systemTheme);
    } else {
      // Use manual theme
      setTheme(themeMode === 'dark' ? darkTheme : lightTheme);
    }
  }, [themeMode, useSystemTheme, systemColorScheme]);

  const loadTheme = async () => {
    try {
      const [savedTheme, savedUseSystemTheme] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem(USE_SYSTEM_THEME_KEY),
      ]);
      
      if (savedUseSystemTheme !== null) {
        setUseSystemThemeState(savedUseSystemTheme === 'true');
      }
      
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setThemeModeState(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
      // When manually setting theme, disable system theme
      await setUseSystemTheme(false);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setUseSystemTheme = async (use: boolean) => {
    try {
      await AsyncStorage.setItem(USE_SYSTEM_THEME_KEY, use.toString());
      setUseSystemThemeState(use);
    } catch (error) {
      console.error('Error saving system theme preference:', error);
    }
  };

  const toggleTheme = () => {
    if (useSystemTheme) {
      // If using system theme, disable it and set to opposite of current
      const currentMode = systemColorScheme === 'dark' ? 'dark' : 'light';
      const newMode = currentMode === 'light' ? 'dark' : 'light';
      setThemeMode(newMode);
    } else {
      // If not using system theme, just toggle
      const newMode = themeMode === 'light' ? 'dark' : 'light';
      setThemeMode(newMode);
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      themeMode, 
      toggleTheme, 
      setThemeMode,
      useSystemTheme,
      setUseSystemTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

