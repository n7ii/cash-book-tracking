// src/components/MarketDetail.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, TrendingUp, TrendingDown, MapPin } from 'lucide-react';

import { useMarkets } from '../contexts/MarketContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

import {
  fetchAddressName,
  fetchMarketCustomers,
  fetchMarketSummary,
  fetchMarketTransactions,
  fetchResponsibleCandidates,
  fetchActiveLoansByMember,
} from './Service/marketService';

/* -------------------- Types -------------------- */
type Props = {
  marketId: string;
  onBack: () => void;
  onStartLoan: (memberId: string) => void; 
};

type MemberRow = {
  id: string;
  firstName: string;
  lastName: string;
  role: 'agent' | 'member';
  age?: number;
  birth_date?: string | null; 
  loanAmountText?: number;
  loanPrincipal?: number;
  loanPaid?: number;
  loanRemain?: number;
};

type TxRow = {
  id: number;
  type: 'income' | 'expense' | 'loan';
  date: string;
  description: string | null;
  category: string | null;
  paymentMethod: string | null;
  amount: number;
};

/* -------------------- Main Component -------------------- */
const MarketDetail: React.FC<Props> = ({  marketId, onBack, onStartLoan }) => {
  const { t } = useTranslation();
  const { showSuccess, showError, showConfirm } = useNotifications();

  const {
    getMarket,
    addMember,
    updateMember,
    removeMember,
    getResponsible,
    setResponsible,
  } = useMarkets();

  const market = getMarket(marketId);
  const marketIdNum = Number(marketId);

  const token =
    sessionStorage.getItem('authToken') ||
    localStorage.getItem('authToken') ||
    '';

  // Address
  const [addressName, setAddressName] = useState<string>('');

  // Members
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [searchMember, setSearchMember] = useState<string>('');

  // Summary
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [summary, setSummary] = useState<{ totalIncome: number; totalExpense: number }>({
    totalIncome: 0,
    totalExpense: 0,
  });

  // Transactions
  const [transactions, setTransactions] = useState<TxRow[]>([]);

  // Responsible candidates
  const [candidates, setCandidates] = useState<
    { id: number; firstName: string; lastName: string; roleId: number }[]
  >([]);

  const currentResponsible = getResponsible(marketId);

  // Derived
  const netBalance = useMemo(
    () => summary.totalIncome - summary.totalExpense,
    [summary]
  );

  const agents = useMemo(
    () => members.filter((m) => m.role === 'agent'),
    [members]
  );

  const agentLabel = useMemo(() => {
    if (agents.length === 0) return '—';
    return agents.map((a) => `${a.firstName} ${a.lastName}`.trim()).join(', ');
  }, [agents]);

  const navigate = useNavigate();
  const handleStartLoan = (memberId: string) => {
    navigate(
      `/transactions/new?type=expense&category=capital&market=${marketId}&member=${memberId}`
    );
  };

  /* -------------------- Loaders -------------------- */
  const loadMembers = async () => {
    let list: MemberRow[] = [];

    try {
      const res = await fetchMarketCustomers(
        marketIdNum,
        1,
        100,
        searchMember.trim()
      );

      const raw = Array.isArray(res?.data) ? res.data : res?.data ?? res;
      const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];

      list = arr.map((c: any) => ({
        id: String(c.MID ?? c.id),
        firstName: c.Fname ?? c.firstName ?? '',
        lastName: c.Lname ?? c.lastName ?? '',
        role: c.role_id === 3 ? 'agent' : (c.role as 'agent' | 'member') ?? 'member',
        age: c.age,
        birth_date: c.birth_date ?? null,
        loanAmountText:
          c.loanAmountText != null ? Number(c.loanAmountText)
          : c.loan_text != null ? Number(c.loan_text)
          : undefined,
      }));
    } catch (e) {
      console.error('fetchMarketCustomers failed', e);
      showError('ບໍ່ສາມາດໂຫຼດຂໍ້ມູນສະມາຊິກໄດ້');
      setMembers([]);
      return;
    }

    try {
      const withLoans: MemberRow[] = await Promise.all(
        list.map(async (m) => {
          try {
            const res = await fetchActiveLoansByMember(Number(m.id));
            const data = res?.data?.data ?? res?.data ?? {};
            const principal = Number(data.total ?? 0);
            const paid = Number(data.paid_total ?? 0);

            return {
              ...m,
              loanPrincipal: principal,
              loanPaid: paid,
              loanRemain: Math.max(principal - paid, 0),
            };
          } catch (e: any) {
            if (e?.response?.status === 404) {
              return { ...m, loanPrincipal: 0, loanPaid: 0, loanRemain: 0 };
            }
            console.error('fetchActiveLoanByMember failed', e);
            return { ...m, loanPrincipal: 0, loanPaid: 0, loanRemain: 0 };
          }
        })
      );

      setMembers(withLoans);
    } catch (e) {
      console.error('summarize loans failed', e);
      setMembers(list);
    }
  };

  const loadSummary = async (days: 7 | 30 | 90) => {
    try {
      const res = await fetchMarketSummary(marketIdNum, days);
      setSummary({
        totalIncome: Number(res?.totalIncome ?? res?.income ?? 0),
        totalExpense: Number(res?.totalExpense ?? res?.expense ?? 0),
      });
    } catch (e) {
      console.error('fetchMarketSummary failed', e);
      setSummary({ totalIncome: 0, totalExpense: 0 });
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await fetchMarketTransactions(marketIdNum);
      const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const arr: TxRow[] = raw.map((r: any) => ({
        id: Number(r.id ?? r.TXID ?? r.tx_id ?? Date.now()),
        type: (r.type ?? r.txType ?? 'expense') as TxRow['type'],
        date: r.date ?? r.createdAt ?? new Date().toISOString(),
        description: r.description ?? r.memo ?? null,
        category: r.category ?? null,
        paymentMethod: r.paymentMethod ?? r.method ?? null,
        amount: Number(r.amount ?? r.total ?? 0),
      }));
      setTransactions(arr);
    } catch (e) {
      console.error('fetchMarketTransactions failed', e);
      setTransactions([]);
    }
  };

  const loadAddress = async () => {
    try {
      if (!market?.village) return;
      const res = await fetchAddressName(market.village);
      setAddressName(res?.fullName || '');
    } catch (e) {
      console.error('fetchAddressName failed', e);
      setAddressName('');
    }
  };

  const loadCandidates = async () => {
    try {
      const res = await fetchResponsibleCandidates(marketIdNum);
      const arr = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setCandidates(arr);
    } catch (e) {
      console.error('fetchResponsibleCandidates failed', e);
      setCandidates([]);
    }
  };

  /* -------------------- Effects -------------------- */
  useEffect(() => {
    if (!token || !market) return;
    loadAddress();
    loadMembers();
    loadTransactions();
    loadCandidates();
  }, [token, marketIdNum, market]);

  useEffect(() => {
    if (!token || !market) return;
    const daysVal: 7 | 30 | 90 = dateRange === '7d' ? 7 : (dateRange === '30d' ? 30 : 90);
    loadSummary(daysVal);
  }, [dateRange, token, market]);

  useEffect(() => {
    if (!market) return;
    const h = setTimeout(() => {
      loadMembers();
    }, 300);
    return () => clearTimeout(h);
  }, [searchMember]);

  /* -------------------- Render -------------------- */
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{market.name}</h2>
          <p className="text-gray-600 flex items-center gap-2 mt-1">
            <MapPin className="h-4 w-4" />
            <span>
              ID: <span className="font-mono">{market.id}</span>
            </span>
            <span>•</span>
            <span>{addressName || 'ກຳລັງໂຫຼດ...'}</span>
          </p>
          <p className="text-gray-600 mt-1">ແມ່ຄ້າຕະຫຼາດ: {agentLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 flex items-center gap-2">
            ຜູ້ຮັບຜິດຊອບ:
            <select
              value={currentResponsible ?? ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                setResponsible(marketId, val !== null ? String(val) : null);
                showSuccess('ອັບເດດຜູ້ຮັບຜິດຊອບສຳເລັດ');
              }}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">— ບໍ່ໄດ້ລະບຸ —</option>
              {candidates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}{' '}
                  {u.roleId === 1 ? '(Admin)' : u.roleId === 4 ? '(Employee)' : ''}
                </option>
              ))}
            </select>
          </label>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <SummaryCard title={t('totalExpenses')} value={summary.totalExpense} icon={TrendingDown} color="red" />
        <SummaryCard title={t('totalIncome')} value={summary.totalIncome} icon={TrendingUp} color="green" />
        <SummaryCard title={t('netBalance')} value={netBalance} icon={DollarSign} color="blue" />
      </div>

      {/* Search bar for members */}
      <div className="flex items-center justify-between">
        <input
          className="border rounded-lg p-2 w-full md:w-80"
          placeholder="ຄົ້ນຫາສະມາຊິກ..."
          value={searchMember}
          onChange={(e) => setSearchMember(e.target.value)}
        />
      </div>

      {/* Member Manager */}
      <MemberManager
        members={members}
        onStartLoan={onStartLoan}
        onAdd={async (m) => {
          try {
            await addMember(marketId, m);
            await loadMembers();
            showSuccess('ເພີ່ມສະມາຊິກສຳເລັດ');
          } catch {
            showError('ເພີ່ມສະມາຊິກລົ້ມເຫລວ');
          }
        }}
        onEdit={async (id, patch) => {
          try {
            await updateMember(marketId, id, patch);
            await loadMembers();
            showSuccess('ແກ້ໄຂສະມາຊິກສຳເລັດ');
          } catch {
            showError('ແກ້ໄຂສະມາຊິກລົ້ມເຫລວ');
          }
        }}
        onDelete={async (id) => {
          showConfirm(
            'ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບສະມາຊິກນີ້?',
            async (_reason) => {
              try {
                await removeMember(marketId, id);
                await loadMembers();
                showSuccess('ລຶບສະມາຊິກສຳເລັດ');
              } catch {
                showError('ລຶບສະມາຊິກລົ້ມເຫລວ');
              }
            },
            {
              label: 'ເຫດຜົນໃນການລຶບ',
              placeholder: 'ກະລຸນາລະບຸເຫດຜົນ...',
              isRequired: true,
            }
          );
        }}
      />

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold mb-3">{t('recentActivity')}</h3>
        <RecentTransactions transactions={transactions.slice(0, 5)} />
        {transactions.length > 5 && (
          <button className="mt-3 px-3 py-2 border rounded-lg hover:bg-gray-50">
            {t('viewAllHistory')}
          </button>
        )}
      </div>
    </div>
  );
};

export default MarketDetail;

/* -------------------- Summary Card Component -------------------- */
const SummaryCard: React.FC<{
  title: string;
  value: number;
  icon: React.FC<{ className?: string }>;
  color: 'red' | 'green' | 'blue';
}> = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold">{value.toLocaleString()} ₭</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

/* -------------------- Member Manager Component -------------------- */
const MemberManager: React.FC<{
  members: MemberRow[];
  onStartLoan: (memberId: string) => void;  
  onAdd: (m: Omit<MemberRow, 'id'>) => void;
  onEdit: (id: string, patch: Partial<MemberRow>) => void;
  onDelete: (id: string) => void;
}> = ({ members, onStartLoan, onAdd, onEdit, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<MemberRow, 'id'>>({
    firstName: '',
    lastName: '',
    age: undefined,
    birth_date: undefined,
    role: 'member',
  });
  const [birthDate, setBirthDate] = useState<string>('');

  const calcAge = (iso: string) => {
    if (!iso) return undefined;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return undefined;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age < 0 ? undefined : age;
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MemberRow>>({});
  const [editBirthDate, setEditBirthDate] = useState<string>('');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">ສະມາຊິກຕະຫຼາດ (ລວມທັງແມ່ຄ້າ)</h3>
        <button
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          onClick={() => setShowForm((s) => !s)}
        >
          {showForm ? 'ປິດຟອມ' : 'ເພີ່ມສະມາຊິກ'}
        </button>
      </div>

      {showForm && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            className="border rounded-lg p-2"
            placeholder="ຊື່"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <input
            className="border rounded-lg p-2"
            placeholder="ນາມສະກຸນ"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
          <input
            className="border rounded-lg p-2"
            type="date"
            placeholder="ວັນເກີດ"
            value={birthDate}
            onChange={(e) => {
              const v = e.target.value;
              setBirthDate(v);
              setForm((prev) => ({ 
                ...prev, 
                birth_date: v || undefined,
                age: calcAge(v) 
              }));
            }}
          />
          <select
            className="border rounded-lg p-2"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as 'agent' | 'member' })}
          >
            <option value="agent">ແມ່ຄ້າ (agent)</option>
            <option value="member">ລູກຄ້າ (member)</option>
          </select>

          <div className="md:col-span-5 flex justify-end gap-2">
            <button 
              className="px-3 py-2 border rounded-lg" 
              onClick={() => {
                setShowForm(false);
                setForm({
                  firstName: '',
                  lastName: '',
                  age: undefined,
                  birth_date: undefined,
                  role: 'member',
                });
                setBirthDate('');
              }}
            >
              ຍົກເລີກ
            </button>
            <button
              className="px-3 py-2 bg-blue-600 text-white rounded-lg"
              onClick={() => {
                if (!form.firstName.trim() || !form.lastName.trim()) return;
                onAdd(form);
                setForm({
                  firstName: '',
                  lastName: '',
                  age: undefined,
                  birth_date: undefined,
                  role: 'member',
                });
                setBirthDate('');
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
              <th className="p-2 text-right">ເງິນກູ້</th>
              <th className="p-2 text-right">ງວດ-ດອກເບ້ຍ</th>
              <th className="p-2 text-right">ເງິນຄົງເຫຼືອ</th>
              <th className="p-2 w-40">Action</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="p-2">
                  {editingId === m.id ? (
                    <input
                      className="border rounded-lg p-1 w-full"
                      value={editForm.firstName ?? m.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    />
                  ) : (
                    m.firstName
                  )}
                </td>
                <td className="p-2">
                  {editingId === m.id ? (
                    <input
                      className="border rounded-lg p-1 w-full"
                      value={editForm.lastName ?? m.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    />
                  ) : (
                    m.lastName
                  )}
                </td>
                <td className="p-2">
                  {editingId === m.id ? (
                    <input
                      className="border rounded-lg p-1 w-full"
                      type="date"
                      value={editBirthDate || (editForm as any).birth_date || ''} 
                      onChange={(e) => {
                        const v = e.target.value;
                        setEditBirthDate(v);
                        setEditForm({
                          ...editForm,
                          birth_date: v || undefined,
                          age: calcAge(v)
                        });
                      }}
                    />
                  ) : (
                    m.age ?? '-'
                  )}
                </td>
                <td className="p-2">
                  {editingId === m.id ? (
                    <select
                      className="border rounded-lg p-1 w-full"
                      value={editForm.role ?? m.role}
                      onChange={(e) =>
                        setEditForm({ ...editForm, role: e.target.value as 'agent' | 'member' })
                      }
                    >
                      <option value="agent">agent</option>
                      <option value="member">member</option>
                    </select>
                  ) : (
                    m.role
                  )}
                </td>
                <td className="p-2 text-right">{(m.loanPrincipal ?? 0).toLocaleString()}</td>
                <td className="p-2 text-right">{(m.loanPaid ?? 0).toLocaleString()}</td>
                <td className="p-2 text-right">
                  {(m.loanRemain ?? Math.max((m.loanPrincipal ?? 0) - (m.loanPaid ?? 0), 0)).toLocaleString()}
                </td>
                  <td className="p-2">
                    {editingId === m.id ? (
                      <div className="flex gap-2">
                        <button
                          className="px-2 py-1 border rounded-lg hover:bg-gray-50"
                          onClick={() => {
                            onEdit(m.id, editForm);
                            setEditingId(null);
                            setEditForm({});
                          }}
                        >
                          ບັນທຶກ
                        </button>
                        <button
                          className="px-2 py-1 border rounded-lg hover:bg-gray-50"
                          onClick={() => {
                            setEditingId(null);
                            setEditForm({});
                          }}
                        >
                          ຍົກເລີກ
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          className="px-2 py-1 border rounded-lg hover:bg-gray-50"
                          onClick={() => {
                            setEditingId(m.id);
                            setEditForm(m);
                          }}
                        >
                          ແກ້ໄຂ
                        </button>
                        <button
                          className="px-2 py-1 border rounded-lg text-red-600 hover:bg-red-50"
                          onClick={() => onDelete(m.id)}
                        >
                          ລຶບ
                        </button>
                        {/* add “ກູ້ເງິນ” in column Action */}
                        <button
                          className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          onClick={() => onStartLoan(m.id)}
                          disabled={(m.loanPrincipal ?? 0) > 0 || (m.loanPaid ?? 0) > 0}
                          title={(m.loanPrincipal ?? 0) > 0 || (m.loanPaid ?? 0) > 0 ? 'ກູ້ແລ້ວ' : ''}
                        >
                          ກູ້
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-500 text-center" colSpan={6}>
                    ຍັງບໍ່ມີສະມາຊິກ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* -------------------- Recent Transactions Component -------------------- */
  const RecentTransactions: React.FC<{ transactions: TxRow[] }> = ({ transactions }) => {
    if (transactions.length === 0) {
      return <div className="text-gray-500 text-center py-4">ຍັງບໍ່ມີທຸລະກຳ</div>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b">
            <tr className="text-gray-600">
              <th className="p-2">ວັນທີ</th>
              <th className="p-2">ລາຍການ</th>
              <th className="p-2">ປະເພດ</th>
              <th className="p-2">ຈຳນວນ</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={`${tx.type}-${tx.id}`} className="border-b">
                <td className="p-2">{new Date(tx.date).toLocaleDateString('lo-LA')}</td>
                <td className="p-2">{tx.description || '-'}</td>
                <td className="p-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      tx.type === 'income'
                        ? 'bg-green-100 text-green-700'
                        : tx.type === 'expense'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {tx.type === 'income' ? 'ລາຍຮັບ' : tx.type === 'expense' ? 'ລາຍຈ່າຍ' : 'ປ່ອຍກູ້'}
                  </span>
                </td>
                <td className="p-2">
                  <span
                    className={`font-medium ${
                      tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {tx.amount.toLocaleString()} ₭
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
