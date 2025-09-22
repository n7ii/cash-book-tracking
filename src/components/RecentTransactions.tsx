import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { Transaction } from '../types/Transaction';
import { useTranslation } from 'react-i18next';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  const { t } = useTranslation();
  const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'income': return 'text-green-600 bg-green-50';
      case 'expense': return 'text-red-600 bg-red-50';
      case 'transfer': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('lo-LA', {
      style: 'currency',
      currency: 'LAK',
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">{t("recentActivity")}</h3>
        </div>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1">
          <span>{t("viewAll")}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t("noRecentTransactions")}</p>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors duration-150">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  transaction.type === 'income' ? 'bg-green-500' :
                  transaction.type === 'expense' ? 'bg-red-500' : 'bg-blue-500'
                }`}></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(transaction.date).toLocaleDateString()} • {transaction.category}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${
                  transaction.type === 'income' ? 'text-green-600' :
                  transaction.type === 'expense' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
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