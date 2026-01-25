import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Invoice } from '../types/invoice';
import { Receipt } from '../types/receipt';
import { CompanySettings, DEFAULT_COMPANY_SETTINGS } from '../types/company';
import { numberToWords } from '../utils/numberToWords';
import { BackupService } from './BackupService';
import { LOGO_BASE64, QRCODE_BASE64, SEAL_BASE64 } from '../constants/assets';

export class PDFService {
  static async generateInvoicePDF(invoice: Invoice, companySettings: CompanySettings | null = null): Promise<string> {
    console.log('PDFService: Starting invoice PDF generation');
    console.log('PDFService: Invoice has', invoice.items.length, 'items');

    const company = companySettings || DEFAULT_COMPANY_SETTINGS;

    // Use pre-embedded base64 images (generated from assets at build time)
    const logoBase64 = LOGO_BASE64;
    const qrCodeBase64 = QRCODE_BASE64;
    const sealBase64 = SEAL_BASE64;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page {
              margin: 0;
              padding-top: 15px;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              padding-top: 15px;
              background-color: #FFFFFF;
              font-size: 12px;
            }
            .header { 
              display: grid;
              grid-template-columns: 140px 1fr 140px;
              align-items: flex-start;
              margin-bottom: 20px;
              border-bottom: 3px solid #333;
              padding-bottom: 15px;
              position: relative;
            }
            .header-left {
              display: flex;
              align-items: flex-start;
              justify-content: flex-start;
            }
            .logo {
              max-width: 120px;
              max-height: 120px;
              object-fit: contain;
            }
            .header-center {
              text-align: center;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .header-right {
              /* Empty space to balance the logo on the left */
            }
            .company-name { 
              font-size: 26px; 
              font-weight: bold;
              color: #1a1a1a;
              margin-bottom: 5px;
            }
            .company-details {
              font-size: 11px;
              color: #555;
              line-height: 1.6;
            }
            .gstin {
              font-weight: bold;
              color: #000;
              margin-top: 5px;
            }
            .invoice-header {
              display: flex;
              justify-content: space-between;
              margin: 15px 0;
              padding: 10px;
              background-color: #f0f0f0;
              border: 1px solid #333;
            }
            .invoice-title { 
              font-size: 22px; 
              font-weight: bold;
              color: #000;
            }
            .state-info {
              text-align: right;
              font-size: 12px;
            }
            .customer-details { 
              margin: 15px 0;
              padding: 12px;
              background-color: #fff;
              border: 1px solid #333;
              border-left: 5px solid #333;
            }
            .customer-label {
              font-weight: bold;
              font-size: 11px;
              color: #555;
            }
            .customer-name {
              font-size: 14px;
              font-weight: bold;
              margin: 3px 0;
            }
            .customer-details > div {
              margin: 1px 0;
              line-height: 1.2;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
              font-size: 11px;
            }
            th, td { 
              border: 1px solid #333; 
              padding: 8px 6px; 
              text-align: left;
            }
            th { 
              background-color: #e0e0e0;
              font-weight: bold;
              text-align: center;
              font-size: 10px;
            }
            td { text-align: center; }
            td.left { text-align: left; }
            td.right { text-align: right; }
            .totals-container {
              display: flex;
              align-items: flex-end;
              justify-content: space-between;
              gap: 20px;
              margin: 20px 0 0 0;
            }
            .amount-words {
              padding: 15px;
              background-color: #fff;
              border: 2px dashed #fbbf24;
              font-style: italic;
              flex: 1;
              margin: 0;
            }
            .totals-table {
              width: 350px;
              border: 2px solid #333;
              flex-shrink: 0;
              margin: 0;
            }
            .totals-table td {
              padding: 8px 12px;
            }
            .grand-total-row {
              background-color: #333;
              color: white;
              font-size: 16px;
              font-weight: bold;
            }
            .bank-and-signature-container {
              display: flex;
              align-items: flex-start;
              gap: 20px;
              margin: 20px 0 0 0;
              page-break-inside: avoid;
            }
            .bank-details {
              display: flex;
              align-items: flex-start;
              padding: 15px;
              background-color: #f9f9f9;
              border: 1px solid #333;
              flex: 1;
            }
            .bank-left {
              width: 140px;
              flex-shrink: 0;
              margin-right: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 10px;
            }
            .qrcode {
              max-width: 120px;
              max-height: 120px;
              width: 100%;
              height: auto;
              object-fit: contain;
              display: block;
              margin: 0 auto;
            }
            .bank-right {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              padding-top: 10px;
            }
            .bank-title {
              font-weight: bold;
              margin-bottom: 10px;
              font-size: 13px;
            }
            .bank-row {
              margin: 5px 0;
              font-size: 12px;
            }
            .signature-section {
              width: 350px;
              flex-shrink: 0;
              text-align: right;
              margin-top: 60px;
              padding-top: 10px;
              position: relative;
              page-break-inside: avoid;
            }
            .for-company {
              font-weight: bold;
              margin-bottom: 20px;
              position: relative;
              text-align: right;
              z-index: 0;
            }
            .seal-container {
              position: absolute;
              right: 110px;
              top: -35px;
              z-index: 2;
              pointer-events: none;
            }
            .seal {
              width: 143px;
              height: 143px;
              object-fit: contain;
              opacity: 0.9;
            }
            .signature-line {
              border-top: 2px solid #000;
              width: 200px;
              margin: 70px 0 5px auto;
            }
            .authorised-signatory {
              margin-top: 5px;
            }
            .discount-row { color: #dc2626; }
            .roundoff-positive { color: #16a34a; }
            .roundoff-negative { color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-left">
              ${logoBase64 ? `<img src="${logoBase64}" alt="Company Logo" class="logo" />` : ''}
            </div>
            <div class="header-center">
              <div class="company-name">${company.name}</div>
              <div class="company-details">
                ${company.address1}<br/>
                ${company.address2}, ${company.city}-${company.pincode}<br/>
                Mobile: ${company.mobile1}${company.mobile2 ? ', ' + company.mobile2 : ''}
                ${company.officePhone ? ' | Office: ' + company.officePhone : ''}<br/>
                Email: ${company.email}<br/>
                <span class="gstin">GSTIN/UIN: ${company.gstin}</span>
              </div>
            </div>
            <div class="header-right"></div>
          </div>

          <div class="invoice-header">
            <div>
              <div class="invoice-title">TAX INVOICE</div>
              <div><strong>${invoice.fullInvoiceNumber}</strong></div>
              <div>Date: ${invoice.date}</div>
            </div>
            <div class="state-info">
              <div><strong>State:</strong> ${invoice.state}</div>
              <div><strong>Code:</strong> ${invoice.stateCode}</div>
            </div>
          </div>

          <div class="customer-details">
            <div class="customer-label">Bill To:</div>
            <div class="customer-name">${invoice.outletName}</div>
            ${invoice.outletAddress ? invoice.outletAddress.split('\n').map(line => line.trim()).filter(line => line).map(line => `<div>${line}</div>`).join('') : ''}
            ${invoice.customerGSTNo ? `<div><strong>GST NO:</strong> ${invoice.customerGSTNo}</div>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 28%;">Description of Goods</th>
                <th style="width: 8%;">HSN</th>
                <th style="width: 7%;">ROT%</th>
                <th style="width: 9%;">Actual</th>
                <th style="width: 9%;">Billed</th>
                <th style="width: 10%;">Rate</th>
                <th style="width: 10%;">CGST</th>
                <th style="width: 10%;">SGST</th>
                <th style="width: 10%;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td class="left">${item.product.name}</td>
                  <td>${item.product.hsnCode}</td>
                  <td><strong>${item.rotPercent}%</strong></td>
                  <td>${item.actualQuantity}</td>
                  <td><strong>${item.billedQuantity}</strong></td>
                  <td class="right">₹${item.unitPrice.toFixed(2)}</td>
                  <td class="right">₹${item.cgstAmount.toFixed(2)}</td>
                  <td class="right">₹${item.sgstAmount.toFixed(2)}</td>
                  <td class="right"><strong>₹${item.totalAmount.toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals-container">
            <div class="amount-words">
              <strong>Total Invoice Amount in Words:</strong><br/>
              ${numberToWords(invoice.grandTotal)}
            </div>

            <table class="totals-table">
              <tr>
                <td class="left">Subtotal (Taxable Amount):</td>
                <td class="right"><strong>₹${invoice.subtotal.toFixed(2)}</strong></td>
              </tr>
              ${invoice.discountType !== 'none' && invoice.discountAmount > 0 ? `
              <tr class="discount-row">
                <td class="left">Discount (${invoice.discountType === 'flat' ? '₹' + invoice.discountValue : invoice.discountValue + '%'}):</td>
                <td class="right"><strong>-₹${invoice.discountAmount.toFixed(2)}</strong></td>
              </tr>
              <tr>
                <td class="left">After Discount:</td>
                <td class="right"><strong>₹${invoice.subtotalAfterDiscount.toFixed(2)}</strong></td>
              </tr>
              ` : ''}
              <tr>
                <td class="left">Total CGST:</td>
                <td class="right"><strong>₹${invoice.totalCGST.toFixed(2)}</strong></td>
              </tr>
              <tr>
                <td class="left">Total SGST:</td>
                <td class="right"><strong>₹${invoice.totalSGST.toFixed(2)}</strong></td>
              </tr>
              ${invoice.roundOff !== 0 ? `
              <tr class="${invoice.roundOff > 0 ? 'roundoff-positive' : 'roundoff-negative'}">
                <td class="left">Round Off:</td>
                <td class="right"><strong>${invoice.roundOff > 0 ? '+' : ''}₹${invoice.roundOff.toFixed(2)}</strong></td>
              </tr>
              ` : ''}
              <tr class="grand-total-row">
                <td class="left">GRAND TOTAL:</td>
                <td class="right">₹${invoice.grandTotal.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="bank-and-signature-container">
            <div class="bank-details">
              <div class="bank-left">
                ${qrCodeBase64 ? `<img src="${qrCodeBase64}" alt="QR Code" class="qrcode" />` : ''}
              </div>
              <div class="bank-right">
                <div class="bank-title">Company's Bank Details:</div>
                <div class="bank-row"><strong>A/c Holder's Name:</strong> ${company.bankDetails.accountHolder}</div>
                <div class="bank-row"><strong>Bank Name:</strong> ${company.bankDetails.bankName}</div>
                <div class="bank-row"><strong>A/c No.:</strong> ${company.bankDetails.accountNumber}</div>
                <div class="bank-row"><strong>Branch & IFSC Code:</strong> ${company.bankDetails.branch} & ${company.bankDetails.ifscCode}</div>
              </div>
            </div>
            <div class="signature-section">
              <div class="for-company">
                For ${company.name}
                ${sealBase64 ? `<div class="seal-container"><img src="${sealBase64}" alt="Seal" class="seal" /></div>` : ''}
              </div>
              <div class="signature-line"></div>
              <div class="authorised-signatory">Authorised Signatory</div>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      console.log('PDFService: Calling expo-print...');
      console.log('PDFService: HTML length:', htmlContent.length);

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
      });

      console.log('PDFService: PDF created successfully at:', uri);

      // Save PDF to permanent storage
      const savedPath = await PDFService.savePDF(uri, invoice.fullInvoiceNumber);
      console.log('PDFService: PDF saved to permanent location:', savedPath);

      return savedPath;
    } catch (error) {
      console.error('PDFService: PDF Generation Error:', error);
      if (error instanceof Error) {
        console.error('PDFService: Error message:', error.message);
        console.error('PDFService: Error stack:', error.stack);
      }
      throw error;
    }
  }

  /**
   * Saves PDF to permanent storage in the app's document directory
   * @param tempUri Temporary URI from expo-print
   * @param invoiceNumber Invoice number for filename
   * @returns Path to saved PDF file
   */
  static async savePDF(tempUri: string, invoiceNumber: string): Promise<string> {
    try {
      // Create invoices directory if it doesn't exist
      const invoicesDir = `${FileSystem.documentDirectory}invoices/`;
      const dirInfo = await FileSystem.getInfoAsync(invoicesDir);

      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(invoicesDir, { intermediates: true });
        console.log('PDFService: Created invoices directory');
      }

      // Generate filename: InvoiceNumber_YYYY-MM-DD.pdf
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const fileName = `${invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${date}.pdf`;
      const savedPath = `${invoicesDir}${fileName}`;

      // Copy from temp location to permanent location
      await FileSystem.copyAsync({
        from: tempUri,
        to: savedPath,
      });

      console.log('PDFService: PDF saved successfully to:', savedPath);

      // Update backup metadata after saving PDF
      try {
        await BackupService.updateBackupMetadata();
      } catch (error) {
        console.log('Failed to update backup metadata:', error);
        // Don't fail PDF generation if backup metadata update fails
      }

      return savedPath;
    } catch (error) {
      console.error('PDFService: Error saving PDF:', error);
      // Return original temp URI if save fails
      return tempUri;
    }
  }

  /**
   * Gets list of all saved invoices
   * @returns Array of file info objects
   */
  static async getSavedInvoices(): Promise<FileSystem.FileInfo[]> {
    try {
      const invoicesDir = `${FileSystem.documentDirectory}invoices/`;
      const dirInfo = await FileSystem.getInfoAsync(invoicesDir);

      if (!dirInfo.exists) {
        return [];
      }

      const files = await FileSystem.readDirectoryAsync(invoicesDir);
      const fileInfos = await Promise.all(
        files.map(async (file) => {
          const filePath = `${invoicesDir}${file}`;
          const info = await FileSystem.getInfoAsync(filePath);
          return info;
        })
      );

      // Filter out directories and return only files, sorted by modification time (newest first)
      return fileInfos
        .filter((info): info is FileSystem.FileInfo & { exists: true; modificationTime?: number } =>
          info.exists && !info.isDirectory
        )
        .sort((a, b) => {
          const aTime = a.modificationTime || 0;
          const bTime = b.modificationTime || 0;
          return bTime - aTime; // Newest first
        });
    } catch (error) {
      console.error('PDFService: Error getting saved invoices:', error);
      return [];
    }
  }

  /**
   * Deletes a saved invoice PDF
   * @param filePath Path to the PDF file
   */
  static async deletePDF(filePath: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath, { idempotent: true });
        console.log('PDFService: PDF deleted:', filePath);
      }
    } catch (error) {
      console.error('PDFService: Error deleting PDF:', error);
      throw error;
    }
  }

  static async sharePDF(filePath: string): Promise<void> {
    try {
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        throw new Error('Sharing is not available on this device');
      }

      // Share the PDF
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Invoice',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      console.error('Share Error:', error);
      throw error;
    }
  }

  /**
   * Generate Receipt Voucher PDF
   */
  static async generateReceiptPDF(receipt: Receipt, companySettings: CompanySettings | null = null): Promise<string> {
    console.log('PDFService: Starting receipt PDF generation');

    const company = companySettings || DEFAULT_COMPANY_SETTINGS;
    const sealBase64 = SEAL_BASE64;

    // Format date for display (DD/MM/YYYY)
    const dateParts = receipt.date.split('/');
    const day = dateParts[0] || '';
    const month = dateParts[1] || '';
    const year = dateParts[2] || '';

    // Payment mode display
    const getCashDisplay = () => receipt.paymentMode === 'CASH' ? 'CASH' : '';
    const getBankDisplay = () => receipt.paymentMode === 'BANK' ? `BANK - ${receipt.bankName || ''}` : '';
    const getChequeDisplay = () => receipt.paymentMode === 'CHEQUE' ? `CHEQUE - ${receipt.chequeNumber || ''}` : '';
    const paymentModeText = getCashDisplay() || getBankDisplay() || getChequeDisplay();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page {
              margin: 20px;
              size: A4;
            }
            body { 
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #333;
              padding: 20px 40px;
              position: relative;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
              text-transform: uppercase;
            }
            .company-details {
              font-size: 10px;
              color: #666;
              margin-bottom: 5px;
            }
            .title {
              font-size: 16px;
              font-weight: bold;
              text-transform: uppercase;
              margin-top: 10px;
              letter-spacing: 1px;
            }
            .divider {
              border-bottom: 2px solid #000;
              margin-bottom: 10px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
              font-size: 12px;
              font-weight: bold;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 0;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
              font-size: 12px;
              vertical-align: top;
            }
            .col-label {
              width: 150px;
              font-weight: bold;
              background-color: #f9f9f9;
              text-transform: uppercase;
            }
            .payee-name {
              font-size: 16px;
              font-weight: 900;
              text-transform: uppercase;
            }
            .amount-wrapper {
              display: flex;
              align-items: center;
              gap: 5px;
            }
            .amount-value {
              font-size: 20px;
              font-weight: 900;
              letter-spacing: 0.5px;
            }
            .rupee-symbol {
              font-family: DejaVu Sans, sans-serif;
              font-weight: bold;
              font-size: 18px;
              margin-right: 2px;
            }
            .footer-cell {
              height: 60px;
              vertical-align: middle;
            }
            .signature-cell {
              height: 60px;
              vertical-align: bottom;
              position: relative;
            }
            .seal {
              position: absolute; 
              bottom: -20px; 
              right: 10px; 
              width: 90px; 
              height: 90px; 
              transform: rotate(-10deg); 
              mix-blend-mode: multiply;
              opacity: 0.8;
              z-index: 10;
              pointer-events: none;
            }
            .date-boxes {
              display: inline-flex;
              gap: 2px;
            }
            .date-box {
              border: 1px solid #000;
              width: 20px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${company.name}</div>
            <div class="company-details">
              ${company.city}, Ph. ${company.mobile1}${company.officePhone ? ', ' + company.officePhone : ''}
            </div>
            <div class="title">RECEIPT VOUCHER</div>
          </div>

          <div class="divider"></div>

          <div class="info-row">
            <div>No. ${receipt.fullReceiptNumber}</div>
            <div class="date-boxes">
              ${day.split('').map(d => `<div class="date-box">${d}</div>`).join('')}
              <div class="date-box">/</div>
              ${month.split('').map(d => `<div class="date-box">${d}</div>`).join('')}
              <div class="date-box">/</div>
              ${year.split('').map(d => `<div class="date-box">${d}</div>`).join('')}
            </div>
          </div>

          <!-- Main Details Table -->
          <table>
            <tr>
              <td class="col-label">Mode of Payment</td>
              <td>${receipt.paymentMode}</td>
            </tr>
            <tr>
              <td class="col-label">Cash / Bank / Cheque</td>
              <td>${paymentModeText}</td>
            </tr>
            ${receipt.paymentMode === 'CHEQUE' ? `
            <tr>
              <td class="col-label">Cheque Date</td>
              <td>${receipt.chequeDate || '-'}</td>
            </tr>
            ` : ''}
            <tr>
              <td class="col-label">Amount in Words</td>
              <td style="text-transform: capitalize;">${receipt.amountInWords}</td>
            </tr>
          </table>

          <!-- Amount/Payee Table (Merged Look) -->
          <table style="margin-top: -1px; border-top: none;">
            <tr>
              <td class="footer-cell" style="width: 60%; border-top: none; border-right: 1px solid #000;">
                <div style="font-size: 10px; font-weight: bold; margin-bottom: 5px;">PAYEE:</div>
                <div class="payee-name">${receipt.payeeName}</div>
                ${receipt.payeeAddress ? `<div style="font-size: 11px; color: #444; margin-top: 2px;">${receipt.payeeAddress.split('\n').map(line => line.trim()).filter(line => line).join(', ')}</div>` : ''}
              </td>
              <td class="footer-cell" style="width: 40%; border-top: none; vertical-align: middle;">
                <div style="font-size: 10px; font-weight: bold;">AMOUNT:</div>
                <div class="amount-wrapper">
                  <span class="rupee-symbol">₹</span> <span class="amount-value">${receipt.amount.toFixed(2)}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td class="footer-cell" style="border-right: 1px solid #000;">
                <div style="font-size: 10px; font-weight: bold; margin-bottom: 5px;">BALANCE AMOUNT</div>
                <div class="amount-wrapper">
                  <span class="rupee-symbol">₹</span> <span class="amount-value">${receipt.balanceAmount.toFixed(2)}</span>
                </div>
              </td>
              <td class="signature-cell">
                <div style="font-size: 10px; font-weight: bold; margin-bottom: 15px;">SIGNATURE:</div>
                ${sealBase64 ? `<img src="${sealBase64}" alt="Seal" class="seal" />` : ''}
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    try {
      console.log('PDFService: Calling expo-print for receipt...');

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
      });

      console.log('PDFService: Receipt PDF created successfully at:', uri);

      // Save PDF to permanent storage
      const savedPath = await PDFService.saveReceiptPDF(uri, receipt.fullReceiptNumber);
      console.log('PDFService: Receipt PDF saved to permanent location:', savedPath);

      return savedPath;
    } catch (error) {
      console.error('PDFService: Receipt PDF Generation Error:', error);
      throw error;
    }
  }

  /**
   * Saves Receipt PDF to permanent storage in the app's document directory
   */
  static async saveReceiptPDF(tempUri: string, receiptNumber: string): Promise<string> {
    try {
      // Create receipts directory if it doesn't exist
      const receiptsDir = `${FileSystem.documentDirectory}receipts/`;
      const dirInfo = await FileSystem.getInfoAsync(receiptsDir);

      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(receiptsDir, { intermediates: true });
        console.log('PDFService: Created receipts directory');
      }

      // Generate filename: ReceiptNumber_YYYY-MM-DD.pdf
      const date = new Date().toISOString().split('T')[0];
      const fileName = `${receiptNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${date}.pdf`;
      const savedPath = `${receiptsDir}${fileName}`;

      // Copy from temp location to permanent location
      await FileSystem.copyAsync({
        from: tempUri,
        to: savedPath,
      });

      console.log('PDFService: Receipt PDF saved successfully to:', savedPath);

      return savedPath;
    } catch (error) {
      console.error('PDFService: Error saving receipt PDF:', error);
      return tempUri;
    }
  }
  /**
   * Gets list of saved receipt PDFs
   */
  static async getSavedReceipts(): Promise<{ uri: string; name: string; modificationTime?: number; size?: number }[]> {
    try {
      const receiptsDir = `${FileSystem.documentDirectory}receipts/`;
      const dirInfo = await FileSystem.getInfoAsync(receiptsDir);

      if (!dirInfo.exists) {
        return [];
      }

      const files = await FileSystem.readDirectoryAsync(receiptsDir);

      const fileInfos: { uri: string; name: string; modificationTime?: number; size?: number }[] = [];

      for (const file of files) {
        if (file.endsWith('.pdf')) {
          const uri = receiptsDir + file;
          const info = await FileSystem.getInfoAsync(uri);
          if (info.exists) {
            fileInfos.push({
              uri,
              name: file,
              modificationTime: info.modificationTime,
              size: info.size,
            });
          }
        }
      }

      return fileInfos
        .sort((a, b) => {
          const aTime = a.modificationTime || 0;
          const bTime = b.modificationTime || 0;
          return bTime - aTime; // Newest first
        });
    } catch (error) {
      console.error('PDFService: Error getting saved receipts:', error);
      return [];
    }
  }
}

