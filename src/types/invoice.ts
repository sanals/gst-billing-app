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
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  outletName: string;
  outletAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  totalCGST: number;
  totalSGST: number;
  totalTax: number;
  grandTotal: number;
}

