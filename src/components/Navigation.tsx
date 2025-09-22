import React from 'react';
import {
  Home,
  Plus,
  History,
  BarChart3,
  Scale,
  DollarSign,
  Store, 
  Users,
  ListChecks,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const { t } = useTranslation();

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: Home },
    { id: 'add-transaction', label: t('addTransaction'), icon: Plus },
    { id: 'history', label: t('history'), icon: History },
    { id: 'reports', label: t('reports'), icon: BarChart3 },
    { id: 'reconciliation', label: t('reconcile'), icon: Scale },
    { id: 'markets', label: t('markets.title'), icon: Store }, 
  { id: 'manage-users', label: t('manageUsers') || 'Manage Users', icon: Users },
  { id: 'user-activity', label: 'User Activity', icon: ListChecks },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">{t('financialTracker')}</h1>
            </div>
          </div>

          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                currentView === item.id ||
                (item.id === 'markets' && currentView === 'market-detail');

              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Mobile menu */}
          <div className="md:hidden">
            <select
              value={currentView === 'market-detail' ? 'markets' : currentView}
              onChange={(e) => onViewChange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {navItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
