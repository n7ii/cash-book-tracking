// src/services/marketService.ts
import { api } from './api';

export interface MarketPayload {
  Mname: string;
  Address: number;         // village_id
  responsible_by?: number; // user id of responsible person
}
export interface MarketUpdatePayload extends MarketPayload {
  edit_reason: string;
}
export interface CustomerPayload {
  Fname: string;
  Lname: string;
  market_id: number;
  role_id: number;   // 2=Member, 3=Collector
  is_active: number; // 1=active
  birth_date?: string | null;
}
export interface CustomerUpdatePayload extends CustomerPayload {
  edit_reason: string;
}



/* ===== Markets ===== */
export const fetchMarkets = async (page = 1, limit = 50, search = '') => {
  const res = await api.get('/markets', { params: { page, limit, search } });
  return res.data;
};

export const fetchMarket = async (marketId: number) => {
  const res = await api.get(`/markets/${marketId}`);
  return res.data;
};

export const createMarket = async (payload: MarketPayload) => {
  const res = await api.post('/markets', payload);
  return res.data;
};

export const updateMarket = async (marketId: number, payload: MarketUpdatePayload) => {
  const res = await api.put(`/markets/${marketId}`, payload);
  return res.data;
};

export const deleteMarket = async (marketId: number, reason: string) => {
  const res = await api.post(`/markets/${marketId}/delete`, { reason });
  return res.data;
};

/* ===== Customers ===== */
export const fetchMarketCustomers = async (
  marketId: number,
  page = 1,
  limit = 50,
  search = ''
) => {
  const res = await api.get(`/markets/${marketId}/customers`, {
    params: { page, limit, search },
  });
  return res.data;
};

export const createCustomer = async (payload: CustomerPayload) => {
  const res = await api.post('/customers', payload);
  return res.data;
};

export const updateCustomer = async (
  customerId: number,
  payload: CustomerUpdatePayload
) => {
  const res = await api.put(`/customers/${customerId}`, payload);
  return res.data;
};

export const deleteCustomer = async (customerId: number, reason: string) => {
  const res = await api.post(`/customers/${customerId}/delete`, { reason });
  return res.data;
};

/* ===== Address ===== */
export const fetchAddressName = async ( villageId: number | string) => {
  try {
    const res = await api.get(`/addresses/${villageId}`);
    return res.data; // { fullName, parts, ids }
  } catch (e: any) {
    // if not found, return empty name
    if (e?.response?.status === 404) return { fullName: '' };
    throw e;
  }
};

/* ===== Summary / Transactions / Responsible ===== */
export const fetchMarketSummary = async (
  marketId: number | string,
  days: 7 | 30 | 90 = 7
) => {
  const res = await api.get(`/markets/${marketId}/summary`, { params: { days } });
  return res.data;
};

export const fetchMarketTransactions = async (marketId: number | string) => {
  const res = await api.get(`/markets/${marketId}/transactions`);
  return res.data;
};

export const fetchResponsibleCandidates = async (marketId: number | string) => {
  const res = await api.get(`/markets/${marketId}/responsible-candidates`);
  return res.data;
};

// ===== Address lookups (use with dropdown) =====
export const listProvinces = async () => {
  const res = await api.get('/addresses/provinces');
  return res.data as { id: number; name: string }[];
};

export const listDistricts = async (provinceId: number) => {
  const res = await api.get(`/addresses/provinces/${provinceId}/districts`);
  return res.data as { id: number; name: string }[];
};

export const listVillages = async (districtId: number) => {
  const res = await api.get(`/addresses/districts/${districtId}/villages`);
  return res.data as { id: number; name: string }[];
};

// เพิ่ม export นี้ (อยู่ไฟล์เดียวกับ fetchMarketCustomers)
export async function fetchActiveLoansByMember(
  memberId: number
) {
  // ถ้า backend คุณใช้ path อื่น ให้ปรับตรงนี้
  return api.get(`/customers/${memberId}/active-loan`);
}
