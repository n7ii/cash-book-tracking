import React, { useState } from 'react';
import { Search, Download, Edit, Trash2, Calendar, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNotifications } from '../contexts/NotificationContext';
import { useTransactions } from '../contexts/TransactionContext';
import { Transaction } from '../types/Transaction';
import { useTranslation } from 'react-i18next';
import TransactionDetail from './transactionDetail';
import { deleteTransaction, exportTransactions } from './Service/transactionHistoryService';
import { formatToLaosDateOnly } from '../utils/dateUtils.ts'; 
// --- UPDATED DeleteButton Component ---
const DeleteButton: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
    const { refreshTransactions } = useTransactions();
    const { showConfirm } = useNotifications();

    const handleDelete = () => {
        const onConfirmAction = (reason?: string) => {
            if (!reason || reason.trim() === '') {
                toast.error("Deletion cancelled. A reason is required.");
                return;
            }

            const deletePromise = deleteTransaction(transaction.type, transaction.id, reason)
                .then(() => {
                    refreshTransactions();
                });

            toast.promise(deletePromise, {
                loading: 'Deleting transaction...',
                success: 'Transaction deleted successfully!',
                error: 'Failed to delete transaction.',
            });
        };
        
        showConfirm(
            `Are you sure you want to delete this transaction?`,
            onConfirmAction,
            {
                label: 'Reason for Deletion',
                placeholder: 'e.g., Duplicate entry',
                isRequired: true
            }
        );
    };
    
    return (
        <button onClick={handleDelete} className="text-red-600 hover:text-red-800 p-1">
            <Trash2 className="h-4 w-4" />
        </button>
    );
};
// --- Props Definition ---
interface Props {
  onOpenDetail: (id: string, type: string) => void; // Expect the handler from App.tsx
}
// --- TransactionHistory Component ---
const TransactionHistory: React.FC<Props> = ({ onOpenDetail }) => { // Receive the prop
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const {
    transactions,
    loading,
    totalTransactions,
    currentPage,
    totalPages,
    filterOptions,
    setSearchTerm,
    setFilterType,
    setFilterCategory,
    setSortBy,
    setSortOrder,
    setCurrentPage,
    dateRange,   
    setDateRange, 
    searchTerm,     
    filterType,     
    filterCategory,
    limit,    // Destructure limit
    sortBy,   // Destructure sortBy
    sortOrder // Destructure sortOrder  
  } = useTransactions();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('lo-LA', {
      style: 'currency',
      currency: 'LAK',
    }).format(amount);
  };

  const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'income': return 'text-green-600 bg-green-50';
      case 'expense': return 'text-red-600 bg-red-50';
      case 'loan': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
      }
  };

  const exportReport = async () => {
    setIsExporting(true);

    try {
      const transactionsToExport = await exportTransactions({
          search: searchTerm,
          type: filterType,
          category: filterCategory,
          startDate: dateRange.start,
          endDate: dateRange.end
      });

        if (transactionsToExport.length === 0) {
            toast.error('No data to export for the current filters.');
            setIsExporting(false);
            return;
        }

        const header = ['ID', 'Type', 'Date', 'Employee', 'Market', 'Category', 'Description', 'Amount', 'Payment Method'];
        const rows = transactionsToExport.map(txn => [
            txn.id,
            txn.type,
            new Date(txn.date).toLocaleDateString('en-CA'), // YYYY-MM-DD for CSV consistency
            `"${txn.employee || ''}"`,
            `"${txn.market || ''}"`,
            `"${txn.category || ''}"`,
            `"${(txn.description || '').replace(/"/g, '""')}"`,
            txn.amount,
            txn.paymentMethod
        ]);

        const csvContent = [header.join(','), ...rows.map(row => row.join(','))].join('\n');
        
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-export-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Failed to export CSV:', error);
        toast.error('Failed to export data.');
    } finally {
        setIsExporting(false);
    }
  };

  // --- Main return ---
  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("transactionHistory")}</h1>
          <p className="text-gray-600">{t("viewAndManageAllYourFinancialTransactions")}</p>
        </div>
        <button 
          onClick={exportReport}
          disabled={isExporting}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          {isExporting ? 'Exporting...' : t("exportCSV")}
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t("search")}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder={t("searchTransactions")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg"/>
            </div>
          </div>
          {/* Type Filter */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t("type")}</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                  <option value="all">{t("allTypes")}</option>
                  {filterOptions.types.map(type => (
                      <option key={type} value={type} className="capitalize">{type}</option>
                  ))}
              </select>
          </div>
          {/* Category Filter */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t("category")}</label>
               <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                  <option value="">{t("allCategories")}</option>
                  {filterOptions.categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                  ))}
              </select>
          </div>
           {/* Sort By Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t("sortBy")}</label>
            <div className="flex space-x-2">
               {/* Use the sortBy state variable */}
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')} className="flex-1 px-4 py-2 border rounded-lg">
                <option value="date">{t("date")}</option>
                <option value="amount">{t("amount")}</option>
              </select>
              <button type="button" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="px-3 py-2 border rounded-lg">
                {/* Use the sortOrder state variable */}
                <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
              </button>
            </div>
          </div>
          {/* Date Range Filter */}
          <div className="md:col-span-2 lg:col-span-4 mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t("dateRange")}</label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

 {/* Table section */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
            <div className="text-center py-12"><Loader2 className="h-8 w-8 text-blue-500 mx-auto animate-spin" /></div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t("noTransactionsFoundMatchingYourCriteria")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                    <tr key={`${transaction.type}-${transaction.id}-${transaction.date}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">{transaction.id}</td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">{transaction.employee}</td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">{transaction.market || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold leading-5 rounded-full capitalize ${getTypeColor(transaction.type)}`}>
                                {transaction.type === 'loan' ? 'expense' : transaction.type}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{transaction.category || '-'}</td>
                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-right">
                            <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(transaction.amount)}
                            </span>
                        </td>
                        {/* Use date formatter */}
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">{formatToLaosDateOnly(transaction.date)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 capitalize whitespace-nowrap">{transaction.paymentMethod?.replace('_', ' ')}</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex justify-end space-x-2">
                              {/* Use onOpenDetail prop */}
                                <button onClick={() => onOpenDetail(transaction.id.toString(), transaction.type)} className="text-blue-600 hover:text-blue-800 p-1">
                                    <Edit className="h-4 w-4" />
                                </button>
                                <DeleteButton transaction={transaction} />
                            </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
            </table>
          </div>
        )}
      </div>

       {/* Pagination section */}
       {totalTransactions > 0 && !loading && (
        <div className="flex justify-between items-center text-sm mt-4">
          {/* Use limit from context */}
          <span>{t("showing")} <span className="font-semibold">{transactions.length > 0 ? ((currentPage - 1) * limit) + 1 : 0}</span> - <span className="font-semibold">{Math.min(currentPage * limit, totalTransactions)}</span> of <span className="font-semibold">{totalTransactions}</span> {t("transactions")}</span>
          <div className="flex gap-2 items-center">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50">« First</button>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50">‹ Prev</button>
            <span className="p-2 font-medium">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50">Next ›</button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages} className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50">Last »</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;