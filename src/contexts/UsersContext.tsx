import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, MOCK_USERS } from '../utils/mockUsers';

type UsersCtx = {
  users: User[];
  addUser: (u: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateUser: (id: string, patch: Partial<User>) => void;
  removeUser: (id: string) => void;
};

const UsersContext = createContext<UsersCtx | null>(null);

const LS_KEY = 'users';

function load(): User[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return MOCK_USERS;
}

export const UsersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(load());

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(users));
  }, [users]);

  const addUser: UsersCtx['addUser'] = (u) => {
    setUsers(prev => {
      const id = `u${String(prev.length + 1).padStart(3, '0')}`;
      const now = new Date().toISOString();
      return [{ ...u, id, createdAt: now }, ...prev];
    });
  };

  const updateUser: UsersCtx['updateUser'] = (id, patch) => {
    setUsers(prev => prev.map(x => x.id === id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x));
  };

  const removeUser: UsersCtx['removeUser'] = (id) => {
    setUsers(prev => prev.filter(x => x.id !== id));
  };

  const value = useMemo(() => ({ users, addUser, updateUser, removeUser }), [users]);

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
};

export function useUsers(): UsersCtx {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error('useUsers must be used within UsersProvider');
  return ctx;
}
