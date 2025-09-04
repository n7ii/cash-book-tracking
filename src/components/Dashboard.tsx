import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useTransactions } from '../contexts/TransactionContext';
import SummaryCard from './SummaryCard';
import RecentTransactions from './RecentTransactions';
import BalanceChart from './BalanceChart';

const Dashboard: React.FC = () => {
  const { getTransactionSummary, transactions } = useTransactions();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  const getDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const currentRange = getDateRange(dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90);
  const summary = getTransactionSummary(currentRange);
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600">Track your income, expenses, and overall financial health</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Net Balance"
          value={summary.netBalance}
          icon={DollarSign}
          color="blue"
          format="currency"
        />
        <SummaryCard
          title="Total Income"
          value={summary.totalIncome}
          icon={TrendingUp}
          color="green"
          format="currency"
          trend={summary.totalIncome > 0 ? 'up' : 'neutral'}
        />
        <SummaryCard
          title="Total Expenses"
          value={summary.totalExpenses}
          icon={TrendingDown}
          color="red"
          format="currency"
          trend={summary.totalExpenses > 0 ? 'down' : 'neutral'}
        />
        <SummaryCard
          title="Transactions"
          value={summary.transactionCount}
          icon={CreditCard}
          color="purple"
          format="number"
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BalanceChart dateRange={dateRange} />
        </div>
        <div className="lg:col-span-1">
          <RecentTransactions transactions={recentTransactions} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200">
            <div className="text-center">
              <ArrowUpRight className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Add Income</span>
            </div>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200">
            <div className="text-center">
              <ArrowDownRight className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Add Expense</span>
            </div>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200">
            <div className="text-center">
              <CreditCard className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Transfer Funds</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;