# 🎯 Using the App in Expo Go (Current Setup)

## ✅ What Works in Expo Go

Your app is now configured to work in **Expo Go** with **Manual Backup** mode!

### Available Features:
- ✅ **Manual Backup** - Export and share to any Google Drive account
- ✅ **Export Backup** - Create JSON backup file
- ✅ **Share to Drive** - Choose any Google Drive account when sharing
- ✅ **Restore from File** - Import backup from any account
- ✅ All core app features (invoices, products, company settings)

### Not Available in Expo Go:
- ❌ **Google Drive Auto-Sync** - Requires custom development build
- ❌ **Google Sign-In** - Native module not available in Expo Go

---

## 📱 How to Use Manual Backup

1. **Open the app** → Go to **Settings**
2. **Backup Method** should show **"Manual"** selected
3. **To backup:**
   - Tap **"Prepare Backup"** - Updates backup metadata
   - Tap **"Export & Save to Drive"** - Creates backup file
   - Choose **any Google Drive account** to save
4. **To restore:**
   - Download backup file from Google Drive
   - Tap **"Restore from Backup File"**
   - Select the downloaded file

**Note:** If you try to switch to "Google Drive" mode, you'll see a message explaining it requires a custom build.

---

## 🚀 To Enable Google Drive Auto-Sync (Optional - Later)

When you're ready for auto-sync to a specific Google Drive account, you need a **custom development build**:

### Option 1: Build Locally (Requires Android Studio)

```powershell
npx expo run:android
```

### Option 2: Build with EAS (Recommended - Easier)

```powershell
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build development client
eas build --profile development --platform android

# Install the APK on your device
# Then run: npx expo start --dev-client
```

### After Building:

1. Uncomment the plugin in `app.config.js`:
   ```javascript
   plugins: [
     "expo-document-picker",
     ["@react-native-google-signin/google-signin", { 
       iosUrlScheme: "YOUR_IOS_CLIENT_ID" 
     }]
   ],
   ```

2. Update `src/contexts/GoogleAuthContext.tsx` to re-enable the import

3. Paste your Google Client IDs in `.env` file

4. Rebuild the app

5. Now "Google Drive" mode will work!

---

## ❓ FAQ

### Q: Why doesn't Google Drive sync work in Expo Go?
**A:** Expo Go is a sandbox app with pre-built native modules. `@react-native-google-signin/google-signin` is a custom native module not included in Expo Go. You need a custom build to use it.

### Q: Is Manual Backup good enough?
**A:** Yes! Manual Backup lets you:
- Export backups anytime
- Save to **any** Google Drive account (not locked to one)
- Restore from any account
- Share backups via email, WhatsApp, etc.

The main difference is Auto-Sync does it automatically, but Manual gives you more control.

### Q: How often should I backup manually?
**A:** Recommended:
- After creating/updating products
- After generating important invoices
- At end of day/week
- Before uninstalling app

### Q: Will Android Auto Backup still work?
**A:** Yes! Android still does automatic backup of your app data to your device's primary Google account (like WhatsApp). Manual/Google Drive sync is additional backup.

---

## 📊 Backup Comparison

| Feature | Manual Backup | Google Drive Auto-Sync |
|---------|---------------|----------------------|
| Works in Expo Go | ✅ Yes | ❌ No (needs custom build) |
| Requires Google login | ❌ No | ✅ Yes |
| Choose backup account | ✅ Any account | ❌ One account only |
| Automatic | ❌ Manual | ✅ Auto when data changes |
| Setup complexity | ✅ Easy | ⚠️ Complex (OAuth, build) |

---

## ✅ Current Status

🎉 **Your app is ready to use with Manual Backup!**

**What to do now:**
1. Test the app in Expo Go
2. Use Manual Backup to export/restore data
3. Build all your app features
4. When everything works, build custom dev client for auto-sync (optional)

**Manual Backup is perfect for most users!** 👍

