import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Linking,
    Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import { PDFService } from '../services/PDFService';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { RootStackParamList } from '../navigation/AppNavigator';

type SavedReceiptsScreenProps = {
    navigation: StackNavigationProp<RootStackParamList, 'SavedReceipts'>;
};

interface SavedReceipt {
    uri: string;
    name: string;
    size?: number;
    modificationTime?: number;
}

export default function SavedReceiptsScreen({ navigation }: SavedReceiptsScreenProps) {
    const { theme, themeMode } = useTheme();
    const styles = getStyles(theme);
    const [receipts, setReceipts] = useState<SavedReceipt[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sharing, setSharing] = useState<string | null>(null);

    useEffect(() => {
        loadReceipts();
    }, []);

    const loadReceipts = async () => {
        try {
            const savedReceipts = await PDFService.getSavedReceipts();
            const receiptList: SavedReceipt[] = savedReceipts.map((info) => {
                const fileName = info.uri.split('/').pop() || 'Unknown';
                // Format: ReceiptNumber_YYYY-MM-DD.pdf
                const parts = fileName.replace('.pdf', '').split('_');
                const datePart = parts[parts.length - 1]; // Last part is date
                const receiptParts = parts.slice(0, -1);
                const receiptNumber = receiptParts.join('-');

                return {
                    uri: info.uri,
                    name: receiptNumber || 'Unknown',
                    size: info.size,
                    modificationTime: info.modificationTime,
                };
            });
            setReceipts(receiptList);
        } catch (error) {
            console.error('Error loading receipts:', error);
            Alert.alert('Error', 'Failed to load saved receipts');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadReceipts();
    };

    const handlePreview = async (uri: string) => {
        try {
            if (Platform.OS === 'android') {
                try {
                    let contentUri = uri;
                    try {
                        if (FileSystem.getContentUriAsync) {
                            contentUri = await FileSystem.getContentUriAsync(uri);
                        }
                    } catch (e) {
                        console.log('Using file URI directly');
                    }

                    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                        data: contentUri,
                        flags: 1,
                        type: 'application/pdf',
                    });
                } catch (intentError) {
                    console.error('Intent launcher error:', intentError);
                    Alert.alert(
                        'Preview Not Available',
                        'No PDF viewer app found. Would you like to share the PDF instead?',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Share', onPress: () => handleShare(uri, 'Receipt') },
                        ]
                    );
                }
            } else {
                const canOpen = await Linking.canOpenURL(uri);
                if (canOpen) {
                    await Linking.openURL(uri);
                } else {
                    Alert.alert(
                        'Preview Not Available',
                        'Unable to open PDF. Would you like to share it instead?',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Share', onPress: () => handleShare(uri, 'Receipt') },
                        ]
                    );
                }
            }
        } catch (error) {
            console.error('Error previewing receipt:', error);
            Alert.alert(
                'Preview Error',
                'Failed to open PDF. Would you like to share it instead?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Share', onPress: () => handleShare(uri, 'Receipt') },
                ]
            );
        }
    };

    const handleShare = async (uri: string, name: string) => {
        setSharing(uri);
        try {
            await PDFService.sharePDF(uri);
        } catch (error) {
            console.error('Error sharing receipt:', error);
            Alert.alert('Error', 'Failed to share receipt');
        } finally {
            setSharing(null);
        }
    };

    const handleDelete = (uri: string, name: string) => {
        Alert.alert(
            'Delete Receipt',
            `Are you sure you want to delete ${name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await PDFService.deletePDF(uri);
                            Alert.alert('Success', 'Receipt deleted successfully');
                            loadReceipts();
                        } catch (error) {
                            console.error('Error deleting receipt:', error);
                            Alert.alert('Error', 'Failed to delete receipt');
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (timestamp?: number): string => {
        if (!timestamp) return 'Unknown date';
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatFileSize = (bytes?: number): string => {
        if (!bytes) return 'Unknown size';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={styles.loadingText}>Loading saved receipts...</Text>
            </View>
        );
    }

    if (receipts.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>No saved receipts</Text>
                <Text style={styles.emptySubtext}>
                    Generated receipts will be saved here automatically
                </Text>
                <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                    <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
            <FlatList
                data={receipts}
                keyExtractor={(item) => item.uri}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.info}>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.date}>{formatDate(item.modificationTime)}</Text>
                            <Text style={styles.size}>{formatFileSize(item.size)}</Text>
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.previewBtn]}
                                onPress={() => handlePreview(item.uri)}
                            >
                                <Text style={styles.actionText}>Preview</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.shareBtn]}
                                onPress={() => handleShare(item.uri, item.name)}
                                disabled={sharing === item.uri}
                            >
                                {sharing === item.uri ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.actionText}>Share</Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.deleteBtn]}
                                onPress={() => handleDelete(item.uri, item.name)}
                            >
                                <Text style={styles.actionText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                contentContainerStyle={styles.list}
            />
        </View>
    );
}

const getStyles = (theme: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: theme.background },
    loadingText: { marginTop: 10, fontSize: 16, color: theme.text.secondary },
    emptyText: { fontSize: 20, fontWeight: 'bold', color: theme.text.primary, marginBottom: 10 },
    emptySubtext: { fontSize: 14, color: theme.text.secondary, textAlign: 'center', marginBottom: 20 },
    refreshButton: { backgroundColor: theme.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
    refreshButtonText: { color: theme.text.inverse, fontSize: 16, fontWeight: '600' },
    list: { padding: 16 },
    card: {
        backgroundColor: theme.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: theme.card.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    info: { marginBottom: 12 },
    name: { fontSize: 18, fontWeight: 'bold', color: theme.text.primary, marginBottom: 4 },
    date: { fontSize: 14, color: theme.text.secondary, marginBottom: 2 },
    size: { fontSize: 12, color: theme.text.secondary },
    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center' },
    previewBtn: { backgroundColor: theme.success },
    shareBtn: { backgroundColor: theme.primary },
    deleteBtn: { backgroundColor: theme.error },
    actionText: { color: theme.text.inverse, fontSize: 14, fontWeight: '600' },
});
