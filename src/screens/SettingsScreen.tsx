import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../constants/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { BackupService, BackupMethod } from '../services/BackupService';
import { useGoogleAuth } from '../contexts/GoogleAuthContext';

type SettingsScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Settings'>;
};

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [backupStatus, setBackupStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [backupMethod, setBackupMethodState] = useState<BackupMethod>('manual');
  const [autoSyncEnabled, setAutoSyncEnabledState] = useState(false);
  
  const { user, isAuthenticated, accessToken, signIn, signOut, isLoading: authLoading } = useGoogleAuth();

  useEffect(() => {
    loadBackupStatus();
    loadBackupMethod();
    loadAutoSyncEnabled();
  }, []);

  const loadBackupStatus = async () => {
    const status = await BackupService.getBackupStatus();
    setBackupStatus(status);
  };

  const loadBackupMethod = async () => {
    const method = await BackupService.getBackupMethod();
    setBackupMethodState(method);
  };

  const loadAutoSyncEnabled = async () => {
    const enabled = await BackupService.isAutoSyncEnabled();
    setAutoSyncEnabledState(enabled);
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

  const handleBackupMethodChange = async (method: BackupMethod) => {
    if (method === 'google_drive' && !isAuthenticated) {
      Alert.alert(
        'Google Sign-In Required',
        'You need to sign in with Google to use Google Drive backup.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In',
            onPress: handleGoogleSignIn,
          },
        ]
      );
      return;
    }

    setBackupMethodState(method);
    await BackupService.setBackupMethod(method);
    
    Alert.alert(
      'Backup Method Changed',
      method === 'manual' 
        ? 'Manual backup selected. Use Export & Save buttons to backup.'
        : 'Google Drive backup selected. Toggle Auto-Sync to enable automatic backups.'
    );
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn();
      Alert.alert('Success', 'Signed in with Google successfully!');
      loadBackupStatus();
    } catch (error) {
      console.error('Google Sign-In error:', error);
      Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Auto-sync will be disabled.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await signOut();
              setBackupMethodState('manual');
              await BackupService.setBackupMethod('manual');
              setAutoSyncEnabledState(false);
              await BackupService.setAutoSyncEnabled(false);
              Alert.alert('Success', 'Signed out successfully');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleAutoSyncToggle = async (enabled: boolean) => {
    if (enabled && !accessToken) {
      Alert.alert('Error', 'Please sign in with Google first');
      return;
    }

    setAutoSyncEnabledState(enabled);
    await BackupService.setAutoSyncEnabled(enabled);

    if (enabled) {
      Alert.alert(
        'Auto-Sync Enabled',
        'Your data will automatically sync to Google Drive when changes are made.'
      );
      // Trigger immediate sync
      handleSyncNow();
    }
  };

  const handleSyncNow = async () => {
    if (!accessToken) {
      Alert.alert('Error', 'Please sign in with Google first');
      return;
    }

    setLoading(true);
    try {
      const result = await BackupService.syncToGoogleDrive(accessToken);
      Alert.alert(result.success ? 'Success' : 'Error', result.message);
      await loadBackupStatus();
    } catch (error) {
      Alert.alert('Error', 'Failed to sync to Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreFromGoogleDrive = async () => {
    if (!accessToken) {
      Alert.alert('Error', 'Please sign in with Google first');
      return;
    }

    Alert.alert(
      'Restore from Google Drive',
      'This will replace all your current data with the backup from Google Drive. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await BackupService.restoreFromGoogleDrive(accessToken);
              Alert.alert(result.success ? 'Success' : 'Error', result.message);
              await loadBackupStatus();
            } catch (error) {
              Alert.alert('Error', 'Failed to restore from Google Drive');
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
            
            {/* Backup Method Selection */}
            <View style={styles.methodCard}>
              <Text style={styles.methodTitle}>Backup Method</Text>
              <View style={styles.methodButtons}>
                <TouchableOpacity
                  style={[styles.methodButton, backupMethod === 'manual' && styles.methodButtonActive]}
                  onPress={() => handleBackupMethodChange('manual')}
                  disabled={loading}
                >
                  <Text style={[styles.methodButtonText, backupMethod === 'manual' && styles.methodButtonTextActive]}>
                    Manual
                  </Text>
                  <Text style={styles.methodButtonDesc}>No login required</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodButton, backupMethod === 'google_drive' && styles.methodButtonActive]}
                  onPress={() => handleBackupMethodChange('google_drive')}
                  disabled={loading}
                >
                  <Text style={[styles.methodButtonText, backupMethod === 'google_drive' && styles.methodButtonTextActive]}>
                    Google Drive
                  </Text>
                  <Text style={styles.methodButtonDesc}>Auto-sync</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Manual Backup Section */}
            {backupMethod === 'manual' && (
              <View style={styles.backupCard}>
                <Text style={styles.backupTitle}>Manual Backup</Text>
                <Text style={styles.backupDescription}>
                  Export and save your backup manually to any Google Drive account.
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
                  💡 Choose any Google Drive account when saving.{'\n'}
                  📥 Android also backs up automatically to device's primary account.
                </Text>
              </View>
            )}

            {/* Google Drive Backup Section */}
            {backupMethod === 'google_drive' && (
              <View style={styles.backupCard}>
                <Text style={styles.backupTitle}>Google Drive Auto-Sync</Text>
                
                {!isAuthenticated ? (
                  <>
                    <Text style={styles.backupDescription}>
                      Sign in with Google to enable automatic sync to your Google Drive.
                    </Text>
                    <TouchableOpacity 
                      style={[styles.backupButton, (loading || authLoading) && styles.buttonDisabled]}
                      onPress={handleGoogleSignIn}
                      disabled={loading || authLoading}
                    >
                      {loading || authLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.backupButtonText}>🔐 Sign in with Google</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.googleUserInfo}>
                      <Text style={styles.googleUserLabel}>Signed in as:</Text>
                      <Text style={styles.googleUserEmail}>{user?.email}</Text>
                      <TouchableOpacity 
                        style={styles.googleSignOutButton}
                        onPress={handleGoogleSignOut}
                        disabled={loading}
                      >
                        <Text style={styles.googleSignOutText}>Sign Out</Text>
                      </TouchableOpacity>
                    </View>

                    {backupStatus && (
                      <View style={styles.backupInfo}>
                        <View style={styles.backupInfoRow}>
                          <Text style={styles.backupInfoLabel}>Last Sync:</Text>
                          <Text style={styles.backupInfoValue}>
                            {formatDate(backupStatus.lastSyncDate || backupStatus.lastBackupDate)}
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

                    {/* Auto-Sync Toggle */}
                    <View style={styles.autoSyncRow}>
                      <View style={styles.autoSyncInfo}>
                        <Text style={styles.autoSyncLabel}>Auto-Sync</Text>
                        <Text style={styles.autoSyncDesc}>
                          Automatically sync when data changes
                        </Text>
                      </View>
                      <Switch
                        value={autoSyncEnabled}
                        onValueChange={handleAutoSyncToggle}
                        disabled={loading}
                        trackColor={{ false: '#E0E0E0', true: colors.primary || '#007AFF' }}
                        thumbColor={autoSyncEnabled ? '#fff' : '#f4f3f4'}
                      />
                    </View>

                    <TouchableOpacity 
                      style={[styles.backupButton, loading && styles.buttonDisabled]}
                      onPress={handleSyncNow}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.backupButtonText}>Sync Now</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.backupButton, styles.backupButtonRestore, loading && styles.buttonDisabled]}
                      onPress={handleRestoreFromGoogleDrive}
                      disabled={loading}
                    >
                      <Text style={styles.backupButtonText}>Restore from Google Drive</Text>
                    </TouchableOpacity>

                    <Text style={styles.backupNote}>
                      ☁️ Your data is securely synced to your Google Drive.{'\n'}
                      🔄 {autoSyncEnabled ? 'Auto-sync is enabled' : 'Enable auto-sync for automatic backups'}
                    </Text>
                  </>
                )}
              </View>
            )}
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
  methodCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: colors.card.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  methodButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  methodButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: colors.primary || '#007AFF',
  },
  methodButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  methodButtonTextActive: {
    color: colors.primary || '#007AFF',
  },
  methodButtonDesc: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  googleUserInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  googleUserLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  googleUserEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  googleSignOutButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#ffebee',
  },
  googleSignOutText: {
    fontSize: 12,
    color: '#c62828',
    fontWeight: '600',
  },
  autoSyncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 16,
  },
  autoSyncInfo: {
    flex: 1,
  },
  autoSyncLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  autoSyncDesc: {
    fontSize: 12,
    color: colors.text.secondary,
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

