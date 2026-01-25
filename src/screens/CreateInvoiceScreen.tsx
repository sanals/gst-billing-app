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
  KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Product } from '../types/product';
import { InvoiceItem } from '../types/invoice';
import { CompanySettings } from '../types/company';
import { StorageService } from '../services/StorageService';
import { CompanySettingsService } from '../services/CompanySettingsService';
import { InvoiceCounterService } from '../services/InvoiceCounterService';
import { OutletService } from '../services/OutletService';
import { Outlet } from '../types/outlet';
import { calculateLineItem, calculateInvoiceTotals, validateDiscount } from '../utils/calculations';
import { StockService } from '../services/StockService';

const CreateInvoiceScreen = ({ navigation }: any) => {
  const { theme, themeMode } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(theme, insets.bottom);
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

  // Invoice Number
  const [manualInvoiceNumber, setManualInvoiceNumber] = useState<string>('');
  const [useManualNumber, setUseManualNumber] = useState(false);
  const [nextAutoNumber, setNextAutoNumber] = useState<string>('');

  // UI
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showOutletPicker, setShowOutletPicker] = useState(false);

  // Search
  const [productSearch, setProductSearch] = useState('');
  const [outletSearch, setOutletSearch] = useState('');

  useEffect(() => {
    loadProducts();
    loadCompanySettings();
    loadOutlets();
    loadNextInvoiceNumber();
  }, []);

  // Reload next invoice number when company settings change (prefix might change)
  useEffect(() => {
    if (companySettings) {
      loadNextInvoiceNumber();
    }
  }, [companySettings?.invoicePrefix]);

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

  const loadNextInvoiceNumber = async () => {
    const prefix = companySettings?.invoicePrefix || 'INV';
    const { fullNumber } = await InvoiceCounterService.getNextInvoiceNumber(prefix);
    setNextAutoNumber(fullNumber);
  };

  // Filter products based on search
  const filteredProducts = products.filter((product) => {
    if (!productSearch.trim()) return true;
    const search = productSearch.toLowerCase().trim();
    return (
      product.name.toLowerCase().includes(search) ||
      product.hsnCode.toLowerCase().includes(search)
    );
  });

  // Filter outlets based on search
  const filteredOutlets = outlets.filter((outlet) => {
    if (!outletSearch.trim()) return true;
    const search = outletSearch.toLowerCase().trim();
    return (
      outlet.name.toLowerCase().includes(search) ||
      outlet.address.toLowerCase().includes(search) ||
      (outlet.gstNo && outlet.gstNo.toLowerCase().includes(search))
    );
  });

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
      rotPercent: product.gstRate, // Rate of Tax (GST percentage) for display
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

        // Auto-populate billedQuantity from actualQuantity when billedQuantity is 0 or empty
        if (field === 'actualQuantity' && item.billedQuantity === 0) {
          updated.billedQuantity = qty;
          const calculated = calculateLineItem(item.product, qty, item.unitPrice);
          return { ...updated, ...calculated };
        }

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
          return { ...item, ...calculated }; // calculateLineItem already includes unitPrice
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
        return { ...item, ...calculated }; // calculateLineItem already includes unitPrice
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

    // Validate stock availability
    const stockValidation = await StockService.validateStockForInvoice(invoiceItems);
    if (!stockValidation.valid) {
      Alert.alert(
        'Insufficient Stock',
        stockValidation.message || 'Some products don\'t have enough stock',
        [{ text: 'OK' }]
      );
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

    // Get invoice number - reserve it atomically to prevent race conditions
    const invoicePrefix = companySettings?.invoicePrefix || 'INV';
    let number: string;
    let fullNumber: string;
    let isManualNumber = false;

    if (useManualNumber && manualInvoiceNumber.trim()) {
      // Use manual invoice number
      const manualNum = parseInt(manualInvoiceNumber.trim(), 10);
      if (isNaN(manualNum) || manualNum <= 0) {
        Alert.alert('Invalid Invoice Number', 'Please enter a valid positive number');
        return;
      }
      number = manualNum.toString();
      fullNumber = `${invoicePrefix}-${manualNum}`;
      isManualNumber = true;
    } else {
      // Reserve next auto number atomically (prevents skipping)
      const reserved = await InvoiceCounterService.reserveNextInvoiceNumber(invoicePrefix);
      number = reserved.number;
      fullNumber = reserved.fullNumber;
    }

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
      isManualNumber, // Pass flag to preview screen
      manualNumberValue: isManualNumber ? parseInt(number, 10) : undefined,
    });

    // Reset manual number input after navigation
    setManualInvoiceNumber('');
    setUseManualNumber(false);
  };

  const totals = calculateInvoiceTotals({
    items: invoiceItems,
    discountType,
    discountValue: parseFloat(discountValue) || 0,
    enableRoundOff,
  });

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
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

        {/* Invoice Number Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Number</Text>
          <View style={styles.invoiceNumberCard}>
            <View style={styles.invoiceNumberRow}>
              <Text style={styles.invoiceNumberLabel}>Next Auto Number:</Text>
              <Text style={styles.invoiceNumberValue}>{nextAutoNumber || 'Loading...'}</Text>
            </View>

            <View style={styles.manualNumberToggle}>
              <View style={styles.manualNumberInfo}>
                <Text style={styles.manualNumberLabel}>Use Manual Number</Text>
                <Text style={styles.manualNumberHint}>For re-billing or corrections</Text>
              </View>
              <Switch
                value={useManualNumber}
                onValueChange={setUseManualNumber}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={useManualNumber ? theme.text.inverse : theme.border}
              />
            </View>

            {useManualNumber && (
              <View style={styles.manualNumberInput}>
                <Text style={styles.inputLabel}>Enter Invoice Number (without prefix)</Text>
                <View style={styles.manualNumberInputRow}>
                  <Text style={styles.prefixText}>{companySettings?.invoicePrefix || 'INV'}-</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={manualInvoiceNumber}
                    onChangeText={setManualInvoiceNumber}
                    placeholder="e.g., 50"
                    placeholderTextColor={theme.text.light}
                    keyboardType="number-pad"
                  />
                </View>
                <Text style={styles.manualNumberWarning}>
                  ⚠️ Using a manual number will not affect the auto-counter unless it's higher
                </Text>
              </View>
            )}
          </View>
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

              {/* Always show stock info */}
              <View style={styles.stockInfo}>
                <Text style={[
                  styles.stockText,
                  {
                    color: StockService.isOutOfStock(item.product.stock)
                      ? theme.error
                      : StockService.isLowStock(item.product.stock, 10)
                        ? theme.warning || '#FF9800'
                        : theme.text.secondary
                  }
                ]}>
                  Available Stock: {item.product.stock ?? 0} {item.product.unit}
                  {item.billedQuantity > (item.product.stock ?? 0) && (
                    <Text style={{ color: theme.error, fontWeight: '700' }}>
                      {' '}(Insufficient!)
                    </Text>
                  )}
                </Text>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputGroupSmall}>
                  <Text style={styles.inputLabel}>Actual Qty</Text>
                  <TextInput
                    style={styles.smallInput}
                    value={item.actualQuantity.toString()}
                    onChangeText={(val) => updateQuantity(item.id, 'actualQuantity', val)}
                    keyboardType="decimal-pad"
                    placeholderTextColor={theme.text.light}
                  />
                </View>
                <View style={styles.inputGroupSmall}>
                  <Text style={styles.inputLabel}>Billed Qty *</Text>
                  <TextInput
                    style={styles.smallInput}
                    value={item.billedQuantity.toString()}
                    onChangeText={(val) => updateQuantity(item.id, 'billedQuantity', val)}
                    keyboardType="decimal-pad"
                    placeholderTextColor={theme.text.light}
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
                    placeholderTextColor={theme.text.light}
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
                  placeholderTextColor={theme.text.light}
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
                <Text style={[styles.summaryValue, { color: theme.error }]}>-₹{totals.discountAmount}</Text>
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
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={enableRoundOff ? theme.text.inverse : theme.border}
              />
            </View>

            {/* Round Off Amount */}
            {enableRoundOff && totals.roundOff !== 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Round Off:</Text>
                <Text style={[styles.summaryValue, { color: totals.roundOff > 0 ? theme.success : theme.error }]}>
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
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior="padding"
          keyboardVerticalOffset={0}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Product</Text>
              <TouchableOpacity onPress={() => { setShowProductPicker(false); setProductSearch(''); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={productSearch}
                onChangeText={setProductSearch}
                placeholder="Search by name or HSN code..."
                placeholderTextColor={theme.text.light}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {productSearch.length > 0 && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setProductSearch('')}
                >
                  <Text style={styles.clearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Results count */}
            {productSearch.length > 0 && (
              <Text style={styles.searchResultCount}>
                {filteredProducts.length} of {products.length} products
              </Text>
            )}

            <ScrollView keyboardShouldPersistTaps="handled">
              {filteredProducts.map((product) => {
                const isOutOfStock = StockService.isOutOfStock(product.stock);
                const isLowStock = StockService.isLowStock(product.stock, 10);
                const stockColor = isOutOfStock
                  ? theme.error
                  : isLowStock
                    ? theme.warning || '#FF9800'
                    : theme.success || '#4CAF50';

                return (
                  <TouchableOpacity
                    key={product.id}
                    style={[
                      styles.productOption,
                      isOutOfStock && styles.productOptionDisabled
                    ]}
                    onPress={() => {
                      if (!isOutOfStock) {
                        addProduct(product);
                      } else {
                        Alert.alert('Out of Stock', `${product.name} is currently out of stock.`);
                      }
                    }}
                    disabled={isOutOfStock}
                  >
                    <View style={styles.productOptionContent}>
                      <Text style={styles.productOptionName}>{product.name}</Text>
                      <Text style={styles.productOptionDetail}>
                        ₹{product.basePrice}/{product.unit} | GST: {product.gstRate}%
                      </Text>
                      {/* Always show stock info */}
                      <Text style={[styles.productStock, { color: stockColor }]}>
                        Stock: {product.stock ?? 0} {product.unit}
                        {isOutOfStock && ' (Out of Stock)'}
                        {!isOutOfStock && isLowStock && ' (Low Stock)'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {filteredProducts.length === 0 && products.length > 0 && (
                <View style={styles.emptyModalContent}>
                  <Text style={styles.emptyModalText}>No products match "{productSearch}"</Text>
                </View>
              )}
              {products.length === 0 && (
                <View style={styles.emptyModalContent}>
                  <Text style={styles.emptyModalText}>No products added yet</Text>
                  <TouchableOpacity
                    style={styles.addInModalButton}
                    onPress={() => {
                      setShowProductPicker(false);
                      setProductSearch('');
                      navigation.navigate('AddProduct');
                    }}
                  >
                    <Text style={styles.addInModalText}>+ Add Product</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showOutletPicker} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior="padding"
          keyboardVerticalOffset={0}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Outlet</Text>
              <TouchableOpacity onPress={() => { setShowOutletPicker(false); setOutletSearch(''); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={outletSearch}
                onChangeText={setOutletSearch}
                placeholder="Search by name, address or GST..."
                placeholderTextColor={theme.text.light}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {outletSearch.length > 0 && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setOutletSearch('')}
                >
                  <Text style={styles.clearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Results count */}
            {outletSearch.length > 0 && (
              <Text style={styles.searchResultCount}>
                {filteredOutlets.length} of {outlets.length} outlets
              </Text>
            )}

            <ScrollView keyboardShouldPersistTaps="handled">
              {filteredOutlets.map((outlet) => (
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
              {filteredOutlets.length === 0 && outlets.length > 0 && (
                <View style={styles.emptyModalContent}>
                  <Text style={styles.emptyModalText}>No outlets match "{outletSearch}"</Text>
                </View>
              )}
              {outlets.length === 0 && (
                <View style={styles.emptyModalContent}>
                  <Text style={styles.emptyModalText}>No outlets added yet</Text>
                  <TouchableOpacity
                    style={styles.addInModalButton}
                    onPress={() => {
                      setShowOutletPicker(false);
                      setOutletSearch('');
                      navigation.navigate('AddOutlet');
                    }}
                  >
                    <Text style={styles.addInModalText}>+ Add Outlet</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const getStyles = (theme: any, bottomInset: number = 0) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectProductText: {
    color: theme.text.inverse,
    fontSize: 12,
    fontWeight: '600',
  },
  selectOutletButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectOutletText: {
    color: theme.text.inverse,
    fontSize: 12,
    fontWeight: '600',
  },
  addOutletButton: {
    backgroundColor: theme.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addOutletText: {
    color: theme.text.inverse,
    fontSize: 12,
    fontWeight: '600',
  },
  selectedOutletCard: {
    backgroundColor: theme.primary + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: theme.primary,
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
    color: theme.text.primary,
    marginBottom: 4,
  },
  selectedOutletAddress: {
    fontSize: 14,
    color: theme.text.secondary,
    marginBottom: 4,
  },
  selectedOutletGst: {
    fontSize: 13,
    color: theme.text.secondary,
    fontStyle: 'italic',
  },
  clearOutletButton: {
    padding: 4,
  },
  clearOutletText: {
    fontSize: 18,
    color: theme.error,
    fontWeight: 'bold',
  },
  noOutletCard: {
    backgroundColor: theme.warning + '40',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: theme.warning,
  },
  noOutletText: {
    fontSize: 14,
    color: theme.text.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyModalContent: {
    padding: 20,
    alignItems: 'center',
  },
  emptyModalText: {
    fontSize: 16,
    color: theme.text.secondary,
    marginBottom: 15,
  },
  addInModalButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addInModalText: {
    color: theme.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.surface,
    marginBottom: 10,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  addProductButton: {
    backgroundColor: theme.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addProductText: {
    color: theme.text.inverse,
    fontSize: 12,
    fontWeight: '600',
  },
  noProductCard: {
    backgroundColor: theme.warning + '40',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: theme.warning,
  },
  noProductText: {
    fontSize: 14,
    color: theme.text.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  itemCard: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: theme.border,
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
    color: theme.text.primary,
  },
  removeText: {
    fontSize: 20,
    color: theme.error,
  },
  itemDetail: {
    fontSize: 14,
    color: theme.text.secondary,
    marginBottom: 8,
  },
  stockInfo: {
    marginBottom: 10,
  },
  stockText: {
    fontSize: 13,
    fontWeight: '600',
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
    color: theme.text.secondary,
    marginBottom: 5,
  },
  smallInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: theme.input.background,
    color: theme.text.primary,
  },
  calculation: {
    backgroundColor: theme.background,
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
    borderTopColor: theme.border,
    marginBottom: 0,
  },
  calcLabel: {
    fontSize: 14,
    color: theme.text.secondary,
    fontWeight: '500',
  },
  calcValue: {
    fontSize: 14,
    color: theme.text.primary,
    fontWeight: '600',
  },
  totalLabel: {
    fontSize: 16,
    color: theme.text.primary,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 16,
    color: theme.text.primary,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.text.secondary,
    fontSize: 14,
    marginTop: 20,
  },
  summarySection: {
    backgroundColor: theme.surface,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: theme.text.secondary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text.primary,
  },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: theme.border,
    marginTop: 5,
    paddingTop: 12,
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
  generateButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.primary,
    padding: 18,
    paddingBottom: 18 + bottomInset, // Add safe area inset to prevent overlap with navigation bar
    alignItems: 'center',
  },
  generateButtonText: {
    color: theme.text.inverse,
    fontSize: 18,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: theme.surface,
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
    color: theme.text.primary,
  },
  modalClose: {
    fontSize: 24,
    color: theme.text.secondary,
  },
  productOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  productOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 5,
  },
  productOptionDetail: {
    fontSize: 14,
    color: theme.text.secondary,
  },
  productOptionContent: {
    flex: 1,
  },
  productStock: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 5,
  },
  productOptionDisabled: {
    opacity: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: theme.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 15,
    color: theme.text.primary,
  },
  clearSearchButton: {
    padding: 12,
  },
  clearSearchText: {
    fontSize: 16,
    color: theme.text.light,
    fontWeight: '600',
  },
  searchResultCount: {
    fontSize: 12,
    color: theme.text.secondary,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text.secondary,
    marginBottom: 5,
    marginTop: 10,
  },
  discountSection: {
    marginTop: 15,
    marginBottom: 15,
    padding: 15,
    backgroundColor: theme.background,
    borderRadius: 8,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text.primary,
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
    borderColor: theme.border,
    backgroundColor: theme.surface,
    alignItems: 'center',
  },
  discountTypeButtonActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  discountTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text.secondary,
  },
  discountTypeTextActive: {
    color: theme.text.inverse,
  },
  discountInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.input.background,
    color: theme.text.primary,
    marginTop: 5,
  },
  roundOffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.border,
    marginVertical: 10,
  },
  roundOffHint: {
    fontSize: 11,
    color: theme.text.secondary,
    marginTop: 2,
  },
  invoiceNumberCard: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: theme.border,
  },
  invoiceNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  invoiceNumberLabel: {
    fontSize: 14,
    color: theme.text.secondary,
    fontWeight: '500',
  },
  invoiceNumberValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.primary,
  },
  manualNumberToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manualNumberInfo: {
    flex: 1,
  },
  manualNumberLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text.primary,
  },
  manualNumberHint: {
    fontSize: 12,
    color: theme.text.secondary,
    marginTop: 2,
  },
  manualNumberInput: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  manualNumberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text.primary,
    marginRight: 4,
  },
  numberInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    backgroundColor: theme.input.background,
    color: theme.text.primary,
  },
  manualNumberWarning: {
    fontSize: 11,
    color: theme.warning || '#FF9800',
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default CreateInvoiceScreen;

