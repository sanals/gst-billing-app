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
import { COLORS } from '../constants/colors';
import { CompanySettings } from '../types/company';
import { CompanySettingsService } from '../services/CompanySettingsService';

const CompanySettingsScreen = ({ navigation }: any) => {
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
      Alert.alert('Success', 'Company settings saved successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await CompanySettingsService.resetToDefaults();
              await loadSettings();
              Alert.alert('Success', 'Settings reset to defaults');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset settings');
            }
          },
        },
      ]
    );
  };

  const updateField = (field: keyof CompanySettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  if (!settings) return null;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Company Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Details</Text>
          
          <Text style={styles.label}>Company Name *</Text>
          <TextInput
            style={styles.input}
            value={settings.name}
            onChangeText={(text) => updateField('name', text)}
            placeholder="Company Name"
          />

          <Text style={styles.label}>Address Line 1 *</Text>
          <TextInput
            style={styles.input}
            value={settings.address1}
            onChangeText={(text) => updateField('address1', text)}
            placeholder="MP12/43, Shopping Complex"
          />

          <Text style={styles.label}>Address Line 2</Text>
          <TextInput
            style={styles.input}
            value={settings.address2}
            onChangeText={(text) => updateField('address2', text)}
            placeholder="Area/Locality"
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                value={settings.city}
                onChangeText={(text) => updateField('city', text)}
                placeholder="City"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Pincode *</Text>
              <TextInput
                style={styles.input}
                value={settings.pincode}
                onChangeText={(text) => updateField('pincode', text)}
                placeholder="834034"
                keyboardType="number-pad"
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
                placeholder="Kerala"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>State Code *</Text>
              <TextInput
                style={styles.input}
                value={settings.stateCode}
                onChangeText={(text) => updateField('stateCode', text)}
                placeholder="22"
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>

          <Text style={styles.label}>GSTIN/UIN *</Text>
          <TextInput
            style={styles.input}
            value={settings.gstin}
            onChangeText={(text) => updateField('gstin', text.toUpperCase())}
            placeholder="22AAUPJ7SS1B12M"
            autoCapitalize="characters"
            maxLength={15}
          />
        </View>

        {/* Contact Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Details</Text>
          
          <Text style={styles.label}>Mobile Number 1 *</Text>
          <TextInput
            style={styles.input}
            value={settings.mobile1}
            onChangeText={(text) => updateField('mobile1', text)}
            placeholder="9838884048"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Mobile Number 2</Text>
          <TextInput
            style={styles.input}
            value={settings.mobile2 || ''}
            onChangeText={(text) => updateField('mobile2', text)}
            placeholder="9211055768"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Office Phone</Text>
          <TextInput
            style={styles.input}
            value={settings.officePhone || ''}
            onChangeText={(text) => updateField('officePhone', text)}
            placeholder="44929 799627"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={settings.email}
            onChangeText={(text) => updateField('email', text)}
            placeholder="janakienterprises@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
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
            placeholder="JANAKI ENTERPRISES"
          />

          <Text style={styles.label}>Bank Name *</Text>
          <TextInput
            style={styles.input}
            value={settings.bankDetails.bankName}
            onChangeText={(text) => updateBankField('bankName', text)}
            placeholder="INDIAN BANK"
          />

          <Text style={styles.label}>Account Number *</Text>
          <TextInput
            style={styles.input}
            value={settings.bankDetails.accountNumber}
            onChangeText={(text) => updateBankField('accountNumber', text)}
            placeholder="7926826378"
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Branch *</Text>
          <TextInput
            style={styles.input}
            value={settings.bankDetails.branch}
            onChangeText={(text) => updateBankField('branch', text)}
            placeholder="AKATHETRARIA"
          />

          <Text style={styles.label}>IFSC Code *</Text>
          <TextInput
            style={styles.input}
            value={settings.bankDetails.ifscCode}
            onChangeText={(text) => updateBankField('ifscCode', text.toUpperCase())}
            placeholder="IDIBD00A007"
            autoCapitalize="characters"
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
            placeholder="KTMVS"
            autoCapitalize="characters"
          />
          <Text style={styles.hint}>
            This prefix will be added to all invoice numbers (e.g., KTMVS-101)
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            disabled={saving}
          >
            <Text style={styles.resetButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Settings</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
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
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    marginTop: 5,
  },
  buttonContainer: {
    padding: 15,
    marginBottom: 100,
  },
  resetButton: {
    backgroundColor: '#ef4444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    padding: 18,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default CompanySettingsScreen;

