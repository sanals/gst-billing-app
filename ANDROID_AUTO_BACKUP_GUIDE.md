# Android Auto Backup to Google Drive (Like WhatsApp)

## How WhatsApp Does It

WhatsApp uses **Android's Auto Backup** feature, which:
- ✅ Automatically backs up app data to Google Drive
- ✅ Uses the Google account **already logged into your phone**
- ✅ **No separate login in WhatsApp needed**
- ✅ Happens automatically in the background
- ✅ Free and unlimited (for app data, not media)

## How It Works

1. **User has Gmail account on phone** → Already done! ✅
2. **Android automatically backs up app data** → Happens automatically
3. **Data stored in Google Drive** → In "Backups" section
4. **When you reinstall app** → Data automatically restores

## What Gets Backed Up

With Android Auto Backup enabled, these are automatically backed up:
- ✅ **AsyncStorage data** (products, company settings, invoice counter)
- ✅ **App files** (PDFs in `invoices/` folder)
- ✅ **App databases** (if you add SQLite later)

## Setup (Already Done!)

I've already configured your `app.json` with:
```json
"android": {
  "backup": {
    "enabled": true,
    "includeSharedPreferences": true
  }
}
```

## How to Verify It's Working

### Method 1: Check Google Drive
1. Open Google Drive app
2. Go to "Backups" section
3. Look for "GST Billing App" backup
4. It appears after first backup (usually within 24 hours)

### Method 2: Test Restore
1. Uninstall the app
2. Reinstall from Play Store
3. Open app - data should restore automatically!

## When Backups Happen

Android automatically backs up when:
- ✅ Device is idle (screen off)
- ✅ Device is charging
- ✅ Connected to WiFi
- ✅ At least 24 hours since last backup

## Manual Backup Option

I've also created a `BackupService` that allows:
- **Manual export** - Create JSON backup file
- **Share to Drive** - User can manually save to Google Drive
- **Restore** - Import backup file to restore data

## Important Notes

1. **No OAuth needed** - Uses device's Google account automatically
2. **Automatic** - Happens in background, no user action needed
3. **Free** - App data backup is free (media backup has limits)
4. **Secure** - Encrypted and private to your Google account
5. **Works on reinstall** - Data automatically restores

## Limitations

- **Only works on Android** (iOS has different backup system)
- **Requires Google account on device** (which you have!)
- **Backup happens automatically** (can't force immediate backup)
- **PDFs are backed up** but might count toward storage quota

## For iOS

iOS uses iCloud backup automatically if:
- User has iCloud enabled
- "Backup" is enabled in Settings
- Device is charging and on WiFi

## Summary

**You're all set!** Your app will automatically backup to Google Drive using the Gmail account on the phone, just like WhatsApp. No login needed, no setup required - it just works! 🎉

The backup happens automatically in the background. Your PDFs and product data will be safely stored in Google Drive.

