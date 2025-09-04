import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, TransactionSummary } from '../types/Transaction';
import { generateMockTransactions } from '../utils/mockData';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getTransactionSummary: (dateRange?: { start: string; end: string }) => TransactionSummary;
  loading: boolean;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

interface TransactionProviderProps {
  children: ReactNode;
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize with mock data for demonstration
    const mockData = generateMockTransactions();
    setTransactions(mockData);
    setLoading(false);
  }, []);

  const addTransaction = (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(txn => 
      txn.id === id 
        ? { ...txn, ...updates, updatedAt: new Date().toISOString() }
        : txn
    ));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(txn => txn.id !== id));
  };

  const getTransactionSummary = (dateRange?: { start: string; end: string }): TransactionSummary => {
    let filteredTransactions = transactions;
    
    if (dateRange) {
      filteredTransactions = transactions.filter(txn => {
        const txnDate = new Date(txn.date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return txnDate >= startDate && txnDate <= endDate;
      });
    }

    const totalIncome = filteredTransactions
      .filter(txn => txn.type === 'income')
      .reduce((sum, txn) => sum + txn.amount, 0);

    const totalExpenses = filteredTransactions
      .filter(txn => txn.type === 'expense')
      .reduce((sum, txn) => sum + txn.amount, 0);

    const totalTransfers = filteredTransactions
      .filter(txn => txn.type === 'transfer')
      .reduce((sum, txn) => sum + txn.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      totalTransfers,
      netBalance: totalIncome - totalExpenses,
      transactionCount: filteredTransactions.length,
    };
  };

  const value = {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionSummary,
    loading,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};