import React, { createContext, useContext, useMemo, useState } from 'react';
import { Market } from '../types/Market';

export type MarketMember = {
  id: string;
  firstName: string;
  lastName: string;
  age?: number;
  role: 'agent' | 'member';
  loanAmountText?: string; 
};

type MarketCtx = {
  markets: Market[];
  addMarket: (m: Omit<Market, 'id' | 'createdAt'>) => void;
  getMarket: (id: string) => Market | undefined;

  listMembers: (marketId: string) => MarketMember[];
  getAgents: (marketId: string) => MarketMember[]; 
  addMember: (marketId: string, m: Omit<MarketMember, 'id'>) => void;
  updateMember: (marketId: string, id: string, patch: Partial<MarketMember>) => void;
  removeMember: (marketId: string, id: string) => void;

  getResponsible: (marketId: string) => string | null;
  setResponsible: (marketId: string, userId: string | null) => void;
};

const MarketContext = createContext<MarketCtx | null>(null);

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [markets, setMarkets] = useState<Market[]>([
    {
      id: 'mkt-001',
      name: 'ຕະຫຼາດເຊົ້າ',
      village: 'ບ້ານໜອງ',
      city: 'ຈັນທະບູລີ',
      district: 'ນະຄອນຫຼວງວຽງຈັນ',
      agentName: '', 
      members: [],   
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mkt-002',
      name: 'ຕະຫຼາດດົງໂດກ',
      village: 'ບ້ານດົງໂດກ',
      city: 'ໄຊທານີ',
      district: 'ຈັນທະບູລີ',
      agentName: '',
      members: [],
      createdAt: new Date().toISOString(),
    },
  ]);

  const [membersByMarket, setMembersByMarket] = useState<Record<string, MarketMember[]>>({
    'mkt-001': [
      { id: 'mem-001', firstName: 'ນາງ', lastName: 'ຄຳ', role: 'member' },
      { id: 'mem-002', firstName: 'ທ້າວ', lastName: 'ວິລັດ', role: 'member' },
      { id: 'mem-003', firstName: 'ນາງ', lastName: 'ມະລິ', role: 'agent' }, 
    ],
    'mkt-002': [
      { id: 'mem-004', firstName: 'ທ້າວ', lastName: 'ສົມຊາຍ', role: 'member' },
      { id: 'mem-005', firstName: 'ນາງ', lastName: 'ຄຳແພງ', role: 'member' },
    ],
  });

  const [responsibleByMarket, setResponsibleByMarket] = useState<Record<string, string | null>>({
    'mkt-001': null,
    'mkt-002': null,
  });

  const addMarket: MarketCtx['addMarket'] = (payload) => {
    setMarkets((prev) => {
      const nextIdNum = prev.length + 1;
      const id = `mkt-${String(nextIdNum).padStart(3, '0')}`;
      const createdAt = new Date().toISOString();
      const record: Market = { ...payload, id, createdAt, members: [] };
      setMembersByMarket((mm) => ({ ...mm, [id]: [] }));
      setResponsibleByMarket((rm) => ({ ...rm, [id]: null }));
      return [record, ...prev];
    });
  };

  const getMarket: MarketCtx['getMarket'] = (id) => markets.find((m) => m.id === id);

  const listMembers: MarketCtx['listMembers'] = (marketId) => membersByMarket[marketId] ?? [];
  const getAgents: MarketCtx['getAgents'] = (marketId) =>
    (membersByMarket[marketId] ?? []).filter((m) => m.role === 'agent');

  const addMember: MarketCtx['addMember'] = (marketId, m) => {
    setMembersByMarket((prev) => {
      const next = [...(prev[marketId] ?? [])];
      const id = `mem-${crypto.randomUUID?.() || Math.random().toString(36).slice(2, 8)}`;
      next.push({ id, ...m });
      return { ...prev, [marketId]: next };
    });
  };

  const updateMember: MarketCtx['updateMember'] = (marketId, id, patch) => {
    setMembersByMarket((prev) => {
      const next = (prev[marketId] ?? []).map((x) => (x.id === id ? { ...x, ...patch } : x));
      return { ...prev, [marketId]: next };
    });
  };

  const removeMember: MarketCtx['removeMember'] = (marketId, id) => {
    setMembersByMarket((prev) => {
      const next = (prev[marketId] ?? []).filter((x) => x.id !== id);
      return { ...prev, [marketId]: next };
    });
  };

  const getResponsible: MarketCtx['getResponsible'] = (marketId) =>
    responsibleByMarket[marketId] ?? null;

  const setResponsible: MarketCtx['setResponsible'] = (marketId, userId) => {
    setResponsibleByMarket((prev) => ({ ...prev, [marketId]: userId }));
  };

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
    }),
    [markets, membersByMarket, responsibleByMarket]
  );

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
};

export function useMarkets(): MarketCtx {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error('useMarkets must be used within MarketProvider');
  return ctx;
}
