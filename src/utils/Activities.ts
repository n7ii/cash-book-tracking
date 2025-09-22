// src/utils/Activities.ts
import { MOCK_USERS } from './mockUsers';

export type TxType = 'income' | 'expense' | 'transfer';

export interface ActivityTx {
  id: string;
  date: string; 
  type: TxType;
  amount: number; 
  category: string;
  marketId?: string;  
  marketName?: string;
  paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'check' | 'other';
  partyInvolved?: string;
  note?: string;
  userId: string;
  userName: string; 
  slipUrl?: string;
}

export function ymd(d: Date = new Date()): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function rel(days = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return ymd(d);
}

function loadUsers() {
  try {
    const raw = localStorage.getItem('users');
    if (raw) return JSON.parse(raw) as typeof MOCK_USERS;
  } catch {}
  return MOCK_USERS;
}

function nameOf(userId: string) {
  const users = loadUsers();
  const u = users.find((x) => x.id === userId);
  return u ? `${u.firstName} ${u.lastName}` : 'Unknown';
}

export const ACT_KEY = 'activities';

export const DEFAULT_ACTIVITIES: ActivityTx[] = [
  {
    id: 'TX-0001',
    date: rel(0), 
    type: 'income',
    amount: 5000,
    category: 'ງວດ',
    marketId: 'mkt-001',
    marketName: 'ຕະຫຼາດເຊົ້າ',
    paymentMethod: 'cash',
    userId: 'u002',
    userName: nameOf('u002'),
    partyInvolved: 'Mr. A',
    note: 'ຮັບງວດປະຈຳວັນ',
  },
  {
    id: 'TX-0002',
    date: rel(0),
    type: 'expense',
    amount: 1200,
    category: 'ອື່ນໆ',
    marketId: 'mkt-001',
    marketName: 'ຕະຫຼາດເຊົ້າ',
    paymentMethod: 'cash',
    userId: 'u002',
    userName: nameOf('u002'),
    partyInvolved: 'ຄ່ານໍາມັນ',
    note: 'ຈ່າຍຄ່າເດິນທາງ',
  },
  {
    id: 'TX-0003',
    date: rel(-1), 
    type: 'income',
    amount: 2_000_000,
    category: 'ທຶນ',
    marketId: 'mkt-002',
    marketName: 'ຕະຫຼາດດົງໂດກ',
    paymentMethod: 'bank_transfer',
    userId: 'u001',
    userName: nameOf('u001'),
    partyInvolved: 'ແມ່ຄ່າຍ ນາງ B',
    note: 'ຄືນທຶນປະຈຳອາທິດ',
    slipUrl: 'https://via.placeholder.com/640x400.png?text=SLIP',
  },
];

export function loadActivities(): ActivityTx[] {
  try {
    const raw = localStorage.getItem(ACT_KEY);
    if (raw) return JSON.parse(raw) as ActivityTx[];
  } catch {}
  return DEFAULT_ACTIVITIES;
}

export function saveActivities(list: ActivityTx[]) {
  localStorage.setItem(ACT_KEY, JSON.stringify(list));
}

export function initActivitiesIfMissing() {
  if (!localStorage.getItem(ACT_KEY)) {
    saveActivities(DEFAULT_ACTIVITIES);
  }
}

export function getActivityById(id: string, list?: ActivityTx[]): ActivityTx | undefined {
  const arr = list ?? loadActivities();
  return arr.find((a) => a.id === id);
}
