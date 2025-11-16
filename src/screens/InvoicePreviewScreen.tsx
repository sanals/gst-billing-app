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
import { COLORS } from '../constants/colors';
import { Invoice } from '../types/invoice';
import { PDFService } from '../services/PDFService';
import { numberToWords } from '../utils/numberToWords';

const InvoicePreviewScreen = ({ route, navigation }: any) => {
  const { invoice } = route.params as { invoice: Invoice };
  const [generating, setGenerating] = React.useState(false);

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      console.log('Starting PDF generation...');
      console.log('Invoice data:', JSON.stringify(invoice, null, 2));
      
      const filePath = await PDFService.generateInvoicePDF(invoice);
      
      console.log('PDF generated successfully at:', filePath);
      
      setGenerating(false);
      
      Alert.alert(
        'Success',
        'Invoice generated successfully!',
        [
          { text: 'OK', onPress: () => navigation.popToTop() },
          {
            text: 'Share',
            onPress: async () => {
              await PDFService.sharePDF(filePath);
              navigation.popToTop();
            },
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
      <ScrollView style={styles.scrollView}>
        <View style={styles.preview}>
          <Text style={styles.companyName}>JANAKI ENTERPRISES</Text>
          <Text style={styles.address}>MP12/43, Greenilayam Shopping Complex</Text>
          <Text style={styles.address}>Postitthol, Kottayam-834034</Text>
          
          <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
          <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
          <Text style={styles.date}>Date: {invoice.date}</Text>

          <View style={styles.billTo}>
            <Text style={styles.billToLabel}>Bill To:</Text>
            <Text style={styles.billToName}>{invoice.outletName}</Text>
            {invoice.outletAddress && (
              <Text style={styles.billToAddress}>{invoice.outletAddress}</Text>
            )}
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 0.4 }]}>No</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>Product</Text>
              <Text style={[styles.th, { flex: 0.7 }]}>Qty</Text>
              <Text style={[styles.th, { flex: 0.8 }]}>Rate</Text>
              <Text style={[styles.th, { flex: 0.8 }]}>CGST</Text>
              <Text style={[styles.th, { flex: 0.8 }]}>SGST</Text>
              <Text style={[styles.th, { flex: 0.9 }]}>Total</Text>
            </View>

            {invoice.items.map((item, index) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 0.4 }]}>{index + 1}</Text>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.td}>{item.product.name}</Text>
                  <Text style={styles.tdSmall}>HSN: {item.product.hsnCode}</Text>
                </View>
                <Text style={[styles.td, { flex: 0.7 }]}>{item.billedQuantity}</Text>
                <Text style={[styles.td, { flex: 0.8 }]}>₹{item.unitPrice}</Text>
                <Text style={[styles.td, { flex: 0.8 }]}>₹{item.cgstAmount}</Text>
                <Text style={[styles.td, { flex: 0.8 }]}>₹{item.sgstAmount}</Text>
                <Text style={[styles.td, { flex: 0.9 }]}>₹{item.totalAmount}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>₹{invoice.subtotal}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total CGST:</Text>
              <Text style={styles.totalValue}>₹{invoice.totalCGST}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total SGST:</Text>
              <Text style={styles.totalValue}>₹{invoice.totalSGST}</Text>
            </View>
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
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.generateButton}
        onPress={handleGeneratePDF}
        disabled={generating}
      >
        {generating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.generateButtonText}>Generate PDF & Share</Text>
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
  scrollView: {
    flex: 1,
  },
  preview: {
    margin: 15,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  companyName: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.text.primary,
  },
  address: {
    fontSize: 12,
    textAlign: 'center',
    color: COLORS.text.secondary,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 5,
  },
  invoiceNumber: {
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.text.secondary,
  },
  date: {
    fontSize: 14,
    textAlign: 'center',
    color: COLORS.text.secondary,
    marginBottom: 20,
  },
  billTo: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  billToLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 5,
  },
  billToName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  billToAddress: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 3,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 6,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  td: {
    fontSize: 12,
    color: COLORS.text.primary,
  },
  tdSmall: {
    fontSize: 10,
    color: COLORS.text.secondary,
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
    color: COLORS.text.secondary,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  grandTotal: {
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
    marginTop: 10,
    paddingTop: 10,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  amountWords: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
  },
  amountWordsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 5,
  },
  amountWordsText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: COLORS.text.primary,
    lineHeight: 18,
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default InvoicePreviewScreen;

