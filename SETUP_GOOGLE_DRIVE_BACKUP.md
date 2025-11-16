# Google Drive Backup Setup Instructions

## ✅ Implementation Complete!

The dual backup system (Manual + Google Drive Auto-Sync) has been implemented. Now you need to paste your API keys.

## 🔑 Step 1: Add Your Google OAuth Client IDs

Create a file named `.env` in the root of your project (same level as `package.json`):

```
# .env file
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=YOUR_ANDROID_CLIENT_ID_HERE.apps.googleusercontent.com
```

### Where to get these IDs:

1. **Web Client ID**: From Google Cloud Console → Credentials → Your "Web Application" OAuth client
2. **Android Client ID**: From Google Cloud Console → Credentials → Your "Android" OAuth client (after you created it with SHA-1)

### Example `.env` file:

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=987654321-qrstuvwxyz123456.apps.googleusercontent.com
```

## 📦 Step 2: Wrap App with GoogleAuthProvider

Update `App.tsx`:

```typescript
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
```

## 🏗️ Step 3: Build Custom Development Client

Since we added native modules, you need to rebuild:

```powershell
# For Android
npx expo run:android

# Or for EAS Build
eas build --profile development --platform android
```

## 🎯 How to Use

### Option 1: Manual Backup (No Login)
1. Open app → Settings
2. Select "Manual" backup method
3. Tap "Export & Save to Drive"
4. Choose any Google Drive account to save

### Option 2: Google Drive Auto-Sync
1. Open app → Settings
2. Select "Google Drive" backup method
3. Tap "Sign in with Google"
4. Toggle "Auto-Sync" ON
5. Data automatically syncs when changed!

## 📋 Features Implemented

✅ **Dual Backup System**
- Manual backup (no login)
- Google Drive auto-sync (with login)
- Toggle between methods anytime

✅ **Manual Backup Features**:
- Export backup as JSON
- Share to any Google Drive account
- Restore from backup file
- No Google login required

✅ **Google Drive Auto-Sync Features**:
- Google Sign-In
- Automatic sync when data changes
- Manual "Sync Now" button
- Restore from Google Drive
- View sync status
- Sign out option

✅ **Settings UI**:
- Method selector (Manual / Google Drive)
- Backup status display
- Last sync date
- Invoice/product counts
- Auto-sync toggle
- User info display when signed in

## 🔧 Troubleshooting

### "No Client ID found"
- Check `.env` file exists in root folder
- Verify Client IDs are correct (end with `.apps.googleusercontent.com`)
- Restart Expo dev server after adding `.env`

### "Sign in failed"
- Verify OAuth consent screen is configured
- Check scopes are added (drive.file, userinfo.email, userinfo.profile)
- Ensure redirect URIs are correct in Google Cloud Console

### "Auto-sync not working"
- Make sure you toggled "Auto-Sync" ON
- Check you're signed in with Google
- Verify Google Drive API is enabled in Console

## 📱 Testing Checklist

- [ ] Created `.env` file with Client IDs
- [ ] Updated `App.tsx` with GoogleAuthProvider
- [ ] Rebuilt app with native modules
- [ ] Tested Manual backup → Export & Share
- [ ] Tested Manual restore from file
- [ ] Tested Google Sign-In
- [ ] Tested Google Drive sync
- [ ] Tested Auto-sync toggle
- [ ] Tested Restore from Google Drive
- [ ] Tested Sign Out

## 🎉 You're All Set!

Your app now has both manual and automatic Google Drive backup options. Users can choose their preferred method!

