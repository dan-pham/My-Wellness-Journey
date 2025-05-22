import { create } from "zustand";
import { persist, StateStorage, PersistStorage, StorageValue } from "zustand/middleware";
import { useAuthStore } from "./authStore";

// Interface for a resource in history
export interface ResourceHistoryItem {
	id: string;
	title: string;
	description: string;
	imageUrl: string;
	sourceUrl: string;
	viewedAt: string; // ISO date string
}

interface ResourceHistoryState {
	history: ResourceHistoryItem[];
	addToHistory: (resource: Omit<ResourceHistoryItem, "viewedAt">) => void;
	clearHistory: () => void;
}

type StoreType = ReturnType<typeof createStore>;

// Add a constant for history expiration (e.g., 30 days)
const HISTORY_EXPIRATION_DAYS = 30;

// Add a type for the persisted data structure
interface PersistedHistoryData {
	state: StorageValue<ResourceHistoryState>;
	timestamp: number;
}

// Create storage object with expiration check
const createStorage = (): PersistStorage<ResourceHistoryState> => ({
	getItem: (name) => {
		const value = localStorage.getItem(name);
		if (!value) return null;

		try {
			const data: PersistedHistoryData = JSON.parse(value);
			
			// Check if data has expired
			const now = Date.now();
			const expirationTime = data.timestamp + (HISTORY_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
			
			if (now > expirationTime) {
				localStorage.removeItem(name);
				return null;
			}
			
			return data.state as StorageValue<ResourceHistoryState>;
		} catch {
			// If data is in old format or invalid, remove it
			localStorage.removeItem(name);
			return null;
		}
	},
	setItem: (name, value: StorageValue<ResourceHistoryState>) => {
		const data: PersistedHistoryData = {
			state: value,
			timestamp: Date.now()
		};
		localStorage.setItem(name, JSON.stringify(data));
	},
	removeItem: (name) => {
		localStorage.removeItem(name);
	}
});

// Function to clean up expired histories
const cleanupExpiredHistories = () => {
	const now = Date.now();
	Object.keys(localStorage).forEach(key => {
		if (key.endsWith('-resource-history')) {
			const value = localStorage.getItem(key);
			if (value) {
				try {
					const data: PersistedHistoryData = JSON.parse(value);
					const expirationTime = data.timestamp + (HISTORY_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
					if (now > expirationTime) {
						localStorage.removeItem(key);
					}
				} catch {
					// Remove invalid data
					localStorage.removeItem(key);
				}
			}
		}
	});
};

// Create separate stores for each user
const createStore = (userId: string) => {
	return create<ResourceHistoryState>()(
		persist(
			(set, get) => ({
				history: [],
				addToHistory: (resource) => {
					// Get current user ID from auth store
					const userId = useAuthStore.getState().user?.id;

					// If no user is logged in, don't store the history
					if (!userId) {
						return;
					}

					const { history } = get();
					const historyItem: ResourceHistoryItem = {
						...resource,
						viewedAt: new Date().toISOString(),
					};
					const filteredHistory = history.filter((item) => item.id !== resource.id);
					set({
						history: [historyItem, ...filteredHistory].slice(0, 10),
					});
				},
				clearHistory: () => {
					set({ history: [] });
					// Also clear from localStorage
					const userId = useAuthStore.getState().user?.id || 'anonymous';
					localStorage.removeItem(`${userId}-resource-history`);
				},
			}),
			{
				name: `${userId}-resource-history`,
				storage: createStorage(),
			}
		)
	);
};

// Store instances cache
const stores: { [key: string]: StoreType } = {};

// Main store hook with proper typing
type ResourceHistoryStore = {
	(): ResourceHistoryState;
	getState: () => ResourceHistoryState;
	cleanup: () => void;
	persist: {
		getOptions: () => {
			name: string;
			storage: PersistStorage<ResourceHistoryState>;
		};
		clearStorage: () => void;
	};
};

export const useResourceHistoryStore = Object.assign(
	() => {
		const userId = useAuthStore.getState().user?.id || 'anonymous';
		
		// Create new store instance if it doesn't exist
		if (!stores[userId]) {
			stores[userId] = createStore(userId);
			cleanupExpiredHistories();
		}
		
		return stores[userId]();
	},
	{
		getState: () => {
			const userId = useAuthStore.getState().user?.id || 'anonymous';
			if (!stores[userId]) {
				stores[userId] = createStore(userId);
			}
			return stores[userId].getState();
		},
		cleanup: () => {
			// Clear all stores from memory
			Object.keys(stores).forEach(key => delete stores[key]);
			
			// Clear all resource history from localStorage
			Object.keys(localStorage).forEach(key => {
				if (key.endsWith('-resource-history')) {
					localStorage.removeItem(key);
				}
			});

			// Recreate store for current user if logged in
			const userId = useAuthStore.getState().user?.id;
			if (userId) {
				stores[userId] = createStore(userId);
			}
		},
		persist: {
			getOptions: () => {
				const userId = useAuthStore.getState().user?.id || 'anonymous';
				return {
					name: `${userId}-resource-history`,
					storage: createStorage(),
				};
			},
			clearStorage: () => {
				Object.keys(localStorage).forEach(key => {
					if (key.endsWith('-resource-history')) {
						localStorage.removeItem(key);
					}
				});
			}
		}
	}
) as ResourceHistoryStore;
