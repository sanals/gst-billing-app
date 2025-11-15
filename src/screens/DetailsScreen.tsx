import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';

type RootStackParamList = {
  Home: undefined;
  Details: undefined;
  Settings: undefined;
};

type DetailsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Details'>;
};

export default function DetailsScreen({ navigation }: DetailsScreenProps) {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Details Screen</Text>
          <Text style={styles.subtitle}>Here's some more information</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>App Features</Text>
            <Text style={styles.infoText}>✓ React Native + TypeScript</Text>
            <Text style={styles.infoText}>✓ React Navigation</Text>
            <Text style={styles.infoText}>✓ Native Stack Navigator</Text>
            <Text style={styles.infoText}>✓ Beautiful UI</Text>
            <Text style={styles.infoText}>✓ Type-safe code</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Navigation</Text>
            <Text style={styles.infoDescription}>
              This app uses React Navigation with a native stack navigator
              and full TypeScript support for type-safe navigation.
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>← Go Back</Text>
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
    backgroundColor: colors.secondary,
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
  infoCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.text.primary,
  },
  infoText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  button: {
    backgroundColor: colors.secondary,
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

