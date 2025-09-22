export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  description: string;
  amount: number;
  category: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'check' | 'other';
  partyInvolved?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  marketId?: string;
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