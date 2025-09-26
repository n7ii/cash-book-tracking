import {
  Home, PlusCircle, History, BarChart2, Scale, Store, Users, Activity
} from 'lucide-react';
import type { ViewKey } from '../types/Navigation';

export default function AppHeader({
  currentView,
  onNavigate,
}: {
  currentView: ViewKey;
  onNavigate: (key: ViewKey) => void;
}) {
  const activeKey: ViewKey =
    currentView === 'market-detail' ? 'markets' :
    currentView === 'activity-detail' ? 'user-activity' :
    currentView;

  const NAVS: { key: ViewKey; label: string; icon: React.ElementType }[] = [
    { key: 'dashboard',       label: 'ຕິດຕາມລາຍຮັບ-ຈ່າຍ', icon: Home },
    { key: 'add-transaction', label: 'ເພີ່ມທຸລະກຳ',               icon: PlusCircle },
    { key: 'history',         label: 'ປະຫວັດ',               icon: History },
    { key: 'reports',         label: 'ລາຍງານ',               icon: BarChart2 },
    { key: 'reconciliation',  label: 'ການປຽບທຽບ',               icon: Scale },
    { key: 'markets',         label: 'ຕະຫຼາດ',               icon: Store },
    { key: 'manage-users',    label: 'ຈັດການຜູ້ໃຊ້',                icon: Users },
    { key: 'user-activity',   label: 'ກິດຈະກຳຂອງຜູ້ໃຊ້',             icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="h-14 md:h-16 flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">$</span>
            <div className="text-base md:text-lg font-semibold leading-none tracking-tight truncate">
              ລະບົບຕິດຕາມລາຍຮັບ-ຈ່າຍ
            </div>
          </div>

          <nav className="hidden md:flex ml-auto overflow-x-auto whitespace-nowrap">
            <ul className="flex items-center gap-1">
              {NAVS.map(({ key, label, icon: Icon }) => {
                const active = activeKey === key;
                return (
                  <li key={key}>
                    <button
                      onClick={() => onNavigate(key)}
                      className={[
                        'group inline-flex items-center gap-2 px-3 py-2 rounded-lg',
                        'text-sm leading-none whitespace-nowrap truncate',
                        active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100',
                      ].join(' ')}
                      title={label}
                      aria-label={label}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="max-w-[12rem] truncate">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* mobile*/}
        <nav className="md:hidden -mb-2 pb-2 overflow-x-auto">
          <ul className="flex items-center justify-between gap-2">
            {NAVS.map(({ key, label, icon: Icon }) => {
              const active = activeKey === key;
              return (
                <li key={key}>
                  <button
                    onClick={() => onNavigate(key)}
                    className={[
                      'w-12 h-12 flex flex-col items-center justify-center rounded-lg',
                      active ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800',
                    ].join(' ')}
                    aria-label={label}
                    title={label}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="sr-only">{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
