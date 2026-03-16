import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const getStoredUser = (): User | null => {
  try {
    const stored = sessionStorage.getItem('mj_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const useStore = create<AuthState>((set) => ({
  isAuthenticated: !!sessionStorage.getItem('mj_token'),
  user: getStoredUser(),

  login: (token, user) => {
    sessionStorage.setItem('mj_token', token);
    sessionStorage.setItem('mj_user', JSON.stringify(user));
    set({ isAuthenticated: true, user });
  },

  logout: () => {
    sessionStorage.removeItem('mj_token');
    sessionStorage.removeItem('mj_user');
    set({ isAuthenticated: false, user: null });
  },
}));
