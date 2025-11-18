import AsyncStorage from '@react-native-async-storage/async-storage';

const INVOICE_COUNTER_KEY = '@invoice_counter';

interface CounterData {
  [prefix: string]: number; // e.g., { "KTMVS": 1, "INV": 5 } (stores last used number)
}

export class InvoiceCounterService {
  /**
   * Get the next invoice number for a given prefix
   * Returns formatted string like "KTMVS-1" (starts from 1)
   */
  static async getNextInvoiceNumber(prefix: string): Promise<{
    number: string; // Just the number "1"
    fullNumber: string; // Complete "KTMVS-1"
  }> {
    try {
      const counters = await this.loadCounters();
      const currentNumber = counters[prefix] || 0; // Start from 0 if not found (first invoice will be 1)
      const nextNumber = currentNumber + 1;
      
      return {
        number: nextNumber.toString(),
        fullNumber: `${prefix}-${nextNumber}`,
      };
    } catch (error) {
      console.error('Error getting next invoice number:', error);
      // Return a fallback number
      return {
        number: '1',
        fullNumber: `${prefix}-1`,
      };
    }
  }

  /**
   * Increment the counter after successful invoice creation
   */
  static async incrementCounter(prefix: string): Promise<void> {
    try {
      const counters = await this.loadCounters();
      const currentNumber = counters[prefix] || 0;
      counters[prefix] = currentNumber + 1;
      await this.saveCounters(counters);
      console.log(`Counter incremented for ${prefix}: ${counters[prefix]}`);
    } catch (error) {
      console.error('Error incrementing counter:', error);
      throw error;
    }
  }

  /**
   * Get current counter value without incrementing
   */
  static async getCurrentCounter(prefix: string): Promise<number> {
    try {
      const counters = await this.loadCounters();
      return counters[prefix] || 0;
    } catch (error) {
      console.error('Error getting current counter:', error);
      return 0;
    }
  }

  /**
   * Set counter to a specific value
   * Useful for manual adjustments or imports
   */
  static async setCounter(prefix: string, value: number): Promise<void> {
    try {
      const counters = await this.loadCounters();
      counters[prefix] = value;
      await this.saveCounters(counters);
      console.log(`Counter set for ${prefix}: ${value}`);
    } catch (error) {
      console.error('Error setting counter:', error);
      throw error;
    }
  }

  /**
   * Reset counter for a prefix (e.g., start of new fiscal year)
   */
  static async resetCounter(prefix: string, startFrom: number = 0): Promise<void> {
    try {
      const counters = await this.loadCounters();
      counters[prefix] = startFrom;
      await this.saveCounters(counters);
      console.log(`Counter reset for ${prefix} to: ${startFrom}`);
    } catch (error) {
      console.error('Error resetting counter:', error);
      throw error;
    }
  }

  /**
   * Delete counter for a prefix
   */
  static async deleteCounter(prefix: string): Promise<void> {
    try {
      const counters = await this.loadCounters();
      delete counters[prefix];
      await this.saveCounters(counters);
      console.log(`Counter deleted for ${prefix}`);
    } catch (error) {
      console.error('Error deleting counter:', error);
      throw error;
    }
  }

  /**
   * Get all counters (for debugging or admin purposes)
   */
  static async getAllCounters(): Promise<CounterData> {
    return await this.loadCounters();
  }

  /**
   * Load counters from storage
   */
  private static async loadCounters(): Promise<CounterData> {
    try {
      const data = await AsyncStorage.getItem(INVOICE_COUNTER_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return {};
    } catch (error) {
      console.error('Error loading counters:', error);
      return {};
    }
  }

  /**
   * Save counters to storage
   */
  private static async saveCounters(counters: CounterData): Promise<void> {
    try {
      await AsyncStorage.setItem(INVOICE_COUNTER_KEY, JSON.stringify(counters));
    } catch (error) {
      console.error('Error saving counters:', error);
      throw error;
    }
  }

  /**
   * Format invoice number with padding
   * e.g., formatInvoiceNumber("KTMVS", 5, 3) => "KTMVS-005"
   */
  static formatInvoiceNumber(prefix: string, number: number, padding: number = 0): string {
    if (padding > 0) {
      const paddedNumber = number.toString().padStart(padding, '0');
      return `${prefix}-${paddedNumber}`;
    }
    return `${prefix}-${number}`;
  }

  /**
   * Parse invoice number to extract prefix and number
   * e.g., "KTMVS-101" => { prefix: "KTMVS", number: 101 }
   */
  static parseInvoiceNumber(fullNumber: string): { prefix: string; number: number } | null {
    const parts = fullNumber.split('-');
    if (parts.length === 2) {
      const prefix = parts[0];
      const number = parseInt(parts[1], 10);
      if (!isNaN(number)) {
        return { prefix, number };
      }
    }
    return null;
  }
}

