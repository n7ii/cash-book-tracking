// src/App.tsx
import React, { useState } from 'react';
import {Toaster} from 'react-hot-toast';

import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionHistory from './components/TransactionHistory';
import TransactionDetail from './components/transactionDetail';
import Reports from './components/Reports';
import Reconciliation from './components/Reconciliation';
import Markets from './components/Markets';
import MarketDetail from './components/MarketDetail';
import ManageUsers from './components/ManageUsers';
import UserActivity from './components/UsersActivity';
import ActivityDetail from './components/ActivityDetail';
import LoanDetail from './components/LoanDetail';
import AppHeader from "./components/AppHeader";
import LoginForm from './components/LoginForm';

import { NotificationProvider } from './contexts/NotificationContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { MarketProvider } from './contexts/MarketContext';

import type { ViewKey } from './types/navigation';

type TxType = 'income' | 'expense' | 'transfer';

function App() {
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('authToken'));   //Login
  const [userRole, setUserRole] = useState<number>(parseInt(sessionStorage.getItem('userRole') || '0', 10));
  const [currentView, setCurrentView] = useState<ViewKey>('dashboard');
  const [previousView, setPreviousView] = useState<ViewKey>('dashboard');

  const [presetTxType, setPresetTxType] = useState<TxType | null>(null);
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
   const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
   const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
   const [selectedTransaction, setSelectedTransaction] = useState<{ id: string; type: string } | null>(null);
   const [presetMarketId, setPresetMarketId] = useState<string | null>(null);
   const [presetMemberId, setPresetMemberId] = useState<string | null>(null);

   const handleOpenDetailFromHistory = (id: string, type: string) => {
    setSelectedTransaction({ id, type });
    setSelectedActivityId(null);
    setPreviousView(currentView);
    setCurrentView('transaction-detail');
  };

  const handleOpenDetailFromUserActivity = (id: string, type: string) => {
    if (type === 'income') {
      setSelectedActivityId(id);       // Set state for ActivityDetail
      setSelectedTransaction(null);    // Clear other state
      setPreviousView(currentView);
      setCurrentView('activity-detail'); // Set view to ActivityDetail
      console.log("Current view should be activity-detail");
    } else if (type === 'expense') {
      setSelectedTransaction({ id, type }); // Set state for TransactionDetail
      setSelectedActivityId(null);          // Clear other state
      setPreviousView(currentView);
      setCurrentView('transaction-detail');  // Set view to TransactionDetail
    }
    // Loan clicks are handled by handleOpenLoanDetail
  };

   const handleLoginSuccess = (newToken: string) => {   //Login
    // --- UPDATE THIS PART ---
    const roleId = parseInt(sessionStorage.getItem('userRole') || '0', 10);
    setToken(newToken);   //Login
    setCurrentView('dashboard');   //Login
   };   //Login
   if (!token){   //Login
    return <LoginForm onLoginSuccess = {handleLoginSuccess}/>;   //Login
   }   //login

   // Correct handler for Loan details
   const handleOpenLoanDetail = (id: string) => {
    setSelectedLoanId(id);
    setPreviousView(currentView);
    setCurrentView('loan-detail'); // This is a new view name
  };

  const handleQuickAdd = (type: TxType) => {
    setPresetTxType(type);
    setPreviousView(currentView);
    setCurrentView('add-transaction');
  };

  const handleViewChange = (view: ViewKey) => {
  setPresetTxType(null);
  if (view !== 'market-detail') setSelectedMarketId(null);
  // Reset selections when changing main view
  if (view !== 'loan-detail') setSelectedLoanId(null);
  if (view !== 'transaction-detail') setSelectedTransaction(null);
  if (view !== 'activity-detail') setSelectedActivityId(null); // Keep activity ID reset for consistency
  setPreviousView(currentView);
  setCurrentView(view);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
const handleViewAll = () => {
  setPresetTxType(null);
  setPreviousView(currentView);      
  setCurrentView('history');  
};

  const renderContent = () => {

    // --- Define Admin-only views again (or import from a shared file) ---
    const ADMIN_ONLY_VIEWS: ViewKey[] = [
      'reports',
      'reconciliation',
      'manage-users',
      'user-activity'
    ];
    // -------------------------------------------------------------------

    // --- Check if the current view requires admin access ---
    const requiresAdmin = ADMIN_ONLY_VIEWS.includes(currentView);
    // -------------------------------------------------------

    // --- If it requires admin AND the user is NOT an admin, redirect ---
    if (requiresAdmin && userRole !== 1) {
      console.warn(`Access denied: User (Role: ${userRole}) tried to access admin view: ${currentView}`);
      // You could show an "Access Denied" component, but redirecting to dashboard is common
      return <Dashboard onQuickAdd={handleQuickAdd} onViewAll={handleViewAll} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard onQuickAdd={handleQuickAdd}
        onViewAll={handleViewAll}
         />;

      case 'add-transaction':
        return (
          <TransactionForm
            defaultType={presetTxType?? 'income'}
            defaultCategory={'ທຶນ'}             
            defaultMarketId={presetMarketId ?? ''} 
            defaultMemberId={presetMemberId ?? ''}  
            onAfterSubmit={() => {
              setPresetTxType(null);
              setPresetMarketId(null);              // <— reset
        setPresetMemberId(null); 
              setCurrentView('dashboard');
            }}
          />
        );

      case 'history':
        return <TransactionHistory 
        onOpenDetail={handleOpenDetailFromHistory}
        />;

      case 'reports':
        return <Reports />;

      case 'reconciliation':
        return <Reconciliation />;

      case 'markets':
        return (
          <Markets
            onOpenDetail={(id) => {
              setSelectedMarketId(id);
              setPreviousView(currentView);
              setCurrentView('market-detail');
            }}
          />
        );

      case 'market-detail':
        return selectedMarketId ? (
          <MarketDetail
            marketId={selectedMarketId}
            onBack={() => setCurrentView(previousView)}
            onStartLoan={(memberId) => {           
              setPresetTxType('expense');          
              setPresetMarketId(selectedMarketId); 
              setPresetMemberId(memberId);         
              setCurrentView('add-transaction');   
      }}
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
  
  // Renders the specific detail page for Income/Expense
      case 'transaction-detail':
        return selectedTransaction ? (
          <TransactionDetail
            transactionId={parseInt(selectedTransaction.id)}
            transactionType={selectedTransaction.type}
            onBack={() => {
              setSelectedTransaction(null);
              setCurrentView(previousView);
            }}
          />
        ) : (
          // Fallback should ideally navigate back or show the history list too
           <TransactionHistory // Consider showing history as fallback
            onOpenDetail={handleOpenDetailFromHistory}
           />
        );

      // Renders the specific detail page for Loans
      case 'loan-detail':
        return selectedLoanId ? (
          <LoanDetail
            loanId={selectedLoanId}
            onBack={() => {
              setSelectedLoanId(null);
              setCurrentView(previousView);
            }}
          />
        ) : (
          <UserActivity
            onOpenDetail={handleOpenDetailFromUserActivity} // Use the correct handler
            onOpenLoanDetail={handleOpenLoanDetail}
          />
        );
      // Renders the list from UserActivity
      case 'user-activity':
        return (
          <UserActivity
            onOpenDetail={handleOpenDetailFromUserActivity} // Use the correct handler
            onOpenLoanDetail={handleOpenLoanDetail}
          />
        );
        case 'activity-detail':
        return selectedActivityId ? (
          <ActivityDetail
            txId={selectedActivityId}
            onBack={() => {
              setSelectedActivityId(null);
              setCurrentView(previousView);
            }}
          />
        ) : (
          // Fallback in case the ID is missing
          <UserActivity
            onOpenDetail={handleOpenDetailFromUserActivity}
            onOpenLoanDetail={handleOpenLoanDetail}
          />
        );

      default:
        return <Dashboard onQuickAdd={handleQuickAdd} onViewAll={handleViewAll} />;
    }
  };

  return (
    <NotificationProvider>
    <TransactionProvider>
      <MarketProvider>
        <div className="min-h-screen bg-gray-50">
        <AppHeader currentView={currentView} onNavigate={handleViewChange} userRole={userRole} />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderContent()}
          </main>
        </div>
      <Toaster position = "top-center" reverseOrder = {false}/>
      </MarketProvider>
    </TransactionProvider>
    </NotificationProvider>
  );
}

export default App;
