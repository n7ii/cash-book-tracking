import React from 'react';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type TrendPoint = { date: string; totalIncome: number; totalExpenses: number };

type Props = {
  trends: TrendPoint[];
  dateRange: '7d' | '30d' | '90d';
  loading?: boolean;
};

const fLAK = (n: number) =>
  new Intl.NumberFormat('lo-LA', {
    style: 'currency',
    currency: 'LAK',
    maximumFractionDigits: 0,
  }).format(n);

export default function BalanceChart({ trends = [], dateRange, loading = false }: Props) {
  const { t } = useTranslation();
  const hasData = trends.some((d) => d.totalIncome > 0 || d.totalExpenses > 0);
  const maxValue = Math.max(...trends.map((d) => Math.max(d.totalIncome, d.totalExpenses)), 1);
  const totalChange = trends.reduce((sum, d) => sum + (d.totalIncome - d.totalExpenses), 0);

  const shouldShowLabel = (index: number, total: number, dateStr: string) => {
    if (dateRange === '7d') return true;
    if (index === 0 || index === total - 1) return true;
    if (dateRange === '30d') {
      // ✅ แก้ไข: ใช้ Date object แทน
      const date = new Date(dateStr + 'T00:00:00');
      const day = date.getDate();
      if ([1, 30, 31].includes(day)) return true;
      return index % 3 === 0;
    }
    if (dateRange === '90d') return index % 7 === 0 || index === total - 1;
    return true;
  };

  // ✅ แก้ไข: ใช้ Date object แทนการ split string
  const formatDateLabel = (dateStr: string) => {
    // สร้าง Date object ที่ไม่มีปัญหา timezone
    const date = new Date(dateStr + 'T00:00:00');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    
    return dateRange === '90d' ? `${day}/${month}` : `${day}/${month}/${year}`;
  };

  const getBarSpacing = () => (dateRange === '7d' ? 'space-x-2' : dateRange === '30d' ? 'space-x-1' : 'space-x-0.5');
  const getBarWidth = () => (dateRange === '7d' ? '45%' : dateRange === '30d' ? '40%' : '35%');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">
            {t('balanceTrend') || 'ແນວໂນ້ມຍອດບັນຊີ'}
          </h3>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">{t('income') || 'ລາຍຮັບ'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">{t('expenses') || 'ລາຍຈ່າຍ'}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-600">
          {t('netChange') || 'ການປ່ຽນແປງສຸດທິ'} ({dateRange})
        </span>
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
              signDisplay: 'always',
              maximumFractionDigits: 0,
            }).format(totalChange)}
          </span>
        </div>
      </div>
      <div className="h-64 overflow-x-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            {t('loading') || 'ກຳລັງໂຫຼດ...'}
          </div>
        ) : !hasData ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <BarChart3 className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">
              {t('noDataInRange') || `ບໍ່ມີຂໍ້ມູນໃນຊ່ວງ ${dateRange === '7d' ? '7' : dateRange === '30d' ? '30' : '90'} ວັນ`}
            </p>
          </div>
        ) : (
          <div
            className={`h-full flex items-end justify-between ${getBarSpacing()} min-w-full`}
            style={{
              minWidth:
                dateRange === '90d' ? `${90 * 8}px` : dateRange === '30d' ? `${30 * 12}px` : 'auto',
            }}
          >
            {trends.map((day, index) => {
              const incomeHeight = maxValue > 0 ? (day.totalIncome / maxValue) * 100 : 0;
              const expenseHeight = maxValue > 0 ? (day.totalExpenses / maxValue) * 100 : 0;
              const showLabel = shouldShowLabel(index, trends.length, day.date);
              return (
                <div key={day.date} className="flex-shrink-0 flex flex-col items-center space-y-1">
                  <div className="w-full flex flex-col items-center space-y-1 h-48">
                    <div className="w-full flex justify-center items-end space-x-0.5 flex-1">
                      <div
                        className="bg-green-500 rounded-t opacity-80 hover:opacity-100 transition-opacity duration-200 min-h-[2px]"
                        style={{ height: `${incomeHeight}%`, width: getBarWidth() }}
                        title={`${formatDateLabel(day.date)} • ${t('income') || 'ລາຍຮັບ'}: ${fLAK(day.totalIncome)}`}
                      />
                      <div
                        className="bg-red-500 rounded-t opacity-80 hover:opacity-100 transition-opacity duration-200 min-h-[2px]"
                        style={{ height: `${expenseHeight}%`, width: getBarWidth() }}
                        title={`${formatDateLabel(day.date)} • ${t('expenses') || 'ລາຍຈ່າຍ'}: ${fLAK(day.totalExpenses)}`}
                      />
                    </div>
                  </div>
                  {showLabel ? (
                    <span className={`text-xs text-gray-500 transform -rotate-45 origin-center whitespace-nowrap ${dateRange === '90d' ? 'text-[10px]' : ''}`}>
                      {formatDateLabel(day.date)}
                    </span>
                  ) : (
                    <div className="h-4" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}