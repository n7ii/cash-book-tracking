import React, { useMemo, useState } from 'react';
import { useMarkets, MarketMember } from '../contexts/MarketContext';
import { useTransactions } from '../contexts/TransactionContext';
import { summarizeMarket, toRange } from '../utils/marketSelectors';
import { useUsers } from '../contexts/UsersContext';
import SummaryCard from './SummaryCard';
import RecentTransactions from './RecentTransactions';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Props = {
  marketId: string;
  onBack: () => void;
};


const MarketDetail: React.FC<Props> = ({ marketId, onBack }) => {
  const { t } = useTranslation();
  const {
    getMarket,
    listMembers,
    addMember,
    updateMember,
    removeMember,
    getResponsible,
    setResponsible,
  } = useMarkets();
  const { transactions } = useTransactions();

  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const market = getMarket(marketId);

  const stats = useMemo(() => {
    if (!market) return null;
    return summarizeMarket(market, transactions, toRange(dateRange));
  }, [market, transactions, dateRange]);

  if (!market) {
    return (
      <div className="space-y-4">
        <button className="px-3 py-2 rounded-lg border hover:bg-gray-50" onClick={onBack}>
          {t('ກັບຄືນ')}
        </button>
        <div className="text-red-600">{t('markets.notFound')}</div>
      </div>
    );
  }
  const { users } = useUsers();

  const members = listMembers(marketId);
  const agents = members.filter((m) => m.role === 'agent');
  const agentLabel =
    agents.length === 0 ? '—' : agents.map((a) => `${a.firstName} ${a.lastName}`.trim()).join(', ');
  const responsibleUserId = getResponsible(marketId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{market.name}</h2>
          <p className="text-gray-600">
            ID: <span className="font-mono">{market.id}</span> {' • '}
            {market.village}, {market.city}, {market.district}
            <br />
            ແມ່ຄ່າຍ: {agentLabel}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* ຜູ້ຮັບຜິດຊອບ */}
          <label className="text-sm text-gray-600">
            ຜູ້ຮັບຜິດຊອບ
            <select
              value={responsibleUserId ?? ''}
              onChange={(e) => setResponsible(marketId, e.target.value || null)}
              className="ml-2 px-3 py-2 border rounded-lg"
            >
              <option value="">— ບໍ່ໄດ້ລະບຸ —</option>
  {users.map(u => (
    <option key={u.id} value={u.id}>
      {`${u.firstName} ${u.lastName}`}
    </option>
  ))}
            </select>
          </label>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">{t('last7Days')}</option>
            <option value="30d">{t('last30Days')}</option>
            <option value="90d">{t('last90Days')}</option>
          </select>
          <button className="px-3 py-2 rounded-lg border hover:bg-gray-50" onClick={onBack}>
            {t('ກັບຄືນ')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard title={t('totalExpenses')} value={stats?.disbursed ?? 0} icon={TrendingDown} color="red" format="currency" />
        <SummaryCard title={t('totalIncome')} value={stats?.repaid ?? 0} icon={TrendingUp} color="green" format="currency" />
        <SummaryCard title={t('netBalance')} value={(stats?.repaid ?? 0) - (stats?.disbursed ?? 0)} icon={DollarSign} color="blue" format="currency" />
      </div>

      {/* Member Manager */}
      <MemberManager
        members={members}
        onAdd={(m) => addMember(marketId, m)}
        onEdit={(id, patch) => updateMember(marketId, id, patch)}
        onDelete={(id) => removeMember(marketId, id)}
      />

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-semibold mb-2">{t('recentActivity')}</h3>
        <RecentTransactions transactions={stats?.recent ?? []} />
        <button className="mt-3 px-3 py-2 border rounded-lg">{t('viewAllHistory')}</button>
      </div>
    </div>
  );
};

export default MarketDetail;

/* -------------------- Member Manager -------------------- */

const MemberManager: React.FC<{
  members: MarketMember[];
  onAdd: (m: Omit<MarketMember, 'id'>) => void;
  onEdit: (id: string, patch: Partial<MarketMember>) => void;
  onDelete: (id: string) => void;
}> = ({ members, onAdd, onEdit, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<MarketMember, 'id'>>({
    firstName: '',
    lastName: '',
    age: undefined,
    role: 'member',
    loanAmountText: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MarketMember>>({});

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">ສະມາຊິກຕະຫຼາດ (ລວມທັງແມ່ຄ່າຍ)</h3>
        <button
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          onClick={() => setShowForm((s) => !s)}
        >
          {showForm ? 'ປິດຟອມ' : 'ເພີ່ມສະມາຊິກ'}
        </button>
      </div>

      {showForm && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input className="border rounded-lg p-2" placeholder="ຊື່" value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <input className="border rounded-lg p-2" placeholder="ນາມສະກຸນ" value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <input className="border rounded-lg p-2" placeholder="ອາຍຸ (ຕົວເລກ)" type="number" value={form.age ?? ''}
            onChange={(e) => setForm({ ...form, age: e.target.value ? Number(e.target.value) : undefined })} />
          <select className="border rounded-lg p-2" value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as 'agent' | 'member' })}>
            <option value="agent">ແມ່ຄ່າຍ (agent)</option>
            <option value="member">ລູກຄ່າຍ (member)</option>
          </select>
          <input className="border rounded-lg p-2" placeholder="ເງິນທີ່ກູ້ (ເວັ້ນວ່າງໄດ້)" value={form.loanAmountText ?? ''}
            onChange={(e) => setForm({ ...form, loanAmountText: e.target.value })} />

          <div className="md:col-span-5 flex justify-end gap-2">
            <button className="px-3 py-2 border rounded-lg" onClick={() => setShowForm(false)}>ຍົກເລີກ</button>
            <button
              className="px-3 py-2 bg-blue-600 text-white rounded-lg"
              onClick={() => {
                if (!form.firstName.trim() || !form.lastName.trim()) return;
                onAdd(form);
                setForm({ firstName: '', lastName: '', age: undefined, role: 'member', loanAmountText: '' });
                setShowForm(false);
              }}
            >
              ບັນທຶກ
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b">
            <tr className="text-sm text-gray-600">
              <th className="p-2">ຊື່</th>
              <th className="p-2">ນາມສະກຸນ</th>
              <th className="p-2">ອາຍຸ</th>
              <th className="p-2">ຕຳແໜ່ງ</th>
              <th className="p-2">ເງິນທີ່ກູ້</th>
              <th className="p-2 w-40">Action</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="p-2">
                  {editingId === m.id ? (
                    <input className="border rounded-lg p-1 w-full"
                      value={editForm.firstName ?? m.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    />
                  ) : m.firstName}
                </td>
                <td className="p-2">
                  {editingId === m.id ? (
                    <input className="border rounded-lg p-1 w-full"
                      value={editForm.lastName ?? m.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    />
                  ) : m.lastName}
                </td>
                <td className="p-2">
                  {editingId === m.id ? (
                    <input className="border rounded-lg p-1 w-full" type="number"
                      value={editForm.age ?? m.age ?? ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, age: e.target.value ? Number(e.target.value) : undefined })
                      }
                    />
                  ) : (m.age ?? '-')}
                </td>
                <td className="p-2">
                  {editingId === m.id ? (
                    <select className="border rounded-lg p-1 w-full"
                      value={editForm.role ?? m.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'agent' | 'member' })}
                    >
                      <option value="agent">agent</option>
                      <option value="member">member</option>
                    </select>
                  ) : m.role}
                </td>
                <td className="p-2">
                  {editingId === m.id ? (
                    <input className="border rounded-lg p-1 w-full"
                      value={editForm.loanAmountText ?? m.loanAmountText ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, loanAmountText: e.target.value })}
                    />
                  ) : (m.loanAmountText ?? '-')}
                </td>
                <td className="p-2">
                  {editingId === m.id ? (
                    <div className="flex gap-2">
                      <button className="px-2 py-1 border rounded-lg"
                        onClick={() => { onEdit(m.id, editForm); setEditingId(null); setEditForm({}); }}>
                        ບັນທຶກ
                      </button>
                      <button className="px-2 py-1 border rounded-lg"
                        onClick={() => { setEditingId(null); setEditForm({}); }}>
                        ຍົກເລີກ
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button className="px-2 py-1 border rounded-lg" onClick={() => { setEditingId(m.id); setEditForm(m); }}>
                        ແກ້ໄຂ
                      </button>
                      <button className="px-2 py-1 border rounded-lg text-red-600" onClick={() => onDelete(m.id)}>
                        ລົບ
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={6}>ຍັງບໍ່ມີສະມາຊິກ</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
