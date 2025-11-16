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
    rotPercent: product.gstRate, // Rate of Tax for display
  };
};

export interface InvoiceTotalsParams {
  items: InvoiceItem[];
  discountType?: 'none' | 'flat' | 'percent';
  discountValue?: number;
  enableRoundOff?: boolean;
}

export const calculateInvoiceTotals = ({
  items,
  discountType = 'none',
  discountValue = 0,
  enableRoundOff = true,
}: InvoiceTotalsParams) => {
  // Step 1: Calculate subtotal (before discount)
  const subtotal = items.reduce((sum, item) => sum + item.taxableAmount, 0);

  // Step 2: Calculate discount amount
  let discountAmount = 0;
  if (discountType === 'flat') {
    discountAmount = discountValue;
  } else if (discountType === 'percent') {
    discountAmount = (subtotal * discountValue) / 100;
  }

  // Ensure discount doesn't exceed subtotal
  discountAmount = Math.min(discountAmount, subtotal);

  // Step 3: Calculate subtotal after discount
  const subtotalAfterDiscount = subtotal - discountAmount;

  // Step 4: Calculate taxes on discounted amount
  // We need to recalculate taxes proportionally
  const discountRatio = subtotal > 0 ? subtotalAfterDiscount / subtotal : 1;
  
  let totalCGST = 0;
  let totalSGST = 0;

  items.forEach((item) => {
    // Calculate discounted taxable amount for this item
    const discountedTaxableAmount = item.taxableAmount * discountRatio;
    
    // Calculate CGST and SGST on discounted amount
    const itemCGST = (discountedTaxableAmount * item.product.gstRate) / 2 / 100;
    const itemSGST = (discountedTaxableAmount * item.product.gstRate) / 2 / 100;
    
    totalCGST += itemCGST;
    totalSGST += itemSGST;
  });

  const totalTax = totalCGST + totalSGST;

  // Step 5: Calculate total before round off
  const totalBeforeRoundOff = subtotalAfterDiscount + totalTax;

  // Step 6: Calculate round off
  let roundOff = 0;
  if (enableRoundOff) {
    const rounded = Math.round(totalBeforeRoundOff);
    roundOff = rounded - totalBeforeRoundOff;
  }

  // Step 7: Calculate grand total
  const grandTotal = totalBeforeRoundOff + roundOff;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    subtotalAfterDiscount: parseFloat(subtotalAfterDiscount.toFixed(2)),
    totalCGST: parseFloat(totalCGST.toFixed(2)),
    totalSGST: parseFloat(totalSGST.toFixed(2)),
    totalTax: parseFloat(totalTax.toFixed(2)),
    totalBeforeRoundOff: parseFloat(totalBeforeRoundOff.toFixed(2)),
    roundOff: parseFloat(roundOff.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2)),
  };
};

// Helper function to format discount display
export const formatDiscount = (type: 'none' | 'flat' | 'percent', value: number): string => {
  if (type === 'none' || value === 0) return '-';
  if (type === 'flat') return `₹${value.toFixed(2)}`;
  if (type === 'percent') return `${value}%`;
  return '-';
};

// Helper function to validate discount
export const validateDiscount = (
  type: 'none' | 'flat' | 'percent',
  value: number,
  subtotal: number
): { valid: boolean; message?: string } => {
  if (type === 'none') return { valid: true };
  
  if (value < 0) {
    return { valid: false, message: 'Discount cannot be negative' };
  }
  
  if (type === 'flat' && value > subtotal) {
    return { valid: false, message: 'Discount cannot exceed subtotal' };
  }
  
  if (type === 'percent' && value > 100) {
    return { valid: false, message: 'Discount percentage cannot exceed 100%' };
  }
  
  return { valid: true };
};

