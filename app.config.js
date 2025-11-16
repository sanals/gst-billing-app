require('dotenv').config();

module.exports = {
  expo: {
    name: "GST Billing App",
    slug: "gst_billing",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#007AFF"
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSPhotoLibraryUsageDescription: "To save invoices to your device"
      },
      bundleIdentifier: "com.gstbilling.app"
    },
    android: {
      package: "com.gstbilling.app",
      permissions: [
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ],
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      backup: {
        enabled: true,
        includeSharedPreferences: true
      },
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || undefined
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-document-picker",
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "com.googleusercontent.apps.placeholder"
        }
      ]
    ],
    extra: {
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
      googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "",
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
    }
  }
};

