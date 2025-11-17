import { Product } from '../types/product';
import { Invoice, InvoiceItem } from '../types/invoice';
import { StorageService } from './StorageService';

export interface StockValidationResult {
  valid: boolean;
  message?: string;
  insufficientProducts?: Array<{
    productName: string;
    available: number;
    required: number;
  }>;
}

export class StockService {
  /**
   * Validates if there's enough stock for invoice items
   */
  static async validateStockForInvoice(items: InvoiceItem[]): Promise<StockValidationResult> {
    try {
      const products = await StorageService.getProducts();
      const insufficientProducts: Array<{
        productName: string;
        available: number;
        required: number;
      }> = [];

      for (const item of items) {
        const product = products.find(p => p.id === item.product.id);
        
        // Skip validation if product doesn't have stock tracking enabled
        if (!product || product.stock === undefined) {
          continue;
        }

        const available = product.stock;
        const required = item.billedQuantity;

        if (available < required) {
          insufficientProducts.push({
            productName: product.name,
            available,
            required,
          });
        }
      }

      if (insufficientProducts.length > 0) {
        const messages = insufficientProducts.map(
          p => `${p.productName}: Available ${p.available}, Required ${p.required}`
        );
        return {
          valid: false,
          message: `Insufficient stock:\n${messages.join('\n')}`,
          insufficientProducts,
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('StockService: Error validating stock:', error);
      return {
        valid: false,
        message: 'Error checking stock availability',
      };
    }
  }

  /**
   * Deducts stock when invoice is created
   */
  static async deductStockForInvoice(items: InvoiceItem[]): Promise<void> {
    try {
      const products = await StorageService.getProducts();
      let updated = false;

      for (const item of items) {
        const productIndex = products.findIndex(p => p.id === item.product.id);
        
        if (productIndex === -1) {
          console.warn(`StockService: Product ${item.product.id} not found`);
          continue;
        }

        const product = products[productIndex];
        
        // Skip if product doesn't have stock tracking enabled
        if (product.stock === undefined) {
          continue;
        }

        // Deduct stock
        const newStock = (product.stock || 0) - item.billedQuantity;
        products[productIndex] = {
          ...product,
          stock: Math.max(0, newStock), // Prevent negative stock
        };
        updated = true;
        
        console.log(
          `StockService: Deducted ${item.billedQuantity} from ${product.name}. ` +
          `Stock: ${product.stock} → ${products[productIndex].stock}`
        );
      }

      if (updated) {
        await StorageService.saveProducts(products);
        console.log('StockService: Stock updated successfully');
      }
    } catch (error) {
      console.error('StockService: Error deducting stock:', error);
      throw error;
    }
  }

  /**
   * Restores stock when invoice is deleted or cancelled
   */
  static async restoreStockForInvoice(items: InvoiceItem[]): Promise<void> {
    try {
      const products = await StorageService.getProducts();
      let updated = false;

      for (const item of items) {
        const productIndex = products.findIndex(p => p.id === item.product.id);
        
        if (productIndex === -1) {
          console.warn(`StockService: Product ${item.product.id} not found`);
          continue;
        }

        const product = products[productIndex];
        
        // Skip if product doesn't have stock tracking enabled
        if (product.stock === undefined) {
          continue;
        }

        // Restore stock
        const newStock = (product.stock || 0) + item.billedQuantity;
        products[productIndex] = {
          ...product,
          stock: newStock,
        };
        updated = true;
        
        console.log(
          `StockService: Restored ${item.billedQuantity} to ${product.name}. ` +
          `Stock: ${product.stock} → ${products[productIndex].stock}`
        );
      }

      if (updated) {
        await StorageService.saveProducts(products);
        console.log('StockService: Stock restored successfully');
      }
    } catch (error) {
      console.error('StockService: Error restoring stock:', error);
      throw error;
    }
  }

  /**
   * Updates stock for a product (manual adjustment)
   */
  static async updateProductStock(productId: string, newStock: number): Promise<void> {
    try {
      const products = await StorageService.getProducts();
      const productIndex = products.findIndex(p => p.id === productId);
      
      if (productIndex === -1) {
        throw new Error(`Product ${productId} not found`);
      }

      products[productIndex] = {
        ...products[productIndex],
        stock: Math.max(0, newStock), // Prevent negative stock
      };

      await StorageService.saveProducts(products);
      console.log(`StockService: Updated stock for product ${productId} to ${newStock}`);
    } catch (error) {
      console.error('StockService: Error updating stock:', error);
      throw error;
    }
  }

  /**
   * Gets current stock for a product
   */
  static async getProductStock(productId: string): Promise<number | undefined> {
    try {
      const products = await StorageService.getProducts();
      const product = products.find(p => p.id === productId);
      return product?.stock;
    } catch (error) {
      console.error('StockService: Error getting stock:', error);
      return undefined;
    }
  }

  /**
   * Checks if product is low on stock (less than threshold)
   */
  static isLowStock(stock: number | undefined, threshold: number = 10): boolean {
    if (stock === undefined) return false;
    return stock < threshold;
  }

  /**
   * Checks if product is out of stock
   */
  static isOutOfStock(stock: number | undefined): boolean {
    if (stock === undefined) return false;
    return stock <= 0;
  }
}

