import AsyncStorage from '@react-native-async-storage/async-storage';
import { Invoice } from '../types/invoice';

const INVOICES_STORAGE_KEY = '@invoices';

export class InvoiceStorageService {
    /**
     * Save a new invoice
     */
    static async saveInvoice(invoice: Invoice): Promise<void> {
        try {
            const invoices = await this.getAllInvoices();
            invoices.push(invoice);
            await AsyncStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
            console.log('Invoice saved:', invoice.fullInvoiceNumber);
        } catch (error) {
            console.error('Error saving invoice:', error);
            throw error;
        }
    }

    /**
     * Get all invoices
     */
    static async getAllInvoices(): Promise<Invoice[]> {
        try {
            const data = await AsyncStorage.getItem(INVOICES_STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
            return [];
        } catch (error) {
            console.error('Error getting invoices:', error);
            return [];
        }
    }

    /**
     * Get an invoice by ID
     */
    static async getInvoiceById(id: string): Promise<Invoice | null> {
        try {
            const invoices = await this.getAllInvoices();
            return invoices.find(i => i.id === id) || null;
        } catch (error) {
            console.error('Error getting invoice by ID:', error);
            return null;
        }
    }

    /**
     * Delete an invoice by ID
     */
    static async deleteInvoice(id: string): Promise<void> {
        try {
            const invoices = await this.getAllInvoices();
            const filtered = invoices.filter(i => i.id !== id);
            await AsyncStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(filtered));
            console.log('Invoice deleted:', id);
        } catch (error) {
            console.error('Error deleting invoice:', error);
            throw error;
        }
    }

    /**
     * Get recent invoices (last N)
     */
    static async getRecentInvoices(count: number = 10): Promise<Invoice[]> {
        try {
            const invoices = await this.getAllInvoices();
            // Sort by createdAt descending and take last N
            return invoices
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, count);
        } catch (error) {
            console.error('Error getting recent invoices:', error);
            return [];
        }
    }
}
