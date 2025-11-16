import 'react-native-gesture-handler';
import React from 'react';
import { GoogleAuthProvider } from './src/contexts/GoogleAuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GoogleAuthProvider>
      <AppNavigator />
    </GoogleAuthProvider>
  );
}

