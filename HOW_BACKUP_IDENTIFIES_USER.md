# How Android Auto Backup Identifies User/Account

## The Technical Explanation

### How It Works:

1. **App Package Name** - Your app has a unique identifier:
   ```
   com.gstbilling.app
   ```
   This is defined in `app.json` → `android.package`

2. **Google Account on Device** - The Gmail account logged into the phone

3. **Backup Storage Location** - Android stores backups in Google Drive at:
   ```
   /Backups/[Package Name]/[Google Account Email]/
   ```
   
   For your app, it would be:
   ```
   /Backups/com.gstbilling.app/user@gmail.com/
   ```

## How Android Identifies Which Data to Load

### When You Install the App:

1. **Android checks** if there's a backup for:
   - Package name: `com.gstbilling.app`
   - Google account: `user@gmail.com` (the account on the device)

2. **If backup exists:**
   - Android automatically downloads the backup
   - Restores it to the app's data directory
   - Happens **before** the app first opens

3. **When app opens:**
   - Your app reads from AsyncStorage
   - Data is already there (restored by Android)
   - No code needed - it's automatic!

## Key Points

### ✅ What Identifies the Backup:

1. **Package Name** (`com.gstbilling.app`)
   - Must be the same on both devices
   - Defined in `app.json`

2. **Google Account Email**
   - The Gmail account logged into the device
   - Must be the same on both devices

3. **App Signature** (for security)
   - Android verifies the app is the same one
   - Prevents data theft

### 🔒 Security:

- Each Google account has its own backup
- User A's data cannot be accessed by User B
- Even if they install the same app

### 📱 Multiple Accounts on Same Device:

If you have multiple Google accounts on the device:
- Android uses the **primary account** (first account added)
- Or the account that was active when backup happened

## Example Scenario

### Device 1 (Old Phone):
- Google Account: `john@gmail.com`
- App Package: `com.gstbilling.app`
- Backup Location: `/Backups/com.gstbilling.app/john@gmail.com/`
- Data: 10 products, 5 invoices

### Device 2 (New Phone):
- Google Account: `john@gmail.com` ✅ (same account)
- App Package: `com.gstbilling.app` ✅ (same package)
- Android finds backup at: `/Backups/com.gstbilling.app/john@gmail.com/`
- ✅ **Data automatically restores!**

### If Different Account:
- Google Account: `jane@gmail.com` ❌ (different account)
- App Package: `com.gstbilling.app` ✅ (same package)
- Android looks for: `/Backups/com.gstbilling.app/jane@gmail.com/`
- ❌ **No backup found** - starts fresh

## How Your App Code Works

### Your App Doesn't Need to Do Anything!

```typescript
// When app opens, you just read from AsyncStorage:
const products = await AsyncStorage.getItem('products');
// Data is already there - Android restored it automatically!
```

### The Flow:

1. **User installs app** on new device
2. **Android checks** for backup (package + account)
3. **Android downloads** backup from Google Drive
4. **Android restores** to app's data directory
5. **App opens** and reads data normally
6. **User sees** all their data! ✅

## Important: Package Name Must Match

### For Development (Expo Go):
- Package name might be different
- Auto backup might not work
- Use manual export/import instead

### For Production:
- Package name: `com.gstbilling.app` (from `app.json`)
- Must be the same on all devices
- Auto backup/restore works perfectly ✅

## What Gets Backed Up

Android Auto Backup backs up:

1. **SharedPreferences** (AsyncStorage data)
   - Products
   - Company settings
   - Invoice counter
   - Any other AsyncStorage data

2. **App Files** (in `getFilesDir()`)
   - PDF invoices in `invoices/` folder
   - Any other app files

3. **App Databases** (if you add SQLite later)
   - Database files

## Summary

**How Android identifies which data to load:**

1. **Package Name** (`com.gstbilling.app`) - identifies the app
2. **Google Account** (`user@gmail.com`) - identifies the user
3. **Combination** = unique backup location

**Your app code doesn't need to do anything special** - Android handles everything automatically! The data just appears in AsyncStorage when the app opens.

🎉 It's like magic, but it's actually Android's built-in backup system working behind the scenes!

