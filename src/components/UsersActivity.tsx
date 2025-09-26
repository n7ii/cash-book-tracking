import React, { useMemo } from 'react';
import { CreditCard, ListChecks, TrendingDown, TrendingUp } from 'lucide-react';
import SummaryCard from './SummaryCard';
import { useTranslation } from 'react-i18next';
import { loadActivities, ymd } from '../utils/Activities';

type Props = {
  onOpenDetail: (id: string) => void;
};

const money = (n: number) => `LAK ${n.toLocaleString()}`;

const UserActivity: React.FC<Props> = ({ onOpenDetail }) => {
  const { t } = useTranslation();
  const today = ymd();

  // filter to today's activities only (demo)
  const todaysTx = useMemo(
    () => loadActivities().filter((t) => t.date === today),
    [today]
  );

  const summary = useMemo(() => {
    const income = todaysTx.filter(t => t.type === 'income').reduce((a,b)=>a+b.amount,0);
    const expense = todaysTx.filter(t => t.type === 'expense').reduce((a,b)=>a+b.amount,0);
    return { income, expense, count: todaysTx.length };
  }, [todaysTx]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ListChecks className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">ກິດຈະກຳພະນັກງານ (ມື້ນີ້)</h1>
          <p className="text-gray-600">ລາຍການທຸລະກຳທີ່ເກີດຂຶ້ນວັນນີ້: {today}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title={t('totalIncome')}
          value={summary.income}
          icon={TrendingUp}
          color="green"
          format="currency"
          trend={summary.income > 0 ? 'up' : 'neutral'}
        />
        <SummaryCard
          title={t('totalExpenses')}
          value={summary.expense}
          icon={TrendingDown}
          color="red"
          format="currency"
          trend={summary.expense > 0 ? 'down' : 'neutral'}
        />
        <SummaryCard
          title={t('transactions')}
          value={summary.count}
          icon={CreditCard}
          color="purple"
          format="number"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b">
            <tr className="text-gray-700">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">ພະນັກງານ</th>
              <th className="px-3 py-2">ເງິນທີ່ໄດ້ຮັບ</th>
              <th className="px-3 py-2">ເງິນທີ່ຈ່າຍ</th>
              <th className="px-3 py-2">ວັນທີ</th>
              <th className="px-3 py-2">ການກະທຳ</th>
            </tr>
          </thead>
          <tbody>
            {todaysTx.map((t) => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-sm">{t.id}</td>
                <td className="px-3 py-2">{t.userName}</td>
                <td className="px-3 py-2 font-medium">
                  {t.type === 'income' ? <span className="text-green-600">{money(t.amount)}</span> : 'LAK 0'}
                </td>
                <td className="px-3 py-2 font-medium">
                  {t.type === 'expense' ? <span className="text-red-600">{money(t.amount)}</span> : 'LAK 0'}
                </td>
                <td className="px-3 py-2">{t.date}</td>
                <td className="px-3 py-2">
                  <button
                    className="px-3 py-1 border rounded-lg text-sm"
                    onClick={() => onOpenDetail(t.id)}
                  >
                    Detail
                  </button>
                </td>
              </tr>
            ))}
            {todaysTx.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  ມື້ນີ້ຍັງບໍ່ມີກິດຈະກຳໃດໆ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-gray-500">
        * ເດໂມ ສະເພາະປະຈຸບັນ ({today}). ຕໍ່ backend ແລ້ວຄ່ອຍເພີ່ມຕົວເລືອກວັນທີ/ກິດຈະກຳພະນັກງານໄດ້
      </p>
    </div>
  );
};

export default UserActivity;