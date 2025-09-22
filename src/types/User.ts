export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'user' | 'agent';
  market?: string;  // market ID if the user is an agent
  createdAt: string;
  lastActive: string;
  status: 'active' | 'inactive';
}

export interface UserActivity {
  id: string;
  userId: string;
  action: 'login' | 'logout' | 'transaction' | 'market_update' | 'user_update';
  details: string;
  timestamp: string;
}