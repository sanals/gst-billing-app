import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../contexts/ThemeContext';
import { Invoice } from '../types/invoice';
import { CompanySettings } from '../types/company';
import { PDFService } from '../services/PDFService';
import { CompanySettingsService } from '../services/CompanySettingsService';
import { InvoiceCounterService } from '../services/InvoiceCounterService';
import { numberToWords } from '../utils/numberToWords';

const InvoicePreviewScreen = ({ route, navigation }: any) => {
  const { theme, themeMode } = useTheme();
  const styles = getStyles(theme);
  const { invoice } = route.params as { invoice: Invoice };
  const [generating, setGenerating] = React.useState(false);
  const [companySettings, setCompanySettings] = React.useState<CompanySettings | null>(null);

  React.useEffect(() => {
    loadCompanySettings();
  }, []);

  const loadCompanySettings = async () => {
    const settings = await CompanySettingsService.getSettings();
    setCompanySettings(settings);
  };

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      console.log('Starting PDF generation...');
      console.log('Invoice data:', JSON.stringify(invoice, null, 2));
      
      const filePath = await PDFService.generateInvoicePDF(invoice, companySettings);
      
      console.log('PDF generated successfully at:', filePath);
      
      // Increment invoice counter after successful PDF generation
      await InvoiceCounterService.incrementCounter(invoice.invoicePrefix);
      console.log(`Invoice counter incremented for ${invoice.invoicePrefix}`);
      
      setGenerating(false);
      
      Alert.alert(
        'Success',
        `Invoice ${invoice.fullInvoiceNumber} has been saved and generated successfully!`,
        [
          {
            text: 'Share',
            onPress: async () => {
              try {
                await PDFService.sharePDF(filePath);
              } catch (error) {
                Alert.alert('Error', 'Failed to share invoice');
              }
            },
          },
          {
            text: 'Done',
            onPress: () => navigation.popToTop(),
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('PDF Generation Error:', error);
      setGenerating(false);
      Alert.alert(
        'Error', 
        `Failed to generate invoice: ${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck console for details.`
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.preview}>
          <Text style={styles.companyName}>{companySettings?.name || 'JANAKI ENTERPRISES'}</Text>
          <Text style={styles.address}>{companySettings?.address1}</Text>
          <Text style={styles.address}>{companySettings?.address2}, {companySettings?.city}-{companySettings?.pincode}</Text>
          <Text style={styles.gstin}>GSTIN/UIN: {companySettings?.gstin}</Text>
          
          <View style={styles.invoiceHeader}>
            <View>
              <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
              <Text style={styles.invoiceNumber}>#{invoice.fullInvoiceNumber}</Text>
              <Text style={styles.date}>Date: {invoice.date}</Text>
            </View>
            <View style={styles.stateInfo}>
              <Text style={styles.stateText}>State: {invoice.state}</Text>
              <Text style={styles.stateCode}>Code: {invoice.stateCode}</Text>
            </View>
          </View>

          <View style={styles.billTo}>
            <Text style={styles.billToLabel}>Bill To:</Text>
            <Text style={styles.billToName}>{invoice.outletName}</Text>
            {invoice.outletAddress && (
              <Text style={styles.billToAddress}>{invoice.outletAddress}</Text>
            )}
            {invoice.customerGSTNo && (
              <Text style={styles.customerGST}>GST NO: {invoice.customerGSTNo}</Text>
            )}
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 0.3 }]}>No</Text>
              <Text style={[styles.th, { flex: 1.3 }]}>Product</Text>
              <Text style={[styles.th, { flex: 0.5 }]}>ROT%</Text>
              <Text style={[styles.th, { flex: 0.6 }]}>Qty</Text>
              <Text style={[styles.th, { flex: 0.7 }]}>Rate</Text>
              <Text style={[styles.th, { flex: 0.7 }]}>CGST</Text>
              <Text style={[styles.th, { flex: 0.7 }]}>SGST</Text>
              <Text style={[styles.th, { flex: 0.8 }]}>Total</Text>
            </View>

            {invoice.items.map((item, index) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 0.3 }]}>{index + 1}</Text>
                <View style={{ flex: 1.3 }}>
                  <Text style={styles.td}>{item.product.name}</Text>
                  <Text style={styles.tdSmall}>HSN: {item.product.hsnCode}</Text>
                </View>
                <Text style={[styles.td, { flex: 0.5 }]}>{item.rotPercent}%</Text>
                <Text style={[styles.td, { flex: 0.6 }]}>{item.billedQuantity}</Text>
                <Text style={[styles.td, { flex: 0.7 }]}>₹{item.unitPrice}</Text>
                <Text style={[styles.td, { flex: 0.7 }]}>₹{item.cgstAmount}</Text>
                <Text style={[styles.td, { flex: 0.7 }]}>₹{item.sgstAmount}</Text>
                <Text style={[styles.td, { flex: 0.8 }]}>₹{item.totalAmount}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>₹{invoice.subtotal}</Text>
            </View>
            
            {/* Discount */}
            {invoice.discountType !== 'none' && invoice.discountAmount > 0 && (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    Discount ({invoice.discountType === 'flat' ? `₹${invoice.discountValue}` : `${invoice.discountValue}%`}):
                  </Text>
                  <Text style={[styles.totalValue, { color: theme.error }]}>-₹{invoice.discountAmount}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>After Discount:</Text>
                  <Text style={styles.totalValue}>₹{invoice.subtotalAfterDiscount}</Text>
                </View>
              </>
            )}
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total CGST:</Text>
              <Text style={styles.totalValue}>₹{invoice.totalCGST}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total SGST:</Text>
              <Text style={styles.totalValue}>₹{invoice.totalSGST}</Text>
            </View>
            
            {/* Round Off */}
            {invoice.roundOff !== 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Round Off:</Text>
                <Text style={[styles.totalValue, { color: invoice.roundOff > 0 ? theme.success : theme.error }]}>
                  {invoice.roundOff > 0 ? '+' : ''}₹{invoice.roundOff}
                </Text>
              </View>
            )}
            
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.grandTotalLabel}>Grand Total:</Text>
              <Text style={styles.grandTotalValue}>₹{invoice.grandTotal}</Text>
            </View>
          </View>

          <View style={styles.amountWords}>
            <Text style={styles.amountWordsLabel}>Amount in Words:</Text>
            <Text style={styles.amountWordsText}>
              {numberToWords(invoice.grandTotal)}
            </Text>
          </View>

          {/* Bank Details Section */}
          {companySettings && (
            <View style={styles.bankDetails}>
              <Text style={styles.bankDetailsTitle}>Company's Bank Details</Text>
              <View style={styles.bankDetailsContent}>
                <Text style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>A/c Holder's Name: </Text>
                  <Text style={styles.bankDetailValue}>{companySettings.bankDetails.accountHolder}</Text>
                </Text>
                <Text style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Bank Name: </Text>
                  <Text style={styles.bankDetailValue}>{companySettings.bankDetails.bankName}</Text>
                </Text>
                <Text style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>A/c No.: </Text>
                  <Text style={styles.bankDetailValue}>{companySettings.bankDetails.accountNumber}</Text>
                </Text>
                <Text style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Branch & IFSC Code: </Text>
                  <Text style={styles.bankDetailValue}>{companySettings.bankDetails.branch} & {companySettings.bankDetails.ifscCode}</Text>
                </Text>
              </View>
            </View>
          )}

          {/* Signature Section */}
          <View style={styles.signatureSection}>
            <Text style={styles.forCompany}>For {companySettings?.name || 'JANAKI ENTERPRISES'}</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.authorisedSignatory}>Authorised Signatory</Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.generateButton}
        onPress={handleGeneratePDF}
        disabled={generating}
      >
        {generating ? (
          <ActivityIndicator color={theme.text.inverse} />
        ) : (
          <Text style={styles.generateButtonText}>Save & Generate PDF</Text>
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
  scrollView: {
    flex: 1,
  },
  preview: {
    margin: 15,
    padding: 20,
    backgroundColor: theme.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  companyName: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: theme.text.primary,
  },
  address: {
    fontSize: 12,
    textAlign: 'center',
    color: theme.text.secondary,
  },
  gstin: {
    fontSize: 13,
    textAlign: 'center',
    color: theme.text.primary,
    fontWeight: '600',
    marginTop: 5,
    marginBottom: 10,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: theme.border,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 5,
  },
  invoiceNumber: {
    fontSize: 16,
    color: theme.text.secondary,
  },
  date: {
    fontSize: 14,
    color: theme.text.secondary,
  },
  stateInfo: {
    alignItems: 'flex-end',
  },
  stateText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text.primary,
  },
  stateCode: {
    fontSize: 13,
    color: theme.text.secondary,
  },
  billTo: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: theme.background,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
  },
  billToLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text.secondary,
    marginBottom: 5,
  },
  billToName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text.primary,
  },
  billToAddress: {
    fontSize: 13,
    color: theme.text.secondary,
    marginTop: 3,
  },
  customerGST: {
    fontSize: 12,
    color: theme.text.primary,
    fontWeight: '600',
    marginTop: 5,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: theme.background,
    padding: 10,
    borderRadius: 6,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.text.primary,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    alignItems: 'center',
  },
  td: {
    fontSize: 12,
    color: theme.text.primary,
  },
  tdSmall: {
    fontSize: 10,
    color: theme.text.secondary,
  },
  totals: {
    marginTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  totalLabel: {
    fontSize: 15,
    color: theme.text.secondary,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text.primary,
  },
  grandTotal: {
    borderTopWidth: 2,
    borderTopColor: theme.border,
    marginTop: 10,
    paddingTop: 10,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text.primary,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.primary,
  },
  amountWords: {
    marginTop: 20,
    padding: 15,
    backgroundColor: theme.background,
    borderRadius: 6,
  },
  amountWordsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text.secondary,
    marginBottom: 5,
  },
  amountWordsText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: theme.text.primary,
    lineHeight: 18,
  },
  bankDetails: {
    marginTop: 20,
    padding: 15,
    backgroundColor: theme.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  bankDetailsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text.primary,
    marginBottom: 10,
  },
  bankDetailsContent: {
    gap: 5,
  },
  bankDetailRow: {
    fontSize: 12,
    color: theme.text.secondary,
    marginBottom: 5,
  },
  bankDetailLabel: {
    fontWeight: '600',
    color: theme.text.secondary,
  },
  bankDetailValue: {
    fontWeight: '400',
    color: theme.text.primary,
  },
  signatureSection: {
    marginTop: 30,
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  forCompany: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 40,
  },
  signatureLine: {
    width: 200,
    height: 1,
    backgroundColor: theme.text.primary,
    marginBottom: 5,
  },
  authorisedSignatory: {
    fontSize: 12,
    color: theme.text.secondary,
  },
  generateButton: {
    backgroundColor: theme.primary,
    padding: 18,
    alignItems: 'center',
  },
  generateButtonText: {
    color: theme.text.inverse,
    fontSize: 18,
    fontWeight: '700',
  },
});

export default InvoicePreviewScreen;

