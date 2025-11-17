export interface Product {
  id: string;
  name: string;
  hsnCode: string;
  basePrice: number;
  gstRate: number;
  unit: string;
  stock?: number; // Optional for backward compatibility - stock quantity available
}

