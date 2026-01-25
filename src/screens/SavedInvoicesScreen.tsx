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
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import { PDFService } from '../services/PDFService';
import { InvoiceReportService } from '../services/ReportService';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { RootStackParamList } from '../navigation/AppNavigator';
import DateTimePicker from '@react-native-community/datetimepicker';

type SavedInvoicesScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'SavedInvoices'>;
};

interface SavedInvoice {
  uri: string;
  name: string;
  size?: number;
  modificationTime?: number;
}

type FilterType = 'today' | 'date' | 'month' | 'custom';

export default function SavedInvoicesScreen({ navigation }: SavedInvoicesScreenProps) {
  const { theme, themeMode } = useTheme();
  const styles = getStyles(theme);
  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sharing, setSharing] = useState<string | null>(null);

  // Summary modal state
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('today');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState<'date' | 'start' | 'end' | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // Custom month picker state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const savedInvoices = await PDFService.getSavedInvoices();
      const invoiceList: SavedInvoice[] = savedInvoices.map((info) => {
        const fileName = info.uri.split('/').pop() || 'Unknown';
        const baseName = fileName.replace('.pdf', '');

        let displayName = baseName;

        // Handle Summary files differently
        if (baseName.startsWith('Summary_')) {
          // New format: Summary_Jan-2026_timestamp.pdf or Summary_2026-01-25_timestamp.pdf
          // Remove timestamp (last underscore-number part)
          const withoutTimestamp = baseName.replace(/_\d+$/, '');
          // Replace underscores with spaces and clean up
          displayName = withoutTimestamp.replace(/_/g, ' ').replace(' to ', ' to ');
        } else {
          // Regular invoices: InvoiceNumber_YYYY-MM-DD.pdf
          // Split by underscore, remove the last part (date.pdf), and join the rest with dashes
          const parts = baseName.split('_');
          const invoiceParts = parts.slice(0, -1); // All parts except the date
          displayName = invoiceParts.join('-') || baseName;
        }

        return {
          uri: info.uri,
          name: displayName,
          size: info.exists ? info.size : 0,
          modificationTime: info.exists ? info.modificationTime : 0,
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

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      let invoicesData: any[] = [];
      let summaryStartDate = new Date();
      let summaryEndDate = new Date();

      switch (filterType) {
        case 'today':
          invoicesData = await InvoiceReportService.getTodayInvoices();
          summaryStartDate = new Date();
          summaryEndDate = new Date();
          break;
        case 'date':
          invoicesData = await InvoiceReportService.getInvoicesByDateRange(selectedDate, selectedDate);
          summaryStartDate = selectedDate;
          summaryEndDate = selectedDate;
          break;
        case 'month':
          // Use the custom month picker values
          summaryStartDate = new Date(selectedYear, selectedMonth, 1); // First day
          summaryEndDate = new Date(selectedYear, selectedMonth + 1, 0); // Last day
          invoicesData = await InvoiceReportService.getInvoicesByDateRange(summaryStartDate, summaryEndDate);
          break;
        case 'custom':
          invoicesData = await InvoiceReportService.getInvoicesByDateRange(startDate, endDate);
          summaryStartDate = startDate;
          summaryEndDate = endDate;
          break;
        default:
          invoicesData = [];
      }

      const summary = InvoiceReportService.calculateSummary(
        invoicesData,
        summaryStartDate,
        summaryEndDate,
        filterType
      );

      const pdfPath = await InvoiceReportService.generateSummaryPDF(summary);

      setShowSummaryModal(false);
      loadInvoices(); // Refresh list to show new summary

      // Ask user if they want to share now
      Alert.alert(
        'Summary Generated!',
        `Invoices: ${summary.totalCount}\nTotal: ₹${summary.totalAmount.toFixed(2)}\n\nWould you like to share it now?`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Share Now',
            onPress: async () => {
              try {
                await PDFService.sharePDF(pdfPath);
              } catch (e) {
                console.error('Share error:', e);
              }
            }
          },
        ]
      );
    } catch (error) {
      console.error('Error generating summary:', error);
      Alert.alert('Error', 'Failed to generate summary');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      switch (showDatePicker) {
        case 'date':
          setSelectedDate(date);
          break;
        case 'start':
          setStartDate(date);
          break;
        case 'end':
          setEndDate(date);
          break;
      }
    }
    setShowDatePicker(null);
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

  const formatDateShort = (date: Date): string => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderSummaryModal = () => (
    <Modal
      visible={showSummaryModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowSummaryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Generate Summary</Text>

          {/* Filter Type Selection */}
          <Text style={styles.sectionLabel}>Select Period</Text>
          <View style={styles.filterButtons}>
            {(['today', 'date', 'month', 'custom'] as FilterType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterButton,
                  filterType === type && styles.filterButtonActive,
                ]}
                onPress={() => setFilterType(type)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filterType === type && styles.filterButtonTextActive,
                  ]}
                >
                  {type === 'today' ? 'Today' :
                    type === 'date' ? 'Date' :
                      type === 'month' ? 'Month' : 'Custom'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Date Selection based on filter type */}
          {filterType === 'date' && (
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowDatePicker('date')}
            >
              <Text style={styles.dateSelectorLabel}>Select Date:</Text>
              <Text style={styles.dateSelectorValue}>{formatDateShort(selectedDate)}</Text>
            </TouchableOpacity>
          )}

          {filterType === 'month' && (
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowMonthPicker(true)}
            >
              <Text style={styles.dateSelectorLabel}>Select Month:</Text>
              <Text style={styles.dateSelectorValue}>
                {new Date(selectedYear, selectedMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
          )}

          {filterType === 'custom' && (
            <View style={styles.customDateContainer}>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowDatePicker('start')}
              >
                <Text style={styles.dateSelectorLabel}>From:</Text>
                <Text style={styles.dateSelectorValue}>{formatDateShort(startDate)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowDatePicker('end')}
              >
                <Text style={styles.dateSelectorLabel}>To:</Text>
                <Text style={styles.dateSelectorValue}>{formatDateShort(endDate)}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={
                showDatePicker === 'start' ? startDate :
                  showDatePicker === 'end' ? endDate : selectedDate
              }
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowSummaryModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.generateButton]}
              onPress={handleGenerateSummary}
              disabled={generatingSummary}
            >
              {generatingSummary ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.generateButtonText}>Generate PDF</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const renderMonthPickerModal = () => (
    <Modal
      visible={showMonthPicker}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowMonthPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.monthPickerContent}>
          <Text style={styles.modalTitle}>Select Month</Text>

          {/* Year Selector */}
          <View style={styles.yearSelector}>
            <TouchableOpacity
              style={styles.yearButton}
              onPress={() => setSelectedYear(y => y - 1)}
            >
              <Text style={styles.yearButtonText}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.yearText}>{selectedYear}</Text>
            <TouchableOpacity
              style={styles.yearButton}
              onPress={() => setSelectedYear(y => y + 1)}
            >
              <Text style={styles.yearButtonText}>▶</Text>
            </TouchableOpacity>
          </View>

          {/* Month Grid */}
          <View style={styles.monthGrid}>
            {MONTHS.map((month, index) => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.monthItem,
                  selectedMonth === index && styles.monthItemActive,
                ]}
                onPress={() => setSelectedMonth(index)}
              >
                <Text style={[
                  styles.monthItemText,
                  selectedMonth === index && styles.monthItemTextActive,
                ]}>
                  {month}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowMonthPicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.generateButton]}
              onPress={() => setShowMonthPicker(false)}
            >
              <Text style={styles.generateButtonText}>Select</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading saved invoices...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />

      {/* Summary Button */}
      <TouchableOpacity
        style={styles.summaryButton}
        onPress={() => setShowSummaryModal(true)}
      >
        <Text style={styles.summaryButtonText}>📊 Generate Summary</Text>
      </TouchableOpacity>

      {invoices.length === 0 ? (
        <View style={styles.emptyContainer}>
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
      ) : (
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
      )}
      {renderSummaryModal()}
      {renderMonthPickerModal()}
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text.primary,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: theme.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  summaryButton: {
    backgroundColor: theme.primary,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  summaryButtonText: { color: theme.text.inverse, fontSize: 16, fontWeight: '600' },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  invoiceCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: theme.card.shadow,
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
    color: theme.text.primary,
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 14,
    color: theme.text.secondary,
    marginBottom: 2,
  },
  invoiceSize: {
    fontSize: 12,
    color: theme.text.secondary,
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
    backgroundColor: theme.success,
  },
  shareButton: {
    backgroundColor: theme.primary,
  },
  deleteButton: {
    backgroundColor: theme.error,
  },
  actionButtonText: {
    color: theme.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal styles (Adding these to existing styles)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.secondary,
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  filterButtonText: {
    fontSize: 13,
    color: theme.text.primary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: theme.text.inverse,
  },
  dateSelector: {
    backgroundColor: theme.background,
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  dateSelectorLabel: {
    fontSize: 12,
    color: theme.text.secondary,
    marginBottom: 4,
  },
  dateSelectorValue: {
    fontSize: 16,
    color: theme.text.primary,
    fontWeight: '600',
  },
  customDateContainer: {
    gap: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cancelButtonText: {
    color: theme.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: theme.primary,
  },
  generateButtonText: {
    color: theme.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },

  // Month Picker Modal Styles
  monthPickerContent: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 360,
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  yearButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: theme.background,
  },
  yearButtonText: {
    fontSize: 18,
    color: theme.primary,
    fontWeight: '600',
  },
  yearText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text.primary,
    minWidth: 60,
    textAlign: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  monthItem: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
  },
  monthItemActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  monthItemText: {
    fontSize: 14,
    color: theme.text.primary,
    fontWeight: '500',
  },
  monthItemTextActive: {
    color: theme.text.inverse,
  },
});

