import { InvoiceItem } from '../types/invoice';
import { Product } from '../types/product';

export const calculateLineItem = (
  product: Product,
  billedQuantity: number,
  unitPrice: number
): Omit<InvoiceItem, 'id' | 'product' | 'actualQuantity'> => {
  const taxableAmount = billedQuantity * unitPrice;
  const cgstAmount = (taxableAmount * product.gstRate) / 2 / 100;
  const sgstAmount = (taxableAmount * product.gstRate) / 2 / 100;
  const totalAmount = taxableAmount + cgstAmount + sgstAmount;

  return {
    billedQuantity,
    unitPrice,
    taxableAmount: parseFloat(taxableAmount.toFixed(2)),
    cgstAmount: parseFloat(cgstAmount.toFixed(2)),
    sgstAmount: parseFloat(sgstAmount.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
  };
};

export const calculateInvoiceTotals = (items: InvoiceItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.taxableAmount, 0);
  const totalCGST = items.reduce((sum, item) => sum + item.cgstAmount, 0);
  const totalSGST = items.reduce((sum, item) => sum + item.sgstAmount, 0);
  const totalTax = totalCGST + totalSGST;
  const grandTotal = subtotal + totalTax;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    totalCGST: parseFloat(totalCGST.toFixed(2)),
    totalSGST: parseFloat(totalSGST.toFixed(2)),
    totalTax: parseFloat(totalTax.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2)),
  };
};

