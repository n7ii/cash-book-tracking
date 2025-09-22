import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { useTransactions } from '../contexts/TransactionContext';
import { useTranslation } from 'react-i18next';

interface BalanceChartProps {
  dateRange: '7d' | '30d' | '90d';
}

const BalanceChart: React.FC<BalanceChartProps> = ({ dateRange }) => {
  const { transactions } = useTransactions();
  const { t } = useTranslation();

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

  const getBarSpacing = () => {
    switch(dateRange) {
      case '7d': return 'space-x-2';
      case '30d': return 'space-x-1';
      case '90d': return 'space-x-0.5';
      default: return 'space-x-1';
    }
  };

  const getBarWidth = () => {
    switch(dateRange) {
      case '7d': return '45%';
      case '30d': return '40%';
      case '90d': return '35%';
      default: return '40%';
    }
  };

  const shouldShowLabel = (index: number, total: number) => {
    if (dateRange === '7d') return true; 
    if (dateRange === '30d') return index % 3 === 0 || index === total - 1;
    if (dateRange === '90d') return index % 7 === 0 || index === total - 1;
    return true;
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (dateRange === '90d') {
      return date.toLocaleDateString('lo-LA', { 
        day: 'numeric', 
        month: 'numeric' 
      });
    } else {
      return date.toLocaleDateString('lo-LA', { 
        month: 'numeric', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">{t("balanceTrend")}</h3>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">{t("income")}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">{t("expenses")}</span>
          </div>
        </div>
      </div>

      {/* Period Summary */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-600">{t("netChange")} ({dateRange})</span>
        <div className="flex items-center space-x-2">
          {totalChange >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
          <span className={`font-semibold ${totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {new Intl.NumberFormat('lo-LA', { 
              style: 'currency', 
              currency: 'LAK',
              signDisplay: 'always'
            }).format(totalChange)}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 overflow-x-auto">
        <div className={`h-full flex items-end justify-between ${getBarSpacing()} min-w-full`} 
             style={{ minWidth: dateRange === '90d' ? `${90 * 8}px` : 'auto' }}>
          {chartData.map((day, index) => {
            const incomeHeight = maxValue > 0 ? (day.income / maxValue) * 100 : 0;
            const expenseHeight = maxValue > 0 ? (day.expenses / maxValue) * 100 : 0;
            const showLabel = shouldShowLabel(index, chartData.length);
            
            return (
              <div key={day.date} className="flex-shrink-0 flex flex-col items-center space-y-1"
                   style={{ minWidth: dateRange === '90d' ? '8px' : 'auto' }}>
                {/* Bars */}
                <div className="w-full flex flex-col items-center space-y-1 h-48">
                  <div className="w-full flex justify-center items-end space-x-0.5 flex-1">
                    {/* Income bar */}
                    <div
                      className="bg-green-500 rounded-t opacity-80 hover:opacity-100 transition-opacity duration-200 min-h-[2px]"
                      style={{ 
                        height: `${incomeHeight}%`,
                        width: getBarWidth()
                      }}
                      title={`${formatDateLabel(day.date)} - Income: ${new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(day.income)}`}
                    ></div>
                    
                    {/* Expense bar */}
                    <div
                      className="bg-red-500 rounded-t opacity-80 hover:opacity-100 transition-opacity duration-200 min-h-[2px]"
                      style={{ 
                        height: `${expenseHeight}%`,
                        width: getBarWidth()
                      }}
                      title={`${formatDateLabel(day.date)} - Expenses: ${new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(day.expenses)}`}
                    ></div>
                  </div>
                </div>
                
                {/* Date label*/}
                {showLabel && (
                  <span className={`text-xs text-gray-500 transform -rotate-45 origin-center whitespace-nowrap ${
                    dateRange === '90d' ? 'text-[10px]' : ''
                  }`}>
                    {formatDateLabel(day.date)}
                  </span>
                )}
                {!showLabel && <div className="h-4"></div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BalanceChart;