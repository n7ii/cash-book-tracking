import React, { useMemo, useState } from 'react';
import { Plus, MapPin, Users } from 'lucide-react';
import { useMarkets } from '../contexts/MarketContext';
import { useTransactions } from '../contexts/TransactionContext';
import { summarizeMarket, toRange } from '../utils/marketSelectors';
import { useTranslation } from 'react-i18next';

type MarketsProps = {
  onOpenDetail: (marketId: string) => void;
};

const Markets: React.FC<MarketsProps> = ({ onOpenDetail }) => {
  const { t } = useTranslation();
  const { markets, addMarket, listMembers, getAgents } = useMarkets();
  const { transactions } = useTransactions();

  const [showForm, setShowForm] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  const summaries = useMemo(() => {
    const range = toRange(dateRange);
    return Object.fromEntries(
      markets.map((m) => [m.id, summarizeMarket(m, transactions, range)])
    ) as Record<string, ReturnType<typeof summarizeMarket>>;
  }, [markets, transactions, dateRange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('markets.title')}</h1>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">{t('last7Days')}</option>
            <option value="30d">{t('last30Days')}</option>
            <option value="90d">{t('last90Days')}</option>
          </select>

          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('ເພີ່ມຕະຫຼາດ')}
          </button>
        </div>
      </div>

      {/* Inline Create Form */}
      {showForm && (
        <MarketInlineForm
          onCancel={() => setShowForm(false)}
          onSave={(payload) => {
            // legacy field: agentName, members 
            addMarket({ ...payload, agentName: '', members: [] });
            setShowForm(false);
          }}
        />
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b">
            <tr className="text-sm text-gray-600">
              <th className="p-3">ID</th>
              <th className="p-3">{t('ຊື່')}</th>
              <th className="p-3">{t('ທີ່ຕັ້ງ')}</th>
              <th className="p-3">ແມ່ຄ່າຍ (agent)</th> 
              <th className="p-3">{t('ສະມາຊິກ')}</th>
              <th className="p-3">{t('ຍອດລວມ')}</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {markets.map((m) => {
              const s = summaries[m.id];
              const memberCount = listMembers(m.id).length; // ລວມ agent + member
              const agents = getAgents(m.id);
              const agentLabel =
                agents.length === 0
                  ? '—'
                  : agents
                      .map((a) => `${a.firstName} ${a.lastName}`.trim())
                      .join(', ');

              return (
                <tr key={m.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-sm">{m.id}</td>
                  <td className="p-3">{m.name}</td>
                  <td className="p-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {m.village}, {m.city}, {m.district}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-sm">{agentLabel}</td>
                  <td className="p-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{memberCount}</span>
                    </div>
                  </td>
                  <td className="p-3 text-sm">
                    {t('totalExpenses')}: {s?.disbursed ?? 0} • {t('totalIncome')}: {s?.repaid ?? 0}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => onOpenDetail(m.id)}
                      className="px-3 py-1 rounded-lg border hover:bg-gray-50"
                    >
                      {t('ເບິ່ງລາຍລະອຽດ')}
                    </button>
                  </td>
                </tr>
              );
            })}
            {markets.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan={7}>
                  {t('ບໍ່ມີຕະຫຼາດທີ່ບັນທຶກ')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Markets;

const MarketInlineForm: React.FC<{
  onCancel: () => void;
  onSave: (payload: {
    name: string;
    village: string;
    city: string;
    district: string;
  }) => void;
}> = ({ onCancel, onSave }) => {
  const { t } = useTranslation();
  const [f, setF] = useState({
    name: '',
    village: '',
    city: '',
    district: '',
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input className="border rounded-lg p-2" placeholder={t('ຊື່ຕະຫຼາດ')} value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className="border rounded-lg p-2" placeholder={t('ບ້ານ')} value={f.village}
          onChange={(e) => setF({ ...f, village: e.target.value })} />
        <input className="border rounded-lg p-2" placeholder={t('ເມືອງ')} value={f.city}
          onChange={(e) => setF({ ...f, city: e.target.value })} />
        <input className="border rounded-lg p-2" placeholder={t('ແຂວງ')} value={f.district}
          onChange={(e) => setF({ ...f, district: e.target.value })} />
      </div>

      <div className="flex justify-end gap-2 mt-3">
        <button className="px-3 py-2 border rounded-lg" onClick={onCancel}>{t('ຍົກເລີກ')}</button>
        <button className="px-3 py-2 bg-blue-600 text-white rounded-lg"
          onClick={() => onSave({ ...f })}>
          {t('save')}
        </button>
      </div>
    </div>
  );
};
