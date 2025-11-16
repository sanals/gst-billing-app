import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { Product } from '../types/product';
import { StorageService } from '../services/StorageService';

const ProductsScreen = ({ navigation }: any) => {
  const { theme, themeMode } = useTheme();
  const styles = getStyles(theme);
  const [products, setProducts] = useState<Product[]>([]);

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

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDetails}>
          HSN: {item.hsnCode} | GST: {item.gstRate}% | ₹{item.basePrice}/{item.unit}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id)}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

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
});

export default ProductsScreen;

