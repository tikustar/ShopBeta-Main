import { create } from "zustand";
import type { CartItem } from "@/types/commerce";

type CartState = {
  items: CartItem[];
  hydrated: boolean;
};

type CartActions = {
  setItems: (items: CartItem[]) => void;
  setHydrated: (hydrated: boolean) => void;
  reset: () => void;
};

const initialState: CartState = {
  items: [],
  hydrated: false,
};

export const useCartStore = create<CartState & CartActions>()((set) => ({
  ...initialState,
  setItems: (items) => set({ items }),
  setHydrated: (hydrated) => set({ hydrated }),
  reset: () => set(initialState),
}));
