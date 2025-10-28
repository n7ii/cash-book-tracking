
import { Transaction } from '../../types/Transaction'; // Adjust path if needed
// Use the centralized 'api' instance
import { api } from './api';

// --- TYPE DEFINITION for filters ---
interface ExportFilters {
    search?: string;
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
}

/**
 * Deletes a single transaction (income or expense).
 * @param token - The user's authentication token.
 * @param type - The type of transaction ('income' or 'expense').
 * @param id - The ID of the transaction to delete.
 * @param reason - The reason for deletion.
 */
export const deleteTransaction = (type: string, id: number, reason: string): Promise<void> => {
    // This calls the existing endpoint in transactionsRoutes.js
    return api.post(
        `/transactions/${type}/${id}/delete`,
        { reason },
    );
};

/**
 * Fetches a list of all transactions for CSV export, based on filters.
 * @param token - The user's authentication token.
 * @param filters - An object containing all the filter criteria.
 */
export const exportTransactions = async (filters: ExportFilters): Promise<Transaction[]> => {
    // This calls the existing endpoint in transactionsRoutes.js
    const response = await api.get(`/transactions/export`, {
        params: {
            search: filters.search,
            type: filters.type === 'all' ? '' : filters.type,
            category: filters.category,
            startDate: filters.startDate,
            endDate: filters.endDate
        }
    });
    return response.data;
};