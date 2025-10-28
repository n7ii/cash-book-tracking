import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, Dispatch, SetStateAction } from 'react';
import axios from 'axios';
import { Transaction } from '../types/Transaction';

interface ApiResponse {
  total: number;
  page: number;
  limit: number;
  data: Transaction[];
}

// Add filterOptions to the context type
interface TransactionContextType {
  transactions: Transaction[];
  loading: boolean;
  totalTransactions: number;
  currentPage: number;
  totalPages: number;
  limit: number;
  filterOptions: { categories: string[], types: string[] }; // ADD THIS
  setSearchTerm: Dispatch<SetStateAction<string>>;
  setFilterType: Dispatch<SetStateAction<string>>;
  setFilterCategory: Dispatch<SetStateAction<string>>;
  sortBy: 'date' | 'amount';
  setSortBy: Dispatch<SetStateAction<'date' | 'amount'>>;
  sortOrder: 'asc' | 'desc';
  setSortOrder: Dispatch<SetStateAction<'asc' | 'desc'>>;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  dateRange: { start: string; end: string };
  setDateRange: React.Dispatch<React.SetStateAction<{ start: string; end: string }>>;
  refreshTransactions: () => void;
  searchTerm: string;
  filterType: string;
  filterCategory: string;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: new Date().toISOString().split('T')[0], // Today
  });
  
  // MOVE filterOptions state here
  const [filterOptions, setFilterOptions] = useState<{ categories: string[], types: string[] }>({ categories: [], types: [] });

  const [totalTransactions, setTotalTransactions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // MOVE the logic to fetch filter options here
  useEffect(() => {
    const fetchFilterOptions = async () => {
        const token = sessionStorage.getItem('authToken');
        if (!token) return;
        try {
            const response = await axios.get('http://localhost:3000/api/transactions/filters', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setFilterOptions(response.data);
        } catch (error) {
            console.error("Failed to fetch filter options", error);
        }
    };
    fetchFilterOptions();
  }, []); // Runs once on component mount

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const token = sessionStorage.getItem('authToken');
    if (!token) {
        setLoading(false);
        return;
    }

    try {
      const response = await axios.get<ApiResponse>('http://localhost:3000/api/transactions', {
        headers: { 'Authorization': `Bearer ${token}` },
        params: {
          page: currentPage,
          limit,
          search: searchTerm,
          type: filterType === 'all' ? '' : filterType,
          category: filterCategory,
          sortBy,
          sortOrder,
          startDate: dateRange.start,
          endDate: dateRange.end,     
        },
      });

      setTransactions(response.data.data);
      setTotalTransactions(response.data.total);
      setTotalPages(Math.ceil(response.data.total / limit));
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, searchTerm, filterType, filterCategory, sortBy, sortOrder, dateRange]);

  useEffect(() => {
    const handler = setTimeout(() => {
        fetchTransactions();
    }, 300); // Debounce to prevent too many API calls

    return () => {
        clearTimeout(handler);
    };
  }, [fetchTransactions]);

  const value = {
    transactions,
    loading,
    totalTransactions,
    currentPage,
    limit,
    totalPages,
    filterOptions, // ADD filterOptions to the value object
    setSearchTerm,
    setFilterType,
    setFilterCategory,
    setSortBy,
    setSortOrder,
    setCurrentPage,
    dateRange,
     sortBy,
    sortOrder,    
    setDateRange, 
    refreshTransactions: fetchTransactions,
    searchTerm,
    filterType,
    filterCategory,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};