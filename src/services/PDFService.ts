import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Invoice } from '../types/invoice';
import { CompanySettings } from '../types/company';
import { numberToWords } from '../utils/numberToWords';
import { DEFAULT_COMPANY_SETTINGS } from '../types/company';

export class PDFService {
  static async generateInvoicePDF(invoice: Invoice, companySettings: CompanySettings | null = null): Promise<string> {
    console.log('PDFService: Starting invoice PDF generation');
    console.log('PDFService: Invoice has', invoice.items.length, 'items');
    
    const company = companySettings || DEFAULT_COMPANY_SETTINGS;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              background-color: #FFF9E6;
              font-size: 12px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px;
              border-bottom: 3px solid #333;
              padding-bottom: 15px;
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
            .totals-table {
              margin-left: auto;
              width: 350px;
              border: 2px solid #333;
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
            .amount-words {
              margin: 20px 0;
              padding: 15px;
              background-color: #fff;
              border: 2px dashed #fbbf24;
              font-style: italic;
            }
            .bank-details {
              margin: 20px 0;
              padding: 15px;
              background-color: #f9f9f9;
              border: 1px solid #333;
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
              text-align: right;
              margin-top: 40px;
            }
            .for-company {
              font-weight: bold;
              margin-bottom: 50px;
            }
            .signature-line {
              border-top: 2px solid #000;
              width: 200px;
              margin: 0 0 5px auto;
            }
            .discount-row { color: #dc2626; }
            .roundoff-positive { color: #16a34a; }
            .roundoff-negative { color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="header">
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
            ${invoice.outletAddress ? `<div>${invoice.outletAddress}</div>` : ''}
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

          <div class="amount-words">
            <strong>Total Invoice Amount in Words:</strong><br/>
            ${numberToWords(invoice.grandTotal)}
          </div>

          <div class="bank-details">
            <div class="bank-title">Company's Bank Details:</div>
            <div class="bank-row"><strong>A/c Holder's Name:</strong> ${company.bankDetails.accountHolder}</div>
            <div class="bank-row"><strong>Bank Name:</strong> ${company.bankDetails.bankName}</div>
            <div class="bank-row"><strong>A/c No.:</strong> ${company.bankDetails.accountNumber}</div>
            <div class="bank-row"><strong>Branch & IFSC Code:</strong> ${company.bankDetails.branch} & ${company.bankDetails.ifscCode}</div>
          </div>

          <div class="signature-section">
            <div class="for-company">For ${company.name}</div>
            <div class="signature-line"></div>
            <div>Authorised Signatory</div>
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
        .filter((info) => info.exists && !info.isDirectory)
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
}

