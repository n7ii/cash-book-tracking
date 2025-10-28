import React, { useState, useEffect } from 'react';
import { CreditCard, ListChecks, TrendingDown, TrendingUp, Loader2, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';
import SummaryCard from './SummaryCard';
import { useTranslation } from 'react-i18next';
import { fetchActivityReport, getTodayYMD, ActivityReport, PaginationInfo } from './Service/userActivityService';
import { formatToLaosDateOnly } from '../utils/dateUtils.ts';

// UPDATED: The props this component accepts have changed
type Props = {
  onOpenDetail: (id: string, type: string) => void;
  onOpenLoanDetail: (id: string) => void;
};

const UserActivity: React.FC<Props> = ({ onOpenDetail, onOpenLoanDetail }) => {
  const { t } = useTranslation();
  const today = getTodayYMD();

  const [report, setReport] = useState<ActivityReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const limit = 15;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchActivityReport(currentPage, limit, today, today, debouncedSearchTerm);
        setReport(data);
        setPagination(data.pagination);
      } catch (err) {
        setError('Failed to load data from the server.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [today, currentPage, debouncedSearchTerm]);

  if (isLoading && !report) { /* Loading UI */ }
  if (error) { /* Error UI */ }

  const summary = report?.summary;
  const transactions = report?.data || [];
  const totalPages = pagination ? Math.ceil(pagination.total / limit) : 1;
  const money = (n: number) => `LAK ${n.toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ListChecks className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Today's Activity ({today})</h1>
          <p className="text-gray-600">All income, expenses, and loan disbursements.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard title={t('totalIncome')} value={summary ? summary.totalIncome : 0} icon={TrendingUp} color="green" format="currency" />
        <SummaryCard title={t('totalExpenses')} value={summary ? summary.totalExpenses : 0} icon={TrendingDown} color="red" format="currency" />
        <SummaryCard title={t('transactions')} value={pagination?.total || 0} icon={CreditCard} color="purple" format="number" />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input type="text" placeholder="Search activities..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg"/>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b"><tr className="text-gray-700"><th className="px-3 py-2">ID</th><th className="px-3 py-2">Employee</th><th className="px-3 py-2">Market</th><th className="px-3 py-2">Collector/Customer</th><th className="px-3 py-2">Description</th><th className="px-3 py-2">Income</th><th className="px-3 py-2">Expense</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Action</th></tr></thead>
          <tbody>
            {isLoading && (<tr><td colSpan={9} className="p-6 text-center"><Loader2 className="h-6 w-6 animate-spin inline-block" /></td></tr>)}
            {!isLoading && transactions.map((t) => (
              <tr key={`${t.type}-${t.id}`} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-sm">{t.id}</td>
                <td className="px-3 py-2">{t.employee_name}</td>
                <td className="px-3 py-2">{t.market_name || '-'}</td>
                <td className="px-3 py-2">{t.collector_name || '-'}</td>
                <td className="px-3 py-2">{t.description || '-'}</td>
                <td className="px-3 py-2 font-medium">{t.type === 'income' ? <span className="text-green-600">{money(t.amount)}</span> : 'LAK 0'}</td>
                <td className="px-3 py-2 font-medium">{(t.type === 'expense' || t.type === 'loan') ? <span className="text-red-600">{money(t.amount)}</span> : 'LAK 0'}</td>
                <td className="px-3 py-2">{new Date(t.date).toLocaleDateString()}</td>
                {/* UPDATED: The buttons now call the correct new handler */}
                <td className="px-3 py-2">
                  {(t.type === 'income' || t.type === 'expense') && (<button onClick={() => onOpenDetail(t.id.toString(), t.type)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Details</button>)}
                  {t.type === 'loan' && (<button onClick={() => onOpenLoanDetail(t.id.toString())} className="text-purple-600 hover:text-purple-800 text-sm font-medium">Details (Loan)</button>)}
                </td>
              </tr>
            ))}
            {!isLoading && transactions.length === 0 && (
              <tr><td colSpan={9} className="p-6 text-center text-gray-500">No activities found for today.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex justify-between items-center text-sm">
          <span>Showing {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, pagination.total)} of {pagination.total} transactions</span>
          <div className="flex gap-2 items-center">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg disabled:opacity-50"><ChevronsLeft className="h-4 w-4" /></button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-2 border rounded-lg disabled:opacity-50"><ChevronsRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserActivity;