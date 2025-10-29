export interface Transaction {
  id: number;
  date: string;
  type: 'income' | 'expense' | 'loan' | 'transfer';
  description: string | null;
  category: string | null;
  paymentMethod: string | null;
  amount: number;
  partyInvolved?: string | null; // This was from an older version
  collector?: string | null;     // This is the new field
  employee?: string | null;      // ADD THIS LINE
  market?: string | null;        // ADD THIS LINE
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  totalTransfers: number;
  netBalance: number;
  transactionCount: number;
}

export interface ReconciliationData {
  systemBalance: number;
  bankBalance: number;
  difference: number;
  lastReconciled: string;
  discrepancies: Transaction[];
}