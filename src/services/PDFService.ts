import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Invoice } from '../types/invoice';
import { numberToWords } from '../utils/numberToWords';

export class PDFService {
  static async generateInvoicePDF(invoice: Invoice): Promise<string> {
    console.log('PDFService: Starting invoice PDF generation');
    console.log('PDFService: Invoice has', invoice.items.length, 'items');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              margin: 0;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
              border-bottom: 2px solid #007AFF;
              padding-bottom: 20px;
            }
            .company-name { 
              font-size: 24px; 
              font-weight: bold;
              color: #007AFF;
            }
            .invoice-title { 
              font-size: 20px; 
              margin: 20px 0;
              font-weight: bold;
            }
            .details { 
              margin: 20px 0;
              background-color: #f5f5f5;
              padding: 15px;
              border-radius: 8px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 12px 8px; 
              text-align: left;
              font-size: 14px;
            }
            th { 
              background-color: #007AFF;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .total { 
              text-align: right; 
              font-weight: bold; 
              font-size: 16px;
              margin-top: 20px;
              padding: 15px;
              background-color: #f5f5f5;
              border-radius: 8px;
            }
            .total div {
              margin: 8px 0;
            }
            .grand-total {
              font-size: 20px;
              color: #007AFF;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 2px solid #007AFF;
            }
            .amount-words {
              margin: 20px 0;
              padding: 15px;
              background-color: #f8f8f8;
              border-left: 4px solid #007AFF;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">JANAKI ENTERPRISES</div>
            <div>MP12/43, Greenilayam Shopping Complex</div>
            <div>Postitthol, Kottayam-834034</div>
          </div>
          <div class="invoice-title">
            TAX INVOICE - ${invoice.invoiceNumber}
            <br/>Date: ${invoice.date}
          </div>
          <div class="details">
            <strong>Bill To:</strong><br/>
            ${invoice.outletName}<br/>
            ${invoice.outletAddress || 'N/A'}
          </div>
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Description</th>
                <th>HSN</th>
                <th>Qty</th>
                <th>Rate (₹)</th>
                <th>CGST (₹)</th>
                <th>SGST (₹)</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.product.name}</td>
                  <td>${item.product.hsnCode}</td>
                  <td>${item.billedQuantity}</td>
                  <td>${item.unitPrice.toFixed(2)}</td>
                  <td>${item.cgstAmount.toFixed(2)}</td>
                  <td>${item.sgstAmount.toFixed(2)}</td>
                  <td>${item.totalAmount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            <div>Subtotal: ₹${invoice.subtotal.toFixed(2)}</div>
            <div>Total CGST: ₹${invoice.totalCGST.toFixed(2)}</div>
            <div>Total SGST: ₹${invoice.totalSGST.toFixed(2)}</div>
            <div class="grand-total">Grand Total: ₹${invoice.grandTotal.toFixed(2)}</div>
          </div>
          <div class="amount-words">
            <strong>Amount in Words:</strong> ${numberToWords(invoice.grandTotal)}
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
      return uri;
    } catch (error) {
      console.error('PDFService: PDF Generation Error:', error);
      if (error instanceof Error) {
        console.error('PDFService: Error message:', error.message);
        console.error('PDFService: Error stack:', error.stack);
      }
      throw error;
    }
  }

  static async generateSampleInvoice(): Promise<string> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              margin: 0;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
              border-bottom: 2px solid #007AFF;
              padding-bottom: 20px;
            }
            .company-name { 
              font-size: 24px; 
              font-weight: bold;
              color: #007AFF;
            }
            .invoice-title { 
              font-size: 20px; 
              margin: 20px 0;
              font-weight: bold;
            }
            .details { 
              margin: 20px 0;
              background-color: #f5f5f5;
              padding: 15px;
              border-radius: 8px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 12px 8px; 
              text-align: left;
              font-size: 14px;
            }
            th { 
              background-color: #007AFF;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .total { 
              text-align: right; 
              font-weight: bold; 
              font-size: 16px;
              margin-top: 20px;
              padding: 15px;
              background-color: #f5f5f5;
              border-radius: 8px;
            }
            .total div {
              margin: 8px 0;
            }
            .grand-total {
              font-size: 20px;
              color: #007AFF;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 2px solid #007AFF;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">JANAKI ENTERPRISES</div>
            <div>Sample Address, Kerala - 834034</div>
            <div>GSTIN: 22AAUPJ7SS1B12M</div>
          </div>
          <div class="invoice-title">
            TAX INVOICE - 101
            <br/>Date: ${new Date().toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            })}
          </div>
          <div class="details">
            <strong>Bill To:</strong><br/>
            Sample Outlet<br/>
            Sample Address<br/>
            Contact: +91 98765 43210
          </div>
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Description</th>
                <th>HSN</th>
                <th>Qty</th>
                <th>Rate (₹)</th>
                <th>CGST (₹)</th>
                <th>SGST (₹)</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Sample Product 1</td>
                <td>2516714</td>
                <td>2</td>
                <td>200.00</td>
                <td>18.00</td>
                <td>18.00</td>
                <td>436.00</td>
              </tr>
              <tr>
                <td>2</td>
                <td>Sample Product 2</td>
                <td>5211</td>
                <td>5</td>
                <td>100.00</td>
                <td>22.50</td>
                <td>22.50</td>
                <td>545.00</td>
              </tr>
            </tbody>
          </table>
          <div class="total">
            <div>Subtotal: ₹900.00</div>
            <div>Total CGST: ₹40.50</div>
            <div>Total SGST: ₹40.50</div>
            <div class="grand-total">Grand Total: ₹981.00</div>
          </div>
        </body>
      </html>
    `;

    try {
      // Generate PDF using expo-print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
      });
      
      return uri;
    } catch (error) {
      console.error('PDF Generation Error:', error);
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

