import { create } from "zustand";

interface UIState {
	isMobileMenuOpen: boolean;
	isLoading: boolean;
	error: string | null;
	hasData: boolean;
	toggleMobileMenu: () => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	setHasData: (hasData: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
	isMobileMenuOpen: false,
	isLoading: false,
	error: null,
	hasData: false,
	toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
	setLoading: (loading) => set({ isLoading: loading }),
	setError: (error) => set({ error }),
	setHasData: (hasData) => set({ hasData }),
}));
