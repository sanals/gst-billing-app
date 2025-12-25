export type PaymentMode = 'CASH' | 'BANK' | 'CHEQUE';

export interface Receipt {
    id: string;
    receiptNumber: string;       // Just the number part
    receiptPrefix: string;       // Prefix like "REC"
    fullReceiptNumber: string;   // Complete: "REC-1"
    date: string;

    // Payment Details
    paymentMode: PaymentMode;
    bankName?: string;           // Required if BANK
    chequeNumber?: string;       // Required if CHEQUE
    chequeDate?: string;         // Required if CHEQUE

    // Payee Details (from Outlet)
    payeeName: string;
    payeeAddress?: string;

    // Amount
    amount: number;
    amountInWords: string;
    balanceAmount: number;       // Manually entered by user

    // Timestamps
    createdAt: string;
}
