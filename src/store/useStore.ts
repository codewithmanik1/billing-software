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

export const useStore = create<AuthState>((set) => ({
  isAuthenticated: !!sessionStorage.getItem('mj_token'),
  user: null, // We'll fetch user details via /api/auth/me if needed, or set during login
  
  login: (token, user) => {
    sessionStorage.setItem('mj_token', token);
    set({ isAuthenticated: true, user });
  },
  
  logout: () => {
    sessionStorage.removeItem('mj_token');
    set({ isAuthenticated: false, user: null });
  },
}));
