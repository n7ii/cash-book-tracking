// src/components/Service/transactionformService.ts
import {api} from './api';

// check number
const toNum = (v: any) => {
  const n = Number(String(v ?? '').toString().replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

/* ========= ADMIN-ONLY: ADD FUNDS (CAPITAL INJECTION) =========
*/
export async function adminAddFunds(payload: {
  amount: number;
  method: 'cash' | 'transfer' | 'other';
  note?: string;
  slip_url?: string | null;
}) {
  // ✅ change amount -> total, note -> notes
  const body = {
    total: toNum(payload.amount),           // ✅ use total
    notes: payload.note || undefined,       // ✅ use notes
    member_id: null,                        // ✅ add member_id field
    market_id: null,                        // ✅ add market_id field
  };
  return api.post('/admin/funds', body);
}

export async function createCollectionWithStatus(payload: {
  market_id: number;
  method: 'cash' | 'transfer' | 'other';
  note?: string;
  slip_url?: string | null;
  items: Array<{
    member_id: number;
    amount: number;
    unpaid?: boolean;
    note?: string;
  }>;
}) {
  // ✅ summary total from all items 
  const items = (payload.items || [])

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('ບໍ່ມີລາຍການສະມາຊິກສຳລັບເກັບເງິນ');
  }

  // summary total
  const total = items.reduce((sum, it) => sum + (it.unpaid ? 0 : toNum(it.amount)), 0);

  // create details array for backend
  const details = items.map((it) => ({
    member_id: Number(it.member_id),
    amount: toNum(it.amount),
    status: it.unpaid ? 'NOT_PAID' : 'PAID',
    notes: it.note || undefined,
  }));

  // ✅ send schema of backend
  const body = {
    member_id: items[0].member_id,          // used first member_id as reference
    total: total,                            // summary total
    notes: payload.note || undefined,
    market_id: Number(payload.market_id),
    details: details,                        // send details array
    photo_url: payload.slip_url || undefined,
    payment_method: payload.method,
    type: 'collection',                      // set type
    category: 'ງວດ-ດອກເບ້ຍ',               // set category
  };

  return api.post('/collections', body);
}

/* ========= CREATE A NEW LOAN (CORRECTED) =========
   Backend want (from loansRoutes.js):
   { member_id, total, end_date?, status, notes? }
*/
export async function createLoanTx(payload: {
  member_id: number;
  total: number;
  method: 'cash' | 'transfer' | 'other';
  note?: string;
  slip_url?: string | null;
}) {
  // ✅ same backend 
  const body = {
    member_id: Number(payload.member_id),
    total: toNum(payload.total),
    status: 1,                               // active loan
    notes: payload.note || undefined,
  };
  return api.post('/loans', body);
}

/* ========= EXPENSES (OTHER) =========
   Backend want (if exists expensesRoutes.js):
   { amount, expense_type, notes?, market_id? }
*/
export async function createExpense(payload: {
  market_id: number | null;
  amount: number;
  category: 'ອື່ນໆ';
  method: 'cash' | 'transfer' | 'other';
  note: string;
  slip_url?: string | null;
}) {
  // ✅ fix compare backend
  const body = {
    market_id: payload.market_id ?? undefined,
    amount: toNum(payload.amount),
    expense_type: payload.category,          // ✅ change category -> expense_type
    notes: payload.note,                     // ✅ change note -> notes
  };
  return api.post('/expenses', body);
}

// ========= UPLOAD SLIP =========
export async function uploadSlip(file: File): Promise<string> {
  const form = new FormData();
  form.append('image', file); // ✅ backend: upload.single('image')
  const res = await api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res?.data?.url || '';
}