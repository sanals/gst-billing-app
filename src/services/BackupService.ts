/**
 * Backup Service - Similar to WhatsApp's Google Drive Backup
 * 
 * This service uses Android's Auto Backup feature which automatically
 * syncs app data to Google Drive using the device's Google account.
 * No separate login required - uses the account already on the phone!
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { GoogleDriveService } from './GoogleDriveService';

const BACKUP_DATA_KEY = 'backup_metadata';
const BACKUP_METHOD_KEY = 'backup_method';
const AUTO_SYNC_ENABLED_KEY = 'auto_sync_enabled';

export type BackupMethod = 'manual' | 'google_drive';

export interface BackupMetadata {
  lastBackupDate: string;
  backupVersion: number;
  totalInvoices: number;
  totalProducts: number;
  backupMethod: BackupMethod;
  lastSyncDate?: string;
}

export class BackupService {
  /**
   * Android Auto Backup automatically backs up:
   * - SharedPreferences (AsyncStorage data)
   * - App files in getFilesDir()
   * - App files in getDatabasePath()
   * 
   * This happens automatically when:
   * - Device is idle
   * - Charging
   * - On WiFi
   * - At least 24 hours since last backup
   * 
   * Uses the Google account already logged into the device!
   */

  /**
   * Get backup status
   */
  static async getBackupStatus(): Promise<BackupMetadata | null> {
    try {
      const metadata = await AsyncStorage.getItem(BACKUP_DATA_KEY);
      return metadata ? JSON.parse(metadata) : null;
    } catch (error) {
      console.error('Error getting backup status:', error);
      return null;
    }
  }

  /**
   * Update backup metadata (called after data changes)
   */
  static async updateBackupMetadata(): Promise<void> {
    try {
      // Count invoices and products
      const invoices = await FileSystem.readDirectoryAsync(
        `${FileSystem.documentDirectory}invoices/`
      ).catch(() => []);
      
      const products = await AsyncStorage.getItem('products').then(
        (data) => data ? JSON.parse(data).length : 0
      ).catch(() => 0);

      const metadata: BackupMetadata = {
        lastBackupDate: new Date().toISOString(),
        backupVersion: Date.now(),
        totalInvoices: invoices.length,
        totalProducts: products,
      };

      await AsyncStorage.setItem(BACKUP_DATA_KEY, JSON.stringify(metadata));
      console.log('Backup metadata updated:', metadata);
    } catch (error) {
      console.error('Error updating backup metadata:', error);
    }
  }

  /**
   * Manual backup trigger (for user-initiated backup)
   * Note: Android Auto Backup is automatic, but this can be used
   * to ensure data is ready for backup
   */
  static async triggerManualBackup(): Promise<{ success: boolean; message: string }> {
    try {
      // Update metadata to mark data as ready for backup
      await this.updateBackupMetadata();
      
      return {
        success: true,
        message: 'Data prepared for backup. Android will automatically sync to Google Drive when device is idle and charging.',
      };
    } catch (error) {
      console.error('Error triggering backup:', error);
      return {
        success: false,
        message: 'Failed to prepare backup data.',
      };
    }
  }

  /**
   * Export data as JSON file (for manual backup/restore)
   */
  static async exportData(): Promise<string> {
    try {
      // Get all products
      const products = await AsyncStorage.getItem('products').then(
        (data) => data ? JSON.parse(data) : []
      ).catch(() => []);

      // Get company settings
      const companySettings = await AsyncStorage.getItem('company_settings').then(
        (data) => data ? JSON.parse(data) : null
      ).catch(() => null);

      // Get invoice counter
      const invoiceCounter = await AsyncStorage.getItem('invoice_counter_KTMVS').then(
        (data) => data || '0'
      ).catch(() => '0');

      // Create backup data object
      const backupData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        products,
        companySettings,
        invoiceCounter: parseInt(invoiceCounter, 10),
      };

      // Save to file
      const backupDir = `${FileSystem.documentDirectory}backups/`;
      const dirInfo = await FileSystem.getInfoAsync(backupDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true });
      }

      const fileName = `gst_billing_backup_${Date.now()}.json`;
      const filePath = `${backupDir}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backupData, null, 2));

      return filePath;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Share backup file (user can save to Google Drive manually)
   */
  static async shareBackupFile(): Promise<void> {
    try {
      const filePath = await this.exportData();
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Save Backup to Google Drive',
        });
      } else {
        throw new Error('Sharing is not available');
      }
    } catch (error) {
      console.error('Error sharing backup:', error);
      throw error;
    }
  }

  /**
   * Restore data from backup file
   */
  static async restoreFromBackup(filePath: string): Promise<{ success: boolean; message: string }> {
    try {
      const backupContent = await FileSystem.readAsStringAsync(filePath);
      const backupData = JSON.parse(backupContent);

      // Restore products
      if (backupData.products) {
        await AsyncStorage.setItem('products', JSON.stringify(backupData.products));
      }

      // Restore company settings
      if (backupData.companySettings) {
        await AsyncStorage.setItem('company_settings', JSON.stringify(backupData.companySettings));
      }

      // Restore invoice counter
      if (backupData.invoiceCounter) {
        await AsyncStorage.setItem('invoice_counter_KTMVS', backupData.invoiceCounter.toString());
      }

      await this.updateBackupMetadata();

      return {
        success: true,
        message: 'Data restored successfully!',
      };
    } catch (error) {
      console.error('Error restoring backup:', error);
      return {
        success: false,
        message: `Failed to restore: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get current backup method
   */
  static async getBackupMethod(): Promise<BackupMethod> {
    try {
      const method = await AsyncStorage.getItem(BACKUP_METHOD_KEY);
      return (method as BackupMethod) || 'manual';
    } catch (error) {
      console.error('Error getting backup method:', error);
      return 'manual';
    }
  }

  /**
   * Set backup method
   */
  static async setBackupMethod(method: BackupMethod): Promise<void> {
    try {
      await AsyncStorage.setItem(BACKUP_METHOD_KEY, method);
      console.log(`Backup method set to: ${method}`);
    } catch (error) {
      console.error('Error setting backup method:', error);
    }
  }

  /**
   * Check if auto-sync is enabled
   */
  static async isAutoSyncEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(AUTO_SYNC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking auto-sync:', error);
      return false;
    }
  }

  /**
   * Set auto-sync enabled/disabled
   */
  static async setAutoSyncEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTO_SYNC_ENABLED_KEY, enabled.toString());
      console.log(`Auto-sync ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error setting auto-sync:', error);
    }
  }

  /**
   * Sync to Google Drive (called automatically when auto-sync is enabled)
   */
  static async syncToGoogleDrive(accessToken: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get all data to backup
      const products = await AsyncStorage.getItem('products').then(
        (data) => data ? JSON.parse(data) : []
      ).catch(() => []);

      const companySettings = await AsyncStorage.getItem('company_settings').then(
        (data) => data ? JSON.parse(data) : null
      ).catch(() => null);

      const invoiceCounter = await AsyncStorage.getItem('invoice_counter_KTMVS').then(
        (data) => data || '0'
      ).catch(() => '0');

      // Create backup data object
      const backupData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        products,
        companySettings,
        invoiceCounter: parseInt(invoiceCounter, 10),
      };

      // Upload to Google Drive
      const result = await GoogleDriveService.uploadBackup(accessToken, backupData);

      if (result.success) {
        // Update metadata
        const metadata = await this.getBackupStatus();
        const updatedMetadata: BackupMetadata = {
          ...(metadata || {
            backupVersion: Date.now(),
            totalInvoices: 0,
            totalProducts: 0,
          }),
          lastBackupDate: new Date().toISOString(),
          lastSyncDate: new Date().toISOString(),
          backupMethod: 'google_drive',
        };
        
        await AsyncStorage.setItem(BACKUP_DATA_KEY, JSON.stringify(updatedMetadata));
      }

      return result;
    } catch (error) {
      console.error('Error syncing to Google Drive:', error);
      return {
        success: false,
        message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Restore from Google Drive
   */
  static async restoreFromGoogleDrive(accessToken: string): Promise<{ success: boolean; message: string }> {
    try {
      const downloadResult = await GoogleDriveService.downloadBackup(accessToken);

      if (!downloadResult.success || !downloadResult.data) {
        return {
          success: false,
          message: downloadResult.message,
        };
      }

      const backupData = downloadResult.data;

      // Restore products
      if (backupData.products) {
        await AsyncStorage.setItem('products', JSON.stringify(backupData.products));
      }

      // Restore company settings
      if (backupData.companySettings) {
        await AsyncStorage.setItem('company_settings', JSON.stringify(backupData.companySettings));
      }

      // Restore invoice counter
      if (backupData.invoiceCounter) {
        await AsyncStorage.setItem('invoice_counter_KTMVS', backupData.invoiceCounter.toString());
      }

      await this.updateBackupMetadata();

      return {
        success: true,
        message: 'Data restored successfully from Google Drive!',
      };
    } catch (error) {
      console.error('Error restoring from Google Drive:', error);
      return {
        success: false,
        message: `Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

