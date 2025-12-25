import AsyncStorage from '@react-native-async-storage/async-storage';
import { Receipt } from '../types/receipt';

const RECEIPTS_STORAGE_KEY = '@receipts';

export class ReceiptStorageService {
    /**
     * Save a new receipt
     */
    static async saveReceipt(receipt: Receipt): Promise<void> {
        try {
            const receipts = await this.getAllReceipts();
            receipts.push(receipt);
            await AsyncStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(receipts));
            console.log('Receipt saved:', receipt.fullReceiptNumber);
        } catch (error) {
            console.error('Error saving receipt:', error);
            throw error;
        }
    }

    /**
     * Get all receipts
     */
    static async getAllReceipts(): Promise<Receipt[]> {
        try {
            const data = await AsyncStorage.getItem(RECEIPTS_STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
            return [];
        } catch (error) {
            console.error('Error getting receipts:', error);
            return [];
        }
    }

    /**
     * Get a receipt by ID
     */
    static async getReceiptById(id: string): Promise<Receipt | null> {
        try {
            const receipts = await this.getAllReceipts();
            return receipts.find(r => r.id === id) || null;
        } catch (error) {
            console.error('Error getting receipt by ID:', error);
            return null;
        }
    }

    /**
     * Delete a receipt by ID
     */
    static async deleteReceipt(id: string): Promise<void> {
        try {
            const receipts = await this.getAllReceipts();
            const filtered = receipts.filter(r => r.id !== id);
            await AsyncStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(filtered));
            console.log('Receipt deleted:', id);
        } catch (error) {
            console.error('Error deleting receipt:', error);
            throw error;
        }
    }

    /**
     * Get recent receipts (last N)
     */
    static async getRecentReceipts(count: number = 10): Promise<Receipt[]> {
        try {
            const receipts = await this.getAllReceipts();
            // Sort by createdAt descending and take last N
            return receipts
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, count);
        } catch (error) {
            console.error('Error getting recent receipts:', error);
            return [];
        }
    }
}
