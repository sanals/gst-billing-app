import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types/product';

const PRODUCTS_KEY = '@products';

export class StorageService {
  static async saveProducts(products: Product[]): Promise<void> {
    try {
      await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    } catch (error) {
      console.error('Save Products Error:', error);
      throw error;
    }
  }

  static async getProducts(): Promise<Product[]> {
    try {
      const data = await AsyncStorage.getItem(PRODUCTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Get Products Error:', error);
      return [];
    }
  }

  static async addProduct(product: Product): Promise<void> {
    const products = await this.getProducts();
    products.push(product);
    await this.saveProducts(products);
  }

  static async deleteProduct(productId: string): Promise<void> {
    const products = await this.getProducts();
    const filtered = products.filter(p => p.id !== productId);
    await this.saveProducts(filtered);
  }
}

