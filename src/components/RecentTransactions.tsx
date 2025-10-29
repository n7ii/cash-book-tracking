import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Transaction } from '../types/Transaction';

interface RecentTransactionsProps {
  /** List of transactions to display. Typically the first 5 recent items. */
  transactions: Transaction[];
  /** Optional handler invoked when the user clicks the "View All" button. */
  onViewAll?: () => void;
  /** Optional limit to show only a subset of the transactions list. */
  limit?: number;
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  onViewAll,
  limit = 5,
}) => {
  const { t } = useTranslation();
  // Limit the number of displayed items if a limit is provided
  const items = Array.isArray(transactions)
    ? transactions.slice(0, limit)
    : [];

  // Helper to format currency values
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('lo-LA', {
      style: 'currency',
      currency: 'LAK',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">
              {t('recentActivity') || 'ກິດຈະກໍາລ່າສຸດ'}
            </h3>
          </div>
          <button
            onClick={onViewAll}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
          >
            <span>{t('viewAll') || 'ເບິ່ງທັງໝົດ'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {t('noRecentTransactions') || 'ບໍ່ມີກິດຈະກໍາລ່າສຸດ'}
          </p>
        ) : (
          items.map((tx, index) => (
            <div
             key={`${tx.id}-${index}`}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors duration-150"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div
                  className={`w-2 h-2 rounded-full ${
                    tx.type === 'income'
                      ? 'bg-green-500'
                      : tx.type === 'expense'
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {tx.description || tx.type}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {new Date(tx.date).toLocaleDateString()} • {tx.category || '-'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`text-sm font-medium ${
                    tx.type === 'income'
                      ? 'text-green-600'
                      : tx.type === 'expense'
                      ? 'text-red-600'
                      : 'text-blue-600'
                  }`}
                >
                  {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;