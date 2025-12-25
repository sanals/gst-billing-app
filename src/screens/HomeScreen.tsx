import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { theme, themeMode } = useTheme();
  const styles = getStyles(theme);

  const QuickActionButton = ({
    icon,
    title,
    subtitle,
    onPress,
    primary = false
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    primary?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.quickActionCard, primary && styles.quickActionCardPrimary]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.quickActionIcon}>
        <Text style={styles.quickActionIconText}>{icon}</Text>
      </View>
      <View style={styles.quickActionContent}>
        <Text style={[styles.quickActionTitle, primary && styles.quickActionTitlePrimary]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.quickActionSubtitle, primary && styles.quickActionSubtitlePrimary]}>
            {subtitle}
          </Text>
        )}
      </View>
      <Text style={[styles.quickActionArrow, primary && styles.quickActionArrowPrimary]}>›</Text>
    </TouchableOpacity>
  );

  const MenuButton = ({
    icon,
    title,
    onPress
  }: {
    icon: string;
    title: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={styles.menuButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.menuButtonIcon}>{icon}</Text>
      <Text style={styles.menuButtonText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />

      <View style={styles.header}>
        <Text style={styles.title}>GST Billing</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions Section - Invoice and Receipt side by side */}
        <View style={styles.section}>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.compactActionCard}
              onPress={() => navigation.navigate('CreateInvoice')}
              activeOpacity={0.7}
            >
              <View style={styles.compactActionIcon}>
                <Text style={styles.compactActionIconText}>📄</Text>
              </View>
              <Text style={styles.compactActionTitle}>New Invoice</Text>
              <Text style={styles.compactActionSubtitle}>GST Invoice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.compactActionCard, styles.compactActionCardReceipt]}
              onPress={() => navigation.navigate('CreateReceipt')}
              activeOpacity={0.7}
            >
              <View style={styles.compactActionIcon}>
                <Text style={styles.compactActionIconText}>🧾</Text>
              </View>
              <Text style={styles.compactActionTitle}>New Receipt</Text>
              <Text style={styles.compactActionSubtitle}>Payment Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Management Section */}
        <View style={styles.section}>
          <View style={styles.menuGrid}>
            <MenuButton
              icon="📦"
              title="Products"
              onPress={() => navigation.navigate('Products')}
            />
            <MenuButton
              icon="🏢"
              title="Outlets"
              onPress={() => navigation.navigate('Outlets')}
            />
            <MenuButton
              icon="🏛️"
              title="Company"
              onPress={() => navigation.navigate('CompanySettings')}
            />
            <MenuButton
              icon="📋"
              title="Invoices"
              onPress={() => navigation.navigate('SavedInvoices')}
            />
            <MenuButton
              icon="🗂️"
              title="Receipts"
              onPress={() => navigation.navigate('SavedReceipts')}
            />
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <QuickActionButton
            icon="⚙️"
            title="App Settings"
            subtitle="Backup, sync & preferences"
            onPress={() => navigation.navigate('Settings')}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    backgroundColor: theme.primary,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text.inverse,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  section: {
    marginBottom: 20,
  },
  quickActionCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: theme.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.border,
  },
  quickActionCardPrimary: {
    backgroundColor: theme.success,
    borderColor: theme.success,
    shadowColor: theme.success,
    shadowOpacity: 0.2,
    elevation: 6,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionIconText: {
    fontSize: 28,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 4,
  },
  quickActionTitlePrimary: {
    color: theme.text.inverse,
  },
  quickActionSubtitle: {
    fontSize: 13,
    color: theme.text.secondary,
    fontWeight: '400',
  },
  quickActionSubtitlePrimary: {
    color: theme.text.inverse,
    opacity: 0.9,
  },
  quickActionArrow: {
    fontSize: 28,
    color: theme.text.light,
    fontWeight: '300',
    marginLeft: 8,
  },
  quickActionArrowPrimary: {
    color: theme.text.inverse,
    opacity: 0.8,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuButton: {
    width: '48%',
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: theme.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.border,
    minHeight: 130,
  },
  menuButtonIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  menuButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text.primary,
    textAlign: 'center',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  compactActionCard: {
    flex: 1,
    backgroundColor: theme.success,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: theme.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  compactActionCardReceipt: {
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
  },
  compactActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  compactActionIconText: {
    fontSize: 24,
  },
  compactActionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text.inverse,
    marginBottom: 2,
  },
  compactActionSubtitle: {
    fontSize: 11,
    color: theme.text.inverse,
    opacity: 0.85,
  },
});

