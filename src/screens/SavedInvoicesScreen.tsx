import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../constants/colors';
import { PDFService } from '../services/PDFService';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { RootStackParamList } from '../navigation/AppNavigator';

type SavedInvoicesScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'SavedInvoices'>;
};

interface SavedInvoice {
  uri: string;
  name: string;
  size?: number;
  modificationTime?: number;
}

export default function SavedInvoicesScreen({ navigation }: SavedInvoicesScreenProps) {
  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sharing, setSharing] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const savedInvoices = await PDFService.getSavedInvoices();
      const invoiceList: SavedInvoice[] = savedInvoices.map((info) => {
        const fileName = info.uri.split('/').pop() || 'Unknown';
        // Extract invoice number from filename (format: KTMVS_101_2024-01-15.pdf)
        // Split by underscore, remove the last part (date.pdf), and join the rest with dashes
        const parts = fileName.replace('.pdf', '').split('_');
        const datePart = parts[parts.length - 1]; // Last part is the date
        const invoiceParts = parts.slice(0, -1); // All parts except the date
        const invoiceNumber = invoiceParts.join('-'); // Join with dashes to restore original format
        
        return {
          uri: info.uri,
          name: invoiceNumber || 'Unknown',
          size: info.size,
          modificationTime: info.modificationTime,
        };
      });
      setInvoices(invoiceList);
    } catch (error) {
      console.error('Error loading invoices:', error);
      Alert.alert('Error', 'Failed to load saved invoices');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadInvoices();
  };

  const handlePreview = async (uri: string) => {
    try {
      if (Platform.OS === 'android') {
        // For Android, use IntentLauncher to open PDF with system viewer
        try {
          // Get content URI for the file
          let contentUri = uri;
          
          // Try to get content URI if the method exists
          try {
            if (FileSystem.getContentUriAsync) {
              contentUri = await FileSystem.getContentUriAsync(uri);
            }
          } catch (e) {
            // If getContentUriAsync doesn't exist or fails, use the file URI
            console.log('Using file URI directly');
          }

          // Use IntentLauncher to open the PDF
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
            type: 'application/pdf',
          });
        } catch (intentError) {
          console.error('Intent launcher error:', intentError);
          // Fallback: try sharing instead
          Alert.alert(
            'Preview Not Available',
            'No PDF viewer app found. Would you like to share the PDF instead?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Share',
                onPress: () => handleShare(uri, 'Invoice'),
              },
            ]
          );
        }
      } else {
        // For iOS, use the file URI directly with Linking
        const canOpen = await Linking.canOpenURL(uri);
        if (canOpen) {
          await Linking.openURL(uri);
        } else {
          Alert.alert(
            'Preview Not Available',
            'Unable to open PDF. Would you like to share it instead?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Share',
                onPress: () => handleShare(uri, 'Invoice'),
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error previewing invoice:', error);
      Alert.alert(
        'Preview Error',
        'Failed to open PDF. Would you like to share it instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share',
            onPress: () => handleShare(uri, 'Invoice'),
          },
        ]
      );
    }
  };

  const handleShare = async (uri: string, name: string) => {
    setSharing(uri);
    try {
      await PDFService.sharePDF(uri);
    } catch (error) {
      console.error('Error sharing invoice:', error);
      Alert.alert('Error', 'Failed to share invoice');
    } finally {
      setSharing(null);
    }
  };

  const handleDelete = (uri: string, name: string) => {
    Alert.alert(
      'Delete Invoice',
      `Are you sure you want to delete ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await PDFService.deletePDF(uri);
              Alert.alert('Success', 'Invoice deleted successfully');
              loadInvoices(); // Reload the list
            } catch (error) {
              console.error('Error deleting invoice:', error);
              Alert.alert('Error', 'Failed to delete invoice');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading saved invoices...</Text>
      </View>
    );
  }

  if (invoices.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No saved invoices</Text>
        <Text style={styles.emptySubtext}>
          Generated invoices will be saved here automatically
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={invoices}
        keyExtractor={(item) => item.uri}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item }) => (
          <View style={styles.invoiceCard}>
            <View style={styles.invoiceInfo}>
              <Text style={styles.invoiceName}>{item.name}</Text>
              <Text style={styles.invoiceDate}>{formatDate(item.modificationTime)}</Text>
              <Text style={styles.invoiceSize}>{formatFileSize(item.size)}</Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.previewButton]}
                onPress={() => handlePreview(item.uri)}
              >
                <Text style={styles.actionButtonText}>Preview</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.shareButton]}
                onPress={() => handleShare(item.uri, item.name)}
                disabled={sharing === item.uri}
              >
                {sharing === item.uri ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>Share</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(item.uri, item.name)}
              >
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  invoiceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invoiceInfo: {
    marginBottom: 12,
  },
  invoiceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  invoiceSize: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewButton: {
    backgroundColor: '#16a34a',
  },
  shareButton: {
    backgroundColor: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

