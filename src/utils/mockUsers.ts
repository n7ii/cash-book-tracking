// src/utils/mockUsers.ts
export type Role = 'admin' | 'collector';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
  phone?: string;
  email?: string;
  username: string;
  password?: string;
  address?: string;
  createdAt: string;
  updatedAt?: string;
}

export const MOCK_USERS: User[] = [
  {
    id: 'u001',
    firstName: 'Somchit',
    lastName: 'Viengsay',
    role: 'admin',
    phone: '02012345678',
    email: 'somchit@example.com',
    username: 'somchit',
    password: 'demo1234', 
    address: 'Ban X, Chanthabouly, Vientiane',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'u002',
    firstName: 'Nita',
    lastName: 'Chansamone',
    role: 'collector',
    phone: '02098765432',
    email: 'nita@example.com',
    username: 'nita',
    password: 'demo1234', 
    address: 'Ban Y, Sikhottabong, Vientiane',
    createdAt: new Date().toISOString(),
  },
];
