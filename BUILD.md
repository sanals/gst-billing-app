# Build Instructions

This document provides detailed instructions for building the GST Billing App for Android.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Android Studio** with Android SDK
3. **Java JDK 11+** (included with Android Studio)
4. **Environment Variables** configured (see below)

## Environment Setup

### 1. Install Android Studio

1. Download from [developer.android.com/studio](https://developer.android.com/studio)
2. Install with default settings
3. During setup, ensure these are installed:
   - Android SDK
   - Android SDK Platform (API 33 or higher)
   - Android SDK Build-Tools
   - Android Virtual Device (for emulator)

### 2. Configure Environment Variables

**Windows:**

1. Find your Android SDK location (usually):
   ```
   C:\Users\YourUsername\AppData\Local\Android\Sdk
   ```

2. Set `ANDROID_HOME`:
   - Press `Win + X` → "System"
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Add new System variable:
     - Name: `ANDROID_HOME`
     - Value: `C:\Users\YourUsername\AppData\Local\Android\Sdk`

3. Add to PATH:
   - Edit the `Path` variable
   - Add these entries:
     ```
     %ANDROID_HOME%\platform-tools
     %ANDROID_HOME%\tools
     %ANDROID_HOME%\tools\bin
     ```

4. **Restart your terminal/PowerShell** after setting variables

### 3. Verify Setup

```powershell
# Check ANDROID_HOME
echo $env:ANDROID_HOME

# Check ADB
adb version

# Check Java
java -version
```

Expected output:
- ANDROID_HOME shows your SDK path
- ADB shows version number
- Java shows version 11 or higher

## Development Build

### Option 1: Expo Development Build (Recommended for Development)

```bash
# Install dependencies
npm install

# Build and run on connected device/emulator
npx expo run:android
```

This will:
- Build the native Android app
- Install on connected device/emulator
- Start the development server
- Enable hot reload

**Time:** 10-15 minutes for first build, 2-3 minutes for subsequent builds

### Option 2: Expo Go (Quick Testing)

```bash
# Start dev server
npm start

# Scan QR code with Expo Go app
# Or press 'a' for Android emulator
```

**Note:** Some native features (like Google Sign-In) require a development build, not Expo Go.

## Production Build

### Build Release APK

1. **Navigate to Android directory:**
   ```bash
   cd android
   ```

2. **Build release APK:**
   ```bash
   # Windows
   .\gradlew.bat assembleRelease

   # Linux/Mac
   ./gradlew assembleRelease
   ```

3. **Find the APK:**
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

### Sign the APK (Optional, for Play Store)

1. Generate a keystore (first time only):
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Configure signing in `android/app/build.gradle`:
   ```gradle
   android {
       ...
       signingConfigs {
           release {
               storeFile file('my-release-key.keystore')
               storePassword 'your-password'
               keyAlias 'my-key-alias'
               keyPassword 'your-password'
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
           }
       }
   }
   ```

## Build Variants

### Debug Build
```bash
npx expo run:android --variant debug
```

### Release Build
```bash
npx expo run:android --variant release
```

## Troubleshooting

### "ANDROID_HOME not set"
- Verify environment variable is set: `echo $env:ANDROID_HOME`
- Restart terminal after setting variables
- Ensure path points to SDK directory (contains `platform-tools`, `platforms`, etc.)

### "No connected devices"
- **For physical device:**
  - Enable USB Debugging in Developer Options
  - Connect via USB
  - Run `adb devices` to verify connection
- **For emulator:**
  - Start emulator from Android Studio
  - Wait for it to fully boot
  - Run `adb devices` to verify

### "Build failed - SDK not found"
- Open Android Studio
- Go to **Tools → SDK Manager**
- Install **Android SDK Platform 33** (or latest)
- Install **Android SDK Build-Tools**

### "Java not found"
- Android Studio includes JDK
- Set `JAVA_HOME` to Android Studio's JDK:
  ```
  C:\Program Files\Android\Android Studio\jbr
  ```

### Build takes too long
- First build: 10-15 minutes (normal)
- Subsequent builds: 2-3 minutes
- If slower, check:
  - Antivirus not scanning build files
  - Sufficient disk space
  - Internet connection (for downloading dependencies)

### APK not found after build
- Check: `android/app/build/outputs/apk/release/`
- Ensure build completed successfully (no errors)
- Try cleaning build: `cd android && .\gradlew.bat clean`

## Alternative: EAS Build (Cloud Build)

If local build setup is complex, use Expo's cloud build service:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login (create free account at expo.dev)
eas login

# Configure
eas build:configure

# Build for Android
eas build --platform android --profile production
```

**Benefits:**
- No Android Studio needed
- Builds in the cloud
- Easier setup
- Can build from any computer

**Downside:**
- Takes 20-30 minutes (cloud build time)
- Requires Expo account (free tier available)

## Next Steps After Build

1. **Test the APK** on a device
2. **Configure app settings** (company details, invoice prefix)
3. **Set up backup** (Google Drive or manual)
4. **Test invoice generation** and PDF export

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Android Developer Guide](https://developer.android.com/)

