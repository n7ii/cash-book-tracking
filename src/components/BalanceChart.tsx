import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { useTransactions } from '../contexts/TransactionContext';

interface BalanceChartProps {
  dateRange: '7d' | '30d' | '90d';
}

const BalanceChart: React.FC<BalanceChartProps> = ({ dateRange }) => {
  const { transactions } = useTransactions();

  const chartData = useMemo(() => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);

    const dailyData = [];
    let runningBalance = 0;

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      const dayTransactions = transactions.filter(txn => txn.date === dateStr);
      
      const dayIncome = dayTransactions
        .filter(txn => txn.type === 'income')
        .reduce((sum, txn) => sum + txn.amount, 0);
      
      const dayExpenses = dayTransactions
        .filter(txn => txn.type === 'expense')
        .reduce((sum, txn) => sum + txn.amount, 0);

      const netChange = dayIncome - dayExpenses;
      runningBalance += netChange;

      dailyData.push({
        date: dateStr,
        income: dayIncome,
        expenses: dayExpenses,
        balance: runningBalance,
        netChange,
      });
    }

    return dailyData;
  }, [transactions, dateRange]);

  const maxValue = Math.max(...chartData.map(d => Math.max(d.income, d.expenses)));
  const totalChange = chartData[chartData.length - 1]?.balance - (chartData[0]?.balance - chartData[0]?.netChange) || 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Balance Trends</h3>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">Income</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">Expenses</span>
          </div>
        </div>
      </div>

      {/* Period Summary */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-600">Net Change ({dateRange})</span>
        <div className="flex items-center space-x-2">
          {totalChange >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
          <span className={`font-semibold ${totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {new Intl.NumberFormat('en-US', { 
              style: 'currency', 
              currency: 'USD',
              signDisplay: 'always'
            }).format(totalChange)}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 flex items-end justify-between space-x-1">
        {chartData.map((day, index) => {
          const incomeHeight = maxValue > 0 ? (day.income / maxValue) * 100 : 0;
          const expenseHeight = maxValue > 0 ? (day.expenses / maxValue) * 100 : 0;
          
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center space-y-1">
              {/* Bars */}
              <div className="w-full flex flex-col items-center space-y-1 h-48">
                <div className="w-full flex justify-center items-end space-x-1 flex-1">
                  {/* Income bar */}
                  <div
                    className="bg-green-500 rounded-t opacity-80 hover:opacity-100 transition-opacity duration-200 min-h-[2px]"
                    style={{ 
                      height: `${incomeHeight}%`,
                      width: '40%'
                    }}
                    title={`Income: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(day.income)}`}
                  ></div>
                  
                  {/* Expense bar */}
                  <div
                    className="bg-red-500 rounded-t opacity-80 hover:opacity-100 transition-opacity duration-200 min-h-[2px]"
                    style={{ 
                      height: `${expenseHeight}%`,
                      width: '40%'
                    }}
                    title={`Expenses: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(day.expenses)}`}
                  ></div>
                </div>
              </div>
              
              {/* Date label */}
              <span className="text-xs text-gray-500 transform -rotate-45 origin-center">
                {new Date(day.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BalanceChart;