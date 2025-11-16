import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../contexts/ThemeContext';
import { StorageService } from '../services/StorageService';

const GST_RATES = [5, 12, 18, 28];
const UNITS = ['Pcs', 'Kg', 'Ltr', 'Box'];

const AddProductScreen = ({ navigation, route }: any) => {
  const { theme, themeMode } = useTheme();
  const styles = getStyles(theme);
  const [name, setName] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [gstRate, setGstRate] = useState(18);
  const [unit, setUnit] = useState('Pcs');

  const handleBasePriceChange = (value: string) => {
    // Allow empty string for clearing
    if (value === '' || value === '.') {
      setBasePrice(value);
      return;
    }

    // Validate: only allow numbers and one decimal point
    const numericRegex = /^[0-9]*\.?[0-9]*$/;
    if (!numericRegex.test(value)) {
      return; // Don't update if invalid
    }

    // Prevent negative values (check if starts with minus)
    if (value.startsWith('-')) {
      return;
    }

    setBasePrice(value);
  };

  const handleSave = async () => {
    if (!name || !hsnCode || !basePrice) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const price = parseFloat(basePrice);
    if (isNaN(price) || price < 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    const product = {
      id: Date.now().toString(),
      name,
      hsnCode,
      basePrice: price,
      gstRate,
      unit,
    };

    try {
      await StorageService.addProduct(product);
      Alert.alert('Success', 'Product added successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save product');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <ScrollView style={styles.form}>
        <Text style={styles.label}>Product Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter product name"
          placeholderTextColor={theme.text.light}
        />

        <Text style={styles.label}>HSN Code *</Text>
        <TextInput
          style={styles.input}
          value={hsnCode}
          onChangeText={setHsnCode}
          placeholder="Enter HSN code"
          placeholderTextColor={theme.text.light}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Base Price *</Text>
        <TextInput
          style={styles.input}
          value={basePrice}
          onChangeText={handleBasePriceChange}
          placeholder="Enter base price"
          placeholderTextColor={theme.text.light}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>GST Rate</Text>
        <View style={styles.gstContainer}>
          {GST_RATES.map((rate) => (
            <TouchableOpacity
              key={rate}
              style={[styles.gstButton, gstRate === rate && styles.gstButtonActive]}
              onPress={() => setGstRate(rate)}
            >
              <Text style={[styles.gstText, gstRate === rate && styles.gstTextActive]}>
                {rate}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Unit</Text>
        <View style={styles.gstContainer}>
          {UNITS.map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.gstButton, unit === u && styles.gstButtonActive]}
              onPress={() => setUnit(u)}
            >
              <Text style={[styles.gstText, unit === u && styles.gstTextActive]}>
                {u}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Product</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 8,
    marginTop: 15,
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
  gstContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gstButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  gstButtonActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  gstText: {
    fontSize: 14,
    color: theme.text.primary,
  },
  gstTextActive: {
    color: theme.text.inverse,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: theme.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: theme.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddProductScreen;

