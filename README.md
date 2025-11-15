# GST Billing - React Native App

A working React Native app with basic navigation and simple home screen built with Expo and React Navigation.

## Features

- ✅ React Native with Expo
- ✅ React Navigation (Native Stack Navigator)
- ✅ Multiple screens with navigation
- ✅ Beautiful and modern UI
- ✅ Home, Details, and Settings screens

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo Go app on your mobile device (for testing)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Running the App

Start the Expo development server:

```bash
npm start
```

This will open the Expo DevTools in your browser. From there you can:

- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator (macOS only)
- Scan the QR code with Expo Go app on your phone

### Other Commands

```bash
npm run android  # Run on Android
npm run ios      # Run on iOS
npm run web      # Run on web browser
```

## Project Structure

```
gst_billing/
├── screens/
│   ├── HomeScreen.js      # Main home screen
│   ├── DetailsScreen.js   # Details page
│   └── SettingsScreen.js  # Settings page
├── App.js                 # Main app with navigation setup
├── package.json           # Dependencies
└── README.md             # This file
```

## Navigation

The app uses React Navigation with a native stack navigator:

- **Home Screen**: Welcome screen with navigation buttons
- **Details Screen**: Information page with app features
- **Settings Screen**: Settings page with placeholder options

## Dependencies

- `expo`: ~54.0.23
- `react`: 19.1.0
- `react-native`: 0.81.5
- `@react-navigation/native`: ^7.1.20
- `@react-navigation/native-stack`: ^7.6.3
- `react-native-screens`: ~4.16.0
- `react-native-safe-area-context`: ~5.6.0

## License

MIT

