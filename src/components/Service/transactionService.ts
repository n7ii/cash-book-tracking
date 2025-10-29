import { api } from './api';

// --- TYPE DEFINITIONS ---
// These describe the shape of the detailed data we expect from the API

export interface IncomeDetail {
    IID: number;
    member_id: number | null; // Add this
    user_id: number;         // Add this
    total: number;
    photo_url: string | null;
    notes: string | null;
    market_id: number | null; // Add this
    created_at: string;
    type: string | null;          // Add this
    category: string | null;
    payment_method: string | null;
    // Joined fields from other tables
    employee_fname: string;
    employee_lname: string;
    collector_fname: string | null;
    collector_lname: string | null;
    market_name: string | null;
}

export interface IncomeSubDetail {
    member_id: number;
    status: 'PAID' | 'NOT_PAID';
    notes: string | null;
    Fname: string;
    Lname: string;
}

export interface ExpenseDetail {
    EID: number;
    user_id: number; 
    expense_type: string;
    amount: number;
    photo_url: string | null;
    created_at: string;
    notes: string | null;
    category: string | null;
    payment_method: string | null;
    market_id: number | null;
    market_name: string | null;
    employee_fname: string;
    employee_lname: string;
}

export interface LoanDetail {
    LID: number;
    member_id: number; 
    total: number;
    balance: number;
    start_date: string;
    end_date: string | null;
    status: number;
    notes: string | null;
    created_by: number
    customer_fname: string;
    customer_lname: string;
    market_name: string;
    created_by_fname: string;
    created_by_lname: string;
}

// --- API FUNCTIONS ---

export const fetchIncomeDetail = async (id: string | number): Promise<IncomeDetail> => {
    // This calls the existing endpoint in collectionsRoutes.js
    const response = await api.get(`/collections/${id}`);
    return response.data;
};

export const fetchIncomeSubDetails = async (id: string | number): Promise<IncomeSubDetail[]> => {
    // This calls the existing endpoint to get the list of paid/unpaid customers
    const response = await api.get(`/collections/${id}/details`);
    return response.data;
};

export const fetchExpenseDetail = async ( id: string | number): Promise<ExpenseDetail> => {
    // This calls the existing endpoint in expensesRoutes.js
    const response = await api.get(`/expenses/${id}`);
    return response.data;
};

export const fetchLoanDetail = async ( id: string | number): Promise<LoanDetail> => {
    // This calls the existing endpoint in loansRoutes.js
    const response = await api.get(`/loans/${id}`);
    return response.data;
};

export const fetchRecentTransactions = async (
  startDate: string,
  endDate: string,
  limit = 5
) => {
  const res = await api.get(
    `/transactions`,
    {
      params: { startDate, endDate, page: 1, limit },
    }
  );
  return res.data.data;
};