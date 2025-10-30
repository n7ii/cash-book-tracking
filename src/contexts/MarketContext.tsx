import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Market, mapMarketFromApi, MarketApiResponse } from '../types/Market';
import {
  fetchMarkets,
  createMarket,
  updateMarket,
  deleteMarket,
  fetchMarketCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  updateMarketAssignment,
} from '../components/Service/marketService';
import { useNotifications } from '../contexts/NotificationContext';
import axios, { isAxiosError } from 'axios';

function getAddressIdFromMarket(m: any): number {
  return Number(m?.addressId ?? m?.Address ?? m?.villageId ?? m?.village ?? 0) || 0;
}
// Types remain mostly the same
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

// Context type definition
type MarketCtx = {
  markets: Market[];
  loading: boolean; // Add loading state to context type
  addMarket: (m: NewMarketInput) => Promise<void>; // Make async
  getMarket: (id: string) => Market | undefined;
  listMembers: (marketId: string) => MarketMember[];
  getAgents: (marketId: string) => MarketMember[];
  addMember: (marketId: string, m: Omit<MarketMember, 'id'>) => Promise<void>;
  updateMember: (marketId: string, id: string, patch: Partial<MarketMember>) => Promise<void>;
  removeMember: (marketId: string, id: string) => Promise<void>;
  getResponsible: (marketId: string) => string | null;
  setResponsible: (marketId: string, userId: string | null) => Promise<void>;
  removeMarket: (marketId: string) => Promise<void>;
  editMarket: (marketId: string, patch: { name: string; villageId: number }, reason: string) => Promise<void>;
};

const MarketContext = createContext<MarketCtx | null>(null);

export const MarketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [membersByMarket, setMembersByMarket] = useState<Record<string, MarketMember[]>>({});
  const [responsibleByMarket, setResponsibleByMarket] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useNotifications();

  // load market component mount
  useEffect(() => {
    const loadMarkets = async () => {
      setLoading(true);
      try {
        const response = await fetchMarkets(1, 100, '');
        // ✅ read array of response.data.data
        const apiMarkets : MarketApiResponse[] = response?.data || []; 
        // use mapMarketFromApi for change
        const mappedMarkets: Market[] = apiMarkets.map(mapMarketFromApi);
        setMarkets(mappedMarkets);

        const respMap: Record<string, string | null> = {};
        mappedMarkets.forEach((m) => {
          respMap[m.id] = m.responsible_by ? String(m.responsible_by) : null;
        });
        setResponsibleByMarket(respMap);

        // Initialize membersMap (can be empty initially, loaded later or per market)
                const membersMap: Record<string, MarketMember[]> = {};
                mappedMarkets.forEach((m) => { membersMap[m.id] = []; }); // Init empty
                setMembersByMarket(membersMap);

      } catch (err) {
        console.error('Error loading markets:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMarkets();
  }, []);

  // --- Refresh markets function (useful after add/edit/delete) ---
     const refreshMarkets = async () => {
          setLoading(true); // Indicate loading during refresh
          try {
              const response = await fetchMarkets(1, 100, '');
              const apiMarkets: MarketApiResponse[] = response?.data || [];
              const mappedMarkets: Market[] = apiMarkets.map(mapMarketFromApi);
              setMarkets(mappedMarkets);
  
              // Re-populate the responsible map based on the refreshed market data
              const respMap: Record<string, string | null> = {};
              mappedMarkets.forEach((m) => {
                  respMap[m.id] = m.responsible_by ? String(m.responsible_by) : null;
              });
              setResponsibleByMarket(respMap);
  
              // Keep existing members data or re-initialize if needed
              const currentMembers = membersByMarket;
              const membersMap: Record<string, MarketMember[]> = {};
              mappedMarkets.forEach((m) => { membersMap[m.id] = currentMembers[m.id] || []; });
              setMembersByMarket(membersMap);
  
          } catch (err) {
              console.error('Error refreshing markets:', err);
          } finally {
              setLoading(false);
          }
      };


  // create market
  const addMarket: MarketCtx['addMarket'] = async (payload) => {
    try {
      await createMarket({
        Mname: payload.name,
        Address: Number(payload.village) || 0,
      });
      await refreshMarkets();
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
      const customers = res?.data || [];
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
      throw err;
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
      const customers = res?.data || [];
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
      const customers = res?.data || [];
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
      throw err;
    }
  };

  // read responsible
  const getResponsible: MarketCtx['getResponsible'] = (marketId) =>
    responsibleByMarket[marketId] ?? null;

  // set responsible
  const setResponsible: MarketCtx['setResponsible'] = async (marketId, newUserIdString) => {
    const marketIdNum = Number(marketId);
        const newUserIdNum = newUserIdString ? Number(newUserIdString) : null;
        const oldUserIdString = responsibleByMarket[marketId] ?? null;
        const oldUserIdNum = oldUserIdString ? Number(oldUserIdString) : null;
    
        console.log(`--- setResponsible called ---`);
        console.log(`Market ID: ${marketIdNum}`);
        console.log(`Old User ID (from state): ${oldUserIdNum}`);
        console.log(`New User ID (from dropdown): ${newUserIdNum}`);
    
        if (oldUserIdNum === newUserIdNum) {
          console.log("No change in responsible user.");
          return; // No change needed
        }
    
        // Optimistically update the UI state first
        setResponsibleByMarket((prevMap) => ({ ...prevMap, [marketId]: newUserIdString }));
        console.log(`Optimistically set responsible for ${marketId} to ${newUserIdString}`);
    
        try {
    
          // --- Call the single PUT API endpoint ---
          console.log(`Calling API to update assignment for Market ${marketIdNum} to User ${newUserIdNum}`);
          await updateMarketAssignment(marketIdNum, newUserIdNum); // Uses the PUT request
          // ----------------------------------------
    
          console.log(`Successfully updated assignment for market ${marketIdNum} via API.`);
          // Optional: show success toast
          showSuccess('Market assignment updated successfully!');
    } catch (err) {
      console.error('Failed to update market responsible:', err);
      // Rollback the UI state on error
            setResponsibleByMarket((prevMap) => ({ ...prevMap, [marketId]: oldUserIdString }));
            console.log(`Rolled back UI state for market ${marketId} to ${oldUserIdString}`);
      
            let errorMsg = 'Failed to update assignment.'; // Default message
        if (isAxiosError(err)) {
            // If it's an Axios error, we know 'err.response' might exist
            // Try to get message from response.data, then response.data itself, then err.message
            //errorMsg = err.response?.data?.message || err.response?.data || err.message || errorMsg;
            errorMsg = "Failed to update assignment."
        } else if (err instanceof Error) {
            // If it's a generic JavaScript Error, we know 'err.message' exists
            // errorMsg = err.message || errorMsg;
            errorMsg = "Failed to update assignment."
        }
      
            // Rollback the UI state on error
            setResponsibleByMarket((prevMap) => ({ ...prevMap, [marketId]: oldUserIdString }));
            console.log(`Rolled back UI state for market ${marketId} to ${oldUserIdString}`);
            showError(errorMsg);
            // Optional: Show error toast
            throw err; // Re-throw error
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
      loading,
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
    [markets, membersByMarket, responsibleByMarket, loading]
  );

  if (loading && markets.length === 0) {
    return <div>Loading markets...</div>;
  }

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
};

export function useMarkets(): MarketCtx {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error('useMarkets must be used within MarketProvider');
  return ctx;
}
