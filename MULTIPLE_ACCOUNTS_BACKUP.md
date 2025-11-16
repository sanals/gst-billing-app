# Multiple Google Accounts - How Backup Works

## What Happens with Multiple Accounts?

If you have multiple Google accounts logged into your device, Android uses a **specific account** for app backups.

## Which Account is Used?

### Primary Account (Default)
Android uses the **primary Google account** for backups:
- Usually the **first account** you added to the device
- Or the account set as **primary** in device settings

### How to Check Which Account is Primary:

**Android Settings:**
1. Open **Settings**
2. Go to **Accounts** (or **Users & accounts**)
3. The first account listed is usually the primary
4. Or look for account with "Primary" label

## Backup Behavior

### Scenario 1: Multiple Accounts, One Backup
- Android creates **one backup** per app
- Uses the **primary account** for backup
- Backup location: `/Backups/com.gstbilling.app/primary@gmail.com/`

### Scenario 2: Switching Primary Account
- If you change primary account
- New backups will use the new primary account
- Old backup remains with old account
- ⚠️ **Data might not restore** if you switch accounts

## Important Considerations

### ✅ Same Account on Both Devices
- Device 1: Primary account = `john@gmail.com`
- Device 2: Primary account = `john@gmail.com`
- ✅ **Backup/restore works perfectly**

### ❌ Different Primary Accounts
- Device 1: Primary account = `john@gmail.com`
- Device 2: Primary account = `jane@gmail.com`
- ❌ **Backup won't restore** (different accounts)

### ⚠️ Multiple Accounts on Same Device
- Only **one account** is used for backup
- The **primary account**
- Other accounts don't get separate backups

## Best Practice

### For Your Use Case:

1. **Use the same primary account** on all devices
   - This ensures backup/restore works

2. **Check which account is primary** before relying on backup
   - Settings → Accounts → Check primary account

3. **If you need to switch accounts:**
   - Use "Export & Save to Drive" for manual backup
   - Then restore manually on new device

## How to Change Primary Account (If Needed)

### Android Settings:
1. Open **Settings**
2. Go to **Accounts**
3. Remove and re-add accounts in desired order
4. First account becomes primary

### Or:
1. Remove secondary account
2. Add it back (becomes secondary)
3. Primary account stays primary

## Example Scenarios

### Scenario A: Business & Personal Accounts
- Device has: `business@gmail.com` (primary) and `personal@gmail.com`
- App backup uses: `business@gmail.com`
- On new device with `business@gmail.com` as primary: ✅ Restores
- On new device with `personal@gmail.com` as primary: ❌ Won't restore

### Scenario B: Family Device
- Device has: `dad@gmail.com` (primary) and `mom@gmail.com`
- App backup uses: `dad@gmail.com`
- If mom uses the app, data backs up to dad's account
- ⚠️ **Privacy consideration**: All users' data goes to primary account

## Solution: Manual Backup for Multiple Users

If you need separate backups for different accounts:

### Option 1: Manual Export
- Each user can export their data
- Save to their own Google Drive account
- Restore manually when needed

### Option 2: Account-Specific Backup (Future Enhancement)
- We could add a feature to:
  - Let user select which account to backup to
  - Store backup metadata with account info
  - Restore from specific account

## Current Implementation

### What We Have:
- ✅ Auto backup uses device's primary Google account
- ✅ Manual export available for any account
- ✅ Backup status shows in Settings

### Limitations:
- ⚠️ Only one account used for auto backup (primary)
- ⚠️ Can't choose which account to backup to
- ⚠️ All users' data backs up to primary account

## Recommendations

### For Single User:
- ✅ Current setup works perfectly
- ✅ Just use the same Google account on all devices

### For Multiple Users:
- ⚠️ Consider manual export/import
- ⚠️ Or use separate devices with different primary accounts
- ⚠️ Or implement account selection feature (future)

## Summary

**With multiple accounts:**
- Android uses the **primary account** for backup
- Only **one backup** per app (tied to primary account)
- To restore, new device must have **same primary account**
- For multiple users, consider **manual export/import**

**Best practice:** Use the same primary Google account on all devices where you want backup/restore to work! 🎯

