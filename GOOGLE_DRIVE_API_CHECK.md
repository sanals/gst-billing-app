# 🔍 Google Drive API Setup Check

## Common Error: "Upload failed"

This usually means one of these issues:

### 1. Google Drive API Not Enabled

**Check:**
1. Go to: https://console.cloud.google.com
2. **APIs & Services** → **Library**
3. Search for **"Google Drive API"**
4. Make sure it shows **"API enabled"** (green checkmark)

**If not enabled:**
- Click on "Google Drive API"
- Click **"ENABLE"** button
- Wait 1-2 minutes for it to activate

---

### 2. Wrong Scopes

**Check OAuth Consent Screen:**
1. Go to: **APIs & Services** → **OAuth consent screen**
2. Click **"EDIT APP"**
3. Scroll to **"Scopes"** section
4. Make sure these are added:
   - ✅ `https://www.googleapis.com/auth/drive.file` - See, edit, create, and delete only the specific Google Drive files you use with this app
   - ✅ `https://www.googleapis.com/auth/userinfo.email`
   - ✅ `https://www.googleapis.com/auth/userinfo.profile`

**If missing:**
- Click **"ADD OR REMOVE SCOPES"**
- Search and add `drive.file`
- Click **"UPDATE"**
- Click **"SAVE AND CONTINUE"**

---

### 3. Test User Not Added

**Check:**
1. **OAuth consent screen** → Scroll to **"Test users"**
2. Make sure your email (`sanalausie@gmail.com`) is listed

---

## Quick Fix Checklist

- [ ] Google Drive API is **ENABLED**
- [ ] Scope `drive.file` is **ADDED** to OAuth consent screen
- [ ] Your email is in **TEST USERS** list
- [ ] You've **signed in** with Google in the app
- [ ] **Reloaded** the app after making changes

---

## After Fixing

1. **Wait 2-3 minutes** for Google's servers to update
2. **Sign out** and **sign in again** in the app (to get new token with correct scopes)
3. Try **"Sync Now"** again

---

## Next Steps

**Try "Sync Now" again** - the improved error message will now show the actual error from Google, which will help us fix it!

