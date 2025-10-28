import { api } from './api';

// --- INTERFACES (Data "Instruction Manuals") ---

export interface BalanceSummary {
    netBalance: number;
    totalIncome: number;
    totalExpenses: number;
}

export interface LatestReconciliationResponse {
    lastReconciledDate: string | null;
}

export interface ReconciliationPayload {
    statement_date: string;
    system_balance: number;
    bank_balance: number;
}

// --- API FUNCTIONS ---

/**
 * Fetches the all-time system balance from the server.
 */
export const fetchSystemBalance = async (): Promise<BalanceSummary> => {
    const response = await api.get(`/admin/reports/balance`);
    return response.data.summary;
};

/**
 * Fetches the date of the most recent reconciliation.
 */
export const fetchLatestReconciliation = async (): Promise<LatestReconciliationResponse> => {
    const response = await api.get(`/admin/reports/reconciliations/latest`);
    return response.data;
};

/**
 * Saves a new, successful reconciliation record to the database.
 */
export const saveReconciliation = async (payload: ReconciliationPayload): Promise<any> => {
    const response = await api.post(`/admin/reports/reconciliations`, payload);
    return response.data;
};