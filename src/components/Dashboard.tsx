import React, { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
} from 'lucide-react';
import SummaryCard from './SummaryCard';
import BalanceChart from './BalanceChart';
import RecentTransactions from './RecentTransactions';
import { useTranslation } from 'react-i18next';
import { fetchRecentTransactions } from './Service/reportService';
import { useTransactions } from '../contexts/TransactionContext';
import type { Transaction } from '../types/Transaction';

type Props = {
  onQuickAdd?: (type: 'income' | 'expense' | 'transfer') => void;
  onViewAll?: () => void;
};

// ✅ ปรับปรุง: บังคับใช้ local time เพื่อป้องกัน timezone issues
function formatDateYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDateRange(days: number) {
  // ✅ ใช้เวลาท้องถิ่นชัดเจน
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  
  const result = { start: formatDateYMD(start), end: formatDateYMD(end) };
  
  // 🐛 Debug: ดูว่าวันที่ถูกต้องหรือไม่
  console.log('📅 Date Range:', result, 'Today:', formatDateYMD(now));
  
  return result;
}

// ✅ แปลง date string เป็น local date object (ปรับปรุงแล้ว)
function normalizeDate(dateInput: string | Date): string {
  if (typeof dateInput === 'string') {
    // ตัดเอาแค่ส่วน YYYY-MM-DD ก่อน (ป้องกัน timezone issues)
    const dateOnly = dateInput.split('T')[0];
    const parts = dateOnly.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      const d = new Date(year, month, day);
      const result = formatDateYMD(d);
      // 🐛 Debug
      console.log(`🔄 normalizeDate: "${dateInput}" -> "${result}"`);
      return result;
    }
  }
  const result = formatDateYMD(new Date(dateInput));
  console.log(`🔄 normalizeDate (fallback): "${dateInput}" -> "${result}"`);
  return result;
}

const Dashboard: React.FC<Props> = ({ onQuickAdd, onViewAll }) => {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d');
  const currentRange = useMemo(() => {
    const d = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    return getDateRange(d);
  }, [dateRange]);

  const { transactions: ctxTransactions } = useTransactions();

  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    transactionCount: 0,
    capitalIncome: 0,
    installmentInterestIncome: 0,
    penaltyIncome: 0,
    otherIncome: 0,
    loanDisbursement: 0,
    capitalExpense: 0,
    otherExpense: 0,
  });
  const [trends, setTrends] = useState<
    { date: string; totalIncome: number; totalExpenses: number }[]
  >([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = sessionStorage.getItem('authToken') ?? '';

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const fetched = await fetchRecentTransactions(
          currentRange.start,
          currentRange.end,
          1000
        );
        if (cancelled) return;

        const allData = (fetched || []) as unknown as Transaction[];
        const effectiveData = allData.length > 0 ? allData : (ctxTransactions || []);
        
        // 🐛 Debug: ดูข้อมูลที่ได้มา
        console.log('📊 Fetched transactions:', effectiveData.length, 'items');
        console.log('📅 Range:', currentRange.start, 'to', currentRange.end);
        
        setAllTransactions(effectiveData);

        let sumIncome = 0;
        let sumExpenses = 0;
        effectiveData.forEach((tx) => {
          // 🐛 Debug: แสดงวันที่ของแต่ละธุรกรรม
          console.log('📝 Transaction:', tx.id, 'Date:', tx.date, 'Type:', tx.type, 'Amount:', tx.amount);
          if (tx.type === 'income') sumIncome += tx.amount;
          else if (tx.type === 'expense' || tx.type === 'loan') sumExpenses += tx.amount;
        });
        const net = sumIncome - sumExpenses;
        const txCount = effectiveData.length;
        setSummary((prev) => ({
          ...prev,
          totalIncome: sumIncome,
          totalExpenses: sumExpenses,
          netBalance: net,
          transactionCount: txCount,
        }));

        const sorted = [...effectiveData].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setRecentTransactions(sorted.slice(0, 5));

        // ✅ สร้าง trends array โดยใช้ local date
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const [sy, sm, sd] = currentRange.start.split('-').map(Number);
        const startDate = new Date(sy, sm - 1, sd);
        const tmp: { date: string; totalIncome: number; totalExpenses: number }[] = [];
        
        for (let i = 0; i < days; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          const dateStr = formatDateYMD(currentDate);
          
          let inc = 0;
          let exp = 0;
          
          effectiveData.forEach((tx) => {
            const txDateStr = normalizeDate(tx.date);
            // 🐛 Debug: แสดงการจับคู่วันที่
            if (txDateStr === dateStr) {
              console.log(`  ✅ Match! TX Date: ${tx.date} -> Normalized: ${txDateStr} = Chart Date: ${dateStr}`);
              if (tx.type === 'income') inc += tx.amount;
              else if (tx.type === 'expense' || tx.type === 'loan') exp += tx.amount;
            }
          });
          
          tmp.push({ date: dateStr, totalIncome: inc, totalExpenses: exp });
        }
        
        // 🐛 Debug: ตรวจสอบว่าวันสุดท้ายคืออะไร
        if (tmp.length > 0) {
          console.log('📈 Trends first date:', tmp[0].date);
          console.log('📈 Trends last date:', tmp[tmp.length - 1].date);
        }
        
        setTrends(tmp);
      } catch (e: any) {
        if (!cancelled) {
          const fallbackData = ctxTransactions || [];
          setAllTransactions(fallbackData);
          let sumIncome = 0;
          let sumExpenses = 0;
          fallbackData.forEach((tx) => {
            if (tx.type === 'income') sumIncome += tx.amount;
            else if (tx.type === 'expense' || tx.type === 'loan') sumExpenses += tx.amount;
          });
          const net = sumIncome - sumExpenses;
          const txCount = fallbackData.length;
          setSummary((prev) => ({
            ...prev,
            totalIncome: sumIncome,
            totalExpenses: sumExpenses,
            netBalance: net,
            transactionCount: txCount,
          }));
          
          const sorted = [...fallbackData].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setRecentTransactions(sorted.slice(0, 5));
          
          const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
          const [sy, sm, sd] = currentRange.start.split('-').map(Number);
          const startDate = new Date(sy, sm - 1, sd);
          const tmp: { date: string; totalIncome: number; totalExpenses: number }[] = [];
          
          for (let i = 0; i < days; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const dateStr = formatDateYMD(currentDate);
            
            let inc = 0;
            let exp = 0;
            
            fallbackData.forEach((tx) => {
              const txDateStr = normalizeDate(tx.date);
              if (txDateStr === dateStr) {
                if (tx.type === 'income') inc += tx.amount;
                else if (tx.type === 'expense' || tx.type === 'loan') exp += tx.amount;
              }
            });
            
            tmp.push({ date: dateStr, totalIncome: inc, totalExpenses: exp });
          }
          setTrends(tmp);
          setError(e?.message ?? 'Failed to fetch');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentRange.start, currentRange.end, dateRange, ctxTransactions, token]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('financialDashboard') || 'ລາຍງານການເງິນ'}
          </h1>
          <p className="text-gray-600">
            {t('trackYourIncomeExpenseAndOverallFinancialHealth') ||
              'ຕິດຕາມລາຍຮັບ ລາຍຈ່າຍ ແລະ ສຸຂະພາບການເງິນໂດຍລວມ'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">{t('last7Days') || 'ຊ່ວງ 7 ວັນ'}</option>
            <option value="30d">{t('last30Days') || 'ຊ່ວງ 30 ວັນ'}</option>
            <option value="90d">{t('last90Days') || 'ຊ່ວງ 90 ວັນ'}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title={t('netBalance') || 'ຍອດເງິນຄົງເຫຼືອ'}
          value={summary.netBalance}
          icon={Wallet}
          color={summary.netBalance >= 0 ? 'green' : 'red'}
          format="currency"
          trend={summary.netBalance >= 0 ? 'up' : 'down'}
        />
        <SummaryCard
          title={t('totalIncome') || 'ລາຍຮັບລວມ'}
          value={summary.totalIncome}
          icon={TrendingUp}
          color="green"
          format="currency"
          trend="up"
        />
        <SummaryCard
          title={t('totalExpenses') || 'ລາຍຈ່າຍລວມ'}
          value={summary.totalExpenses}
          icon={TrendingDown}
          color="red"
          format="currency"
          trend="down"
        />
        <SummaryCard
          title={t('transactions') || 'ທຸລະກຳ'}
          value={summary.transactionCount}
          icon={CreditCard}
          color="purple"
          format="number"
          subtitle={`${dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90} ${t('days') || 'ວັນ'}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BalanceChart trends={trends} dateRange={dateRange} loading={loading} />
        </div>
        <div className="lg:col-span-1">
          <RecentTransactions transactions={recentTransactions} onViewAll={onViewAll} limit={5} />
        </div>
      </div>

      {onQuickAdd && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">{t('quickActions') || 'Quick Actions'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => onQuickAdd('income')}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200"
            >
              <div className="text-center">
                <ArrowUpRight className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  {t('addIncome') || 'ເພີ່ມລາຍຮັບ'}
                </span>
              </div>
            </button>
            <button
              onClick={() => onQuickAdd('expense')}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200"
            >
              <div className="text-center">
                <ArrowDownRight className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  {t('addExpense') || 'ເພີ່ມລາຍຈ່າຍ'}
                </span>
              </div>
            </button>
            <button
              onClick={() => onQuickAdd('transfer')}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200"
            >
              <div className="text-center">
                <CreditCard className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  {t('transferFunds') || 'ໂອນເງິນ'}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;