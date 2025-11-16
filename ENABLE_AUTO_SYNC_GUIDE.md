# 🚀 How to Enable Google Drive Auto-Sync

## Current Status
✅ Manual Backup - Works in Expo Go  
❌ Google Drive Auto-Sync - Requires custom build

---

## Why Auto-Sync Doesn't Work Now

`@react-native-google-signin/google-signin` is a **native module** that needs to be compiled into the app. Expo Go doesn't include it, so we need to build a **custom development client**.

---

## 📋 Complete Plan to Enable Auto-Sync

### Phase 1: Prepare (5 minutes)
1. ✅ Google OAuth clients created (you already did this)
2. ✅ Client IDs in `.env` file (already done)
3. ✅ Code is ready (already implemented)
4. ⚠️ Need to build custom app

### Phase 2: Build Custom Development Client (20-40 minutes)

**Option A: EAS Build (Recommended - Easier)**

```powershell
# 1. Install EAS CLI globally
npm install -g eas-cli

# 2. Login to Expo account (create free account if needed)
eas login

# 3. Configure EAS for your project
eas build:configure

# 4. Build development client for Android
eas build --profile development --platform android
```

**This will:**
- Upload your code to Expo servers
- Build a custom APK with Google Sign-In included
- Take 15-30 minutes
- Give you a download link for the APK

**Option B: Local Build (Requires Android Studio)**

```powershell
# Requires Android Studio and Android SDK installed
npx expo run:android
```

---

### Phase 3: Enable Code (5 minutes)

Once you have the custom APK built, re-enable the Google Sign-In code:

#### Step 1: Update `app.config.js`

```javascript
plugins: [
  "expo-document-picker",
  [
    "@react-native-google-signin/google-signin",
    {
      iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "com.googleusercontent.apps.placeholder"
    }
  ]
],
```

#### Step 2: Update `src/contexts/GoogleAuthContext.tsx`

Replace the disabled import with:

```typescript
import { GoogleSignin, User } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
```

#### Step 3: Update `src/screens/SettingsScreen.tsx`

Remove the alert that blocks Google Drive mode:

```typescript
const handleBackupMethodChange = async (method: BackupMethod) => {
  if (method === 'google_drive' && !isAuthenticated) {
    Alert.alert(
      'Google Sign-In Required',
      'You need to sign in with Google to use Google Drive backup.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign In',
          onPress: handleGoogleSignIn,
        },
      ]
    );
    return;
  }

  setBackupMethodState(method);
  await BackupService.setBackupMethod(method);
  // ... rest of code
};
```

And change:

```typescript
{backupMethod === 'google_drive' && false && (
```

To:

```typescript
{backupMethod === 'google_drive' && (
```

---

### Phase 4: Install & Test (10 minutes)

1. **Install the custom APK** on your Android device
2. **Run dev server:**
   ```powershell
   npx expo start --dev-client
   ```
3. **Open the custom app** (not Expo Go)
4. **Test Google Sign-In:**
   - Go to Settings
   - Switch to "Google Drive" mode
   - Tap "Sign in with Google"
   - Should open Google sign-in page
5. **Test Auto-Sync:**
   - Toggle "Auto-Sync" ON
   - Add a product or create invoice
   - Check Google Drive for backup file

---

## 🎯 Detailed Steps for EAS Build (Recommended)

### Step 1: Install EAS CLI

```powershell
npm install -g eas-cli
```

### Step 2: Login to Expo

```powershell
eas login
```

If you don't have an Expo account:
- Go to https://expo.dev/signup
- Create free account
- Then run `eas login`

### Step 3: Configure EAS

```powershell
cd C:\Users\sanal\Downloads\dev\cursor_projects\gst_billing
eas build:configure
```

This creates `eas.json` with build profiles.

### Step 4: Update eas.json (if needed)

Make sure `eas.json` has a development profile:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

### Step 5: Build Development APK

```powershell
eas build --profile development --platform android
```

**This will:**
- Ask for Android package name (use `com.gstbilling.app`)
- Ask if you want to generate a new keystore (say Yes)
- Upload your code
- Build in the cloud
- Take 15-30 minutes

**You'll see:**
```
✔ Build started, it may take a few minutes to complete.
🔗 https://expo.dev/accounts/[username]/projects/gst_billing/builds/[build-id]
```

### Step 6: Download APK

When build completes:
- Click the link provided
- Download the APK
- Transfer to your Android device
- Install it

### Step 7: Run with Dev Client

```powershell
npx expo start --dev-client
```

Scan QR code with the **custom app** (not Expo Go).

---

## 📊 Comparison: Manual vs Auto-Sync

| Aspect | Manual Backup | Google Drive Auto-Sync |
|--------|---------------|------------------------|
| **Setup** | ✅ Works now | ⚠️ Needs custom build |
| **Time to setup** | 0 minutes | 30-60 minutes |
| **Login required** | ❌ No | ✅ Yes |
| **Account selection** | ✅ Any account each time | ⚠️ One account only |
| **Automatic** | ❌ Manual action | ✅ Auto on data change |
| **Best for** | Testing, flexibility | Production, convenience |

---

## 💡 My Recommendation

### For Now (Development):
**Use Manual Backup** - It's perfect for:
- Testing the app
- Building features
- Flexibility to backup to different accounts
- No build hassle

### Later (Before Production):
**Build custom client for Auto-Sync** when:
- App is feature-complete
- Ready for production testing
- Want the polished auto-sync experience
- Building production APK anyway

---

## 🔧 Quick Reference: What Needs to Change

### Files to modify when enabling Auto-Sync:

1. **app.config.js** - Uncomment Google Sign-In plugin
2. **src/contexts/GoogleAuthContext.tsx** - Re-enable real import
3. **src/screens/SettingsScreen.tsx** - Remove blocking alert and `&& false`

That's it! The rest of the code is already ready.

---

## ❓ FAQ

### Q: Do I need to build custom client to publish the app?
**A:** Yes! Production APKs are custom builds anyway, so you'll have Auto-Sync in production.

### Q: Can I test everything else without building?
**A:** Yes! All features work in Expo Go except Google Drive Auto-Sync.

### Q: Is EAS Build free?
**A:** Yes for small projects! Free tier includes builds.

### Q: How long does EAS Build take?
**A:** First build: 20-30 minutes. Subsequent builds: 10-15 minutes.

### Q: Can I skip this for now?
**A:** Absolutely! Manual Backup works great. Build custom client later when you're ready.

---

## ✅ Summary

**To enable Google Drive Auto-Sync, you need to:**

1. Build custom development client (EAS or local)
2. Re-enable 3 lines of code
3. Install custom APK
4. Test Google Sign-In

**Estimated time:** 30-60 minutes total

**Worth it?** Only if you want auto-sync now. Otherwise, use Manual Backup and build later!

---

**Ready to build?** Let me know and I'll guide you through the EAS build process step-by-step! 🚀

