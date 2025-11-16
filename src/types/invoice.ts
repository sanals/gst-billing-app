import { Product } from './product';

export interface InvoiceItem {
  id: string;
  product: Product;
  actualQuantity: number;
  billedQuantity: number;
  unitPrice: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
  rotPercent: number; // Rate of Tax (GST percentage) for display
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // Just the number part (101, 102, etc.)
  invoicePrefix: string; // Prefix like "KTMVS"
  fullInvoiceNumber: string; // Complete: "KTMVS-101"
  date: string;
  
  // Customer/Outlet Details
  outletName: string;
  outletAddress: string;
  customerGSTNo?: string; // Optional for B2C, required for B2B
  
  // State Information
  state: string; // e.g., "Kerala"
  stateCode: string; // e.g., "22"
  
  // Line Items
  items: InvoiceItem[];
  
  // Calculations
  subtotal: number; // Sum of all taxable amounts (before discount)
  
  // Discount
  discountType: 'none' | 'flat' | 'percent';
  discountValue: number; // Amount or percentage
  discountAmount: number; // Calculated discount amount
  subtotalAfterDiscount: number; // Subtotal - discount
  
  // Taxes
  totalCGST: number;
  totalSGST: number;
  totalTax: number; // CGST + SGST
  
  // Final Total
  totalBeforeRoundOff: number; // Subtotal after discount + taxes
  roundOff: number; // Can be positive or negative
  grandTotal: number; // Final amount
}

