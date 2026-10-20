export type UserRole = 'distributor' | 'user';

export interface UserAccount {
  id: string;
  username: string; // e.g. "user1" or "karimi"
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  assignedImeis: string[]; // only these devices are visible to this user
  companyName?: string;
  createdAt: string;
}

export interface AuthSession {
  user: UserAccount;
  loginMethod: 'account' | 'imei';
  loginImei?: string; // if logged in via direct IMEI
  token: string;
}
