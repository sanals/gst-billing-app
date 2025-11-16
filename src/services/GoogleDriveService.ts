/**
 * Google Drive Service - Auto Sync to Google Drive
 * 
 * This service handles automatic backup and restore of app data
 * to Google Drive using the Google Drive API.
 */

import * as FileSystem from 'expo-file-system/legacy';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const APP_FOLDER_NAME = 'GST_Billing_Backups';
const BACKUP_FILE_NAME = 'gst_billing_backup.json';

export interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
  size: string;
}

export class GoogleDriveService {
  /**
   * Get or create app folder in Google Drive
   */
  static async getAppFolderId(accessToken: string): Promise<string> {
    try {
      // Search for existing folder
      const searchUrl = `${DRIVE_API_BASE}/files?q=name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      
      const searchResponse = await fetch(searchUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        let errorMessage = `Failed to search folder: ${searchResponse.status} ${searchResponse.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorMessage;
        } catch {
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        }
        throw new Error(errorMessage);
      }

      const searchData = await searchResponse.json();

      if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id;
      }

      // Create folder if it doesn't exist
      const createUrl = `${DRIVE_API_BASE}/files`;
      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: APP_FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        let errorMessage = `Failed to create folder: ${createResponse.status} ${createResponse.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorMessage;
        } catch {
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        }
        throw new Error(errorMessage);
      }

      const createData = await createResponse.json();
      return createData.id;
    } catch (error) {
      console.error('Error getting/creating app folder:', error);
      throw error;
    }
  }

  /**
   * Upload backup file to Google Drive
   */
  static async uploadBackup(
    accessToken: string,
    backupData: any
  ): Promise<{ success: boolean; fileId?: string; message: string }> {
    try {
      const folderId = await this.getAppFolderId(accessToken);

      // Check if backup file already exists
      const searchUrl = `${DRIVE_API_BASE}/files?q=name='${BACKUP_FILE_NAME}' and '${folderId}' in parents and trashed=false`;
      
      const searchResponse = await fetch(searchUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const searchData = await searchResponse.json();
      const existingFileId = searchData.files?.[0]?.id;

      const backupJson = JSON.stringify(backupData, null, 2);
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      let url: string;
      let method: string;
      let metadata: any;

      if (existingFileId) {
        // Update existing file - use addParents/removeParents instead of parents
        url = `${DRIVE_UPLOAD_BASE}/files/${existingFileId}?uploadType=multipart`;
        method = 'PATCH';
        metadata = {
          name: BACKUP_FILE_NAME,
          mimeType: 'application/json',
        };
      } else {
        // Create new file - can use parents
        url = `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`;
        method = 'POST';
        metadata = {
          name: BACKUP_FILE_NAME,
          mimeType: 'application/json',
          parents: [folderId],
        };
      }

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        backupJson +
        closeDelimiter;

      const uploadResponse = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        let errorMessage = `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorMessage;
        } catch {
          // If not JSON, use the text
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        }
        throw new Error(errorMessage);
      }

      const uploadData = await uploadResponse.json();
      
      return {
        success: true,
        fileId: uploadData.id,
        message: existingFileId ? 'Backup updated successfully' : 'Backup created successfully',
      };
    } catch (error) {
      console.error('Error uploading backup:', error);
      return {
        success: false,
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Download backup file from Google Drive
   */
  static async downloadBackup(
    accessToken: string
  ): Promise<{ success: boolean; data?: any; message: string }> {
    try {
      const folderId = await this.getAppFolderId(accessToken);

      // Search for backup file
      const searchUrl = `${DRIVE_API_BASE}/files?q=name='${BACKUP_FILE_NAME}' and '${folderId}' in parents and trashed=false`;
      
      const searchResponse = await fetch(searchUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const searchData = await searchResponse.json();

      if (!searchData.files || searchData.files.length === 0) {
        return {
          success: false,
          message: 'No backup found in Google Drive',
        };
      }

      const fileId = searchData.files[0].id;

      // Download file content
      const downloadUrl = `${DRIVE_API_BASE}/files/${fileId}?alt=media`;
      
      const downloadResponse = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!downloadResponse.ok) {
        throw new Error(`Download failed: ${downloadResponse.statusText}`);
      }

      const backupData = await downloadResponse.json();

      return {
        success: true,
        data: backupData,
        message: 'Backup downloaded successfully',
      };
    } catch (error) {
      console.error('Error downloading backup:', error);
      return {
        success: false,
        message: `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get backup file info from Google Drive
   */
  static async getBackupInfo(
    accessToken: string
  ): Promise<{ exists: boolean; modifiedTime?: string; size?: string }> {
    try {
      const folderId = await this.getAppFolderId(accessToken);

      const searchUrl = `${DRIVE_API_BASE}/files?q=name='${BACKUP_FILE_NAME}' and '${folderId}' in parents and trashed=false&fields=files(id,name,modifiedTime,size)`;
      
      const response = await fetch(searchUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!data.files || data.files.length === 0) {
        return { exists: false };
      }

      const file = data.files[0];
      return {
        exists: true,
        modifiedTime: file.modifiedTime,
        size: file.size,
      };
    } catch (error) {
      console.error('Error getting backup info:', error);
      return { exists: false };
    }
  }

  /**
   * Delete backup file from Google Drive
   */
  static async deleteBackup(accessToken: string): Promise<{ success: boolean; message: string }> {
    try {
      const folderId = await this.getAppFolderId(accessToken);

      // Search for backup file
      const searchUrl = `${DRIVE_API_BASE}/files?q=name='${BACKUP_FILE_NAME}' and '${folderId}' in parents and trashed=false`;
      
      const searchResponse = await fetch(searchUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const searchData = await searchResponse.json();

      if (!searchData.files || searchData.files.length === 0) {
        return {
          success: false,
          message: 'No backup found to delete',
        };
      }

      const fileId = searchData.files[0].id;

      // Delete file
      const deleteUrl = `${DRIVE_API_BASE}/files/${fileId}`;
      
      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!deleteResponse.ok) {
        throw new Error(`Delete failed: ${deleteResponse.statusText}`);
      }

      return {
        success: true,
        message: 'Backup deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting backup:', error);
      return {
        success: false,
        message: `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

