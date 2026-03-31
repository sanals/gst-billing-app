import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Product } from '../types/product';
import { StorageService } from '../services/StorageService';
import { StockService } from '../services/StockService';

const ProductsScreen = ({ navigation }: any) => {
  const { theme, themeMode } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(theme, insets.bottom);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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


  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.hsnCode.toLowerCase().includes(q)
    );
  });

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
          {/* Always show stock info */}
          <View style={styles.stockContainer}>
            <Text style={[styles.stockLabel, { color: stockColor }]}>
              Stock: {item.stock ?? 0} {item.unit}
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
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('AddProduct', { product: item })}
          >
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
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
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or HSN..."
          placeholderTextColor={theme.text.light}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {searchQuery.trim() ? 'No products match your search' : 'No products added yet'}
          </Text>
        }
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddProduct')}
      >
        <Text style={styles.addButtonText}>+ Add Product</Text>
      </TouchableOpacity>

    </View>
  );
};

const getStyles = (theme: any, bottomInset: number = 0) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    marginTop: 15,
    paddingHorizontal: 12,
    backgroundColor: theme.input?.background || theme.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.text.primary,
  },
  clearButton: {
    padding: 6,
  },
  clearButtonText: {
    fontSize: 16,
    color: theme.text.secondary,
    fontWeight: '600',
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
  editButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: theme.success || '#4CAF50',
    borderRadius: 5,
  },
  editText: {
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
    bottom: 20 + bottomInset,
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
});

export default ProductsScreen;

