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
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Receipt, PaymentMode } from '../types/receipt';
import { Outlet } from '../types/outlet';
import { CompanySettings } from '../types/company';
import { OutletService } from '../services/OutletService';
import { CompanySettingsService } from '../services/CompanySettingsService';
import { ReceiptCounterService } from '../services/ReceiptCounterService';
import { ReceiptStorageService } from '../services/ReceiptStorageService';
import { PDFService } from '../services/PDFService';
import { numberToWords } from '../utils/numberToWords';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateReceiptScreen({ navigation }: any) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const styles = getStyles(theme, insets.bottom);

    // State
    const [receiptNumber, setReceiptNumber] = useState('');
    const [fullReceiptNumber, setFullReceiptNumber] = useState('');
    const [date, setDate] = useState('');
    const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
    const [bankName, setBankName] = useState('');
    const [chequeNumber, setChequeNumber] = useState('');
    const [chequeDate, setChequeDate] = useState('');

    // Date Picker State
    const [showChequeDatePicker, setShowChequeDatePicker] = useState(false);
    const [chequeDateObj, setChequeDateObj] = useState(new Date());

    const [amount, setAmount] = useState('');
    const [balanceAmount, setBalanceAmount] = useState('');
    const [amountInWords, setAmountInWords] = useState('');

    // Payee (Outlet)
    const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [showOutletPicker, setShowOutletPicker] = useState(false);

    // Company settings
    const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

    // Loading states
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        loadInitialData();
        setCurrentDate();
    }, []);

    useEffect(() => {
        // Update amount in words when amount changes
        const numAmount = parseFloat(amount) || 0;
        if (numAmount > 0) {
            setAmountInWords(numberToWords(numAmount));
        } else {
            setAmountInWords('');
        }
    }, [amount]);

    const setCurrentDate = () => {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        setDate(`${day}/${month}/${year}`);
    };

    const loadInitialData = async () => {
        try {
            // Load outlets
            const loadedOutlets = await OutletService.getOutlets();
            setOutlets(loadedOutlets);

            // Load company settings
            const settings = await CompanySettingsService.getSettings();
            setCompanySettings(settings);

            // Load next receipt number
            if (settings?.receiptPrefix) {
                const { number, fullNumber } = await ReceiptCounterService.getNextReceiptNumber(settings.receiptPrefix);
                setReceiptNumber(number);
                setFullReceiptNumber(fullNumber);
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    };

    const selectOutlet = (outlet: Outlet) => {
        setSelectedOutlet(outlet);
        setShowOutletPicker(false);
    };

    const clearOutlet = () => {
        setSelectedOutlet(null);
    };

    const onChequeDateChange = (event: any, selectedDate?: Date) => {
        setShowChequeDatePicker(false);
        if (selectedDate) {
            setChequeDateObj(selectedDate);
            // Format DD/MM/YYYY
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const year = selectedDate.getFullYear();
            setChequeDate(`${day}/${month}/${year}`);
        }
    };

    const handleGenerateReceipt = async () => {
        // Validation
        if (!companySettings?.receiptPrefix) {
            Alert.alert('Error', 'Please set a Receipt Prefix in Company Settings first.');
            return;
        }

        if (!selectedOutlet) {
            Alert.alert('Error', 'Please select a payee (outlet).');
            return;
        }

        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) {
            Alert.alert('Error', 'Please enter a valid amount.');
            return;
        }

        if (paymentMode === 'BANK' && !bankName.trim()) {
            Alert.alert('Error', 'Please enter the bank name.');
            return;
        }

        if (paymentMode === 'CHEQUE') {
            if (!chequeNumber.trim()) {
                Alert.alert('Error', 'Please enter the cheque number.');
                return;
            }
            if (!chequeDate.trim()) {
                Alert.alert('Error', 'Please select the cheque date.');
                return;
            }
        }

        setIsGenerating(true);

        try {
            // DON'T reserve the number yet - just preview it for the receipt object
            // The actual reservation happens AFTER successful PDF generation
            const { number, fullNumber } = await ReceiptCounterService.getNextReceiptNumber(companySettings.receiptPrefix);

            // Create receipt object (with preview number)
            const receipt: Receipt = {
                id: Date.now().toString(),
                receiptNumber: number,
                receiptPrefix: companySettings.receiptPrefix,
                fullReceiptNumber: fullNumber,
                date,
                paymentMode,
                bankName: paymentMode === 'BANK' ? bankName : undefined,
                chequeNumber: paymentMode === 'CHEQUE' ? chequeNumber : undefined,
                chequeDate: paymentMode === 'CHEQUE' ? chequeDate : undefined,
                payeeName: selectedOutlet.name,
                payeeAddress: selectedOutlet.address,
                amount: numAmount,
                amountInWords,
                balanceAmount: parseFloat(balanceAmount) || 0,
                createdAt: new Date().toISOString(),
            };

            // Generate PDF with timeout (30 seconds)
            const PDF_TIMEOUT_MS = 30000;
            const generatePDFPromise = PDFService.generateReceiptPDF(receipt, companySettings);
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('PDF generation timed out. Please try again.')), PDF_TIMEOUT_MS)
            );

            const pdfPath = await Promise.race([generatePDFPromise, timeoutPromise]);

            // PDF generated successfully - NOW reserve the receipt number
            // This prevents number skipping if PDF generation fails
            await ReceiptCounterService.reserveNextReceiptNumber(companySettings.receiptPrefix);
            console.log(`Receipt number ${fullNumber} reserved after successful PDF generation`);

            // Save receipt to storage
            await ReceiptStorageService.saveReceipt(receipt);

            // Share the PDF
            await PDFService.sharePDF(pdfPath);

            Alert.alert(
                'Success',
                `Receipt ${fullNumber} has been generated and saved.`,
                [
                    {
                        text: 'Create Another',
                        onPress: () => {
                            resetForm();
                            loadInitialData();
                        },
                    },
                    {
                        text: 'Go Home',
                        onPress: () => navigation.navigate('Home'),
                    },
                ]
            );
        } catch (error) {
            console.error('Error generating receipt:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            Alert.alert(
                'Receipt Generation Failed',
                `${errorMessage}\n\nThe receipt number has NOT been used. You can try again.`,
                [
                    {
                        text: 'Try Again',
                        onPress: () => handleGenerateReceipt(),
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                ]
            );
        } finally {
            setIsGenerating(false);
        }
    };

    const resetForm = () => {
        setPaymentMode('CASH');
        setBankName('');
        setChequeNumber('');
        setChequeDate('');
        setAmount('');
        setBalanceAmount('');
        setAmountInWords('');
        setSelectedOutlet(null);
        setCurrentDate();
    };

    const PaymentModeButton = ({ mode, label }: { mode: PaymentMode; label: string }) => (
        <TouchableOpacity
            style={[
                styles.paymentModeButton,
                paymentMode === mode && styles.paymentModeButtonActive,
            ]}
            onPress={() => setPaymentMode(mode)}
        >
            <Text
                style={[
                    styles.paymentModeButtonText,
                    paymentMode === mode && styles.paymentModeButtonTextActive,
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Receipt Number & Date */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Receipt Details</Text>
                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>Receipt No.</Text>
                            <View style={styles.readOnlyInput}>
                                <Text style={styles.readOnlyText}>{fullReceiptNumber || 'Set prefix in settings'}</Text>
                            </View>
                        </View>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>Date</Text>
                            <View style={styles.readOnlyInput}>
                                <Text style={styles.readOnlyText}>{date}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Payment Mode */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mode of Payment</Text>
                    <View style={styles.paymentModeContainer}>
                        <PaymentModeButton mode="CASH" label="CASH" />
                        <PaymentModeButton mode="BANK" label="BANK" />
                        <PaymentModeButton mode="CHEQUE" label="CHEQUE" />
                    </View>

                    {paymentMode === 'BANK' && (
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Bank Name</Text>
                            <TextInput
                                style={styles.input}
                                value={bankName}
                                onChangeText={setBankName}
                                placeholder="Enter bank name"
                                placeholderTextColor={theme.text.light}
                            />
                        </View>
                    )}

                    {paymentMode === 'CHEQUE' && (
                        <>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Cheque Number</Text>
                                <TextInput
                                    style={styles.input}
                                    value={chequeNumber}
                                    onChangeText={setChequeNumber}
                                    placeholder="Enter cheque number"
                                    placeholderTextColor={theme.text.light}
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Cheque Date</Text>
                                <TouchableOpacity
                                    style={styles.datePickerButton}
                                    onPress={() => setShowChequeDatePicker(true)}
                                >
                                    <Text style={[
                                        styles.datePickerText,
                                        !chequeDate && { color: theme.text.light }
                                    ]}>
                                        {chequeDate || 'DD/MM/YYYY'}
                                    </Text>
                                </TouchableOpacity>
                                {showChequeDatePicker && (
                                    <DateTimePicker
                                        value={chequeDateObj}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={onChequeDateChange}
                                    />
                                )}
                            </View>
                        </>
                    )}
                </View>

                {/* Payee Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payee</Text>
                    {selectedOutlet ? (
                        <View style={styles.selectedOutlet}>
                            <View style={styles.selectedOutletInfo}>
                                <Text style={styles.selectedOutletName}>{selectedOutlet.name}</Text>
                                {selectedOutlet.address && (
                                    <Text style={styles.selectedOutletAddress}>{selectedOutlet.address}</Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={clearOutlet} style={styles.clearButton}>
                                <Text style={styles.clearButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.selectButton}
                            onPress={() => setShowOutletPicker(true)}
                        >
                            <Text style={styles.selectButtonText}>Select Payee (Outlet)</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Amount */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Amount</Text>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Amount (₹)</Text>
                        <TextInput
                            style={styles.input}
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="Enter amount"
                            placeholderTextColor={theme.text.light}
                            keyboardType="decimal-pad"
                        />
                    </View>
                    {amountInWords && (
                        <View style={styles.amountWordsContainer}>
                            <Text style={styles.amountWordsLabel}>In Words:</Text>
                            <Text style={styles.amountWordsText}>{amountInWords}</Text>
                        </View>
                    )}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Balance Amount (₹)</Text>
                        <TextInput
                            style={styles.input}
                            value={balanceAmount}
                            onChangeText={setBalanceAmount}
                            placeholder="Enter balance amount (if any)"
                            placeholderTextColor={theme.text.light}
                            keyboardType="decimal-pad"
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Generate Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
                    onPress={handleGenerateReceipt}
                    disabled={isGenerating}
                >
                    <Text style={styles.generateButtonText}>
                        {isGenerating ? 'Generating...' : 'Generate Receipt'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Outlet Picker Modal */}
            <Modal
                visible={showOutletPicker}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowOutletPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Payee</Text>
                            <TouchableOpacity onPress={() => setShowOutletPicker(false)}>
                                <Text style={styles.modalCloseButton}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalList}>
                            {outlets.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyStateText}>No outlets found.</Text>
                                    <TouchableOpacity
                                        style={styles.addOutletButton}
                                        onPress={() => {
                                            setShowOutletPicker(false);
                                            navigation.navigate('AddOutlet');
                                        }}
                                    >
                                        <Text style={styles.addOutletButtonText}>+ Add Outlet</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                outlets.map((outlet) => (
                                    <TouchableOpacity
                                        key={outlet.id}
                                        style={styles.outletItem}
                                        onPress={() => selectOutlet(outlet)}
                                    >
                                        <Text style={styles.outletName}>{outlet.name}</Text>
                                        {outlet.address && (
                                            <Text style={styles.outletAddress}>{outlet.address}</Text>
                                        )}
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const getStyles = (theme: any, bottomInset: number = 0) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        scrollView: {
            flex: 1,
        },
        scrollContent: {
            padding: 16,
            paddingBottom: 100,
        },
        section: {
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.border,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.text.primary,
            marginBottom: 12,
        },
        row: {
            flexDirection: 'row',
            gap: 12,
        },
        halfInput: {
            flex: 1,
        },
        label: {
            fontSize: 13,
            fontWeight: '500',
            color: theme.text.secondary,
            marginBottom: 6,
        },
        input: {
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            padding: 12,
            fontSize: 15,
            color: theme.text.primary,
        },
        inputContainer: {
            marginTop: 12,
        },
        datePickerButton: {
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            padding: 12,
            justifyContent: 'center',
        },
        datePickerText: {
            fontSize: 15,
            color: theme.text.primary,
        },
        readOnlyInput: {
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            padding: 12,
        },
        readOnlyText: {
            fontSize: 15,
            color: theme.text.primary,
            fontWeight: '600',
        },
        paymentModeContainer: {
            flexDirection: 'row',
            gap: 8,
        },
        paymentModeButton: {
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: theme.border,
            alignItems: 'center',
        },
        paymentModeButtonActive: {
            borderColor: theme.primary,
            backgroundColor: theme.primary + '15',
        },
        paymentModeButtonText: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.text.secondary,
        },
        paymentModeButtonTextActive: {
            color: theme.primary,
        },
        selectButton: {
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            padding: 16,
            alignItems: 'center',
        },
        selectButtonText: {
            fontSize: 15,
            color: theme.primary,
            fontWeight: '500',
        },
        selectedOutlet: {
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: theme.primary,
            borderRadius: 8,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
        },
        selectedOutletInfo: {
            flex: 1,
        },
        selectedOutletName: {
            fontSize: 15,
            fontWeight: '600',
            color: theme.text.primary,
        },
        selectedOutletAddress: {
            fontSize: 13,
            color: theme.text.secondary,
            marginTop: 2,
        },
        clearButton: {
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: theme.error + '20',
            alignItems: 'center',
            justifyContent: 'center',
        },
        clearButtonText: {
            color: theme.error,
            fontSize: 14,
            fontWeight: '600',
        },
        amountWordsContainer: {
            backgroundColor: theme.warning + '15',
            borderRadius: 8,
            padding: 12,
            marginTop: 12,
            borderWidth: 1,
            borderColor: theme.warning + '30',
        },
        amountWordsLabel: {
            fontSize: 12,
            color: theme.text.secondary,
            marginBottom: 4,
        },
        amountWordsText: {
            fontSize: 14,
            color: theme.text.primary,
            fontStyle: 'italic',
        },
        footer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            paddingBottom: bottomInset + 16,
            backgroundColor: theme.surface,
            borderTopWidth: 1,
            borderTopColor: theme.border,
        },
        generateButton: {
            backgroundColor: theme.success,
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
        },
        generateButtonDisabled: {
            opacity: 0.6,
        },
        generateButtonText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: '600',
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
        },
        modalContent: {
            backgroundColor: theme.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '80%',
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        modalTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: theme.text.primary,
        },
        modalCloseButton: {
            fontSize: 20,
            color: theme.text.secondary,
            padding: 4,
        },
        modalList: {
            padding: 16,
        },
        outletItem: {
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        outletName: {
            fontSize: 15,
            fontWeight: '600',
            color: theme.text.primary,
        },
        outletAddress: {
            fontSize: 13,
            color: theme.text.secondary,
            marginTop: 2,
        },
        emptyState: {
            padding: 32,
            alignItems: 'center',
        },
        emptyStateText: {
            fontSize: 15,
            color: theme.text.secondary,
            marginBottom: 16,
        },
        addOutletButton: {
            backgroundColor: theme.primary,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
        },
        addOutletButtonText: {
            color: '#fff',
            fontSize: 14,
            fontWeight: '600',
        },
    });
