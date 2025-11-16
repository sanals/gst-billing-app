# Backup & Restore - How It Works

## ✅ Yes! Your Data Will Restore on New Device

When you install the app on a new device (or reinstall), your data will automatically restore **IF** you use the same Google account.

## How It Works

### Scenario 1: Same Device, Reinstall App
1. **Uninstall** the app
2. **Reinstall** from Play Store
3. **Open** the app
4. ✅ **Data automatically restores** from Google Drive backup

### Scenario 2: New Device
1. **Install** app on new device
2. **Login** with **same Google account** (the one you used on old device)
3. **Open** the app
4. ✅ **Data automatically restores** from Google Drive backup

## Requirements for Restore

### ✅ Must Have:
1. **Same Google Account** - The Gmail account used on the old device
2. **App from Play Store** - For production apps (or same package name)
3. **Backup Exists** - Data must have been backed up (happens automatically after 24 hours)

### ⚠️ Important Notes:

#### For Development (Expo Go):
- Auto Backup might not work fully
- You'd need to use "Export & Save to Drive" manually
- Then manually restore on new device

#### For Production (Published App):
- Auto Backup works automatically ✅
- Restore happens automatically ✅
- No manual steps needed ✅

## What Gets Restored?

✅ **Products** - All your product catalog
✅ **Company Settings** - Company name, address, GSTIN, etc.
✅ **Invoice Counter** - Continues from where you left off
✅ **PDF Invoices** - All saved invoice PDFs

## Timeline

### Backup:
- Happens automatically **once every 24 hours**
- When device is: idle, charging, on WiFi

### Restore:
- Happens **immediately** when you open the app
- On first launch after installation
- No waiting needed!

## Testing Restore (Before Going to New Device)

### Step 1: Create Test Data
- Add a few products
- Create an invoice
- Update company settings

### Step 2: Wait for Backup
- Wait 24 hours (or use "Prepare Backup" button)
- Or use "Export & Save to Drive" for immediate backup

### Step 3: Test Restore
- Uninstall the app
- Reinstall from Play Store
- Open app - data should restore! ✅

## Manual Backup/Restore (Alternative)

If you want to backup/restore manually:

### Backup:
1. Go to **Settings** → **Backup & Sync**
2. Tap **"Export & Save to Drive"**
3. Save the JSON file to Google Drive

### Restore:
1. Download the backup JSON file from Google Drive
2. Use a restore function (we can add this if needed)
3. Or manually import data

## Cross-Device Sync

### Same Account, Multiple Devices:
- ✅ Data syncs across all devices
- ✅ Latest backup is used
- ⚠️ Note: If you use app on Device A, then Device B, the backup from Device A will restore on Device B

### Different Accounts:
- ❌ Data does NOT sync between different Google accounts
- Each account has its own backup

## Summary

**Yes, your data will restore on a new device!** Just make sure:
1. ✅ Use the same Google account
2. ✅ Wait for backup to happen (24 hours, or use manual export)
3. ✅ Install app from Play Store (for production)

The restore happens automatically - no manual steps needed! 🎉

## For Development Testing

If you're testing in development:
- Use "Export & Save to Drive" to create backup file
- Share it to Google Drive
- On new device, download and restore manually
- Or wait for production build where auto backup/restore works fully

