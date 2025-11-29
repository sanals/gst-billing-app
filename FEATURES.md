# GST Billing App - Complete Features Overview

## App Purpose

The GST Billing App is a comprehensive React Native application designed for businesses to generate GST-compliant invoices. It helps manage products, customers (outlets), generate professional PDF invoices, track stock, and maintain data backups.

## Core Features

### 1. Invoice Generation 📄

**Purpose**: Create GST-compliant tax invoices with automatic calculations.

**Key Features**:
- **Automatic Invoice Numbering**: Sequential invoice numbers with customizable prefix (e.g., "KTMVS-101")
  - Atomic reservation prevents number skipping
  - Manual invoice number option for corrections/re-billing
  - Counter management in Company Settings
- **GST Calculations**: Automatic CGST and SGST calculations based on product GST rates
- **Discount Support**: 
  - Flat discount (₹ amount)
  - Percentage discount (%)
  - Applied before tax calculations
- **Round Off**: Optional rounding to nearest rupee
- **ROT (Rate of Tax) Display**: Shows GST percentage for each line item
- **PDF Generation**: Professional invoice PDFs with:
  - Company logo
  - QR code
  - Company seal
  - Bank details
  - Amount in words
  - Complete itemized breakdown

**Screens**:
- `CreateInvoiceScreen`: Main invoice creation interface
- `InvoicePreviewScreen`: Preview before generating PDF
- `SavedInvoicesScreen`: View and manage saved invoices

**Key Services**:
- `PDFService`: Generates PDF invoices
- `InvoiceCounterService`: Manages invoice numbering
- `StockService`: Tracks and deducts stock

---

### 2. Product Management 📦

**Purpose**: Manage product catalog with HSN codes, pricing, and stock tracking.

**Key Features**:
- **Product Details**:
  - Product name
  - HSN code (required for GST)
  - Base price
  - GST rate (5%, 12%, 18%, 28%)
  - Unit (Pcs, Kg, Ltr, Box)
  - Stock quantity (optional)
- **Stock Management**:
  - Track available stock
  - Automatic stock deduction on invoice generation
  - Low stock warnings
  - Out of stock indicators
- **Search Functionality**: Search products by name or HSN code
- **CRUD Operations**: Add, edit, delete products

**Screens**:
- `ProductsScreen`: List all products with stock status
- `AddProductScreen`: Add/edit product details

**Key Services**:
- `StorageService`: Product data persistence
- `StockService`: Stock tracking and validation

---

### 3. Outlet Management 🏢

**Purpose**: Manage customer/outlet information for billing.

**Key Features**:
- **Outlet Details**:
  - Outlet name
  - Address (multi-line)
  - GST number (optional, for B2B invoices)
- **Search Functionality**: Search outlets by name, address, or GST number
- **CRUD Operations**: Add, edit, delete outlets
- **Quick Selection**: Easy outlet selection during invoice creation

**Screens**:
- `OutletsScreen`: List all outlets
- `AddOutletScreen`: Add/edit outlet details

**Key Services**:
- `OutletService`: Outlet data management

---

### 4. Company Settings 🏛️

**Purpose**: Configure company information that appears on invoices.

**Key Features**:
- **Company Details**:
  - Company name
  - Address (2 lines)
  - City, Pincode, State, State Code
  - GSTIN/UIN
  - Contact: Mobile (2 numbers), Office phone, Email
- **Bank Details**:
  - Account holder name
  - Bank name
  - Account number
  - Branch
  - IFSC code
- **Invoice Settings**:
  - Invoice prefix (e.g., "KTMVS", "INV")
  - Invoice counter management
    - View current counter
    - Set starting number (for new installations)
    - Next invoice number preview

**Screens**:
- `CompanySettingsScreen`: Complete company configuration

**Key Services**:
- `CompanySettingsService`: Company data management
- `InvoiceCounterService`: Counter management

---

### 5. Backup & Sync 💾

**Purpose**: Protect data with backup and sync capabilities.

**Key Features**:
- **Manual Backup**:
  - Export all data as JSON file
  - Save to Google Drive manually
  - Restore from backup file
- **Google Drive Auto-Sync**:
  - Automatic backup to Google Drive
  - Sign in with Google account
  - Auto-sync on data changes
  - Manual sync option
  - Restore from Google Drive
- **Android Auto Backup**:
  - Automatic device-level backup
  - Uses device's Google account
  - No app login required
- **Data Included in Backup**:
  - Products
  - Outlets
  - Company settings
  - Invoice counters (all prefixes)
  - Saved invoices (PDFs)

**Screens**:
- `SettingsScreen`: Backup configuration and management

**Key Services**:
- `BackupService`: Backup/restore operations
- `GoogleDriveService`: Google Drive integration

---

### 6. Saved Invoices 📋

**Purpose**: View and manage previously generated invoices.

**Key Features**:
- **Invoice List**: View all saved invoices
- **Invoice Details**: View invoice information
- **Share/Export**: Share invoices via various apps
- **Delete**: Remove invoices from saved list

**Screens**:
- `SavedInvoicesScreen`: List of saved invoices

**Key Services**:
- `PDFService`: Invoice file management

---

### 7. User Interface 🎨

**Purpose**: Modern, user-friendly interface.

**Key Features**:
- **Dark Mode**: System theme support with manual toggle
- **Responsive Design**: Works on phones and tablets
- **Safe Area Support**: Buttons not hidden behind navigation bars
- **Keyboard Handling**: Modals adjust when keyboard appears
- **Search**: Quick search in product/outlet pickers
- **Visual Feedback**: Loading states, error messages, success alerts

**Screens**:
- `HomeScreen`: Main navigation hub
- `SettingsScreen`: App preferences

**Key Contexts**:
- `ThemeContext`: Theme management
- `GoogleAuthContext`: Google authentication state

---

## Technical Architecture

### Services Layer

1. **StorageService**: AsyncStorage wrapper for products
2. **OutletService**: Outlet data management
3. **CompanySettingsService**: Company settings with validation
4. **InvoiceCounterService**: Atomic invoice numbering
5. **PDFService**: PDF generation using expo-print
6. **StockService**: Stock tracking and validation
7. **BackupService**: Backup/restore operations
8. **GoogleDriveService**: Google Drive API integration

### Type Definitions

- `Product`: Product with HSN, price, GST, stock
- `Outlet`: Customer/outlet information
- `Invoice`: Complete invoice with items and calculations
- `InvoiceItem`: Line item with calculations
- `CompanySettings`: Company and bank details

### Key Utilities

- `calculations.ts`: Invoice calculations (taxes, discounts, round off)
- `numberToWords.ts`: Convert numbers to words for invoice
- `convert-images.js`: Convert logo/QR code to base64 for PDF

---

## Data Flow

### Invoice Creation Flow

1. User selects outlet → `CreateInvoiceScreen`
2. User adds products → Products selected with quantities
3. User sets prices → Unit prices can be customized
4. User applies discount (optional) → Flat or percentage
5. User enables round off (optional) → Rounds to nearest rupee
6. System calculates totals → Automatic CGST/SGST calculation
7. User reviews → `InvoicePreviewScreen`
8. User generates PDF → PDF created, stock deducted, counter incremented
9. Invoice saved → Available in `SavedInvoicesScreen`

### Backup Flow

1. User configures backup method → Manual or Google Drive
2. For Google Drive → Sign in with Google
3. Enable auto-sync (optional) → Automatic backups on changes
4. Manual backup → Export JSON file
5. Restore → Select backup file or restore from Google Drive

---

## Key Features & Fixes

### Recent Improvements

1. **Invoice Number Skipping Fix**: 
   - Uses atomic reservation (`reserveNextInvoiceNumber`)
   - Prevents race conditions on multiple devices
   - Manual number option for corrections

2. **Backup Counter Fix**:
   - Fixed storage key (`@invoice_counter` instead of hardcoded)
   - Backs up all invoice counter prefixes
   - Proper restore support

3. **Search Functionality**:
   - Search in product picker (name, HSN)
   - Search in outlet picker (name, address, GST)
   - Real-time filtering

4. **UI Improvements**:
   - Safe area insets for bottom buttons
   - Keyboard avoiding views in modals
   - Better navigation bar handling

---

## File Structure

```
src/
├── screens/              # All app screens
│   ├── HomeScreen.tsx
│   ├── CreateInvoiceScreen.tsx
│   ├── InvoicePreviewScreen.tsx
│   ├── ProductsScreen.tsx
│   ├── AddProductScreen.tsx
│   ├── OutletsScreen.tsx
│   ├── AddOutletScreen.tsx
│   ├── CompanySettingsScreen.tsx
│   ├── SavedInvoicesScreen.tsx
│   └── SettingsScreen.tsx
├── services/            # Business logic
│   ├── StorageService.ts
│   ├── OutletService.ts
│   ├── CompanySettingsService.ts
│   ├── InvoiceCounterService.ts
│   ├── PDFService.ts
│   ├── StockService.ts
│   ├── BackupService.ts
│   └── GoogleDriveService.ts
├── types/               # TypeScript definitions
│   ├── product.ts
│   ├── outlet.ts
│   ├── invoice.ts
│   └── company.ts
├── utils/               # Utilities
│   ├── calculations.ts
│   └── numberToWords.ts
├── contexts/            # React contexts
│   ├── ThemeContext.tsx
│   └── GoogleAuthContext.tsx
└── navigation/          # Navigation setup
    └── AppNavigator.tsx
```

---

## Important Notes

### Invoice Numbering
- Counter is stored per prefix
- Atomic reservation prevents skipping
- Manual override available
- Counter can be set for new installations

### Stock Management
- Stock is optional (backward compatible)
- Automatically deducted on invoice generation
- Low stock warnings at 10 units
- Out of stock prevents adding to invoice

### PDF Generation
- Logo, QR code, and seal are embedded as base64
- Run `node scripts/convert-images.js` after updating assets
- PDFs saved to device storage
- Can be shared via any app

### Backup
- Manual backup: JSON file export
- Google Drive: Requires OAuth setup
- Android Auto Backup: Uses device account
- All data types included in backup

---

## Future Reference

When fixing bugs or adding features, refer to:
- This document for feature overview
- `README.md` for setup and build
- `BUILD.md` for build instructions
- Individual service files for implementation details
- Type definitions for data structures

