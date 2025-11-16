import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { Product } from '../types/product';
import { InvoiceItem } from '../types/invoice';
import { StorageService } from '../services/StorageService';
import { calculateLineItem, calculateInvoiceTotals } from '../utils/calculations';

const CreateInvoiceScreen = ({ navigation }: any) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [outletName, setOutletName] = useState('');
  const [outletAddress, setOutletAddress] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await StorageService.getProducts();
    setProducts(data);
  };

  const addProduct = (product: Product) => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      product,
      actualQuantity: 0,
      billedQuantity: 0,
      unitPrice: product.basePrice,
      taxableAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      totalAmount: 0,
    };
    setInvoiceItems([...invoiceItems, newItem]);
    setShowProductPicker(false);
  };

  const updateQuantity = (itemId: string, field: 'actualQuantity' | 'billedQuantity', value: string) => {
    const qty = parseFloat(value) || 0;
    setInvoiceItems(items =>
      items.map(item => {
        if (item.id !== itemId) return item;

        const updated = { ...item, [field]: qty };
        if (field === 'billedQuantity') {
          const calculated = calculateLineItem(item.product, qty, item.unitPrice);
          return { ...updated, ...calculated };
        }
        return updated;
      })
    );
  };

  const updateUnitPrice = (itemId: string, value: string) => {
    const price = parseFloat(value) || 0;
    setInvoiceItems(items =>
      items.map(item => {
        if (item.id !== itemId) return item;

        const calculated = calculateLineItem(item.product, item.billedQuantity, price);
        return { ...item, unitPrice: price, ...calculated };
      })
    );
  };

  const removeItem = (itemId: string) => {
    setInvoiceItems(items => items.filter(item => item.id !== itemId));
  };

  const handleGenerateInvoice = () => {
    if (!outletName.trim()) {
      Alert.alert('Error', 'Please enter outlet name');
      return;
    }
    if (invoiceItems.length === 0) {
      Alert.alert('Error', 'Please add at least one product');
      return;
    }
    if (invoiceItems.some(item => item.billedQuantity === 0)) {
      Alert.alert('Error', 'Please enter quantity for all items');
      return;
    }

    const totals = calculateInvoiceTotals(invoiceItems);
    navigation.navigate('InvoicePreview', {
      invoice: {
        id: Date.now().toString(),
        invoiceNumber: `INV${Date.now()}`,
        date: new Date().toLocaleDateString(),
        outletName,
        outletAddress,
        items: invoiceItems,
        ...totals,
      },
    });
  };

  const totals = calculateInvoiceTotals(invoiceItems);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outlet Details</Text>
          <TextInput
            style={styles.input}
            value={outletName}
            onChangeText={setOutletName}
            placeholder="Outlet Name *"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            value={outletAddress}
            onChangeText={setOutletAddress}
            placeholder="Outlet Address (Optional)"
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Products</Text>
            <TouchableOpacity
              style={styles.addProductButton}
              onPress={() => setShowProductPicker(true)}
            >
              <Text style={styles.addProductText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {invoiceItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.product.name}</Text>
                <TouchableOpacity onPress={() => removeItem(item.id)}>
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.itemDetail}>
                HSN: {item.product.hsnCode} | GST: {item.product.gstRate}%
              </Text>

              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Actual Qty</Text>
                  <TextInput
                    style={styles.smallInput}
                    value={item.actualQuantity.toString()}
                    onChangeText={(val) => updateQuantity(item.id, 'actualQuantity', val)}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Billed Qty *</Text>
                  <TextInput
                    style={styles.smallInput}
                    value={item.billedQuantity.toString()}
                    onChangeText={(val) => updateQuantity(item.id, 'billedQuantity', val)}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Unit Price</Text>
                  <TextInput
                    style={styles.smallInput}
                    value={item.unitPrice.toString()}
                    onChangeText={(val) => updateUnitPrice(item.id, val)}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {item.billedQuantity > 0 && (
                <View style={styles.calculation}>
                  <Text style={styles.calcText}>Taxable: ₹{item.taxableAmount}</Text>
                  <Text style={styles.calcText}>CGST: ₹{item.cgstAmount}</Text>
                  <Text style={styles.calcText}>SGST: ₹{item.sgstAmount}</Text>
                  <Text style={[styles.calcText, styles.totalText]}>
                    Total: ₹{item.totalAmount}
                  </Text>
                </View>
              )}
            </View>
          ))}

          {invoiceItems.length === 0 && (
            <Text style={styles.emptyText}>No products added yet</Text>
          )}
        </View>

        {invoiceItems.length > 0 && (
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Invoice Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>₹{totals.subtotal}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total CGST:</Text>
              <Text style={styles.summaryValue}>₹{totals.totalCGST}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total SGST:</Text>
              <Text style={styles.summaryValue}>₹{totals.totalSGST}</Text>
            </View>
            <View style={[styles.summaryRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Grand Total:</Text>
              <Text style={styles.grandTotalValue}>₹{totals.grandTotal}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.generateButton}
        onPress={handleGenerateInvoice}
      >
        <Text style={styles.generateButtonText}>Generate Invoice</Text>
      </TouchableOpacity>

      <Modal visible={showProductPicker} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Product</Text>
              <TouchableOpacity onPress={() => setShowProductPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {products.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productOption}
                  onPress={() => addProduct(product)}
                >
                  <Text style={styles.productOptionName}>{product.name}</Text>
                  <Text style={styles.productOptionDetail}>
                    ₹{product.basePrice}/{product.unit} | GST: {product.gstRate}%
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  section: {
    padding: 15,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  addProductButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addProductText: {
    color: '#fff',
    fontWeight: '600',
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  removeText: {
    fontSize: 20,
    color: '#ef4444',
  },
  itemDetail: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  inputGroup: {
    flex: 1,
    marginRight: 10,
  },
  inputLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 5,
  },
  smallInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  calculation: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calcText: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  totalText: {
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.text.secondary,
    fontSize: 14,
    marginTop: 20,
  },
  summarySection: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: COLORS.text.secondary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
    marginTop: 5,
    paddingTop: 12,
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
  generateButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    padding: 18,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  modalClose: {
    fontSize: 24,
    color: COLORS.text.secondary,
  },
  productOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  productOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 5,
  },
  productOptionDetail: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
});

export default CreateInvoiceScreen;

