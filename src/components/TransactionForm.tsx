import React, { useEffect, useMemo, useState } from 'react';
import { useMarkets } from '../contexts/MarketContext';
import { useNotifications } from '../contexts/NotificationContext';
import { fetchMarketCustomers } from './Service/marketService';
import {
  adminAddFunds,
  createCollectionWithStatus,
  createExpense,
  createLoanTx,
  uploadSlip,
} from './Service/transactionformService';
import { useTransactions } from '../contexts/TransactionContext';

type TxType = 'income' | 'expense';
type Category = 'ທຶນ' | 'ງວດ-ດອກເບ້ຍ' | 'ອື່ນໆ';

type MemberOption = { id: string; name: string };

const toNumber = (v: any) => {
  const n = Number(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

type Props = {
  defaultType?: TxType | null;     
  defaultCategory?: Category | null; 
  defaultMarketId?: string | null;
  defaultMemberId?: string | null;
  defaultMethod?: 'cash' | 'transfer' | 'other' | null; 
  onAfterSubmit?: () => void;
};

const TransactionForm: React.FC<Props> = ({
  defaultType,
  defaultCategory,
  defaultMarketId,
  defaultMemberId,
  defaultMethod,
  onAfterSubmit,
}) => {
  const { markets } = useMarkets();
  const { showError, showSuccess } = useNotifications();
  const { refreshTransactions } = useTransactions();

  const [type, setType] = useState<TxType>('income');
  const incomeCats: Category[] = ['ທຶນ', 'ງວດ-ດອກເບ້ຍ', 'ອື່ນໆ'];
  const expenseCats: Category[] = ['ທຶນ', 'ອື່ນໆ'];
  const [category, setCategory] = useState<Category>('ງວດ-ດອກເບ້ຍ');

  const [marketId, setMarketId] = useState<string>('');
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  const [method, setMethod] = useState<'cash' | 'transfer' | 'other'>('cash');
  const [note, setNote] = useState('');

  // ຕາຕະລາງເກັບງວດ
  const [rowAmounts, setRowAmounts] = useState<Record<string, number>>({});
  const [rowUnpaid, setRowUnpaid] = useState<Record<string, boolean>>({});
  const [rowNotes, setRowNotes] = useState<Record<string, string>>({});

  const [manualAmount, setManualAmount] = useState('');
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [slipUploading, setSlipUploading] = useState(false);

  const cats = type === 'income' ? incomeCats : expenseCats;
  const needMarket = !(type === 'income' && category === 'ທຶນ');
  const isInstallment = type === 'income' && category === 'ງວດ-ດອກເບ້ຍ';
  const isLoanCreate = type === 'expense' && category === 'ທຶນ';

  const totalFromRows = useMemo(
    () => Object.values(rowAmounts).reduce((s, n) => s + (Number(n) || 0), 0),
    [rowAmounts]
  );
  const amountDisabled = isInstallment;
  const amount = useMemo(
    () => (isInstallment ? totalFromRows : toNumber(manualAmount)),
    [isInstallment, totalFromRows, manualAmount]
  );

  const loadMembers = async (mid: string) => {
    setMarketId(mid);
    setMembers([]);
    setSelectedMemberId('');
    setRowAmounts({});
    setRowUnpaid({});
    setRowNotes({});
    if (!mid) return;

    try {
      const res = await fetchMarketCustomers(Number(mid), 1, 200, '');
      const raw = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : [];
      const list: MemberOption[] = raw.map((c: any) => ({
        id: String(c.MID ?? c.id),
        name: `${c.Fname ?? ''} ${c.Lname ?? ''}`.trim(),
      }));
      setMembers(list);
    } catch (e) {
      showError('ດຶງສະມາຊິກບໍ່ສຳເລັດ');
    }
  };
  useEffect(() => {
  // 1) tye-category
  if (defaultType) setType(defaultType);
  if (defaultCategory) setCategory(defaultCategory);

  // 2) market + lead members
  if (defaultMarketId) {
    // load members and setMarketId
    loadMembers(defaultMarketId);
  }

  // 3) select default member (if provided)
  if (defaultMemberId) {
    setSelectedMemberId(defaultMemberId);
  }
  // 4) method  set transfer
    if (defaultMethod) setMethod(defaultMethod);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [defaultType, defaultCategory, defaultMarketId, defaultMemberId, defaultMethod]);

  const validate = (): string | null => {
    if (type === 'income') {
      if (category === 'ງວດ-ດອກເບ້ຍ') {
        if (!marketId) return 'ກະລຸນາເລືອກຕະຫຼາດ';
        if (members.length === 0) return 'ຕະຫຼາດນີ້ບໍ່ມີສະມາຊິກ';
        if (amount <= 0) return 'ກະລຸນາກຳນົດຈຳນວນເງິນທີ່ເກັບ';
        for (const id of Object.keys(rowUnpaid)) {
          if (rowUnpaid[id] && !(rowNotes[id] || '').trim()) {
            return 'ກະລຸນາລະບຸເຫດຜົນສຳລັບຜູ້ທີ່ບໍ່ຈ່າຍ';
          }
        }
      } else if (category === 'ທຶນ') {
        if (amount <= 0) return 'ກະລຸນາລະບຸຈຳນວນເງິນ';
      } else if (category === 'ອື່ນໆ') {
        return 'ປະເພດນີ້ຍັງບໍ່ຮອງຮັບ';
      }
    } else {
      if (category === 'ທຶນ') {
        if (!marketId) return 'ກະລຸນາເລືອກຕະຫຼາດ';
        if (!selectedMemberId) return 'ກະລຸນາເລືອກສະມາຊິກ 1 ຄົນ';
        if (amount <= 0) return 'ກະລຸນາລະບຸຈຳນວນເງິນ';
      } else if (category === 'ອື່ນໆ') {
        if (amount <= 0) return 'ກະລຸນາລະບຸຈຳນວນເງິນ';
        if (!note.trim()) return 'ກະລຸນາລະບຸ Note ເມື່ອເລືອກ "ອື່ນໆ"';
      }
    }
    return null;
  };

  const handlePickSlip = async (file: File | null) => {
    if (!file) return;
    try {
      setSlipUploading(true);
      const url = await uploadSlip(file);
      setSlipUrl(url || null);
    } catch {
      setSlipUrl(null);
      showError('ອັບໂຫລດສະລິບບໍ່ສຳເລັດ');
    } finally {
      setSlipUploading(false);
    }
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) return showError(err);

    try {
      if (type === 'income') {
        if (category === 'ງວດ-ດອກເບ້ຍ') {
          const items = members // <-- PROBLEM 1 FIX: Iterate over the full `members` list from state
            .map((member) => { // For each member in the market...
              const id = member.id; // Get their ID
              return {
                member_id: Number(id),
                // Get amount, unpaid status, and note from state using the member's ID
                amount: rowAmounts[id] || 0,
                unpaid: !!rowUnpaid[id],
                note: rowNotes[id] || undefined,
              };
             });
            // --- END CORRECTED 'items' CREATION ---

            // --- VALIDATION (Optional but Recommended) ---
            // You might want to add a check here to ensure at least one item was processed
            if (items.length === 0 && members.length > 0) {
               console.error("No items generated from members list, check logic.");
               // Maybe throw an error or show a specific notification
               return showError("Could not process member details for submission.");
            }

          await createCollectionWithStatus({
            market_id: Number(marketId),
            method,
            note: note || undefined,
            slip_url: slipUrl,
            items,
          });
        } else if (category === 'ທຶນ') {
          await adminAddFunds({
            amount,
            method,
            note: note || undefined,
            slip_url: slipUrl,
          });
        }
      } else {
        if (category === 'ທຶນ') {
          await createLoanTx({
            member_id: Number(selectedMemberId),
            total: amount,
            method,
            note: note || undefined,
            slip_url: slipUrl,
          });
        } else if (category === 'ອື່ນໆ') {
          await createExpense({
            market_id: marketId ? Number(marketId) : null,
            amount: amount,
            category: 'ອື່ນໆ',
            method,
            note, // required
            slip_url: slipUrl || undefined,
          });
        }
      }

      showSuccess('ເຮັດທຸລະກຳສຳເລັດ');
      // reset ສະເພາະຈຳນວນຕາຕະລາງ
      refreshTransactions();
      setManualAmount('');
      setRowAmounts({});
      setRowUnpaid({});
      setRowNotes({});
      setSelectedMemberId('');
      setSlipUrl(null);
    } catch (e: any) {
      console.error(e);
      showError(e?.response?.data?.message || 'ບັນທຶກທຸລະກຳລົ້ມເຫຼວ');
    }
    onAfterSubmit?.();
  };

  /* ===================== UI===================== */
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 grid place-items-center rounded-lg bg-blue-50 text-blue-600 text-lg">🧾</div>
        <div>
          <h2 className="text-xl font-semibold">ເພີ່ມທຸລະກຳໃໝ່</h2>
          <p className="text-gray-500 text-sm">ໃສ່ລາຍລະອຽດທຸລະກຳຕ່າງໆນີ້</p>
        </div>
      </div>

      {/* topline: ປະເພດ / ໝວດໝູ່ / ວິທີຊຳລະ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm text-gray-600">ປະເພດ</label>
          <select
            className="mt-1 border rounded-lg p-2 w-full"
            value={type}
            onChange={(e) => {
              const v = e.target.value as TxType;
              setType(v);
              setCategory(v === 'income' ? 'ງວດ-ດອກເບ້ຍ' : 'ທຶນ');
              setManualAmount('');
              setSlipUrl(null);
            }}
          >
            <option value="income">ລາຍຮັບ</option>
            <option value="expense">ລາຍຈ່າຍ</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">ເລືອກ “ລາຍຮັບ” ຫຼື “ລາຍຈ່າຍ”</p>
        </div>

        <div>
          <label className="text-sm text-gray-600">ຫມວດໝູ່</label>
          <select
            className="mt-1 border rounded-lg p-2 w-full"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as Category);
              setManualAmount('');
            }}
          >
            {cats.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">“ລາຍຮັບ” ມີ “ທຶນ, ງວດ-ດອກເບ້ຍ, ອື່ນໆ” / “ລາຍຈ່າຍ” ບໍ່ມີ “ງວດ-ດອກເບ້ຍ”</p>
        </div>

        <div>
          <label className="text-sm text-gray-600">ວິທີຊຳລະ</label>
          <select
            className="mt-1 border rounded-lg p-2 w-full"
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
          >
            <option value="cash">ເງິນສົດ</option>
            <option value="transfer">ໂອນ</option>
            <option value="other">ອື່ນໆ</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">ເລືອກວິທີຮັບ-ຈ່າຍເງິນ</p>
        </div>
      </div>

      {/* ຕະຫຼາດ */}
      {needMarket && (
        <div>
          <label className="text-sm text-gray-600">ຕະຫຼາດ</label>
          <select
            className="mt-1 border rounded-lg p-2 w-full md:w-96"
            value={marketId}
            onChange={(e) => loadMembers(e.target.value)}
          >
            <option value="">— ເລືອກຕະຫຼາດ —</option>
            {markets.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">ຄົ້ນຫາ/ເລືອກຕະຫຼາດເພື່ອດຶງລາຍຊື່ສະມາຊິກ</p>
        </div>
      )}

      {/* ຕາຕະລາງເກັບງວດ (ລາຍຮັບ/ງວດ-ດອກເບ້ຍ) */}
      {isInstallment && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">ລາຍລະອຽດການເກັບ</div>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="p-2">ຊື່ສະມາຊິກ</th>
                  <th className="p-2 w-40 text-right">ຈຳນວນ</th>
                  <th className="p-2 w-24 text-center">ບໍ່ຈ່າຍ</th>
                  <th className="p-2">ເຫດຜົນ (ຖ້າບໍ່ຈ່າຍ)</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b">
                    <td className="p-2">{m.name}</td>
                    <td className="p-2">
                      <input
                        className="border rounded-lg p-1 w-full text-right"
                        placeholder="0"
                        value={rowAmounts[m.id] ?? ''}
                        onChange={(e) =>
                          setRowAmounts((prev) => ({ ...prev, [m.id]: toNumber(e.target.value) }))
                        }
                        disabled={rowUnpaid[m.id]}
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={!!rowUnpaid[m.id]}
                        onChange={(e) =>
                          setRowUnpaid((prev) => ({ ...prev, [m.id]: e.target.checked }))
                        }
                      />
                    </td>
                    <td className="p-2">
                      <input
                        className="border rounded-lg p-1 w-full"
                        placeholder="ອະທິບາຍເຫດຜົນ (ຖ້າບໍ່ຈ່າຍ)"
                        value={rowNotes[m.id] ?? ''}
                        onChange={(e) =>
                          setRowNotes((prev) => ({ ...prev, [m.id]: e.target.value }))
                        }
                        disabled={!rowUnpaid[m.id]}
                      />
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td className="p-4 text-center text-gray-500" colSpan={4}>ບໍ່ມີສະມາຊິກ</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-1">ລວມຈາກທຸກສະມາຊິກ: <b>{totalFromRows.toLocaleString()}</b></p>
        </div>
      )}

      {/* ເລືອກສະມາຊິກ 1 ຄົນ (ລາຍຈ່າຍ/ທຶນ) */}
      {isLoanCreate && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">ເລືອກສະມາຊິກ (ໄດ້ 1 ຄົນ)</div>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="p-2 w-20">ເລືອກ</th>
                  <th className="p-2">ຊື່ສະມາຊິກ</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const disabled = !!selectedMemberId && selectedMemberId !== m.id;
                  return (
                    <tr key={m.id} className="border-b">
                      <td className="p-2">
                        <input
                          type="radio"
                          name="oneMember"
                          checked={selectedMemberId === m.id}
                          onChange={() => setSelectedMemberId(m.id)}
                          disabled={disabled}
                        />
                      </td>
                      <td className="p-2">{m.name}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-1">ໝາຍເຫດ: ສ້າງການກູ້ເງິນໄດ້ຄັ້ງລະ 1 ຄົນ</p>
        </div>
      )}

      {/* Amount & Note */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-600">Amount</label>
          <input
            className="mt-1 border rounded-lg p-2 w-full text-right"
            placeholder="0"
            value={amountDisabled ? amount.toLocaleString() : manualAmount}
            onChange={(e) => setManualAmount(e.target.value)}
            disabled={amountDisabled}
          />
          <p className="text-xs text-gray-500 mt-1">
            {amountDisabled ? 'ຄຳນວນອັດຕະໂນມັດຈາກຕາຕະລາງດ້ານເທິງ' : 'ພິມຈຳນວນເງິນທີ່ຕ້ອງການ'}
          </p>
        </div>
        <div>
          <label className="text-sm text-gray-600">Note</label>
          <textarea
            className="mt-1 border rounded-lg p-2 w-full"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ອະທິບາຍ (ຖ້າມີ)"
          />
          <p className="text-xs text-gray-500 mt-1">ບັງຄັບສະເພາະເລືອກ “ອື່ນໆ”</p>
        </div>
      </div>

      {/* ອັບໂຫລດສລິບເມື່ອເລືອກໂອນ */}
      {method === 'transfer' && (
        <div>
          <label className="text-sm text-gray-600">ອັບໂຫລດສລິບເມື່ອເລືອກໂອນ (ຖ້າໂອນ)</label>
          <div className="flex items-center gap-3 mt-1">
            <label
        className={`inline-flex items-center px-3 py-2 rounded-lg
                    bg-blue-600 text-white hover:bg-blue-700 cursor-pointer
                    disabled:opacity-50 ${slipUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {slipUploading ? 'ກຳລັງອັບໂຫລດ…' : (slipUrl ? 'ອັບໂຫລດໃໝ່' : 'ເລືອກຮູບສະລິບ')}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handlePickSlip(e.target.files?.[0] ?? null)}
          disabled={slipUploading}
        />
      </label>

      {!!slipUrl && (
        <a
          className="text-sm text-blue-600 underline"
          href={slipUrl}
          target="_blank"
          rel="noreferrer"
        >
          ເບິ່ງຮູບ
        </a>
      )}
    </div>

    <p className="text-xs text-gray-500 mt-1">ເພື່ອເກັບຫຼັກຖານການໂອນເງິນ</p>
  </div>
)}

      <div className="flex justify-end">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          onClick={handleSubmit}
          disabled={type === 'income' && category === 'ອື່ນໆ'}
        >
          ບັນທຶກ
        </button>
      </div>
    </div>
  );
};

export default TransactionForm;
