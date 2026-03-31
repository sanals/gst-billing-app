import AsyncStorage from '@react-native-async-storage/async-storage';

const RECEIPT_COUNTER_KEY = '@receipt_counter';

interface CounterData {
    [key: string]: number | string;
}

export class ReceiptCounterService {

    static async getNextReceiptNumber(prefix: string): Promise<{
        number: string;
        fullNumber: string;
    }> {
        try {
            const counters = await this.loadCounters();
            const currentNumber = (counters[prefix] as number) || 0;
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

    static async reserveNextReceiptNumber(prefix: string): Promise<{
        number: string;
        fullNumber: string;
    }> {
        try {
            const counters = await this.loadCounters();
            const currentNumber = (counters[prefix] as number) || 0;
            const nextNumber = currentNumber + 1;

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

    static async getCurrentCounter(prefix: string): Promise<number> {
        try {
            const counters = await this.loadCounters();
            return (counters[prefix] as number) || 0;
        } catch (error) {
            console.error('Error getting current counter:', error);
            return 0;
        }
    }

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

    private static async saveCounters(counters: CounterData): Promise<void> {
        try {
            await AsyncStorage.setItem(RECEIPT_COUNTER_KEY, JSON.stringify(counters));
        } catch (error) {
            console.error('Error saving receipt counters:', error);
            throw error;
        }
    }
}
