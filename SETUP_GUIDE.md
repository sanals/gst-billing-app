# Setup Guide - Running the React Native App

## Option 1: Run on Android Emulator (Recommended)

Since you have Android Studio installed, here's how to run the app:

### Step 1: Start an Android Emulator

1. Open **Android Studio**
2. Click on **More Actions** (three dots) → **Virtual Device Manager**
3. If you don't have an emulator, create one:
   - Click **Create Device**
   - Select a device (e.g., Pixel 5)
   - Select a system image (e.g., Android 13 or latest)
   - Click **Finish**
4. Click the **Play button** (▶) next to your device to start it

### Step 2: Run the App

Once the emulator is running, in your terminal run:

```bash
npm run android
```

OR press `a` in the Expo terminal that's already running.

The app will automatically install and launch on your Android emulator!

---

## Option 2: Run on Your Physical Android Phone

1. Install **Expo Go** app from Google Play Store
2. Make sure your phone and computer are on the same WiFi network
3. The Expo dev server should show a QR code in the terminal
4. Open Expo Go app and scan the QR code

---

## Option 3: Run in Web Browser (Quick Preview)

```bash
npm run web
```

This will open the app in your default web browser. Note: Some mobile-specific features may not work perfectly on web.

---

## Troubleshooting

### If Android Studio SDK is not in PATH:

You may need to set the ANDROID_HOME environment variable:

1. Find your Android SDK location (usually `C:\Users\YourUsername\AppData\Local\Android\Sdk`)
2. Set environment variables:
   - `ANDROID_HOME` = your SDK path
   - Add `%ANDROID_HOME%\platform-tools` to PATH
   - Add `%ANDROID_HOME%\tools` to PATH

### If emulator is running but app doesn't install:

Try:
```bash
npm start
# Then press 'a' for Android
```

---

## Current Status

✅ React Native app is ready
✅ Navigation is configured
✅ Three screens created (Home, Details, Settings)
✅ Dev server is running on `npm start`

**Next Step**: Start your Android emulator and run `npm run android`

