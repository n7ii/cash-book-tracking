import React, { useState } from 'react';
import { BarChart3, Download, Calendar, PieChart } from 'lucide-react';
import { useTransactions } from '../contexts/TransactionContext';
import CategoryChart from './CategoryChart';
import MonthlyTrends from './MonthlyTrends';
import { useTranslation } from 'react-i18next';

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const { getTransactionSummary, transactions } = useTransactions();
  const [reportType, setReportType] = useState<'overview' | 'categories' | 'trends'>('overview');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const summary = getTransactionSummary(dateRange);

  const exportReport = () => {
    const csvContent = transactions.map(txn => [
      txn.date,
      txn.type,
      txn.description,
      txn.category,
      txn.amount,
      txn.paymentMethod,
      txn.partyInvolved || '',
      txn.notes || ''
    ]);

    const header = ['Date', 'Type', 'Description', 'Category', 'Amount', 'Payment Method', 'Party', 'Notes'];
    const csv = [header, ...csvContent].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${dateRange.start}-to-${dateRange.end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("financialReports")}</h1>
          <p className="text-gray-600">{t("analyzeTourFinancialPatternsAndTrends")}</p>
        </div>
        
        <button 
          onClick={exportReport}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <Download className="h-4 w-4 mr-2" />
          {t("exportReport")}
        </button>
      </div>

      {/* Date Range and Report Type Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("dateRange")}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("reportType")}
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'overview' | 'categories' | 'trends')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="overview">{t("financialOverview")}</option>
              <option value="categories">{t("categoryBreakdown")}</option>
              <option value="trends">{t("monthlyTrends")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t("totalIncome")}</p>
              <p className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summary.totalIncome)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t("totalExpenses")}</p>
              <p className="text-2xl font-bold text-red-600">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summary.totalExpenses)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t("netBanlance")}</p>
              <p className={`text-2xl font-bold ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(summary.netBalance)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${summary.netBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <BarChart3 className={`h-6 w-6 ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t("transactions")}</p>
              <p className="text-2xl font-bold text-gray-900">{summary.transactionCount}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <PieChart className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {reportType === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryChart transactions={transactions} dateRange={dateRange} />
          <MonthlyTrends transactions={transactions} />
        </div>
      )}

      {reportType === 'categories' && (
        <CategoryChart transactions={transactions} dateRange={dateRange} />
      )}

      {reportType === 'trends' && (
        <MonthlyTrends transactions={transactions} />
      )}
    </div>
  );
};

export default Reports;