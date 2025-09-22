import { Market } from '../types/Market';
import { Transaction } from '../types/Transaction';
export type DateRangeKey = '7d' | '30d' | '90d';
export type DateRange = { start: string; end: string };

export function toRange(key: DateRangeKey): DateRange {
  const end = new Date();
  const start = new Date();
  const days = key === '7d' ? 7 : key === '30d' ? 30 : 90;
  start.setDate(start.getDate() - days);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}


function inRange(dateStr: string, range?: DateRange) {
  if (!range) return true;
  return dateStr >= range.start && dateStr <= range.end;
}


function normName(s?: string) {
  return (s ?? '').trim().toLowerCase();
}

export function filterTxByMarket(
  market: Market,
  txs: Transaction[],
  range?: DateRange
): Transaction[] {
  const nameSet = new Set<string>(
    [market.agentName, ...market.members].map(normName).filter(Boolean)
  );

  return txs.filter((t) => {
    if (!inRange(t.date, range)) return false;
    if (t.marketId) return t.marketId === market.id;
    const who = normName((t as any).partyInvolved); 
    return nameSet.has(who);
  });
}

export type MarketSummary = {
  disbursed: number;              
  repaid: number;                 
  outstanding: number;            
  count: number;                  
  recent: Transaction[];          
};

export function summarizeMarket(
  market: Market,
  txs: Transaction[],
  range?: DateRange
): MarketSummary {
  const list = filterTxByMarket(market, txs, range).slice();

  list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  let disbursed = 0;
  let repaid = 0;

  for (const t of list) {
    if (t.type === 'income') repaid += t.amount;
    else if (t.type === 'expense') disbursed += t.amount;
  }

  const outstanding = Math.max(0, disbursed - repaid);

  return {
    disbursed: round2(disbursed),
    repaid: round2(repaid),
    outstanding: round2(outstanding),
    count: list.length,
    recent: list.slice(0, 5),
  };
}

export function dailySeries(
  market: Market,
  txs: Transaction[],
  range: DateRange
): Array<{ date: string; income: number; expense: number; net: number }> {
  const list = filterTxByMarket(market, txs, range);
  const bucket = new Map<string, { income: number; expense: number }>();

  for (const t of list) {
    const b = bucket.get(t.date) ?? { income: 0, expense: 0 };
    if (t.type === 'income') b.income += t.amount;
    else if (t.type === 'expense') b.expense += t.amount;
    bucket.set(t.date, b);
  }

  const dates = Array.from(bucket.keys()).sort();
  return dates.map((d) => {
    const b = bucket.get(d)!;
    const net = b.income - b.expense;
    return { date: d, income: round2(b.income), expense: round2(b.expense), net: round2(net) };
  });
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
