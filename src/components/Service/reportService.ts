import { api } from './api';

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
export interface ReportSummary {
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

export const fetchExtendedSummary = async (
startDate?: string, endDate?: string): Promise<ReportSummary> => {
  const res = await api.get(`/admin/reports/balance`, {
    params: { startDate, endDate },
  });
  // The backend wraps the numbers in a summary object
  return res.data.summary as ReportSummary;
};

export const fetchDailyTrends = async (
  startDate: string, 
  endDate: string, 
  token: string
) => {
  const res = await api.get(
    `/admin/reports/monthly-trends`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.map((row: any) => ({
    date: `${row.month}-01`,
    totalIncome: row.totalIncome,
    totalExpenses: row.totalExpenses,
  }));
};

export const fetchTransactionCount = async (
startDate?: string, endDate?: string): Promise<number> => {
  const res = await api.get(`/admin/reports/useractivity`, {
    params: {
      startDate,
      endDate,
      page: 1,
      limit: 1,
    },
  });
  return (res.data?.pagination?.total ?? res.data.total ?? 0) as number;
};

export const fetchRecentTransactions = async (
  startDate?: string,
  endDate?: string,
  limit: number = 5
): Promise<Transaction[]> => {
  const res = await api.get(`/transactions`, {
    params: {
      startDate,
      endDate,
      page: 1,
      limit,
    },
  });
  // Some endpoints wrap the data in a `data` property; others return the array directly
  return (res.data?.data ?? res.data) as Transaction[];
};
// --- API FUNCTIONS ---

/**
 * Fetches the summary balance (income, expenses, net) for a given date range.
 */
export const fetchBalanceSummary = async (startDate: string, endDate: string): Promise<ReportSummary> => {
    const response = await api.get(`/admin/reports/balance`, {
        params: {
            startDate,
            endDate
        }
    });
    return response.data.summary;
};
