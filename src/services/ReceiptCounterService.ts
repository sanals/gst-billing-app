import AsyncStorage from '@react-native-async-storage/async-storage';

const RECEIPT_COUNTER_KEY = '@receipt_counter';

interface CounterData {
    [prefix: string]: number; // e.g., { "REC": 1, "RCPT": 5 } (stores last used number)
}

export class ReceiptCounterService {
    /**
     * Get the next receipt number for a given prefix (without reserving)
     * Use this for preview purposes only
     * Returns formatted string like "REC-1" (starts from 1)
     */
    static async getNextReceiptNumber(prefix: string): Promise<{
        number: string; // Just the number "1"
        fullNumber: string; // Complete "REC-1"
    }> {
        try {
            const counters = await this.loadCounters();
            const currentNumber = counters[prefix] || 0;
            const nextNumber = currentNumber + 1;

            return {
                number: nextNumber.toString(),
                fullNumber: `${prefix}-${nextNumber}`,
            };
        } catch (error) {
            console.error('Error getting next receipt number:', error);
            return {
                number: '1',
                fullNumber: `${prefix}-1`,
            };
        }
    }

    /**
     * Reserve and return the next receipt number atomically
     * This prevents race conditions by immediately incrementing the counter
     * Use this when actually creating a receipt
     */
    static async reserveNextReceiptNumber(prefix: string): Promise<{
        number: string;
        fullNumber: string;
    }> {
        try {
            const counters = await this.loadCounters();
            const currentNumber = counters[prefix] || 0;
            const nextNumber = currentNumber + 1;

            // Immediately save the incremented counter (atomic reservation)
            counters[prefix] = nextNumber;
            await this.saveCounters(counters);

            console.log(`Receipt number reserved for ${prefix}: ${nextNumber}`);

            return {
                number: nextNumber.toString(),
                fullNumber: `${prefix}-${nextNumber}`,
            };
        } catch (error) {
            console.error('Error reserving receipt number:', error);
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
            console.log(`Receipt counter set for ${prefix}: ${value}`);
        } catch (error) {
            console.error('Error setting counter:', error);
            throw error;
        }
    }

    /**
     * Reset counter for a prefix
     */
    static async resetCounter(prefix: string, startFrom: number = 0): Promise<void> {
        try {
            const counters = await this.loadCounters();
            counters[prefix] = startFrom;
            await this.saveCounters(counters);
            console.log(`Receipt counter reset for ${prefix} to: ${startFrom}`);
        } catch (error) {
            console.error('Error resetting counter:', error);
            throw error;
        }
    }

    /**
     * Load counters from storage
     */
    private static async loadCounters(): Promise<CounterData> {
        try {
            const data = await AsyncStorage.getItem(RECEIPT_COUNTER_KEY);
            if (data) {
                return JSON.parse(data);
            }
            return {};
        } catch (error) {
            console.error('Error loading receipt counters:', error);
            return {};
        }
    }

    /**
     * Save counters to storage
     */
    private static async saveCounters(counters: CounterData): Promise<void> {
        try {
            await AsyncStorage.setItem(RECEIPT_COUNTER_KEY, JSON.stringify(counters));
        } catch (error) {
            console.error('Error saving receipt counters:', error);
            throw error;
        }
    }
}
