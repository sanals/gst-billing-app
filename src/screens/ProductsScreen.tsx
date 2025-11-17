import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { Product } from '../types/product';
import { StorageService } from '../services/StorageService';
import { StockService } from '../services/StockService';

const ProductsScreen = ({ navigation }: any) => {
  const { theme, themeMode } = useTheme();
  const styles = getStyles(theme);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockInput, setStockInput] = useState('');

  const loadProducts = async () => {
    const data = await StorageService.getProducts();
    setProducts(data);
  };

  // Reload products when screen comes into focus (e.g., after adding a product)
  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  const handleDelete = (productId: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure?',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            await StorageService.deleteProduct(productId);
            loadProducts();
          },
        },
      ]
    );
  };

  const handleUpdateStock = (product: Product) => {
    setSelectedProduct(product);
    setStockInput(product.stock?.toString() || '0');
    setStockModalVisible(true);
  };

  const handleStockInputChange = (value: string) => {
    // Only allow numbers
    const numericRegex = /^[0-9]*$/;
    if (numericRegex.test(value) || value === '') {
      setStockInput(value);
    }
  };

  const handleSaveStock = async () => {
    if (!selectedProduct) return;

    const stockValue = parseInt(stockInput.trim(), 10);
    if (isNaN(stockValue) || stockValue < 0) {
      Alert.alert('Error', 'Please enter a valid stock quantity (0 or greater)');
      return;
    }

    try {
      await StockService.updateProductStock(selectedProduct.id, stockValue);
      setStockModalVisible(false);
      setSelectedProduct(null);
      setStockInput('');
      loadProducts();
      Alert.alert('Success', `Stock updated to ${stockValue}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update stock');
    }
  };

  const handleCancelStock = () => {
    setStockModalVisible(false);
    setSelectedProduct(null);
    setStockInput('');
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const isOutOfStock = StockService.isOutOfStock(item.stock);
    const isLowStock = StockService.isLowStock(item.stock, 10);
    const stockColor = isOutOfStock 
      ? theme.error 
      : isLowStock 
      ? theme.warning || '#FF9800'
      : theme.success || '#4CAF50';

    return (
      <View style={styles.productCard}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productDetails}>
            HSN: {item.hsnCode} | GST: {item.gstRate}% | ₹{item.basePrice}/{item.unit}
          </Text>
          {item.stock !== undefined && (
            <View style={styles.stockContainer}>
              <Text style={[styles.stockLabel, { color: stockColor }]}>
                Stock: {item.stock} {item.unit}
              </Text>
              {isOutOfStock && (
                <Text style={[styles.stockWarning, { color: theme.error }]}>
                  Out of Stock
                </Text>
              )}
              {!isOutOfStock && isLowStock && (
                <Text style={[styles.stockWarning, { color: theme.warning || '#FF9800' }]}>
                  Low Stock
                </Text>
              )}
            </View>
          )}
        </View>
        <View style={styles.actionButtons}>
          {item.stock !== undefined && (
            <TouchableOpacity
              style={[styles.updateStockButton, { backgroundColor: theme.primary }]}
              onPress={() => handleUpdateStock(item)}
            >
              <Text style={styles.updateStockText}>Update Stock</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No products added yet</Text>
        }
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddProduct')}
      >
        <Text style={styles.addButtonText}>+ Add Product</Text>
      </TouchableOpacity>

      {/* Stock Update Modal */}
      <Modal
        visible={stockModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelStock}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Update Stock - {selectedProduct?.name}
            </Text>
            <Text style={styles.modalLabel}>Enter new stock quantity:</Text>
            <TextInput
              style={styles.modalInput}
              value={stockInput}
              onChangeText={handleStockInputChange}
              placeholder="Enter stock quantity"
              placeholderTextColor={theme.text.light}
              keyboardType="number-pad"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={handleCancelStock}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveStock}
              >
                <Text style={styles.modalButtonTextSave}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 15,
    backgroundColor: theme.card.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 5,
  },
  productDetails: {
    fontSize: 14,
    color: theme.text.secondary,
  },
  stockContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stockLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  stockWarning: {
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  updateStockButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
  },
  updateStockText: {
    color: theme.text.inverse,
    fontWeight: '600',
    fontSize: 12,
  },
  deleteButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: theme.error,
    borderRadius: 5,
  },
  deleteText: {
    color: theme.text.inverse,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: theme.text.secondary,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: theme.primary,
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
    shadowColor: theme.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButtonText: {
    color: theme.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text.primary,
    marginBottom: 15,
  },
  modalLabel: {
    fontSize: 14,
    color: theme.text.secondary,
    marginBottom: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.input.background,
    color: theme.text.primary,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalButtonCancel: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalButtonSave: {
    backgroundColor: theme.primary,
  },
  modalButtonTextCancel: {
    color: theme.text.primary,
    fontWeight: '600',
  },
  modalButtonTextSave: {
    color: theme.text.inverse,
    fontWeight: '600',
  },
});

export default ProductsScreen;

