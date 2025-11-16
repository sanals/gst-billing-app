import AsyncStorage from '@react-native-async-storage/async-storage';
import { Outlet } from '../types/outlet';

const OUTLETS_KEY = '@outlets';

export class OutletService {
  static async getOutlets(): Promise<Outlet[]> {
    try {
      const data = await AsyncStorage.getItem(OUTLETS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Get Outlets Error:', error);
      return [];
    }
  }

  static async saveOutlets(outlets: Outlet[]): Promise<void> {
    try {
      await AsyncStorage.setItem(OUTLETS_KEY, JSON.stringify(outlets));
    } catch (error) {
      console.error('Save Outlets Error:', error);
      throw error;
    }
  }

  static async addOutlet(outlet: Omit<Outlet, 'id' | 'createdAt' | 'updatedAt'>): Promise<Outlet> {
    const outlets = await this.getOutlets();
    const newOutlet: Outlet = {
      ...outlet,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    outlets.push(newOutlet);
    await this.saveOutlets(outlets);
    return newOutlet;
  }

  static async updateOutlet(id: string, outlet: Partial<Outlet>): Promise<void> {
    const outlets = await this.getOutlets();
    const index = outlets.findIndex(o => o.id === id);
    if (index === -1) {
      throw new Error('Outlet not found');
    }
    outlets[index] = {
      ...outlets[index],
      ...outlet,
      updatedAt: new Date().toISOString(),
    };
    await this.saveOutlets(outlets);
  }

  static async deleteOutlet(id: string): Promise<void> {
    const outlets = await this.getOutlets();
    const filtered = outlets.filter(o => o.id !== id);
    await this.saveOutlets(filtered);
  }

  static async getOutletById(id: string): Promise<Outlet | null> {
    const outlets = await this.getOutlets();
    return outlets.find(o => o.id === id) || null;
  }
}

