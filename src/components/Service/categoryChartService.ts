import { api } from './api';

// --- INTERFACE ---
// Describes the shape of the data for a single category from the API
export interface CategoryDataPoint {
    category: string;
    total: number;
}

// --- API FUNCTION ---

/**
 * Fetches the expense and loan summary grouped by category for a given date range.
 */
export const fetchCategorySummary = async ( startDate: string, endDate: string): Promise<CategoryDataPoint[]> => {
    const response = await api.get(`/admin/reports/category-summary`, {
        params: {
            startDate,
            endDate
        }
    });
    return response.data;
};