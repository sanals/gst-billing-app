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
  Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { Product } from '../types/product';
import { InvoiceItem } from '../types/invoice';
import { CompanySettings } from '../types/company';
import { StorageService } from '../services/StorageService';
import { CompanySettingsService } from '../services/CompanySettingsService';
import { InvoiceCounterService } from '../services/InvoiceCounterService';
import { OutletService } from '../services/OutletService';
import { Outlet } from '../types/outlet';
import { calculateLineItem, calculateInvoiceTotals, validateDiscount } from '../utils/calculations';

const CreateInvoiceScreen = ({ navigation }: any) => {
  // Product & Items
  const [products, setProducts] = useState<Product[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  
  // Customer Details
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  
  // Outlets
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  
  // Discount
  const [discountType, setDiscountType] = useState<'none' | 'flat' | 'percent'>('none');
  const [discountValue, setDiscountValue] = useState('0');
  
  // Round Off
  const [enableRoundOff, setEnableRoundOff] = useState(true);
  
  // Company Settings
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  
  // UI
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showOutletPicker, setShowOutletPicker] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCompanySettings();
    loadOutlets();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadOutlets();
      loadProducts();
    }, [])
  );

  const loadOutlets = async () => {
    const data = await OutletService.getOutlets();
    setOutlets(data);
  };

  const loadProducts = async () => {
    const data = await StorageService.getProducts();
    setProducts(data);
  };

  const loadCompanySettings = async () => {
    const settings = await CompanySettingsService.getSettings();
    setCompanySettings(settings);
  };

  const addProduct = (product: Product) => {
    // Check if product already exists in invoice items
    const productExists = invoiceItems.some(item => item.product.id === product.id);
    if (productExists) {
      Alert.alert('Product Already Added', 'This product is already in the invoice. Please remove it first if you want to add it again.');
      return;
    }

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
    // Allow empty string for clearing, but validate when there's input
    if (value === '' || value === '.') {
      setInvoiceItems(items =>
        items.map(item => {
          if (item.id !== itemId) return item;
          const updated = { ...item, [field]: 0 };
          if (field === 'billedQuantity') {
            const calculated = calculateLineItem(item.product, 0, item.unitPrice);
            return { ...updated, ...calculated };
          }
          return updated;
        })
      );
      return;
    }

    // Validate: only allow numbers and one decimal point
    const numericRegex = /^[0-9]*\.?[0-9]*$/;
    if (!numericRegex.test(value)) {
      return; // Don't update if invalid
    }

    const qty = parseFloat(value);
    // Prevent negative values
    if (isNaN(qty) || qty < 0) {
      return;
    }

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
    // Allow empty string for clearing, but validate when there's input
    if (value === '' || value === '.') {
      setInvoiceItems(items =>
        items.map(item => {
          if (item.id !== itemId) return item;
          const calculated = calculateLineItem(item.product, item.billedQuantity, 0);
          return { ...item, unitPrice: 0, ...calculated };
        })
      );
      return;
    }

    // Validate: only allow numbers and one decimal point
    const numericRegex = /^[0-9]*\.?[0-9]*$/;
    if (!numericRegex.test(value)) {
      return; // Don't update if invalid
    }

    const price = parseFloat(value);
    // Prevent negative values
    if (isNaN(price) || price < 0) {
      return;
    }

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

  const selectOutlet = (outlet: Outlet) => {
    setSelectedOutlet(outlet);
    setShowOutletPicker(false);
  };

  const clearOutlet = () => {
    setSelectedOutlet(null);
  };

  const handleGenerateInvoice = async () => {
    // Validation
    if (!selectedOutlet) {
      Alert.alert('Error', 'Please select an outlet');
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

    // Validate discount
    const discountVal = parseFloat(discountValue) || 0;
    const tempTotals = calculateInvoiceTotals({
      items: invoiceItems,
      discountType: 'none',
      discountValue: 0,
      enableRoundOff: false,
    });
    
    const discountValidation = validateDiscount(discountType, discountVal, tempTotals.subtotal);
    if (!discountValidation.valid) {
      Alert.alert('Invalid Discount', discountValidation.message || 'Please check discount value');
      return;
    }

    // Calculate totals with discount
    const totals = calculateInvoiceTotals({
      items: invoiceItems,
      discountType,
      discountValue: discountVal,
      enableRoundOff,
    });

    // Get invoice number
    const invoicePrefix = companySettings?.invoicePrefix || 'INV';
    const { number, fullNumber } = await InvoiceCounterService.getNextInvoiceNumber(invoicePrefix);
    
    navigation.navigate('InvoicePreview', {
      invoice: {
        id: Date.now().toString(),
        invoiceNumber: number,
        invoicePrefix,
        fullInvoiceNumber: fullNumber,
        date: new Date().toLocaleDateString(),
        outletName: selectedOutlet.name,
        outletAddress: selectedOutlet.address,
        customerGSTNo: selectedOutlet.gstNo || undefined,
        state: companySettings?.state || 'Kerala',
        stateCode: companySettings?.stateCode || '22',
        items: invoiceItems,
        discountType,
        discountValue: discountVal,
        ...totals,
      },
    });
  };

  const totals = calculateInvoiceTotals({
    items: invoiceItems,
    discountType,
    discountValue: parseFloat(discountValue) || 0,
    enableRoundOff,
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Outlet Details</Text>
            <View style={styles.outletActions}>
              {outlets.length > 0 && (
                <TouchableOpacity
                  style={styles.selectOutletButton}
                  onPress={() => setShowOutletPicker(true)}
                >
                  <Text style={styles.selectOutletText}>
                    {selectedOutlet ? 'Change' : 'Select'} Outlet
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.addOutletButton}
                onPress={() => navigation.navigate('AddOutlet')}
              >
                <Text style={styles.addOutletText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {selectedOutlet ? (
            <View style={styles.selectedOutletCard}>
              <View style={styles.selectedOutletInfo}>
                <Text style={styles.selectedOutletName}>{selectedOutlet.name}</Text>
                <Text style={styles.selectedOutletAddress}>{selectedOutlet.address}</Text>
                {selectedOutlet.gstNo && (
                  <Text style={styles.selectedOutletGst}>GST: {selectedOutlet.gstNo}</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.clearOutletButton}
                onPress={clearOutlet}
              >
                <Text style={styles.clearOutletText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noOutletCard}>
              <Text style={styles.noOutletText}>Please select an outlet to continue</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Products</Text>
            <View style={styles.productActions}>
              {products.length > 0 && (
                <TouchableOpacity
                  style={styles.selectProductButton}
                  onPress={() => setShowProductPicker(true)}
                >
                  <Text style={styles.selectProductText}>Select Product</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.addProductButton}
                onPress={() => navigation.navigate('AddProduct')}
              >
                <Text style={styles.addProductText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {invoiceItems.length === 0 && (
            <View style={styles.noProductCard}>
              <Text style={styles.noProductText}>No products added yet. Select or add a product to continue.</Text>
            </View>
          )}

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
                <View style={styles.inputGroupSmall}>
                  <Text style={styles.inputLabel}>Actual Qty</Text>
                  <TextInput
                    style={styles.smallInput}
                    value={item.actualQuantity.toString()}
                    onChangeText={(val) => updateQuantity(item.id, 'actualQuantity', val)}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.inputGroupSmall}>
                  <Text style={styles.inputLabel}>Billed Qty *</Text>
                  <TextInput
                    style={styles.smallInput}
                    value={item.billedQuantity.toString()}
                    onChangeText={(val) => updateQuantity(item.id, 'billedQuantity', val)}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.inputGroupLarge}>
                  <Text style={styles.inputLabel}>Unit Price</Text>
                  <TextInput
                    style={styles.smallInput}
                    value={item.unitPrice > 0 ? item.unitPrice.toString() : ''}
                    onChangeText={(val) => updateUnitPrice(item.id, val)}
                    keyboardType="decimal-pad"
                    placeholder="0"
                  />
                </View>
              </View>

              {item.billedQuantity > 0 && (
                <View style={styles.calculation}>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Taxable:</Text>
                    <Text style={styles.calcValue}>₹{(item.taxableAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>CGST:</Text>
                    <Text style={styles.calcValue}>₹{(item.cgstAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>SGST:</Text>
                    <Text style={styles.calcValue}>₹{(item.sgstAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
                  </View>
                  <View style={[styles.calcRow, styles.totalRow]}>
                    <Text style={[styles.calcLabel, styles.totalLabel]}>Total:</Text>
                    <Text style={[styles.calcValue, styles.totalValue]}>₹{(item.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
                  </View>
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
            
            {/* Subtotal */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>₹{totals.subtotal}</Text>
            </View>

            {/* Discount Controls */}
            <View style={styles.discountSection}>
              <Text style={styles.subSectionTitle}>Discount</Text>
              <View style={styles.discountTypeRow}>
                <TouchableOpacity
                  style={[styles.discountTypeButton, discountType === 'none' && styles.discountTypeButtonActive]}
                  onPress={() => { setDiscountType('none'); setDiscountValue('0'); }}
                >
                  <Text style={[styles.discountTypeText, discountType === 'none' && styles.discountTypeTextActive]}>None</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.discountTypeButton, discountType === 'flat' && styles.discountTypeButtonActive]}
                  onPress={() => setDiscountType('flat')}
                >
                  <Text style={[styles.discountTypeText, discountType === 'flat' && styles.discountTypeTextActive]}>₹ Flat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.discountTypeButton, discountType === 'percent' && styles.discountTypeButtonActive]}
                  onPress={() => setDiscountType('percent')}
                >
                  <Text style={[styles.discountTypeText, discountType === 'percent' && styles.discountTypeTextActive]}>% Percent</Text>
                </TouchableOpacity>
              </View>
              
              {discountType !== 'none' && (
                <TextInput
                  style={styles.discountInput}
                  value={discountValue}
                  onChangeText={setDiscountValue}
                  placeholder={discountType === 'flat' ? 'Enter amount' : 'Enter percentage'}
                  keyboardType="decimal-pad"
                />
              )}
            </View>

            {/* Discount Display */}
            {discountType !== 'none' && totals.discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Discount ({discountType === 'flat' ? `₹${discountValue}` : `${discountValue}%`}):
                </Text>
                <Text style={[styles.summaryValue, { color: '#ef4444' }]}>-₹{totals.discountAmount}</Text>
              </View>
            )}

            {/* After Discount */}
            {discountType !== 'none' && totals.discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>After Discount:</Text>
                <Text style={styles.summaryValue}>₹{totals.subtotalAfterDiscount}</Text>
              </View>
            )}

            {/* Taxes */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total CGST:</Text>
              <Text style={styles.summaryValue}>₹{totals.totalCGST}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total SGST:</Text>
              <Text style={styles.summaryValue}>₹{totals.totalSGST}</Text>
            </View>

            {/* Round Off Toggle */}
            <View style={styles.roundOffRow}>
              <View>
                <Text style={styles.summaryLabel}>Round Off</Text>
                <Text style={styles.roundOffHint}>Round to nearest rupee</Text>
              </View>
              <Switch
                value={enableRoundOff}
                onValueChange={setEnableRoundOff}
                trackColor={{ false: '#E0E0E0', true: COLORS.primary }}
                thumbColor={enableRoundOff ? '#fff' : '#f4f3f4'}
              />
            </View>

            {/* Round Off Amount */}
            {enableRoundOff && totals.roundOff !== 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Round Off:</Text>
                <Text style={[styles.summaryValue, { color: totals.roundOff > 0 ? '#16a34a' : '#ef4444' }]}>
                  {totals.roundOff > 0 ? '+' : ''}₹{totals.roundOff}
                </Text>
              </View>
            )}

            {/* Grand Total */}
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
              {products.length === 0 && (
                <View style={styles.emptyModalContent}>
                  <Text style={styles.emptyModalText}>No products added yet</Text>
                  <TouchableOpacity
                    style={styles.addInModalButton}
                    onPress={() => {
                      setShowProductPicker(false);
                      navigation.navigate('AddProduct');
                    }}
                  >
                    <Text style={styles.addInModalText}>+ Add Product</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showOutletPicker} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Outlet</Text>
              <TouchableOpacity onPress={() => setShowOutletPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {outlets.map((outlet) => (
                <TouchableOpacity
                  key={outlet.id}
                  style={styles.productOption}
                  onPress={() => selectOutlet(outlet)}
                >
                  <Text style={styles.productOptionName}>{outlet.name}</Text>
                  <Text style={styles.productOptionDetail}>{outlet.address}</Text>
                  {outlet.gstNo && (
                    <Text style={styles.productOptionDetail}>GST: {outlet.gstNo}</Text>
                  )}
                </TouchableOpacity>
              ))}
              {outlets.length === 0 && (
                <View style={styles.emptyModalContent}>
                  <Text style={styles.emptyModalText}>No outlets added yet</Text>
                  <TouchableOpacity
                    style={styles.addInModalButton}
                    onPress={() => {
                      setShowOutletPicker(false);
                      navigation.navigate('AddOutlet');
                    }}
                  >
                    <Text style={styles.addInModalText}>+ Add Outlet</Text>
                  </TouchableOpacity>
                </View>
              )}
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
  outletActions: {
    flexDirection: 'row',
    gap: 8,
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  selectProductButton: {
    backgroundColor: COLORS.primary || '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectProductText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  selectOutletButton: {
    backgroundColor: COLORS.primary || '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectOutletText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addOutletButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addOutletText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedOutletCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.primary || '#007AFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  selectedOutletInfo: {
    flex: 1,
  },
  selectedOutletName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  selectedOutletAddress: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  selectedOutletGst: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  },
  clearOutletButton: {
    padding: 4,
  },
  clearOutletText: {
    fontSize: 18,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  noOutletCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  noOutletText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyModalContent: {
    padding: 20,
    alignItems: 'center',
  },
  emptyModalText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 15,
  },
  addInModalButton: {
    backgroundColor: COLORS.primary || '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addInModalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addProductText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  noProductCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  noProductText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    fontStyle: 'italic',
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
    gap: 8,
  },
  inputGroupSmall: {
    flex: 0.7,
  },
  inputGroupLarge: {
    flex: 1.6,
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
    padding: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  totalRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: 0,
  },
  calcLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  calcValue: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  totalLabel: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: '700',
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 5,
    marginTop: 10,
  },
  discountSection: {
    marginTop: 15,
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 10,
  },
  discountTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  discountTypeButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  discountTypeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  discountTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  discountTypeTextActive: {
    color: '#fff',
  },
  discountInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginTop: 5,
  },
  roundOffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 10,
  },
  roundOffHint: {
    fontSize: 11,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
});

export default CreateInvoiceScreen;

