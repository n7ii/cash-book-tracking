import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Market, mapMarketFromApi } from '../types/Market';
import {
  fetchMarkets,
  createMarket,
  updateMarket,
  deleteMarket,
  fetchMarketCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../components/Service/marketService'; 

function getAddressIdFromMarket(m: any): number {
  return Number(m?.addressId ?? m?.Address ?? m?.villageId ?? m?.village ?? 0) || 0;
}
export type MarketMember = {
  id: string;
  firstName: string;
  lastName: string;
  age?: number;
  role: 'agent' | 'member';
  loanAmountText?: number;
  birth_date?: string | null; 
};
type NewMarketInput = { name: string; village: string };

type MarketCtx = {
  markets: Market[];
  addMarket: (m: NewMarketInput) => void;
  getMarket: (id: string) => Market | undefined;
  listMembers: (marketId: string) => MarketMember[];
  getAgents: (marketId: string) => MarketMember[];
  addMember: (marketId: string, m: Omit<MarketMember, 'id'>) => void;
  updateMember: (marketId: string, id: string, patch: Partial<MarketMember>) => void;
  removeMember: (marketId: string, id: string) => void;
  getResponsible: (marketId: string) => string | null;
  setResponsible: (marketId: string, userId: string | null) => void;
  removeMarket: (marketId: string) => void;
  editMarket: (marketId: string, patch: { name: string; villageId: number }, reason: string) => Promise<void>;
};

const MarketContext = createContext<MarketCtx | null>(null);

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [membersByMarket, setMembersByMarket] = useState<Record<string, MarketMember[]>>({});
  const [responsibleByMarket, setResponsibleByMarket] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);

  // load market component mount
  useEffect(() => {
    const loadMarkets = async () => {
      try {
        const response = await fetchMarkets(1, 100, '');
        // ✅ read array of response.data.data
        const apiMarkets = Array.isArray(response?.data?.data)
          ? response.data.data
          : Array.isArray(response?.data)
          ? response.data
          : [];
        // use mapMarketFromApi for change
        const mappedMarkets: Market[] = apiMarkets.map(mapMarketFromApi);
        setMarkets(mappedMarkets);

        // set map member and responsible(employee)
        const membersMap: Record<string, MarketMember[]> = {};
        const respMap: Record<string, string | null> = {};
        mappedMarkets.forEach((m) => {
          membersMap[m.id] = [];
          respMap[m.id] = m.responsible_by ? String(m.responsible_by) : null;
        });
        setMembersByMarket(membersMap);
        setResponsibleByMarket(respMap);
      } catch (err) {
        console.error('Error loading markets:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMarkets();
  }, []);

  // create market
  const addMarket: MarketCtx['addMarket'] = async (payload) => {
    try {
      await createMarket({
        Mname: payload.name,
        Address: Number(payload.village) || 0,
        responsible_by: undefined,
      });
      // load markets again
      const response = await fetchMarkets(1, 100, '');
      const apiMarkets = Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.data)
        ? response.data
        : [];
      const mappedMarkets: Market[] = apiMarkets.map(mapMarketFromApi);
      setMarkets(mappedMarkets);
    } catch (err) {
      console.error('Failed to create market:', err);
    }
  };

  // add member
  const addMember: MarketCtx['addMember'] = async (marketId, m) => {
    try {
      const roleId = m.role === 'agent' ? 3 : 2;
      await createCustomer({
        Fname: m.firstName,
        Lname: m.lastName,
        market_id: Number(marketId),
        role_id: roleId,
        is_active: 1,
        birth_date: (m as any).birth_date ?? null, 
      });
      // load new member
      const res = await fetchMarketCustomers(Number(marketId), 1, 100, '');
      const customers = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : [];
      const transformedMembers: MarketMember[] = customers.map((c: any) => ({
        id: String(c.MID || c.id),
        firstName: c.Fname || c.firstName || '',
        lastName: c.Lname || c.lastName || '',
        role: c.role_id === 3 ? 'agent' : 'member',
        age: c.age ?? undefined,
        loanAmountText: typeof c.total_loan_amount === 'number' ? c.total_loan_amount : undefined,
        birth_date: c.birth_date ?? null,
      }));
      setMembersByMarket((prev) => ({ ...prev, [marketId]: transformedMembers }));
    } catch (err) {
      console.error('Failed to add member:', err);
    }
  };

  // update member
  const updateMember: MarketCtx['updateMember'] = async (marketId, id, patch) => {
    try {
      const payload: any = {
        edit_reason: 'update member',
        market_id: Number(marketId), 
        is_active: 1,                
      };
      if (patch.firstName !== undefined) payload.Fname = patch.firstName;
      if (patch.lastName !== undefined) payload.Lname = patch.lastName;
      if (patch.role !== undefined) payload.role_id = patch.role === 'agent' ? 3 : 2;
      if ((patch as any).birth_date !== undefined) payload.birth_date = (patch as any).birth_date || null;

      await updateCustomer(Number(id), payload);

      // reload members list of this market
      const res = await fetchMarketCustomers(Number(marketId), 1, 100, '');
      const customers = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : [];
      const transformed: MarketMember[] = customers.map((c: any) => ({
        id: String(c.MID || c.id),
        firstName: c.Fname || c.firstName || '',
        lastName: c.Lname || c.lastName || '',
        role: c.role_id === 3 ? 'agent' : 'member',
        age: c.age ?? undefined,
        loanAmountText: typeof c.total_loan_amount === 'number' ? c.total_loan_amount : undefined,
        birth_date: c.birth_date ?? null, 
      }));
      setMembersByMarket((prev) => ({ ...prev, [marketId]: transformed }));
    } catch (err) {
      console.error('Failed to update member:', err);
      throw err;
    }
  };

  // remove member
  const removeMember: MarketCtx['removeMember'] = async (marketId, id) => {
    try {
      await deleteCustomer(Number(id), 'remove member');
      const res = await fetchMarketCustomers(Number(marketId), 1, 100, '');
      const customers = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : [];
      const transformedMembers: MarketMember[] = customers.map((c: any) => ({
        id: String(c.MID || c.id),
        firstName: c.Fname || c.firstName || '',
        lastName: c.Lname || c.lastName || '',
        role: c.role_id === 3 ? 'agent' : 'member',
        age: c.age ?? undefined, 
  loanAmountText: typeof c.total_loan_amount === 'number' ? c.total_loan_amount : undefined,
      }));
      setMembersByMarket((prev) => ({ ...prev, [marketId]: transformedMembers }));
    } catch (err) {
      console.error('Failed to delete member:', err);
    }
  };

  // read responsible
  const getResponsible: MarketCtx['getResponsible'] = (marketId) =>
    responsibleByMarket[marketId] ?? null;

  // set responsible
  const setResponsible: MarketCtx['setResponsible'] = async (marketId, userId) => {
    setResponsibleByMarket((prev) => ({ ...prev, [marketId]: userId }));
    try {
      const market = markets.find((m) => m.id === marketId);
      if (!market) return;
      await updateMarket(Number(marketId), {
        Mname: market.name,
        Address: getAddressIdFromMarket(market),
        responsible_by: userId ? Number(userId) : undefined,
        edit_reason: 'change responsible',
      });
    } catch (err) {
      console.error('Failed to update market responsible:', err);
    }
  };

  // delete market
  const removeMarket: MarketCtx['removeMarket'] = async (marketId) => {
    try {
      await deleteMarket(Number(marketId), 'remove market');
      const response = await fetchMarkets(1, 100, '');
      const apiMarkets = Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.data)
        ? response.data
        : [];
      const mappedMarkets: Market[] = apiMarkets.map(mapMarketFromApi);
      setMarkets(mappedMarkets);

      // reset members and responsible to match remaining markets
      const membersMap: Record<string, MarketMember[]> = {};
      const respMap: Record<string, string | null> = {};
      mappedMarkets.forEach((m) => {
        membersMap[m.id] = membersByMarket[m.id] || [];
        respMap[m.id] = responsibleByMarket[m.id] || null;
      });
      setMembersByMarket(membersMap);
      setResponsibleByMarket(respMap);
    } catch (err) {
      console.error('Failed to delete market:', err);
    }
  };
  /** 🎯 edit market name and location */
  const editMarket: MarketCtx['editMarket'] = async (marketId, patch, reason) => {
    try {
      await updateMarket(Number(marketId), {
        Mname: patch.name,
        Address: Number(patch.villageId) || 0,
        edit_reason: reason || 'update market',
      });
      // reload markets
      const response = await fetchMarkets( 1, 100, '');
      const apiMarkets = Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.data)
        ? response.data
        : [];
      const mapped: Market[] = apiMarkets.map(mapMarketFromApi);
      setMarkets(mapped);
    } catch (err) {
      console.error('Failed to edit market:', err);
      throw err;
    }
  };

  const getMarket: MarketCtx['getMarket'] = (id) => markets.find((m) => m.id === id);
  const listMembers: MarketCtx['listMembers'] = (marketId) => membersByMarket[marketId] ?? [];
  const getAgents: MarketCtx['getAgents'] = (marketId) =>
    (membersByMarket[marketId] ?? []).filter((m) => m.role === 'agent');

  //  value to sent context
  const value = useMemo<MarketCtx>(
    () => ({
      markets,
      addMarket,
      getMarket,
      listMembers,
      getAgents,
      addMember,
      updateMember,
      removeMember,
      getResponsible,
      setResponsible,
      removeMarket,
      editMarket, 
    }),
    [markets, membersByMarket, responsibleByMarket]
  );

  if (loading) {
    return <div>Loading markets...</div>;
  }

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
};

export function useMarkets(): MarketCtx {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error('useMarkets must be used within MarketProvider');
  return ctx;
}
