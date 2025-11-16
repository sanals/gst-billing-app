import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompanySettings, DEFAULT_COMPANY_SETTINGS } from '../types/company';
import { BackupService } from './BackupService';

const COMPANY_SETTINGS_KEY = '@company_settings';

export class CompanySettingsService {
  /**
   * Get company settings from storage
   * Returns default settings if not found
   */
  static async getSettings(): Promise<CompanySettings> {
    try {
      const data = await AsyncStorage.getItem(COMPANY_SETTINGS_KEY);
      if (data) {
        return JSON.parse(data);
      }
      // Return default settings if not found
      return DEFAULT_COMPANY_SETTINGS;
    } catch (error) {
      console.error('Error loading company settings:', error);
      return DEFAULT_COMPANY_SETTINGS;
    }
  }

  /**
   * Save company settings to storage
   */
  static async saveSettings(settings: CompanySettings): Promise<void> {
    try {
      await AsyncStorage.setItem(COMPANY_SETTINGS_KEY, JSON.stringify(settings));
      console.log('Company settings saved successfully');
      
      // Update backup metadata to include company settings change
      await BackupService.updateBackupMetadata();
    } catch (error) {
      console.error('Error saving company settings:', error);
      throw error;
    }
  }

  /**
   * Reset to default settings
   */
  static async resetToDefaults(): Promise<void> {
    try {
      await this.saveSettings(DEFAULT_COMPANY_SETTINGS);
      console.log('Company settings reset to defaults');
    } catch (error) {
      console.error('Error resetting company settings:', error);
      throw error;
    }
  }

  /**
   * Get default settings without loading from storage
   */
  static getDefaultSettings(): CompanySettings {
    return { ...DEFAULT_COMPANY_SETTINGS };
  }

  /**
   * Validate GSTIN format
   * Format: 15 characters total
   * - 2 digits: State code (01-37)
   * - 10 alphanumeric: PAN (Permanent Account Number)
   * - 1 alphanumeric: Entity number (1-9 or A-Z)
   * - 1 alphanumeric: Default character (usually 'Z', but can vary)
   * - 1 alphanumeric: Check code
   * Example: 22AAUPJ7SS1B12M or 07ABCDE1234F1Z5
   * 
   * Note: This is a basic format validation. The actual GSTIN validation
   * includes checksum verification which is more complex.
   */
  static validateGSTIN(gstin: string): boolean {
    // Must be exactly 15 characters
    if (gstin.length !== 15) {
      return false;
    }
    
    // Format: 2 digits + 10 alphanumeric (PAN) + 1 alphanumeric (entity) + 1 alphanumeric + 1 alphanumeric (check)
    // More flexible: allows any alphanumeric in positions 13 and 14 (not strictly requiring 'Z')
    const gstinRegex = /^[0-9]{2}[A-Z0-9]{10}[1-9A-Z]{1}[A-Z0-9]{2}$/;
    return gstinRegex.test(gstin);
  }

  /**
   * Validate IFSC Code format
   * Format: SBIN0001234 (4 letters + 0 + 6 digits)
   */
  static validateIFSC(ifsc: string): boolean {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifsc);
  }

  /**
   * Validate mobile number (Indian format)
   */
  static validateMobile(mobile: string): boolean {
    // Remove spaces and special characters
    const cleaned = mobile.replace(/[\s\-\(\)]/g, '');
    // Check if 10 digits
    return /^[6-9]\d{9}$/.test(cleaned);
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

