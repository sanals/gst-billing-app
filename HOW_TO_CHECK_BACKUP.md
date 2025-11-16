# How to Check if Backup is Working

## ✅ Setup Complete!

Your app is now configured for automatic Google Drive backup (like WhatsApp). Here's how to verify it's working:

## Method 1: Check in App Settings

1. Open the app
2. Go to **Settings** (from Home screen)
3. Scroll to **"📦 Backup & Sync"** section
4. You'll see:
   - Last Backup date/time
   - Number of invoices backed up
   - Number of products backed up

## Method 2: Check Google Drive (After First Backup)

### Steps:
1. Open **Google Drive** app on your phone
2. Tap the **hamburger menu** (☰) in top left
3. Scroll down and tap **"Backups"**
4. Look for **"GST Billing App"** in the list

### When Will It Appear?
- First backup happens automatically within **24 hours** of:
  - Device being idle (screen off)
  - Device charging
  - Connected to WiFi
  - At least 24 hours since last backup

## Method 3: Test Restore (Best Way to Verify)

1. **Create some test data:**
   - Add a few products
   - Create an invoice
   - Update company settings

2. **Wait for backup** (or use "Prepare Backup" button in Settings)

3. **Uninstall the app** (to simulate data loss)

4. **Reinstall the app** from Play Store

5. **Open the app** - Your data should automatically restore! ✅

## Method 4: Manual Export & Check

1. Go to **Settings** → **Backup & Sync**
2. Tap **"Export & Save to Drive"**
3. This creates a JSON backup file
4. Share it to Google Drive manually
5. You can download and check the file contents

## What Gets Backed Up Automatically?

✅ **Products** (from AsyncStorage)
✅ **Company Settings** (from AsyncStorage)
✅ **Invoice Counter** (from AsyncStorage)
✅ **PDF Invoices** (from `invoices/` folder)

## Important Notes

### ⚠️ Development vs Production

- **Expo Go**: Auto Backup might not work fully (needs production build)
- **Production APK**: Auto Backup works automatically ✅

### 🔄 Backup Frequency

- Automatic backups happen **once every 24 hours** (when conditions are met)
- You can't force an immediate backup, but you can:
  - Use "Prepare Backup" to update metadata
  - Use "Export & Save to Drive" for manual backup

### 📱 Requirements

- ✅ Google account logged into device
- ✅ WiFi connection (for automatic backup)
- ✅ Device charging (for automatic backup)
- ✅ Device idle (screen off)

## Troubleshooting

### Backup Status Shows "Never"
- This is normal if you just set it up
- Create some data (products/invoices)
- Tap "Prepare Backup" button
- Wait 24 hours for automatic backup

### Can't See Backup in Google Drive
- Make sure you're checking the **"Backups"** section (not "My Drive")
- Wait at least 24 hours after first data creation
- Ensure device has Google account logged in
- Check that device has been charging and on WiFi

### Want Immediate Backup?
- Use "Export & Save to Drive" button
- This creates a file you can manually save to Drive
- Works immediately, no waiting needed

## Summary

**Your backup is configured!** It will work automatically in the background, just like WhatsApp. Check the Settings screen to see backup status, or wait 24 hours and check Google Drive's "Backups" section.

🎉 No login needed, no setup required - it just works!

