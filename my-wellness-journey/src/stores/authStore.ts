import { create } from "zustand";
import { User } from "../types/user";

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	loading: boolean;
	error: string | null;
	login: (user: User) => void;
	logout: () => void;
	setError: (error: string | null) => void;
	setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	isAuthenticated: false,
	loading: false,
	error: null,
	login: (user) => set({ user, isAuthenticated: true }),
	logout: () => set({ user: null, isAuthenticated: false }),
	setError: (error) => set({ error }),
	setLoading: (loading) => set({ loading }),
}));
