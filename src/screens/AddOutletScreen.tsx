import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp, RouteProp } from '@react-navigation/stack';
import { COLORS } from '../constants/colors';
import { Outlet } from '../types/outlet';
import { OutletService } from '../services/OutletService';
import { RootStackParamList } from '../navigation/AppNavigator';

type AddOutletScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'AddOutlet'>;
  route: RouteProp<RootStackParamList, 'AddOutlet'>;
};

export default function AddOutletScreen({ navigation, route }: AddOutletScreenProps) {
  const outlet = route.params?.outlet;
  const isEditing = !!outlet;

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [gstNo, setGstNo] = useState('');

  useEffect(() => {
    if (outlet) {
      setName(outlet.name);
      setAddress(outlet.address);
      setGstNo(outlet.gstNo || '');
    }
  }, [outlet]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter outlet name');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Please enter outlet address');
      return;
    }

    try {
      if (isEditing && outlet) {
        await OutletService.updateOutlet(outlet.id, {
          name: name.trim(),
          address: address.trim(),
          gstNo: gstNo.trim() || undefined,
        });
        Alert.alert('Success', 'Outlet updated successfully');
      } else {
        await OutletService.addOutlet({
          name: name.trim(),
          address: address.trim(),
          gstNo: gstNo.trim() || undefined,
        });
        Alert.alert('Success', 'Outlet added successfully');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save outlet');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.title}>{isEditing ? 'Edit Outlet' : 'Add Outlet'}</Text>
        <Text style={styles.subtitle}>
          {isEditing ? 'Update outlet details' : 'Add a new customer outlet'}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.form}>
          <Text style={styles.label}>Outlet Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter outlet name"
            placeholderTextColor={COLORS.text.light}
          />

          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter complete address"
            placeholderTextColor={COLORS.text.light}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>GST Number (Optional)</Text>
          <TextInput
            style={styles.input}
            value={gstNo}
            onChangeText={setGstNo}
            placeholder="Enter GST number"
            placeholderTextColor={COLORS.text.light}
            maxLength={15}
            autoCapitalize="characters"
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Update Outlet' : 'Save Outlet'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.accent,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: COLORS.text.primary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: COLORS.primary || '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

