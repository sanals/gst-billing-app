# GST Billing App

A comprehensive React Native application for generating GST-compliant invoices with product management, outlet management, and automated backup features.

## Features

- 📄 **Invoice Generation**: Create GST-compliant invoices with automatic calculations
- 📦 **Product Management**: Manage products with HSN codes, GST rates, and stock tracking
- 🏢 **Outlet Management**: Store customer/outlet information
- 💾 **Backup & Sync**: Manual backup and Google Drive auto-sync
- 🎨 **Modern UI**: Beautiful, responsive interface with dark mode support
- 📱 **Cross-Platform**: Works on Android (iOS support can be added)

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Android Studio** (for Android builds)
- **Java JDK 11+** (included with Android Studio)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Development Mode

For development with hot reload:

```bash
# Start Expo dev server
npm start

# Or run directly on Android
npm run android
```

### 3. Build for Production

See [BUILD.md](./BUILD.md) for detailed build instructions.

**Quick build commands:**

```bash
# Build and run on Android device/emulator
npx expo run:android

# Build release APK
cd android
.\gradlew.bat assembleRelease
```

The APK will be located at: `android/app/build/outputs/apk/release/app-release.apk`

## Project Structure

```
gst-billing-app/
├── src/
│   ├── screens/          # App screens
│   ├── services/         # Business logic services
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── contexts/        # React contexts
│   └── navigation/      # Navigation setup
├── assets/              # Images and static assets
├── android/             # Android native code
└── scripts/             # Build scripts
```

## Documentation

- **[FEATURES.md](./FEATURES.md)** - Complete app features and architecture overview
- **[BUILD.md](./BUILD.md)** - Detailed build instructions
- **Logo & QR Code Setup**: See [LOGO_QRCODE_SETUP.md](./LOGO_QRCODE_SETUP.md)
- **Google Drive Backup**: See [SETUP_GOOGLE_DRIVE_BACKUP.md](./SETUP_GOOGLE_DRIVE_BACKUP.md)
- **Testing Guide**: See [TEST_INSTRUCTIONS.md](./TEST_INSTRUCTIONS.md)

## Environment Setup

### Android Development

1. Install Android Studio
2. Set `ANDROID_HOME` environment variable:
   ```
   ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
   ```
3. Add to PATH:
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\tools
   ```

## Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run web` - Run in web browser
- `node scripts/convert-images.js` - Convert logo/QR code to base64 for PDF

## Troubleshooting

### Build Issues

- **"ANDROID_HOME not set"**: Set the environment variable and restart terminal
- **"No connected devices"**: Enable USB debugging on device or start emulator
- **Build fails**: Ensure Android SDK Platform 33+ and Build-Tools are installed

### App Issues

- **Logo not updating in PDF**: Run `node scripts/convert-images.js` after updating logo
- **Invoice numbers skipping**: Fixed in latest version - uses atomic reservation
- **Keyboard covering modals**: Fixed in latest version - uses KeyboardAvoidingView

## License

MIT
