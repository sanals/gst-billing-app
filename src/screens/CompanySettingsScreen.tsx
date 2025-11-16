import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../contexts/ThemeContext';
import { CompanySettings } from '../types/company';
import { CompanySettingsService } from '../services/CompanySettingsService';
import { BackupService } from '../services/BackupService';
import { useGoogleAuth } from '../contexts/GoogleAuthContext';

const CompanySettingsScreen = ({ navigation }: any) => {
  const { theme, themeMode } = useTheme();
  const { accessToken } = useGoogleAuth();
  const styles = getStyles(theme);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await CompanySettingsService.getSettings();
      setSettings(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load company settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    // Validation
    if (!settings.name.trim()) {
      Alert.alert('Validation Error', 'Company name is required');
      return;
    }

    if (!settings.gstin.trim()) {
      Alert.alert('Validation Error', 'GSTIN is required');
      return;
    }

    if (!CompanySettingsService.validateGSTIN(settings.gstin)) {
      Alert.alert('Validation Error', 'Invalid GSTIN format');
      return;
    }

    if (!settings.mobile1.trim()) {
      Alert.alert('Validation Error', 'At least one mobile number is required');
      return;
    }

    if (!settings.bankDetails.accountNumber.trim()) {
      Alert.alert('Validation Error', 'Bank account number is required');
      return;
    }

    if (!CompanySettingsService.validateIFSC(settings.bankDetails.ifscCode)) {
      Alert.alert('Validation Error', 'Invalid IFSC Code format');
      return;
    }

    setSaving(true);
    try {
      await CompanySettingsService.saveSettings(settings);
      
      // Check if auto-sync is enabled and sync to Google Drive
      const autoSyncEnabled = await BackupService.isAutoSyncEnabled();
      if (autoSyncEnabled && accessToken) {
        try {
          await BackupService.syncToGoogleDrive(accessToken);
          console.log('Company settings synced to Google Drive');
        } catch (syncError) {
          console.error('Error syncing to Google Drive:', syncError);
          // Don't show error to user, just log it
        }
      }
      
      Alert.alert('Success', 'Company settings saved successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };


  const updateField = (field: keyof CompanySettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const updateNumericField = (field: keyof CompanySettings, value: string) => {
    if (!settings) return;
    // Allow empty string
    if (value === '') {
      setSettings({ ...settings, [field]: '' });
      return;
    }
    // Only allow digits
    const numericRegex = /^[0-9]+$/;
    if (numericRegex.test(value)) {
      setSettings({ ...settings, [field]: value });
    }
  };

  const updatePhoneField = (field: keyof CompanySettings, value: string) => {
    if (!settings) return;
    // Allow empty string
    if (value === '') {
      setSettings({ ...settings, [field]: '' });
      return;
    }
    // Only allow digits (no dashes, spaces, or other characters)
    const numericRegex = /^[0-9]+$/;
    if (numericRegex.test(value)) {
      setSettings({ ...settings, [field]: value });
    }
  };

  const updateBankField = (field: keyof CompanySettings['bankDetails'], value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      bankDetails: {
        ...settings.bankDetails,
        [field]: value,
      },
    });
  };

  const updateNumericBankField = (field: keyof CompanySettings['bankDetails'], value: string) => {
    if (!settings) return;
    // Allow empty string
    if (value === '') {
      setSettings({
        ...settings,
        bankDetails: {
          ...settings.bankDetails,
          [field]: '',
        },
      });
      return;
    }
    // Only allow digits
    const numericRegex = /^[0-9]+$/;
    if (numericRegex.test(value)) {
      setSettings({
        ...settings,
        bankDetails: {
          ...settings.bankDetails,
          [field]: value,
        },
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  if (!settings) return null;

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Company Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Details</Text>
          
          <Text style={styles.label}>Company Name *</Text>
          <TextInput
            style={styles.input}
            value={settings.name}
            onChangeText={(text) => updateField('name', text)}
            placeholder="Company Name"
            placeholderTextColor={theme.text.light}
          />

          <Text style={styles.label}>Address Line 1 *</Text>
          <TextInput
            style={styles.input}
            value={settings.address1}
            onChangeText={(text) => updateField('address1', text)}
            placeholder="123, Business Park, Main Street"
            placeholderTextColor={theme.text.light}
          />

          <Text style={styles.label}>Address Line 2</Text>
          <TextInput
            style={styles.input}
            value={settings.address2}
            onChangeText={(text) => updateField('address2', text)}
            placeholder="Area/Locality"
            placeholderTextColor={theme.text.light}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                value={settings.city}
                onChangeText={(text) => updateField('city', text)}
                placeholder="City"
                placeholderTextColor={theme.text.light}
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Pincode *</Text>
              <TextInput
                style={styles.input}
                value={settings.pincode}
                onChangeText={(text) => updateNumericField('pincode', text)}
                placeholder="400001"
                keyboardType="number-pad"
                placeholderTextColor={theme.text.light}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>State *</Text>
              <TextInput
                style={styles.input}
                value={settings.state}
                onChangeText={(text) => updateField('state', text)}
                placeholder="Maharashtra"
                placeholderTextColor={theme.text.light}
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>State Code *</Text>
              <TextInput
                style={styles.input}
                value={settings.stateCode}
                onChangeText={(text) => updateNumericField('stateCode', text)}
                placeholder="27"
                keyboardType="number-pad"
                maxLength={2}
                placeholderTextColor={theme.text.light}
              />
            </View>
          </View>

          <Text style={styles.label}>GSTIN/UIN *</Text>
          <TextInput
            style={styles.input}
            value={settings.gstin}
            onChangeText={(text) => updateField('gstin', text.toUpperCase())}
            placeholder="27ABCDE1234F1Z5"
            autoCapitalize="characters"
            maxLength={15}
            placeholderTextColor={theme.text.light}
          />
        </View>

        {/* Contact Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Details</Text>
          
          <Text style={styles.label}>Mobile Number 1 *</Text>
          <TextInput
            style={styles.input}
            value={settings.mobile1}
            onChangeText={(text) => updatePhoneField('mobile1', text)}
            placeholder="9876543210"
            keyboardType="number-pad"
            placeholderTextColor={theme.text.light}
          />

          <Text style={styles.label}>Mobile Number 2</Text>
          <TextInput
            style={styles.input}
            value={settings.mobile2 || ''}
            onChangeText={(text) => updatePhoneField('mobile2', text)}
            placeholder="9876543211"
            keyboardType="number-pad"
            placeholderTextColor={theme.text.light}
          />

          <Text style={styles.label}>Office Phone</Text>
          <TextInput
            style={styles.input}
            value={settings.officePhone || ''}
            onChangeText={(text) => updatePhoneField('officePhone', text)}
            placeholder="02212345678"
            keyboardType="number-pad"
            placeholderTextColor={theme.text.light}
          />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={settings.email}
            onChangeText={(text) => updateField('email', text)}
            placeholder="company@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={theme.text.light}
          />
        </View>

        {/* Bank Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Details</Text>
          
          <Text style={styles.label}>Account Holder Name *</Text>
          <TextInput
            style={styles.input}
            value={settings.bankDetails.accountHolder}
            onChangeText={(text) => updateBankField('accountHolder', text)}
            placeholder="ABC ENTERPRISES"
            placeholderTextColor={theme.text.light}
          />

          <Text style={styles.label}>Bank Name *</Text>
          <TextInput
            style={styles.input}
            value={settings.bankDetails.bankName}
            onChangeText={(text) => updateBankField('bankName', text)}
            placeholder="STATE BANK OF INDIA"
            placeholderTextColor={theme.text.light}
          />

          <Text style={styles.label}>Account Number *</Text>
          <TextInput
            style={styles.input}
            value={settings.bankDetails.accountNumber}
            onChangeText={(text) => updateNumericBankField('accountNumber', text)}
            placeholder="123456789012"
            keyboardType="number-pad"
            placeholderTextColor={theme.text.light}
          />

          <Text style={styles.label}>Branch *</Text>
          <TextInput
            style={styles.input}
            value={settings.bankDetails.branch}
            onChangeText={(text) => updateBankField('branch', text)}
            placeholder="MAIN BRANCH"
            placeholderTextColor={theme.text.light}
          />

          <Text style={styles.label}>IFSC Code *</Text>
          <TextInput
            style={styles.input}
            value={settings.bankDetails.ifscCode}
            onChangeText={(text) => updateBankField('ifscCode', text.toUpperCase())}
            placeholder="SBIN0001234"
            autoCapitalize="characters"
            placeholderTextColor={theme.text.light}
          />
        </View>

        {/* Invoice Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Settings</Text>
          
          <Text style={styles.label}>Invoice Prefix *</Text>
          <TextInput
            style={styles.input}
            value={settings.invoicePrefix}
            onChangeText={(text) => updateField('invoicePrefix', text.toUpperCase())}
            placeholder="INV"
            autoCapitalize="characters"
            placeholderTextColor={theme.text.light}
          />
          <Text style={styles.hint}>
            This prefix will be added to all invoice numbers (e.g., KTMVS-101)
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={theme.text.inverse} />
        ) : (
          <Text style={styles.saveButtonText}>Save Settings</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Add padding to prevent content from being hidden behind the save button
  },
  section: {
    padding: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text.primary,
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text.secondary,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.input.background,
    color: theme.text.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  hint: {
    fontSize: 12,
    color: theme.text.secondary,
    fontStyle: 'italic',
    marginTop: 5,
  },
  saveButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.primary,
    padding: 18,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: theme.text.inverse,
    fontSize: 18,
    fontWeight: '700',
  },
});

export default CompanySettingsScreen;

