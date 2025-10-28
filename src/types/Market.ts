// src/types/Market.ts

export interface Market {
  id: string;
  name: string;
  village: string;
  city: string;
  district: string;
  agentName: string;
  members: string[];
  createdAt: string;
  responsible_by?: number | null;
}

// Response จาก API
export interface MarketApiResponse {
  MkID: number;
  Mname: string;
  Address: number;
  responsible_by?: number | null;
  created_at?: string;
  city?: string;
  district?: string;
}

// สำหรับแปลง API Response เป็น Market
export function mapMarketFromApi(apiMarket: MarketApiResponse): Market {
  return {
    id: String(apiMarket.MkID),
    name: apiMarket.Mname,
    village: String(apiMarket.Address),
    city: apiMarket.city || '',
    district: apiMarket.district || '',
    agentName: '',
    members: [],
    createdAt: apiMarket.created_at || new Date().toISOString(),
    responsible_by: apiMarket.responsible_by,
  };
}