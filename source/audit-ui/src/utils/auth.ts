export interface User {
  id: number;
  username: string;
  role: 'viewer' | 'analyst' | 'admin';
}

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
};

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const setAuth = (token: string, user: User): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const logout = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.clear();
  window.location.href = '/login';
};

export const hasRole = (requiredRole: 'viewer' | 'analyst' | 'admin'): boolean => {
  const user = getUser();
  if (!user) return false;
  
  const roleHierarchy = { viewer: 1, analyst: 2, admin: 3 };
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
};

