// src/components/Service/transactionContextService.ts
import { api } from './api';
import { Transaction } from '../../types/Transaction'; // Adjust path if needed

// Interface for the transaction list API response
export interface TransactionApiResponse {
  total: number;
  page: number;
  limit: number;
  data: Transaction[];
}

// Interface for the filter options API response
export interface FilterOptionsResponse {
  categories: string[];
  types: string[];
}

// Interface for the parameters needed to fetch transactions
export interface FetchTransactionsParams {
  page: number;
  limit: number;
  searchTerm: string;
  filterType: string;
  filterCategory: string;
  sortBy: 'date' | 'amount';
  sortOrder: 'asc' | 'desc';
  startDate: string;
  endDate: string;
}

/**
 * Fetches the list of transactions based on filter parameters.
 * Calls GET /api/transactions
 */
export const fetchTransactionsFromApi = async (params: FetchTransactionsParams): Promise<TransactionApiResponse> => {
  const response = await api.get<TransactionApiResponse>('/transactions', {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.searchTerm,
      type: params.filterType === 'all' ? '' : params.filterType, // Handle 'all' type
      category: params.filterCategory,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      startDate: params.startDate,
      endDate: params.endDate,
    },
  });
  return response.data; // The data is already in the correct shape
};

/**
 * Fetches the available filter options (categories and types).
 * Calls GET /api/transactions/filters
 */
export const fetchFilterOptionsFromApi = async (): Promise<FilterOptionsResponse> => {
  const response = await api.get<FilterOptionsResponse>('/transactions/filters');
  return response.data;
};