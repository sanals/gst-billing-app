import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { Outlet } from '../types/outlet';
import { OutletService } from '../services/OutletService';
import { RootStackParamList } from '../navigation/AppNavigator';

type OutletsScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Outlets'>;
};

export default function OutletsScreen({ navigation }: OutletsScreenProps) {
  const { theme, themeMode } = useTheme();
  const styles = getStyles(theme);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOutlets();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadOutlets();
    }, [])
  );

  const loadOutlets = async () => {
    try {
      const data = await OutletService.getOutlets();
      setOutlets(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load outlets');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (outlet: Outlet) => {
    Alert.alert(
      'Delete Outlet',
      `Are you sure you want to delete "${outlet.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await OutletService.deleteOutlet(outlet.id);
              await loadOutlets();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete outlet');
            }
          },
        },
      ]
    );
  };

  const renderOutlet = ({ item }: { item: Outlet }) => (
    <View style={styles.outletCard}>
      <View style={styles.outletInfo}>
        <Text style={styles.outletName}>{item.name}</Text>
        <Text style={styles.outletAddress}>{item.address}</Text>
        {item.gstNo && (
          <Text style={styles.outletGst}>GST: {item.gstNo}</Text>
        )}
      </View>
      <View style={styles.outletActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('AddOutlet', { outlet: item })}
        >
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />

      <FlatList
        data={outlets}
        renderItem={renderOutlet}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No outlets added yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add your first outlet
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddOutlet')}
      >
        <Text style={styles.addButtonText}>+ Add Outlet</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  list: {
    padding: 15,
    paddingTop: 20,
  },
  outletCard: {
    backgroundColor: theme.card.background,
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.card.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  outletInfo: {
    marginBottom: 10,
  },
  outletName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 5,
  },
  outletAddress: {
    fontSize: 14,
    color: theme.text.secondary,
    marginBottom: 4,
  },
  outletGst: {
    fontSize: 13,
    color: theme.text.secondary,
    fontStyle: 'italic',
  },
  outletActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  editButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: theme.primary,
    borderRadius: 6,
  },
  editText: {
    color: theme.text.inverse,
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: theme.error,
    borderRadius: 6,
  },
  deleteText: {
    color: theme.text.inverse,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: theme.text.secondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.text.light,
    textAlign: 'center',
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

