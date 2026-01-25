/**
 * Report Service - Generates summary reports for receipts
 */
import { Receipt } from '../types/receipt';
import { ReceiptStorageService } from './ReceiptStorageService';
import { CompanySettingsService } from './CompanySettingsService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

export interface ReceiptSummary {
    startDate: Date;
    endDate: Date;
    totalAmount: number;
    totalCount: number;
    receipts: Receipt[];
    filterType: 'today' | 'date' | 'month' | 'custom';
}

export class ReportService {
    /**
     * Get receipts filtered by date range
     */
    static async getReceiptsByDateRange(startDate: Date, endDate: Date): Promise<Receipt[]> {
        const allReceipts = await ReceiptStorageService.getAllReceipts();

        // Set time bounds for comparison
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return allReceipts.filter(receipt => {
            const receiptDate = new Date(receipt.createdAt);
            return receiptDate >= start && receiptDate <= end;
        });
    }

    /**
     * Get today's receipts
     */
    static async getTodayReceipts(): Promise<Receipt[]> {
        const today = new Date();
        return this.getReceiptsByDateRange(today, today);
    }

    /**
     * Get receipts for a specific month
     */
    static async getMonthReceipts(year: number, month: number): Promise<Receipt[]> {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0); // Last day of month
        return this.getReceiptsByDateRange(startDate, endDate);
    }

    /**
     * Calculate summary from receipts
     */
    static calculateSummary(
        receipts: Receipt[],
        startDate: Date,
        endDate: Date,
        filterType: 'today' | 'date' | 'month' | 'custom'
    ): ReceiptSummary {
        const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);

        return {
            startDate,
            endDate,
            totalAmount,
            totalCount: receipts.length,
            receipts: receipts.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ),
            filterType,
        };
    }

    /**
     * Format date for display
     */
    static formatDate(date: Date): string {
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }

    /**
     * Get date range label
     */
    static getDateRangeLabel(summary: ReceiptSummary): string {
        const startStr = this.formatDate(summary.startDate);
        const endStr = this.formatDate(summary.endDate);

        if (summary.filterType === 'today') {
            return `Today (${startStr})`;
        } else if (summary.filterType === 'date') {
            return startStr;
        } else if (summary.filterType === 'month') {
            return summary.startDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        } else {
            return `${startStr} - ${endStr}`;
        }
    }

    /**
     * Generate Summary PDF
     */
    static async generateSummaryPDF(summary: ReceiptSummary): Promise<string> {
        const settings = await CompanySettingsService.getSettings();
        const companyName = settings?.name || 'Company';
        const dateRangeLabel = this.getDateRangeLabel(summary);
        const generatedAt = new Date().toLocaleString('en-IN');

        // Generate receipt rows
        const receiptRows = summary.receipts.map((r, index) => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${index + 1}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.fullReceiptNumber}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.payeeName}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${r.amount.toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
            </tr>
        `).join('');

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    color: #333;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #007AFF;
                    padding-bottom: 15px;
                }
                .company-name {
                    font-size: 24px;
                    font-weight: bold;
                    color: #007AFF;
                    margin-bottom: 5px;
                }
                .report-title {
                    font-size: 18px;
                    color: #555;
                }
                .date-range {
                    font-size: 16px;
                    color: #777;
                    margin-top: 10px;
                }
                .summary-box {
                    display: flex;
                    justify-content: space-around;
                    margin: 20px 0;
                    padding: 20px;
                    background: #f5f5f5;
                    border-radius: 8px;
                }
                .summary-item {
                    text-align: center;
                }
                .summary-label {
                    font-size: 12px;
                    color: #777;
                    text-transform: uppercase;
                }
                .summary-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #007AFF;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                th {
                    background: #007AFF;
                    color: white;
                    padding: 10px;
                    text-align: left;
                }
                th:nth-child(4) {
                    text-align: right;
                }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 10px;
                    color: #999;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-name">${companyName}</div>
                <div class="report-title">Receipt Summary Report</div>
                <div class="date-range">${dateRangeLabel}</div>
            </div>

            <div class="summary-box">
                <div class="summary-item">
                    <div class="summary-label">Total Receipts</div>
                    <div class="summary-value">${summary.totalCount}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Total Amount</div>
                    <div class="summary-value">₹${summary.totalAmount.toFixed(2)}</div>
                </div>
            </div>

            ${summary.receipts.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Receipt No.</th>
                        <th>Payee</th>
                        <th>Amount</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${receiptRows}
                </tbody>
            </table>
            ` : '<p style="text-align: center; color: #999;">No receipts found for this period.</p>'}

            <div class="footer">
                Generated on ${generatedAt}
            </div>
        </body>
        </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html });

            // Save to receipts folder with descriptive name
            const receiptsDir = `${FileSystem.documentDirectory}receipts/`;
            const dirInfo = await FileSystem.getInfoAsync(receiptsDir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(receiptsDir, { intermediates: true });
            }

            // Generate filename with date/date-range (using local timezone)
            const formatDateForFilename = (d: Date) => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const formatMonthForFilename = (d: Date) => {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return `${months[d.getMonth()]}-${d.getFullYear()}`;
            };

            let dateStr: string;
            const startDateStr = formatDateForFilename(summary.startDate);
            const endDateStr = formatDateForFilename(summary.endDate);

            if (summary.filterType === 'month') {
                // For month: show "Jan-2026" format
                dateStr = formatMonthForFilename(summary.startDate);
            } else if (startDateStr === endDateStr) {
                // Single day
                dateStr = startDateStr;
            } else {
                // Date range
                dateStr = `${startDateStr}_to_${endDateStr}`;
            }

            // Add timestamp to prevent overwriting same-date summaries
            const timestamp = Date.now();
            const fileName = `Summary_${dateStr}_${timestamp}.pdf`;
            const newPath = `${receiptsDir}${fileName}`;
            await FileSystem.moveAsync({ from: uri, to: newPath });

            console.log('Summary PDF saved:', newPath);
            return newPath;
        } catch (error) {
            console.error('Error generating summary PDF:', error);
            throw error;
        }
    }

    /**
     * Share the generated PDF
     */
    static async sharePDF(uri: string): Promise<void> {
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Share Receipt Summary',
            });
        }
    }
}
