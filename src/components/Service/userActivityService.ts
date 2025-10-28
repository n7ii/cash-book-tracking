import { api } from './api';

// This is the "Instruction Manual" for our data
// =================================================
// 1. Defines the shape of a single transaction
interface Transaction {
  id: number;
  date: string;
  type: 'income' | 'expense' | 'loan';
  description: string | null; // Notes can be null
  amount: number;
  employee_name: string;
  market_name?: string | null;   // ADD THIS LINE
  collector_name?: string | null; // ADD THIS LINE
}

// 2. Defines the shape of the summary object
interface ReportSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
}

// 3. Defines the shape of the entire API response
export interface ActivityReport {
  summary: ReportSummary;
  pagination: PaginationInfo;
  data: Transaction[];
}
// =================================================

// Helper function to get today's date
export const getTodayYMD = (): string => {
  return new Date().toISOString().slice(0, 10);
};

// The function that calls our backend API
export const fetchActivityReport = async (
  page: number, 
  limit: number, 
  startDate: string, 
  endDate: string,
  searchTerm: string = ''
): Promise<ActivityReport> => {
    const response = await api.get(`/admin/reports/useractivity`, {
        params: {
          page,       
          limit,      
          startDate,
          endDate,
          search: searchTerm // We can add search functionality later
      }
    });
    return response.data;
};