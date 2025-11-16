# 🧪 PHASE 4 - Testing Guide

## 📦 Implementation Status

### ✅ Step 1: Core Files (Part 1)
- ✅ `src/types/invoice.ts` - Invoice and InvoiceItem interfaces
- ✅ `src/utils/calculations.ts` - GST calculation functions
- ✅ `src/utils/numberToWords.ts` - Amount to words converter
- ✅ `src/navigation/AppNavigator.tsx` - Added CreateInvoice and InvoicePreview routes
- ✅ `src/screens/HomeScreen.tsx` - Added "Create New Invoice" button

### ✅ Step 2: Create Invoice Screen (Part 2)
- ✅ `src/screens/CreateInvoiceScreen.tsx` - Full implementation with:
  - Outlet details input (name and address)
  - Product selection modal
  - Line item management (add, remove, edit)
  - Real-time GST calculations
  - Invoice summary
  - Validation

### ✅ Step 3: Invoice Preview Screen (Part 3)
- ✅ `src/screens/InvoicePreviewScreen.tsx` - Full implementation with:
  - Professional invoice layout
  - Company header
  - Product table with HSN codes
  - Tax breakdown
  - Amount in words
  - PDF generation button

### ✅ Step 4: PDF Service Update (Part 4)
- ✅ `src/services/PDFService.ts` - Updated with:
  - `generateInvoicePDF()` method
  - Dynamic HTML template
  - Professional formatting
  - Amount in words in PDF

---

## 🧪 Testing Checklist

### ✅ Basic Flow
- [ ] Home screen shows "Create New Invoice" button (green color)
- [ ] Tapping button navigates to Create Invoice screen
- [ ] Can enter outlet name and address
- [ ] Can tap "+ Add" to open product selection modal

### ✅ Product Selection
- [ ] Modal shows all saved products from Products screen
- [ ] Can tap product to add it to invoice
- [ ] Product appears in list with HSN code and GST rate displayed
- [ ] Can add multiple products
- [ ] Can remove products using ✕ button
- [ ] Modal closes after selecting a product

### ✅ Quantity & Price Entry
- [ ] Can enter actual quantity for each product
- [ ] Can enter billed quantity for each product (required)
- [ ] Unit price is pre-filled from product base price
- [ ] Can edit unit price if needed
- [ ] Accepts decimal quantities (e.g., 1.5, 2.25)

### ✅ Real-Time Calculations
- [ ] Taxable amount calculates: billedQuantity × unitPrice
- [ ] CGST calculates: (taxableAmount × GST%) / 2 / 100
- [ ] SGST calculates: (taxableAmount × GST%) / 2 / 100
- [ ] Line item total shows: taxableAmount + CGST + SGST
- [ ] Invoice summary updates automatically
- [ ] Subtotal is sum of all taxable amounts
- [ ] Total CGST is sum of all CGST amounts
- [ ] Total SGST is sum of all SGST amounts
- [ ] Grand total is subtotal + total CGST + total SGST

### ✅ Validation
- [ ] Shows alert if outlet name is empty
- [ ] Shows alert if no products added
- [ ] Shows alert if any product has 0 billed quantity
- [ ] Cannot proceed to preview without fixing errors

### ✅ Preview Screen
- [ ] Shows "JANAKI ENTERPRISES" header
- [ ] Shows company address
- [ ] Shows invoice number (format: INV{timestamp})
- [ ] Shows current date
- [ ] Shows outlet name and address in "Bill To" section
- [ ] Shows all products in table format
- [ ] Table shows: S.No, Product, Qty, Rate, CGST, SGST, Total
- [ ] Shows HSN codes for each product
- [ ] Shows correct CGST and SGST per item
- [ ] Shows invoice totals section
- [ ] Shows amount in words in Indian format
- [ ] Amount in words handles: Rupees, Paise, Lakhs, Crores

### ✅ PDF Generation & Sharing
- [ ] "Generate PDF & Share" button is visible
- [ ] Shows loading spinner while generating
- [ ] Success alert appears after generation
- [ ] Alert has "OK" and "Share" buttons
- [ ] Tapping "OK" returns to home screen
- [ ] Tapping "Share" opens native share sheet
- [ ] Can share via WhatsApp, Email, etc.
- [ ] PDF matches preview screen layout
- [ ] PDF is professionally formatted
- [ ] All data is accurate in PDF

### ✅ Test Different Scenarios

#### Scenario 1: Single Product Invoice
- [ ] Add one product
- [ ] Enter quantity and verify calculations
- [ ] Generate PDF and verify output

#### Scenario 2: Multiple Products with Same GST Rate
- [ ] Add 3-4 products with 18% GST
- [ ] Enter different quantities
- [ ] Verify total calculations

#### Scenario 3: Multiple Products with Different GST Rates
- [ ] Add products with 5%, 12%, 18%, and 28% GST
- [ ] Verify each line item calculates correctly
- [ ] Verify totals are summed correctly

#### Scenario 4: Decimal Quantities
- [ ] Enter quantities like 1.5, 2.25, 3.75
- [ ] Verify calculations handle decimals correctly

#### Scenario 5: Large Quantities
- [ ] Enter quantities like 100, 500, 1000
- [ ] Verify no overflow or display issues

#### Scenario 6: High-Value Invoices
- [ ] Create invoice with grand total > ₹50,000
- [ ] Verify amount in words is correct
- [ ] Check PDF formatting with large numbers

#### Scenario 7: Amount in Words Testing
Test these amounts:
- [ ] ₹100.00 → "One Hundred Rupees Only"
- [ ] ₹1,000.00 → "One Thousand Rupees Only"
- [ ] ₹1,50,000.00 → "One Lakh Fifty Thousand Rupees Only"
- [ ] ₹10,00,000.00 → "Ten Lakh Rupees Only"
- [ ] ₹1,00,00,000.00 → "One Crore Rupees Only"
- [ ] ₹100.50 → "One Hundred Rupees and Fifty Paise Only"

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot find products"
**Solution:** 
1. Go to Products screen
2. Add at least one product
3. Return to Create Invoice screen
4. Products should now appear in modal

### Issue 2: Calculations not updating
**Solution:**
- Make sure you're entering valid numbers (not letters)
- Clear the field and re-enter if stuck
- Check that billed quantity is entered (not just actual quantity)

### Issue 3: PDF generation fails
**Solution:**
1. Check if expo-print is installed: `npm list expo-print`
2. If missing: `npm install expo-print expo-sharing`
3. Clear cache: `npm start -- --reset-cache`

### Issue 4: Share sheet doesn't open
**Solution:**
- Ensure expo-sharing is installed
- Check app permissions for storage
- Try on physical device (may not work on some emulators)

### Issue 5: TypeScript errors
**Solution:**
```bash
npm install --save-dev @types/react @types/react-native
```

### Issue 6: Modal won't close
**Solution:**
- Tap outside the modal content area
- Or select a product (it auto-closes)
- Check that ✕ button is working

---

## 📱 Complete User Flow

### Flow 1: Create and Share Invoice

1. **Start:** Open app
2. Tap **"Create New Invoice"** button (green)
3. Enter outlet name (e.g., "ABC Stores")
4. Optionally enter outlet address
5. Tap **"+ Add"** button
6. Select product from modal (e.g., "Rice Bag")
7. Product appears in list
8. Enter **Actual Qty** (e.g., 10)
9. Enter **Billed Qty** (e.g., 9)
10. Unit price is auto-filled
11. Optionally edit unit price
12. See calculations appear below product
13. Tap **"+ Add"** again to add more products
14. Repeat steps 6-12 for each product
15. Check **Invoice Summary** at bottom
16. Verify all amounts are correct
17. Tap **"Generate Invoice"** button
18. **Preview Screen** appears
19. Review all invoice details
20. Tap **"Generate PDF & Share"**
21. Wait for loading spinner
22. Alert appears: "Invoice generated successfully!"
23. Tap **"Share"**
24. Choose WhatsApp, Email, or other app
25. Invoice PDF is shared

### Flow 2: Handle Validation Errors

1. Start Create Invoice
2. Don't enter outlet name
3. Tap "Generate Invoice"
4. Alert: "Please enter outlet name"
5. Enter outlet name
6. Tap "Generate Invoice" (no products added)
7. Alert: "Please add at least one product"
8. Add a product but don't enter billed quantity
9. Tap "Generate Invoice"
10. Alert: "Please enter quantity for all items"
11. Enter billed quantity
12. Now can proceed to preview

---

## 🎯 What to Verify in PDF

### Header Section
- [ ] Company name: "JANAKI ENTERPRISES"
- [ ] Address: "MP12/43, Greenilayam Shopping Complex"
- [ ] City: "Postitthol, Kottayam-834034"

### Invoice Details
- [ ] Invoice number (format: INV{timestamp})
- [ ] Date (format: MM/DD/YYYY or locale format)
- [ ] Outlet name matches input
- [ ] Outlet address matches input (if provided)

### Product Table
- [ ] All products listed in order
- [ ] Product names correct
- [ ] HSN codes displayed
- [ ] Quantities match input
- [ ] Unit prices match input
- [ ] CGST amounts correct
- [ ] SGST amounts correct
- [ ] Line totals correct

### Totals Section
- [ ] Subtotal is sum of taxable amounts
- [ ] Total CGST is sum of all CGST
- [ ] Total SGST is sum of all SGST
- [ ] Grand total is correct
- [ ] Amount in words is accurate

### Formatting
- [ ] Text is readable (not too small)
- [ ] Table borders are visible
- [ ] Numbers are aligned properly
- [ ] No overlapping text
- [ ] Professional appearance

---

## 💡 Pro Testing Tips

1. **Test with Real Data**
   - Use actual products you'll bill
   - Use real outlet names
   - Use realistic quantities and prices

2. **Test Edge Cases**
   - Very small amounts (₹1, ₹5)
   - Very large amounts (₹100,000+)
   - Decimal quantities (1.5, 2.25)
   - Single item invoices
   - Many items (10+ products)

3. **Verify Calculations Manually**
   - Use a calculator to double-check one invoice
   - Ensure CGST + SGST = Total GST
   - Ensure Grand Total = Subtotal + Total Tax

4. **Test on Multiple Devices**
   - Android phone
   - iOS device (if available)
   - Different screen sizes

5. **Share to Yourself First**
   - Send test invoice to your own WhatsApp
   - Check if PDF opens correctly
   - Verify all data is visible

6. **Keep Test Products Ready**
   - Add 5-10 test products with different GST rates
   - Use realistic prices
   - This makes testing faster

---

## 🚀 Ready for Production?

Before using this app for real invoices, verify:

- [ ] All calculations are accurate
- [ ] PDF formatting is professional
- [ ] Company details are correct
- [ ] GST rates match your products
- [ ] Amount in words is always correct
- [ ] Sharing works reliably
- [ ] App doesn't crash with any input
- [ ] Validation prevents errors

---

## 📋 Next Steps: Phase 5 Preview

Once Phase 4 is fully tested and working, Phase 5 will add:

1. **Invoice History**
   - Save invoices to storage
   - View past invoices
   - Search and filter
   - Regenerate PDFs

2. **Outlet Management**
   - Save outlet details
   - Quick select from list
   - Store GST numbers
   - Edit outlet information

3. **Company Settings**
   - Edit company details
   - Customize invoice template
   - Update bank details
   - Add company logo

4. **Enhanced Features**
   - Custom invoice numbering
   - Discount support
   - Terms & conditions
   - Payment status tracking

---

## 🎉 Congratulations!

You now have a fully functional GST invoice generator with:
- ✅ Product management
- ✅ Invoice creation
- ✅ Real-time calculations
- ✅ Professional PDF generation
- ✅ Easy sharing

**Happy Billing! 🚀**

