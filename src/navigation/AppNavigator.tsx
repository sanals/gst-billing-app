import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import DetailsScreen from '../screens/DetailsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProductsScreen from '../screens/ProductsScreen';
import AddProductScreen from '../screens/AddProductScreen';
import CreateInvoiceScreen from '../screens/CreateInvoiceScreen';
import InvoicePreviewScreen from '../screens/InvoicePreviewScreen';
import CompanySettingsScreen from '../screens/CompanySettingsScreen';

export type RootStackParamList = {
  Home: undefined;
  Details: undefined;
  Settings: undefined;
  Products: undefined;
  AddProduct: { onProductAdded?: () => void };
  CreateInvoice: undefined;
  InvoicePreview: { invoice: any };
  CompanySettings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Details" 
          component={DetailsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Products" 
          component={ProductsScreen}
          options={{ title: 'Manage Products' }}
        />
        <Stack.Screen 
          name="AddProduct" 
          component={AddProductScreen}
          options={{ title: 'Add Product' }}
        />
        <Stack.Screen 
          name="CreateInvoice" 
          component={CreateInvoiceScreen}
          options={{ title: 'Create Invoice' }}
        />
        <Stack.Screen 
          name="InvoicePreview" 
          component={InvoicePreviewScreen}
          options={{ title: 'Invoice Preview' }}
        />
        <Stack.Screen 
          name="CompanySettings" 
          component={CompanySettingsScreen}
          options={{ title: 'Company Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

