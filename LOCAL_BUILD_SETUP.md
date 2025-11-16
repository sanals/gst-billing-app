# 📱 Local Build Setup for Google Drive Auto-Sync

## Prerequisites for Local Build

To build locally with `npx expo run:android`, you need:

1. ✅ Node.js (you have this)
2. ⚠️ Android Studio
3. ⚠️ Android SDK
4. ⚠️ Environment variables configured

---

## Step 1: Install Android Studio (if not installed)

### Download & Install:
1. Go to: https://developer.android.com/studio
2. Download Android Studio
3. Run installer
4. During setup, make sure to install:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (optional for emulator)
   - Android SDK Build-Tools

---

## Step 2: Configure Environment Variables

### Set ANDROID_HOME:

1. **Find your Android SDK location:**
   - Usually: `C:\Users\[YourUsername]\AppData\Local\Android\Sdk`
   - Or: `C:\Android\Sdk`

2. **Add to System Environment Variables:**
   
   **Windows Settings:**
   - Press `Win + X` → "System"
   - Click "Advanced system settings"
   - Click "Environment Variables"
   
   **Add ANDROID_HOME:**
   - Click "New" under "System variables"
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\sanal\AppData\Local\Android\Sdk` (or your path)

3. **Add to PATH:**
   
   Edit the `Path` variable and add these:
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\tools
   %ANDROID_HOME%\tools\bin
   ```

4. **Restart PowerShell/Terminal** after setting environment variables

---

## Step 3: Verify Setup

Run these commands to verify:

```powershell
# Check ANDROID_HOME
echo $env:ANDROID_HOME

# Check ADB (Android Debug Bridge)
adb version

# Check Java
java -version
```

Expected output:
- ANDROID_HOME shows your SDK path
- ADB shows version number
- Java shows version 11 or higher

---

## Step 4: Build the App

Once Android Studio is set up:

```powershell
cd C:\Users\sanal\Downloads\dev\cursor_projects\gst_billing

# Build and run on connected device/emulator
npx expo run:android
```

This will:
- Install dependencies
- Build native modules (including Google Sign-In)
- Generate APK
- Install on connected device
- Start development server

**Time:** 10-15 minutes for first build

---

## Alternative: EAS Build (Easier)

If Android Studio setup is too complex, use EAS Build instead:

```powershell
# Install EAS CLI
npm install -g eas-cli

# Login (create free account at expo.dev)
eas login

# Configure
eas build:configure

# Build
eas build --profile development --platform android
```

**Benefits of EAS:**
- ✅ No Android Studio needed
- ✅ Builds in the cloud
- ✅ Easier setup
- ✅ Can build from any computer

**Downside:**
- Takes 20-30 minutes (cloud build time)
- Requires Expo account (free)

---

## Troubleshooting

### "ANDROID_HOME not set"
- Set environment variable and restart terminal
- Make sure path points to SDK directory (contains `platform-tools`, `platforms`, etc.)

### "No connected devices"
- Enable USB Debugging on Android device
- Connect via USB
- Run `adb devices` to verify

### "Build failed - SDK not found"
- Open Android Studio
- Go to Tools → SDK Manager
- Install Android SDK Platform 33 (or latest)
- Install Android SDK Build-Tools

### "Java not found"
- Android Studio includes JDK
- Set JAVA_HOME to Android Studio's JDK:
  - Usually: `C:\Program Files\Android\Android Studio\jbr`

---

## Which Method Should You Choose?

### Local Build - Choose if:
- ✅ You have Android Studio
- ✅ Want faster iterations
- ✅ Comfortable with native development
- ✅ Want more control

### EAS Build - Choose if:
- ✅ Android Studio not installed
- ✅ Want easier setup
- ✅ Don't mind 20-30 min wait
- ✅ Want clean build environment

---

## Next Steps

**Option A: If Android Studio is ready**
```powershell
npx expo run:android
```

**Option B: Use EAS Build**
```powershell
npm install -g eas-cli
eas login
eas build --profile development --platform android
```

---

## After Build Completes

1. App will install on your device
2. Dev server will start
3. App will connect to dev server
4. Go to Settings
5. Switch to "Google Drive" mode
6. Sign in with Google
7. Toggle Auto-Sync ON
8. Test it! 🎉

---

**Which method do you want to try?**
- Local Build (needs Android Studio)
- EAS Build (easier, no setup needed)

Let me know and I'll guide you through! 🚀

