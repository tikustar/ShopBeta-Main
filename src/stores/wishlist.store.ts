import { create } from "zustand";
import type { WishlistItem } from "@/types/commerce";

type WishlistState = {
  items: WishlistItem[];
  hydrated: boolean;
};

type WishlistActions = {
  setItems: (items: WishlistItem[]) => void;
  setHydrated: (hydrated: boolean) => void;
  reset: () => void;
};

const initialState: WishlistState = {
  items: [],
  hydrated: false,
};

export const useWishlistStore = create<WishlistState & WishlistActions>()(
  (set) => ({
    ...initialState,
    setItems: (items) => set({ items }),
    setHydrated: (hydrated) => set({ hydrated }),
    reset: () => set(initialState),
  }),
);
