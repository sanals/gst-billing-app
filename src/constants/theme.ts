export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  error: string;
  warning: string;
  background: string;
  surface: string;
  card: {
    background: string;
    shadow: string;
  };
  text: {
    primary: string;
    secondary: string;
    light: string;
    inverse: string;
  };
  border: string;
  button: {
    primary: string;
    secondary: string;
    text: string;
    textSecondary: string;
  };
  input: {
    background: string;
    border: string;
  };
}

export const lightTheme: Theme = {
  mode: 'light',
  primary: '#007AFF',
  secondary: '#34C759',
  accent: '#FF9500',
  success: '#16a34a',
  error: '#ef4444',
  warning: '#fbbf24',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  card: {
    background: '#FFFFFF',
    shadow: '#000000',
  },
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    light: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  border: '#E5E7EB',
  button: {
    primary: '#007AFF',
    secondary: '#FFFFFF',
    text: '#FFFFFF',
    textSecondary: '#007AFF',
  },
  input: {
    background: '#FFFFFF',
    border: '#E5E7EB',
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  primary: '#0A84FF',
  secondary: '#30D158',
  accent: '#FF9F0A',
  success: '#32D74B',
  error: '#FF453A',
  warning: '#FFD60A',
  background: '#000000',
  surface: '#1C1C1E',
  card: {
    background: '#1C1C1E',
    shadow: '#000000',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#AEAEB2',
    light: '#8E8E93',
    inverse: '#000000',
  },
  border: '#38383A',
  button: {
    primary: '#0A84FF',
    secondary: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#0A84FF',
  },
  input: {
    background: '#1C1C1E',
    border: '#38383A',
  },
};

// Legacy colors export for backward compatibility
export const colors = lightTheme;
export const COLORS = lightTheme;

