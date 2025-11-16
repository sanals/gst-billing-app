# 📋 Phase 4 Enhancements - Matching Current Bill Format

## 🔍 Analysis of Current Bill vs App

### ✅ Already Implemented
- [x] Company Name: JANAKI ENTERPRISES
- [x] Company Address (partially)
- [x] Invoice Number
- [x] Date
- [x] Customer Name (Outlet Name)
- [x] Customer Address (Outlet Address)
- [x] Product Description
- [x] HSN Code
- [x] Quantity (Actual and Billed)
- [x] Unit Price
- [x] Amount
- [x] CGST calculation and display
- [x] SGST calculation and display
- [x] Total Before Tax Amount (Subtotal)
- [x] Taxable Value
- [x] Total Tax Amount
- [x] Grand Total
- [x] Amount in words

### ❌ Missing from Current Implementation

#### 1. Company Branding & Identity
- [ ] **Company Logo** (circular logo at top left)
- [ ] **QR Code** (top right - likely for UPI payment or invoice verification)
- [ ] **GSTIN/UIN**: 22AAUPJ7SS1B12M
- [ ] **Complete Contact Details**:
  - Mobile: 9838884048, 9211055768
  - Office: 44929 799627
  - Email: janakienterprises@gmail.com
- [ ] **State**: Kerala
- [ ] **State Code**: 22

#### 2. Invoice Numbering
- [ ] **Invoice Prefix**: KTMVS (before the number)
- [ ] Current: INV1234567890
- [ ] Should be: KTMVS-101 or similar format

#### 3. Customer Information
- [ ] **Customer GST NO** field (important for B2B transactions)
- [ ] Current: Only Name and Address
- [ ] Need: GST NO input field

#### 4. Product Table Enhancements
- [x] **ROT (Rate of Tax) %** column (shows GST rate like 12%, 18%)
- [x] Current: GST rate only shown in details
- [x] Need: Dedicated column in main table

#### 5. Calculations & Adjustments
- [x] **Discount** field (flat or percentage)
- [x] **Round Off** amount (to make total a round number)
- [x] Current: Direct grand total
- [x] Need: Subtotal → Discount → Round Off → Grand Total

#### 6. Bank Details Section
- [x] **A/c Holder's Name**: JANAKI ENTERPRISES
- [x] **Bank Name**: INDIAN BANK
- [x] **A/c No.**: 7926826378
- [x] **Branch**: AKATHETRARIA
- [x] **IFSC Code**: IDIBD00A007

#### 7. Footer & Signature
- [x] **"For JANAKI ENTERPRISES"** text
- [x] **Authorised Signatory** section with space
- [ ] **Class** field at bottom

#### 8. Layout & Design
- [ ] Yellow/gold background color (as in physical bill)
- [ ] Better table borders (more visible)
- [ ] Company logo placement
- [ ] QR code placement

---

## 🎯 Implementation Priority

### 🔴 HIGH PRIORITY (Critical for compliance) ✅ COMPLETED
1. ✅ **GSTIN/UIN** - Legal requirement for GST invoices
2. ✅ **State & State Code** - Required for GST compliance
3. ✅ **Customer GST NO** - Needed for B2B invoices
4. ✅ **Invoice Prefix** - Better invoice numbering system
5. ✅ **ROT % Column** - Clearer tax display
6. ✅ **Bank Details** - Required for payment

### 🟡 MEDIUM PRIORITY (Important for functionality) ✅ COMPLETED
7. ✅ **Discount & Round Off** - Common business need
8. ✅ **Complete Contact Details** - Professional appearance
9. ✅ **Signature Section** - Authorization proof

### 🟢 LOW PRIORITY (Nice to have)
10. **Company Logo** - Branding
11. **QR Code** - Modern payment option
12. **Yellow Background** - Design preference
13. **Class Field** - If needed for your business

---

## 📝 Detailed Implementation Plan

### PART 1: Company Settings & Configuration

#### 1.1 Create Company Settings Type
**File:** `src/types/company.ts`
```typescript
export interface CompanySettings {
  name: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  gstin: string;
  mobile1: string;
  mobile2?: string;
  officePhone?: string;
  email: string;
  bankDetails: {
    accountHolder: string;
    bankName: string;
    accountNumber: string;
    branch: string;
    ifscCode: string;
  };
  invoicePrefix: string;
  logo?: string; // base64 or file path
}
```

#### 1.2 Create Company Settings Service
**File:** `src/services/CompanySettingsService.ts`
```typescript
export class CompanySettingsService {
  static async getSettings(): Promise<CompanySettings>
  static async saveSettings(settings: CompanySettings): Promise<void>
  static getDefaultSettings(): CompanySettings
}
```

#### 1.3 Create Company Settings Screen
**File:** `src/screens/CompanySettingsScreen.tsx`
- Form to edit all company details
- Save to AsyncStorage
- Validation for GSTIN format
- Bank details section

---

### PART 2: Enhanced Invoice Types

#### 2.1 Update Invoice Type
**File:** `src/types/invoice.ts` (UPDATE)
```typescript
export interface Invoice {
  // Existing fields...
  
  // NEW FIELDS:
  stateCode: string;           // "22"
  invoicePrefix: string;        // "KTMVS"
  customerGSTNo?: string;       // Optional for B2C
  discount: number;             // Flat amount discount
  discountPercent: number;      // Percentage discount
  roundOff: number;             // Round off amount (+/-)
  subtotalBeforeDiscount: number;
  subtotalAfterDiscount: number;
}

export interface InvoiceItem {
  // Existing fields...
  
  // NEW FIELDS:
  rotPercent: number;          // Rate of Tax (GST %)
}
```

---

### PART 3: Enhanced Invoice Creation Screen

#### 3.1 Add Customer GST Field
- Input field for customer GST number
- Optional (for B2C) / Required (for B2B)
- Format validation (e.g., 22AAAAA1234A1Z5)

#### 3.2 Add Discount Fields
- Flat discount input
- Percentage discount input
- Auto-calculate based on choice
- Update grand total accordingly

#### 3.3 Add Round Off
- Calculate round off to nearest rupee
- Show as separate line item
- Can be positive or negative
- User can override

#### 3.4 Update Summary Section
```
Subtotal:              ₹1000.00
Discount (10%):        -₹100.00
After Discount:         ₹900.00
Total CGST:             ₹81.00
Total SGST:             ₹81.00
Round Off:              +₹0.00
GRAND TOTAL:           ₹1062.00
```

---

### PART 4: Enhanced Invoice Preview & PDF

#### 4.1 Update Preview Screen Layout
- Add company logo at top left
- Add QR code at top right
- Show GSTIN/UIN
- Show State and State Code
- Display customer GST NO (if provided)
- Add ROT% column in table
- Show discount line
- Show round off line
- Add bank details section
- Add signature section

#### 4.2 Update PDF Template
**File:** `src/services/PDFService.ts` (UPDATE)
- Include all new fields
- Match physical bill layout
- Add yellow/gold background color
- Better table borders
- Include bank details
- Add signature section
- "For JANAKI ENTERPRISES" text

---

### PART 5: Invoice Numbering System

#### 5.1 Create Invoice Counter Service
**File:** `src/services/InvoiceCounterService.ts`
```typescript
export class InvoiceCounterService {
  static async getNextInvoiceNumber(prefix: string): Promise<string>
  // Returns: "KTMVS-101", "KTMVS-102", etc.
  
  static async resetCounter(prefix: string): Promise<void>
  // For new year/fiscal year reset
}
```

#### 5.2 Update Invoice Creation
- Get next number from counter
- Format: {PREFIX}-{NUMBER}
- Increment after successful creation
- Store with invoice

---

### PART 6: QR Code Generation

#### 6.1 Install Dependencies
```bash
npm install react-native-qrcode-svg
npm install react-native-svg
```

#### 6.2 QR Code Content Options

**Option A: UPI Payment QR**
```
upi://pay?pa=janakienterprises@upi&pn=JANAKI ENTERPRISES&am={amount}&tn=Invoice {number}
```

**Option B: Invoice Verification QR**
```json
{
  "invoice": "KTMVS-101",
  "date": "29-9-2023",
  "amount": 3150,
  "gstin": "22AAUPJ7SS1B12M"
}
```

#### 6.3 Implementation
- Generate QR on invoice preview
- Include in PDF
- Position at top right corner

---

### PART 7: Calculation Updates

#### 7.1 Enhanced Calculation Function
**File:** `src/utils/calculations.ts` (UPDATE)
```typescript
export const calculateInvoiceTotals = (
  items: InvoiceItem[],
  discountAmount: number = 0,
  discountPercent: number = 0,
  roundOffEnabled: boolean = true
) => {
  const subtotal = items.reduce((sum, item) => sum + item.taxableAmount, 0);
  
  // Calculate discount
  let discount = discountAmount;
  if (discountPercent > 0) {
    discount = (subtotal * discountPercent) / 100;
  }
  
  const subtotalAfterDiscount = subtotal - discount;
  
  // Recalculate taxes on discounted amount
  const totalCGST = items.reduce((sum, item) => {
    const discountedAmount = item.taxableAmount * (subtotalAfterDiscount / subtotal);
    return sum + (discountedAmount * item.product.gstRate / 2 / 100);
  }, 0);
  
  const totalSGST = totalCGST;
  const totalTax = totalCGST + totalSGST;
  
  const grandTotalBeforeRoundOff = subtotalAfterDiscount + totalTax;
  
  // Calculate round off
  let roundOff = 0;
  if (roundOffEnabled) {
    roundOff = Math.round(grandTotalBeforeRoundOff) - grandTotalBeforeRoundOff;
  }
  
  const grandTotal = grandTotalBeforeRoundOff + roundOff;
  
  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    subtotalAfterDiscount: parseFloat(subtotalAfterDiscount.toFixed(2)),
    totalCGST: parseFloat(totalCGST.toFixed(2)),
    totalSGST: parseFloat(totalSGST.toFixed(2)),
    totalTax: parseFloat(totalTax.toFixed(2)),
    roundOff: parseFloat(roundOff.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2)),
  };
};
```

---

## 🎨 Design Updates

### Color Scheme
- Background: #E8D4A2 (yellowish/gold like physical bill)
- Header: Darker gold/brown
- Table borders: #333333 (darker, more visible)
- Text: Black for better contrast

### Typography
- Company Name: Bold, larger
- GSTIN, State Code: Prominent display
- Table headers: Bold, uppercase
- Numbers: Monospace font for alignment

### Layout
```
┌─────────────────────────────────────────────┐
│ [LOGO]    JANAKI ENTERPRISES        [QR]   │
│           Complete Address                  │
│           Contact Details                   │
│           GSTIN/UIN: 22AAUPJ7SS1B12M       │
├─────────────────────────────────────────────┤
│         TAX INVOICE        State: Kerala    │
│         KTMVS-101         Code: 22          │
│         Date: 29-9-2023                     │
├─────────────────────────────────────────────┤
│ Name & Address: [Customer Name]             │
│ GST NO: [Customer GST if B2B]              │
├─────────────────────────────────────────────┤
│ No | Description | ROT% | HSN | Qty | ... │
│────┼─────────────┼──────┼─────┼─────┼─────│
│  1 | Product 1   | 18%  | 123 | 2/2 | ... │
├─────────────────────────────────────────────┤
│                     Total Before Tax: 1000  │
│ Taxable: 1000  CGST 9%: 90  SGST 9%: 90   │
│                         Total Tax: 180      │
│                         Discount: -50       │
│                         Round Off: +0.70    │
│                    GRAND TOTAL: ₹1131      │
├─────────────────────────────────────────────┤
│ Amount in Words: One Thousand One Hundred...│
├─────────────────────────────────────────────┤
│ Company's Bank Details:                     │
│ A/c Holder: JANAKI ENTERPRISES             │
│ Bank: INDIAN BANK                           │
│ A/c No: 7926826378                         │
│ Branch & IFSC: AKATHETRARIA & IDIBD00A007  │
├─────────────────────────────────────────────┤
│                    For JANAKI ENTERPRISES   │
│                                             │
│                    _____________________    │
│                    Authorised Signatory     │
└─────────────────────────────────────────────┘
```

---

## 📦 Implementation Phases

### PHASE 4A: Company Settings (Week 1)
**Files to Create:**
1. `src/types/company.ts`
2. `src/services/CompanySettingsService.ts`
3. `src/screens/CompanySettingsScreen.tsx`
4. Add route to AppNavigator
5. Add button on HomeScreen

**Features:**
- [x] Company info form
- [x] Bank details form
- [x] Save/load settings
- [x] Default JANAKI ENTERPRISES data

### PHASE 4B: Enhanced Invoice Types (Week 1)
**Files to Update:**
1. `src/types/invoice.ts`
2. `src/utils/calculations.ts`

**Features:**
- [x] Add new invoice fields
- [x] Update calculation logic
- [x] Discount calculations
- [x] Round off calculations

### PHASE 4C: Enhanced Invoice Creation (Week 2)
**Files to Update:**
1. `src/screens/CreateInvoiceScreen.tsx`

**Features:**
- [x] Customer GST NO field
- [x] Discount input (flat/percent)
- [x] Round off toggle
- [x] Updated summary
- [x] Load company settings

### PHASE 4D: Invoice Numbering (Week 2)
**Files to Create:**
1. `src/services/InvoiceCounterService.ts`

**Features:**
- [x] Counter management
- [x] Prefix support
- [x] Auto-increment
- [x] Reset functionality

### PHASE 4E: Enhanced Preview & PDF (Week 3)
**Files to Update:**
1. `src/screens/InvoicePreviewScreen.tsx`
2. `src/services/PDFService.ts`

**Features:**
- [x] Match physical bill layout
- [x] Show all new fields
- [x] Bank details section
- [x] Signature section
- [x] Yellow background
- [x] Better table design

### PHASE 4F: QR Code & Logo (Week 3)
**Files to Update:**
1. Install QR libraries
2. `src/screens/InvoicePreviewScreen.tsx`
3. `src/services/PDFService.ts`
4. `src/screens/CompanySettingsScreen.tsx`

**Features:**
- [x] QR code generation
- [x] Logo upload
- [x] Display in preview
- [x] Include in PDF

---

## ✅ Testing Checklist

### Company Settings
- [ ] Can edit company details
- [ ] Can edit bank details
- [ ] Settings persist after app restart
- [ ] Invoice prefix can be customized

### Enhanced Invoice Creation
- [ ] Can enter customer GST NO
- [ ] Flat discount works correctly
- [ ] Percentage discount works correctly
- [ ] Round off calculates correctly
- [ ] Grand total is accurate

### Invoice Display
- [ ] All company details show correctly
- [ ] Customer GST NO displays (if entered)
- [ ] ROT% column shows correct GST rates
- [ ] Discount line displays
- [ ] Round off line displays
- [ ] Bank details show in footer
- [ ] Signature section present

### PDF Generation
- [ ] PDF matches physical bill layout
- [ ] All fields present
- [ ] QR code renders
- [ ] Logo renders (if uploaded)
- [ ] Colors match (yellow background)
- [ ] Table borders visible
- [ ] Bank details included
- [ ] Calculations correct

### Invoice Numbering
- [ ] Numbers increment correctly
- [ ] Prefix applies correctly
- [ ] No duplicate numbers
- [ ] Counter persists after restart

---

## 📊 Comparison: Before vs After

### Current Implementation
```
Invoice #INV1731793200000
Date: 11/16/2025
To: ABC Store

Products table
Subtotal: 1000
CGST: 90
SGST: 90
Grand Total: 1180

Amount in words
```

### Enhanced Implementation
```
JANAKI ENTERPRISES                    [QR Code]
Complete Address & Contact
GSTIN: 22AAUPJ7SS1B12M    State: Kerala (22)

TAX INVOICE
KTMVS-101
Date: 29-9-2023

To: ABC Store
GST NO: 29XXXXX1234X1Z5

Products table with ROT% column
Subtotal: 1000
Discount: -50
After Discount: 950
CGST (9%): 85.50
SGST (9%): 85.50
Total Tax: 171
Round Off: +0.00
GRAND TOTAL: ₹1121

Amount in Words: ...

Bank Details:
Account: 7926826378
IFSC: IDIBD00A007

                For JANAKI ENTERPRISES
                ____________________
                Authorised Signatory
```

---

## 🎯 Success Criteria

✅ Invoice matches physical bill format
✅ All legally required fields present (GSTIN, State Code)
✅ Discount and round off calculations work
✅ Bank details included for payment
✅ Professional appearance
✅ QR code for modern payment
✅ Customizable company settings
✅ Sequential invoice numbering
✅ B2B ready (customer GST NO)

---

## ⏱️ Timeline

**Week 1:** Company Settings + Enhanced Types (8-10 hours)
**Week 2:** Enhanced Invoice Creation + Numbering (10-12 hours)
**Week 3:** Preview/PDF + QR Code/Logo (12-15 hours)

**Total:** ~35-40 hours of development

---

## 💡 Additional Considerations

### Legal Compliance
- GSTIN format validation
- State code validation
- Customer GST NO validation (optional)
- Date format (DD-MM-YYYY as in physical bill)

### Data Migration
- Existing invoices won't have new fields
- Need default values for old invoices
- Consider version field in invoice data

### User Experience
- Settings screen accessible from Home
- One-time setup wizard for company details
- Import/export company settings
- Backup invoice counter

---

## 🚀 Ready to Implement?

This plan adds all missing features from your physical bill:
1. ✅ Complete company details
2. ✅ Customer GST NO
3. ✅ Discount & Round Off
4. ✅ Bank details
5. ✅ Invoice numbering (KTMVS prefix)
6. ✅ QR code
7. ✅ Professional layout
8. ✅ All GST compliance fields

**Shall I start with Phase 4A (Company Settings)?**

