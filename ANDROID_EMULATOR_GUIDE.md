# Complete Guide: Running React Native on Android Emulator

## Prerequisites ✅
You already have:
- Node.js installed (v25.2.0) ✅
- Android Studio installed ✅
- JDK 21 installed ✅
- Android Emulator running (emulator-5554) ✅

## How React Native + Expo Works on Emulator

### Step 1: Metro Bundler Starts
When you run `npm start`, it starts the **Metro bundler** which:
- Bundles your JavaScript code
- Watches for file changes
- Serves the bundle to the app
- Runs on port 8081 by default

### Step 2: App Installation
When you run `npm run android`, it:
- Builds the native Android app (APK)
- Installs it on your emulator via ADB
- Connects the app to Metro bundler
- Opens the app automatically

### Step 3: Hot Reload
- When you change code, Metro rebundles
- App reloads automatically

---

## Manual Step-by-Step Process

### Method 1: Single Command (Easiest)
```powershell
cd C:\Users\sanal\Downloads\dev\cursor_projects\gst_billing
npm run android
```

This does everything automatically:
1. Starts Metro bundler
2. Builds the app
3. Installs on emulator
4. Opens the app

**Expected Output:**
```
> gst-billing-app@1.0.0 android
> expo start --android

Starting project at C:\Users\sanal\Downloads\dev\cursor_projects\gst_billing
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
› Building...
› Installing app on emulator-5554...
› Opening app on emulator-5554...
```

**Time:** 2-3 minutes first time, 30 seconds subsequent times

---

### Method 2: Two-Step Process (Better for Debugging)

**Terminal 1 - Start Metro Bundler:**
```powershell
cd C:\Users\sanal\Downloads\dev\cursor_projects\gst_billing
npm start
```

Wait until you see:
```
› Metro waiting on exp://...
› Press 'a' to open Android
```

**Then:** Press `a` key (lowercase) in the terminal

OR

**Terminal 2 - Manually trigger Android build:**
```powershell
npm run android
```

---

## Common Issues & Solutions

### Issue 1: "Port 8081 already in use"
**Cause:** Metro bundler already running from previous session

**Solution:**
```powershell
Stop-Process -Name node -Force
npm start --clear
```

### Issue 2: "No devices/emulators found"
**Cause:** Emulator not running or ADB can't see it

**Check:**
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
```

**Should show:**
```
List of devices attached
emulator-5554   device
```

**If shows "offline":**
- Wait 30 seconds for emulator to fully boot
- Or restart emulator

**If shows nothing:**
- Start emulator from Android Studio
- Wait for home screen to appear

### Issue 3: App installs but shows error screen
**Causes:**
- Syntax error in code
- Missing dependency
- Babel configuration issue

**Solution:**
```powershell
# Clear everything and rebuild
Stop-Process -Name node -Force
Remove-Item -Path .expo -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path node_modules\.cache -Recurse -Force -ErrorAction SilentlyContinue
npm start --clear
```

### Issue 4: Build fails with "Could not install app"
**Solution:**
```powershell
# Uninstall old version
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" uninstall com.gstbilling.app
# Try again
npm run android
```

### Issue 5: Metro bundler crashes/stops
**Cause:** Syntax error or module issue

**Check:**
```powershell
# Verify all dependencies installed
npm install
# Check for errors
npm run android
```

---

## Verification Checklist

Before running the app, verify:

1. ✅ **Node.js works:**
   ```powershell
   node --version  # Should show v25.2.0
   ```

2. ✅ **Expo installed:**
   ```powershell
   npx expo --version  # Should show 54.x.x
   ```

3. ✅ **Emulator running:**
   ```powershell
   & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
   # Should show emulator-5554 as "device"
   ```

4. ✅ **In correct directory:**
   ```powershell
   pwd  # Should show: C:\Users\sanal\Downloads\dev\cursor_projects\gst_billing
   ```

5. ✅ **Dependencies installed:**
   ```powershell
   Test-Path node_modules  # Should return True
   ```

---

## What You Should See

### On Terminal:
```
Starting project at C:\Users\sanal\Downloads\dev\cursor_projects\gst_billing
› Metro waiting on exp://192.168.1.x:8081
› Logs: http://localhost:8081
› Building...
› Installing app on emulator-5554...
✓ Built successfully
› Opening app on emulator-5554...
```

### On Emulator:
1. White splash screen with "GST Billing App" (2-3 seconds)
2. Blue home screen with:
   - "Welcome to GST Billing"
   - Card with app info
   - "Go to Details" button
   - "Settings" button

---

## Testing Navigation

Once app opens:
1. Tap "Go to Details" → Should see green Details screen
2. Tap "Go Back" → Returns to home
3. Tap "Settings" → Should see orange Settings screen
4. Tap "Back to Home" → Returns to home

---

## Current App Structure

```
gst_billing/
├── App.js                 # Main entry with navigation setup
├── screens/
│   ├── HomeScreen.js     # Blue welcome screen
│   ├── DetailsScreen.js  # Green details page
│   └── SettingsScreen.js # Orange settings page
├── package.json          # Dependencies
├── app.json             # Expo configuration
└── babel.config.js      # Babel setup for reanimated
```

---

## Next: After Confirming App Runs

Once you see the app running on emulator:
1. Try navigating between screens
2. Confirm no error messages
3. Let me know it's working
4. We'll proceed with building GST Billing features!

---

## Quick Command Reference

```powershell
# Full rebuild
npm run android

# Just start Metro
npm start

# Clear cache and start
npm start --clear

# Check emulator
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices

# Kill all node processes
Stop-Process -Name node -Force

# Reinstall dependencies
Remove-Item -Path node_modules -Recurse -Force
npm install
```

