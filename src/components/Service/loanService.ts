import { api } from './api';

// "Instruction Manual" for a single loan in a list
export interface LoanInList {
  LID: number;
  total: number;
  start_date: string;
  status: number;
  customer_fname: string;
  customer_lname: string;
  market_name: string;
  notes?: string | null;
}

// "Instruction Manual" for the full loan details
export interface LoanDetail {
    LID: number;
    member_id: number;
    total: number;
    start_date: string;
    end_date: string | null;
    status: number;
    notes?: string | null;
    created_by: number;
    customer_fname: string;
    customer_lname: string;
    market_name: string;
    created_by_fname: string;
    created_by_lname: string;
  }

/**
 * Fetches the list of loans created by the logged-in employee.
 */
export const fetchMyLoans = async ( page: number = 1, limit: number = 20, search: string = ''): Promise<{ total: number, data: LoanInList[] }> => {
    const response = await api.get(`/loans`, {
        params: { page, limit, search }
    });
    // The backend response has total and data properties
    return response.data;
};

/**
 * Fetches the complete details for a single loan.
 */
export const fetchLoanDetail = async (loanId: string): Promise<LoanDetail> => {
    const response = await api.get(`/loans/${loanId}`, {
    });
    return response.data;
};