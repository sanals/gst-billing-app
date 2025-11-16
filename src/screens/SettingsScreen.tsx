import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../constants/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { BackupService } from '../services/BackupService';

type SettingsScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Settings'>;
};

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [backupStatus, setBackupStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBackupStatus();
  }, []);

  const loadBackupStatus = async () => {
    const status = await BackupService.getBackupStatus();
    setBackupStatus(status);
  };

  const handleManualBackup = async () => {
    setLoading(true);
    try {
      const result = await BackupService.triggerManualBackup();
      Alert.alert('Backup', result.message);
      await loadBackupStatus();
    } catch (error) {
      Alert.alert('Error', 'Failed to prepare backup');
    } finally {
      setLoading(false);
    }
  };

  const handleExportBackup = async () => {
    setLoading(true);
    try {
      await BackupService.shareBackupFile();
      Alert.alert('Success', 'Backup file ready to save to Google Drive');
      await loadBackupStatus();
    } catch (error) {
      Alert.alert('Error', 'Failed to create backup file');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    Alert.alert(
      'Restore Backup',
      'This will replace all your current data with the backup. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Pick backup file
              const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true,
              });

              if (result.canceled) {
                setLoading(false);
                return;
              }

              const fileUri = result.assets[0].uri;
              
              // Restore from backup
              const restoreResult = await BackupService.restoreFromBackup(fileUri);
              
              if (restoreResult.success) {
                Alert.alert('Success', restoreResult.message, [
                  {
                    text: 'OK',
                    onPress: () => {
                      loadBackupStatus();
                      // Optionally reload app or navigate to home
                    },
                  },
                ]);
              } else {
                Alert.alert('Error', restoreResult.message);
              }
            } catch (error) {
              console.error('Restore error:', error);
              Alert.alert('Error', 'Failed to restore backup. Please check the file format.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your app</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.settingsGroup}>
            <Text style={styles.groupTitle}>📦 Backup & Sync</Text>
            <View style={styles.backupCard}>
              <Text style={styles.backupTitle}>Google Drive Backup</Text>
              <Text style={styles.backupDescription}>
                Your data is automatically backed up to Google Drive using your device's Google account (like WhatsApp).
              </Text>
              
              {backupStatus && (
                <View style={styles.backupInfo}>
                  <View style={styles.backupInfoRow}>
                    <Text style={styles.backupInfoLabel}>Last Backup:</Text>
                    <Text style={styles.backupInfoValue}>
                      {formatDate(backupStatus.lastBackupDate)}
                    </Text>
                  </View>
                  <View style={styles.backupInfoRow}>
                    <Text style={styles.backupInfoLabel}>Invoices:</Text>
                    <Text style={styles.backupInfoValue}>{backupStatus.totalInvoices || 0}</Text>
                  </View>
                  <View style={styles.backupInfoRow}>
                    <Text style={styles.backupInfoLabel}>Products:</Text>
                    <Text style={styles.backupInfoValue}>{backupStatus.totalProducts || 0}</Text>
                  </View>
                </View>
              )}

              <TouchableOpacity 
                style={[styles.backupButton, loading && styles.buttonDisabled]}
                onPress={handleManualBackup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.backupButtonText}>Prepare Backup</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.backupButton, styles.backupButtonSecondary, loading && styles.buttonDisabled]}
                onPress={handleExportBackup}
                disabled={loading}
              >
                <Text style={styles.backupButtonTextSecondary}>Export & Save to Drive</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.backupButton, styles.backupButtonRestore, loading && styles.buttonDisabled]}
                onPress={handleRestoreBackup}
                disabled={loading}
              >
                <Text style={styles.backupButtonText}>Restore from Backup File</Text>
              </TouchableOpacity>

              <Text style={styles.backupNote}>
                💡 Android automatically backs up to Google Drive when device is charging and on WiFi.{'\n'}
                📥 Use "Restore from Backup File" to restore data from a different Google account.
              </Text>
            </View>
          </View>

          <View style={styles.settingsGroup}>
            <Text style={styles.groupTitle}>General</Text>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>Profile</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>Notifications</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingsGroup}>
            <Text style={styles.groupTitle}>App</Text>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>Theme</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>Language</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingsGroup}>
            <Text style={styles.groupTitle}>About</Text>
            <View style={styles.settingItem}>
              <Text style={styles.settingText}>Version</Text>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.buttonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.accent,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  settingsGroup: {
    marginBottom: 30,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    paddingLeft: 4,
  },
  settingItem: {
    backgroundColor: colors.card.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: colors.card.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  settingArrow: {
    fontSize: 24,
    color: colors.text.light,
  },
  settingValue: {
    fontSize: 16,
    color: colors.text.light,
  },
  backupCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: colors.card.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  backupDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  backupInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  backupInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backupInfoLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  backupInfoValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },
  backupButton: {
    backgroundColor: colors.primary || '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  backupButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary || '#007AFF',
  },
  backupButtonRestore: {
    backgroundColor: '#16a34a',
    marginTop: 5,
  },
  backupButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  backupButtonTextSecondary: {
    color: colors.primary || '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backupNote: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});

