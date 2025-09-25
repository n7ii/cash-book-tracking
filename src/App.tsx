// src/App.tsx
import React, { useState } from 'react';

import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionHistory from './components/TransactionHistory';
import Reports from './components/Reports';
import Reconciliation from './components/Reconciliation';


import Markets from './components/Markets';
import MarketDetail from './components/MarketDetail';

import { TransactionProvider } from './contexts/TransactionContext';
import { MarketProvider } from './contexts/MarketContext';

import ManageUsers from './components/ManageUsers';
import { UsersProvider } from './contexts/UsersContext';

import UserActivity from './components/UsersActivity';
import ActivityDetail from './components/ActivityDetail';

import AppHeader from "./components/AppHeader";
import type { ViewKey } from './types/navigation';

type TxType = 'income' | 'expense' | 'transfer';

function App() {
  const [currentView, setCurrentView] = useState<ViewKey>('dashboard');

  const [presetTxType, setPresetTxType] = useState<TxType | null>(null);

  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);

   const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  const handleQuickAdd = (type: TxType) => {
    setPresetTxType(type);
    setCurrentView('add-transaction');
  };

  const handleViewChange = (view: ViewKey) => {
  setPresetTxType(null);
  if (view !== 'market-detail') setSelectedMarketId(null);
  setCurrentView(view);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onQuickAdd={handleQuickAdd} />;

      case 'add-transaction':
        return (
          <TransactionForm
            defaultType={presetTxType}
            onAfterSubmit={() => {
              setPresetTxType(null);
              setCurrentView('dashboard');
            }}
          />
        );

      case 'history':
        return <TransactionHistory />;

      case 'reports':
        return <Reports />;

      case 'reconciliation':
        return <Reconciliation />;

      case 'markets':
        return (
          <Markets
            onOpenDetail={(id) => {
              setSelectedMarketId(id);
              setCurrentView('market-detail');
            }}
          />
        );

      case 'market-detail':
        return selectedMarketId ? (
          <MarketDetail
            marketId={selectedMarketId}
            onBack={() => setCurrentView('markets')}
          />
        ) : (
          <Markets
            onOpenDetail={(id) => {
              setSelectedMarketId(id);
              setCurrentView('market-detail');
            }}
          />
        );
        case 'manage-users':
  return <ManageUsers />;
  
  case 'activity-detail':
        return selectedActivityId ? (
          <ActivityDetail
            txId={selectedActivityId}
            onBack={() => {
              setSelectedActivityId(null);
              setCurrentView('user-activity');
            }}
          />
        ) : (
          <UserActivity
            onOpenDetail={(id) => {
              setSelectedActivityId(id);
              setCurrentView('activity-detail');
            }}
          />
        );
        case 'user-activity':
        return (
          <UserActivity
            onOpenDetail={(id) => {
              setSelectedActivityId(id);
              setCurrentView('activity-detail');
            }}
          />
        );
      default:
        return <Dashboard onQuickAdd={handleQuickAdd} />;
    }
  };

  return (
    <TransactionProvider>
      <MarketProvider>
        <UsersProvider>
        <div className="min-h-screen bg-gray-50">
          <AppHeader currentView={currentView} onNavigate={handleViewChange} />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderContent()}
          </main>
        </div>
        </UsersProvider>
      </MarketProvider>
    </TransactionProvider>
  );
}

export default App;
