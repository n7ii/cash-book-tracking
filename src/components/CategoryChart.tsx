import React, { useMemo } from 'react';
import { PieChart } from 'lucide-react';
import { Transaction } from '../types/Transaction';
import { useTranslation } from 'react-i18next';

interface CategoryChartProps {
  transactions: Transaction[];
  dateRange: { start: string; end: string };
}

const CategoryChart: React.FC<CategoryChartProps> = ({ transactions, dateRange }) => {
  const { t } = useTranslation();
  const categoryData = useMemo(() => {
    const filteredTransactions = transactions.filter(txn => {
      const txnDate = new Date(txn.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      return txnDate >= startDate && txnDate <= endDate;
    });

    const expenseCategories = filteredTransactions
      .filter(txn => txn.type === 'expense')
      .reduce((acc, txn) => {
        acc[txn.category] = (acc[txn.category] || 0) + txn.amount;
        return acc;
      }, {} as Record<string, number>);

    const total = Object.values(expenseCategories).reduce((sum, amount) => sum + amount, 0);

    return Object.entries(expenseCategories)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, dateRange]);

  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-gray-500',
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <PieChart className="h-5 w-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900">{t("expensesCategories")}</h3>
      </div>

      {categoryData.length === 0 ? (
        <div className="text-center py-12">
          <PieChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t("noExpenseDataAvailableForThisPeriod")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {categoryData.map((item, index) => (
            <div key={item.category} className="flex items-center space-x-4">
              <div className={`w-4 h-4 rounded ${colors[index % colors.length]}`}></div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-900">{item.category}</span>
                  <span className="text-sm text-gray-600">
                    {new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(item.amount)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${colors[index % colors.length]}`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryChart;