import React, { useEffect, useMemo, useState } from 'react';
import { Save, X, Calculator, Search, Upload } from 'lucide-react';
import { useTransactions } from '../contexts/TransactionContext';
import { Transaction } from '../types/Transaction';
import { useTranslation } from 'react-i18next';
import { useMarkets, MarketMember } from '../contexts/MarketContext';

import { MOCK_USERS } from '../utils/mockUsers';

import {
  loadActivities,
  saveActivities,
  ymd,
} from '../utils/Activities';

type Props = {
  defaultType?: Transaction['type'] | null;
  onAfterSubmit?: () => void;
};

const TransactionForm: React.FC<Props> = ({ defaultType, onAfterSubmit }) => {
  const { t } = useTranslation();
  const { addTransaction } = useTransactions();
  const { markets, listMembers } = useMarkets();

  // --- mainform ---
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as Transaction['type'],
    amount: '',
    category: '',
    paymentMethod: 'card' as Transaction['paymentMethod'],
    notes: '',
    marketId: '' as string,
    collectorId: '' as string, // collector
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- search ---
  const [marketQuery, setMarketQuery] = useState('');
  const [marketOpen, setMarketOpen] = useState(false);

  const filteredMarkets = useMemo(() => {
    const q = marketQuery.trim().toLowerCase();
    if (!q) return markets;
    return markets.filter((m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
  }, [marketQuery, markets]);

  const pickMarket = (id: string) => {
    const m = markets.find((x) => x.id === id);
    if (!m) return;
    setFormData((s) => ({ ...s, marketId: m.id }));
    setMarketQuery(`${m.name} (ID: ${m.id})`);
    setMarketOpen(false);
  };

  // --- listname members + checkbox “no pay” ---
  const membersOfMarket: MarketMember[] = useMemo(
    () => (formData.marketId ? listMembers(formData.marketId) : []),
    [formData.marketId, listMembers]
  );
  const [nonPayers, setNonPayers] = useState<Set<string>>(new Set());

  const toggleNonPayer = (memberId: string) => {
    setNonPayers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  // --- upload slip  ---
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreviewUrl, setSlipPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!slipFile) {
      if (slipPreviewUrl) URL.revokeObjectURL(slipPreviewUrl);
      setSlipPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(slipFile);
    setSlipPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [slipFile]);

  // setting default type 
  useEffect(() => {
    if (!defaultType) return;
    setFormData((prev) => ({ ...prev, type: defaultType }));
  }, [defaultType]);

  // --- category options ---
  const CATEGORY_OPTIONS = [
    { value: '', label: t('selectCategory') || 'ເລືອກຫມວດໝູ່' },
    { value: 'capital', label: 'ທຶນ' },
    { value: 'installment_interest', label: 'ງວດ-ດອກເບີຍ' },
    { value: 'penalty', label: 'ຄ່າປັບ' },
  ];

  // check validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.marketId) newErrors.market = t('validation.marketIsRequired') || 'ກະລຸນາເລືອກຕະຫຼາດ';
    if (!formData.collectorId) newErrors.collector = 'ກະລຸນາເລືອກຜູ້ເກັບເງິນ';
    if (!formData.amount || parseFloat(formData.amount) <= 0)
      newErrors.amount = t('validation.amountMustBeGreaterThan0');
    if (!formData.category) newErrors.category = t('validation.categoryIsRequired');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const categoryLabel = (val: string) => {
    const f = CATEGORY_OPTIONS.find((x) => x.value === val);
    return f?.label || val;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const tx: Transaction = {
      ...(undefined as unknown as Transaction), 
      date: formData.date,
      type: formData.type,
      description: '', 
      amount: parseFloat(formData.amount),
      category: formData.category, 
      paymentMethod: formData.paymentMethod,
      notes: formData.notes || undefined,
      marketId: formData.marketId || undefined,
    };
    addTransaction(tx);

    const list = loadActivities();
    const ts = Date.now();
    const id = `TX-${ts}`;
    const market = markets.find((m) => m.id === formData.marketId);
    const collector = MOCK_USERS.find((u) => u.id === formData.collectorId);
    const nonPayerNames = membersOfMarket
      .filter((m) => nonPayers.has(m.id))
      .map((m) => `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim())
      .filter(Boolean);

    const noteParts: string[] = [];
    if (nonPayerNames.length) noteParts.push(`ບໍ່ໄດ້ຈ່າຍໃນມື້ນີ້: ${nonPayerNames.join(', ')}`);
    if (formData.notes?.trim()) noteParts.push(`ໝາຍເຫດ: ${formData.notes.trim()}`);

    list.unshift({
      id,
      date: formData.date || ymd(),
      type: formData.type,
      amount: parseFloat(formData.amount),
      category: categoryLabel(formData.category),
      marketId: formData.marketId,
      marketName: market?.name,
      paymentMethod: formData.paymentMethod,
      userId: collector?.id || '',
      userName: collector ? `${collector.firstName} ${collector.lastName}` : 'Unknown',
      note: noteParts.join(' | ') || undefined,
      slipUrl: slipPreviewUrl || undefined,
    });
    saveActivities(list);

    // reset
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      amount: '',
      category: '',
      paymentMethod: 'card',
      notes: '',
      marketId: '',
      collectorId: '',
    });
    setMarketQuery('');
    setMarketOpen(false);
    setNonPayers(new Set());
    setSlipFile(null);
    setErrors({});

    onAfterSubmit?.();
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      amount: '',
      category: '',
      paymentMethod: 'card',
      notes: '',
      marketId: '',
      collectorId: '',
    });
    setMarketQuery('');
    setMarketOpen(false);
    setNonPayers(new Set());
    setSlipFile(null);
    setErrors({});
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calculator className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('addNewTransaction')}</h2>
              <p className="text-gray-600">{t('enterYourTransactionDetailsBelow')}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                {t('date')}
              </label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                {t('transactionType')}
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Transaction['type'] })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="income">{t('income')}</option>
                <option value="expense">{t('expenses')}</option>
                <option value="transfer">{t('transfer')}</option>
              </select>
            </div>
          </div>

          {/* Market Autocomplete */}
          <div className="relative">
            <label htmlFor="market" className="block text-sm font-medium text-gray-700 mb-2">
              {t('markets.title') /* "ຕະຫຼາດ" */}
            </label>
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="market"
                type="text"
                value={marketQuery}
                onChange={(e) => {
                  setMarketQuery(e.target.value);
                  setMarketOpen(true);
                  setFormData((s) => ({ ...s, marketId: '' }));
                  setNonPayers(new Set());
                }}
                onFocus={() => setMarketOpen(true)}
                placeholder={t('markets.searchByIdOrName') || 'Search market by ID or name'}
                className={`w-full pl-9 pr-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.market ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.market && <p className="mt-1 text-sm text-red-600">{errors.market}</p>}

            {marketOpen && (
              <div
                className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow"
                onMouseLeave={() => setMarketOpen(false)}
              >
                {filteredMarkets.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">{t('noResults') || 'No results'}</div>
                ) : (
                  filteredMarkets.slice(0, 8).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                      onClick={() => pickMarket(m.id)}
                    >
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-gray-500">
                        ID: {m.id} • {m.village}, {m.city}, {m.district}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Members checklist */}
          {formData.marketId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ບໍ່ໄດ້ຈ່າຍໃນມື້ນີ້ (ຕິກທີ່ບັອກ “ບໍ່ໄດ້ຈ່າຍ”)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {membersOfMarket.length === 0 ? (
                  <div className="text-gray-500">ຕະຫຼາດນີ້ຍັງບໍ່ມີສະມາຊິກ</div>
                ) : (
                  membersOfMarket.map((m) => {
                    const fullName = `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || '(ບໍ່ລະບຸຊື່)';
                    const checked = nonPayers.has(m.id);
                    return (
                      <label
                        key={m.id}
                        className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer ${
                          checked ? 'bg-red-50 border-red-200' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={checked}
                          onChange={() => toggleNonPayer(m.id)}
                        />
                        <span className="text-sm">
                          {fullName}
                          {m.role === 'agent' ? <span className="ml-2 text-xs text-blue-600">(ແມ່ຄ່າຍ)</span> : null}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                * ເຫດຜົນໃຫ້ຂຽນທີ່ “ບົດບັນທຶກ” ດ້ານລຸ່ມ
              </p>
            </div>
          )}

          {/* Amount & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                {t('amountMt')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₭</span>
                </div>
                <input
                  type="number"
                  id="amount"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className={`w-full pl-8 pr-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                {t('categoryMt')}
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>
          </div>

          {/* Payment Method & Collector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
                {t('paymentMethod')}
              </label>
              <select
                id="paymentMethod"
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value as Transaction['paymentMethod'] })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cash">{t('paymentMethodList.cash')}</option>
                <option value="card">{t('paymentMethodList.card')}</option>
                <option value="bank_transfer">{t('paymentMethodList.bankTransfer')}</option>
                <option value="check">{t('paymentMethodList.check')}</option>
                <option value="other">{t('paymentMethodList.other')}</option>
              </select>

              {/* upload slip */}
              {formData.paymentMethod === 'bank_transfer' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">slip</label>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <Upload className="h-4 w-4 mr-2" />
                      <span>upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                      />
                    </label>
                    {slipPreviewUrl && (
                      <a
                        href={slipPreviewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 text-sm underline"
                      >
                        see the picture
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="collector" className="block text-sm font-medium text-gray-700 mb-2">
                ຜູ້ເກັບເງິນ
              </label>
              <select
                id="collector"
                value={formData.collectorId}
                onChange={(e) => setFormData({ ...formData, collectorId: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.collector ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">— ລະບຸຜູ້ເກັບເງິນ —</option>
                {MOCK_USERS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.role})
                  </option>
                ))}
              </select>
              {errors.collector && <p className="mt-1 text-sm text-red-600">{errors.collector}</p>}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              {t('notes')}
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="ຂຽນເຫດຜົນຂອງຜູ້ທີ່ບໍ່ໄດ້ຈ່າຍມື້ນີ້ ຫຼື ລາຍລະອຽດເພີ່ມເຕີມ"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
            >
              <X className="h-4 w-4 mr-2" />
              {t('clear')}
            </button>
            <button
              type="submit"
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <Save className="h-4 w-4 mr-2" />
              {t('addTransaction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
