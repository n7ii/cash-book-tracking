import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionHistory from './components/TransactionHistory';
import Reports from './components/Reports';
import Reconciliation from './components/Reconciliation';
import Navigation from './components/Navigation';
import { Transaction } from './types/Transaction';
import { TransactionProvider } from './contexts/TransactionContext';

function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'add-transaction':
        return <TransactionForm />;
      case 'history':
        return <TransactionHistory />;
      case 'reports':
        return <Reports />;
      case 'reconciliation':
        return <Reconciliation />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <TransactionProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation currentView={currentView} onViewChange={setCurrentView} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </main>
      </div>
    </TransactionProvider>
  );
}

export default App;