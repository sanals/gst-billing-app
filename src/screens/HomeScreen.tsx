import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors } from '../constants/colors';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.title}>GST Billing App</Text>
        <Text style={styles.subtitle}>Phase 4: Invoice Management</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📄 Invoice Generator</Text>
          <Text style={styles.cardDescription}>
            Generate professional GST invoices in PDF format and share via WhatsApp or email
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#16a34a' }]}
          onPress={() => navigation.navigate('CreateInvoice')}
        >
          <Text style={styles.buttonText}>Create New Invoice</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Products')}
        >
          <Text style={styles.buttonText}>Manage Products</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.buttonSecondary}
          onPress={() => navigation.navigate('CompanySettings')}
        >
          <Text style={styles.buttonSecondaryText}>Company Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.buttonSecondary}
          onPress={() => navigation.navigate('Details')}
        >
          <Text style={styles.buttonSecondaryText}>View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.buttonSecondary}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.buttonSecondaryText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
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
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    shadowColor: colors.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.text.primary,
  },
  cardDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  button: {
    backgroundColor: colors.button.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: colors.button.text,
    fontSize: 18,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: colors.button.secondary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.button.primary,
  },
  buttonSecondaryText: {
    color: colors.button.textSecondary,
    fontSize: 18,
    fontWeight: '600',
  },
});

