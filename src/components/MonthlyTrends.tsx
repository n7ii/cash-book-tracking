import React, { useMemo } from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import { Transaction } from '../types/Transaction';

interface MonthlyTrendsProps {
  transactions: Transaction[];
}

const MonthlyTrends: React.FC<MonthlyTrendsProps> = ({ transactions }) => {
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.toISOString().slice(0, 7); // YYYY-MM format
      
      const monthTransactions = transactions.filter(txn => 
        txn.date.slice(0, 7) === month
      );

      const income = monthTransactions
        .filter(txn => txn.type === 'income')
        .reduce((sum, txn) => sum + txn.amount, 0);
      
      const expenses = monthTransactions
        .filter(txn => txn.type === 'expense')
        .reduce((sum, txn) => sum + txn.amount, 0);

      months.push({
        month,
        monthName: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income,
        expenses,
        net: income - expenses,
        transactionCount: monthTransactions.length,
      });
    }

    return months;
  }, [transactions]);

  const maxValue = Math.max(
    ...monthlyData.flatMap(m => [m.income, m.expenses])
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Calendar className="h-5 w-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900">Monthly Trends</h3>
      </div>

      <div className="space-y-6">
        {monthlyData.map((month) => {
          const incomeHeight = maxValue > 0 ? (month.income / maxValue) * 100 : 0;
          const expenseHeight = maxValue > 0 ? (month.expenses / maxValue) * 100 : 0;

          return (
            <div key={month.month} className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">{month.monthName}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-500">{month.transactionCount} txns</span>
                  <span className={`text-sm font-medium ${month.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {new Intl.NumberFormat('en-US', { 
                      style: 'currency', 
                      currency: 'USD',
                      signDisplay: 'always'
                    }).format(month.net)}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2 h-6">
                {/* Income bar */}
                <div className="flex-1 bg-gray-100 rounded">
                  <div
                    className="h-full bg-green-500 rounded transition-all duration-500"
                    style={{ width: `${incomeHeight}%` }}
                    title={`Income: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(month.income)}`}
                  ></div>
                </div>
                
                {/* Expense bar */}
                <div className="flex-1 bg-gray-100 rounded">
                  <div
                    className="h-full bg-red-500 rounded transition-all duration-500"
                    style={{ width: `${expenseHeight}%` }}
                    title={`Expenses: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(month.expenses)}`}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between text-xs text-gray-500">
                <span>Income: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(month.income)}</span>
                <span>Expenses: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(month.expenses)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthlyTrends;