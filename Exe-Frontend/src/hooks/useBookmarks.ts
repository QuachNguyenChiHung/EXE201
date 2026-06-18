import { useState, useEffect } from 'react';
import { renterService } from '../services/renterService';
import { useApp } from '../context/AppContext';

let globalBookmarkedIds: number[] = [];
let isInitialized = false;
let isLoading = false;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach(l => l());

export const initBookmarks = async () => {
    if (isInitialized || isLoading) return;
    try {
        isLoading = true;
        const warehouses = await renterService.getMyBookmarks();
        globalBookmarkedIds = warehouses.map(w => w.id_warehouse);
        isInitialized = true;
    } catch (error) {
        console.error("Failed to load bookmarks", error);
    } finally {
        isLoading = false;
        notify();
    }
};

export const clearBookmarksState = () => {
    globalBookmarkedIds = [];
    isInitialized = false;
    notify();
};

export function useBookmarks() {
    const [bookmarkedIds, setBookmarkedIds] = useState<number[]>(globalBookmarkedIds);
    const { isAuthenticated, user } = useApp();

    useEffect(() => {
        // Clear state if logged out
        if (!isAuthenticated) {
            clearBookmarksState();
            return;
        }

        // Initialize only if authenticated as RENTER
        if (!isInitialized && user?.role === 'RENTER') {
            initBookmarks();
        }

        const listener = () => setBookmarkedIds([...globalBookmarkedIds]);
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }, [isAuthenticated, user?.role]);

    const toggleBookmark = async (warehouseId: number) => {
        if (!isAuthenticated || user?.role !== 'RENTER') {
            throw new Error('AUTH_REQUIRED');
        }

        const isBookmarked = globalBookmarkedIds.includes(warehouseId);
        
        // Optimistic update
        if (isBookmarked) {
            globalBookmarkedIds = globalBookmarkedIds.filter(id => id !== warehouseId);
        } else {
            globalBookmarkedIds = [...globalBookmarkedIds, warehouseId];
        }
        notify();

        try {
            await renterService.toggleBookmark(warehouseId);
        } catch (error) {
            // Revert on failure
            if (isBookmarked) {
                globalBookmarkedIds = [...globalBookmarkedIds, warehouseId];
            } else {
                globalBookmarkedIds = globalBookmarkedIds.filter(id => id !== warehouseId);
            }
            notify();
            throw error;
        }
    };

    return { bookmarkedIds, toggleBookmark };
}
