import { create } from 'zustand'
import { User } from '@supabase/supabase-js'

interface UserState {
  user: User | null;
  role: 'user' | 'admin' | null;
  setUser: (user: User | null, role: 'user' | 'admin' | null) => void;
  clearUser: () => void;
}

// Global user state to store active session natively on the client
export const useUserStore = create<UserState>((set) => ({
  user: null,
  role: null,
  setUser: (user, role) => set({ user, role }),
  clearUser: () => set({ user: null, role: null }),
}))
