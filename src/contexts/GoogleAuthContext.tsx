import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { GoogleSignin, User } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOOGLE_USER_KEY = 'google_user';
const GOOGLE_TOKENS_KEY = 'google_tokens';

interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

interface GoogleAuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    configureGoogleSignIn();
    loadSavedUser();
  }, []);

  const configureGoogleSignIn = () => {
    try {
      const webClientId = 
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 
        Constants.expoConfig?.extra?.googleWebClientId;

      const androidClientId = 
        process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
        Constants.expoConfig?.extra?.googleAndroidClientId;

      const iosClientId =
        process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
        Constants.expoConfig?.extra?.googleIosClientId;

      console.log('Configuring Google Sign-In...');
      console.log('Web Client ID:', webClientId ? 'Present' : 'Missing');

      GoogleSignin.configure({
        webClientId: webClientId,
        // Note: androidClientId is configured via app.config.js plugin, not here
        iosClientId: iosClientId,
        scopes: [
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email',
        ],
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });
    } catch (error) {
      console.error('Error configuring Google Sign-In:', error);
    }
  };

  const loadSavedUser = async () => {
    try {
      const [userJson, tokensJson] = await Promise.all([
        AsyncStorage.getItem(GOOGLE_USER_KEY),
        AsyncStorage.getItem(GOOGLE_TOKENS_KEY),
      ]);

      if (userJson && tokensJson) {
        const savedUser = JSON.parse(userJson);
        const savedTokens: GoogleTokens = JSON.parse(tokensJson);

        // Check if token is expired
        if (savedTokens.expiresAt > Date.now()) {
          setUser(savedUser);
          setAccessToken(savedTokens.accessToken);
        } else {
          // Token expired, try to refresh
          await refreshAccessToken();
        }
      }
    } catch (error) {
      console.error('Error loading saved user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async () => {
    try {
      setIsLoading(true);

      // Check Play Services (Android only)
      await GoogleSignin.hasPlayServices();

      // Sign in
      const response = await GoogleSignin.signIn();
      
      if (response && response.type === 'success') {
        const { user: googleUser } = response.data;
        setUser(googleUser);

        // Get tokens
        const tokens = await GoogleSignin.getTokens();
        const googleTokens: GoogleTokens = {
          accessToken: tokens.accessToken,
          expiresAt: Date.now() + 3600 * 1000, // 1 hour
        };

        setAccessToken(tokens.accessToken);

        // Save to storage
        await AsyncStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(googleUser));
        await AsyncStorage.setItem(GOOGLE_TOKENS_KEY, JSON.stringify(googleTokens));

        console.log('Google Sign-In successful');
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      setUser(null);
      setAccessToken(null);
      await AsyncStorage.multiRemove([GOOGLE_USER_KEY, GOOGLE_TOKENS_KEY]);
      console.log('Google Sign-Out successful');
    } catch (error) {
      console.error('Google Sign-Out error:', error);
      throw error;
    }
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const tokens = await GoogleSignin.getTokens();
      const googleTokens: GoogleTokens = {
        accessToken: tokens.accessToken,
        expiresAt: Date.now() + 3600 * 1000,
      };

      setAccessToken(tokens.accessToken);
      await AsyncStorage.setItem(GOOGLE_TOKENS_KEY, JSON.stringify(googleTokens));
      
      return tokens.accessToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, sign out
      await signOut();
      return null;
    }
  };

  const isAuthenticated = !!user;

  return (
    <GoogleAuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        accessToken,
        signIn,
        signOut,
        refreshAccessToken,
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth() {
  const context = useContext(GoogleAuthContext);
  if (context === undefined) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
}

