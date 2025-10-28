import { api } from './api';

// --- INTERFACE ---
// Describes the shape of the data for a single month from the API
export interface MonthlyDataPoint {
    month: string; // e.g., "2025-10"
    totalIncome: number;
    totalExpenses: number;
}

// --- API FUNCTION ---

/**
 * Fetches the income/expense trend data for the last X months.
 */
export const fetchMonthlyTrends = async (months: number = 6): Promise<MonthlyDataPoint[]> => {
    const response = await api.get(`/admin/reports/monthly-trends`, {
        params: {
            count: months
        }
    });
    return response.data;
};