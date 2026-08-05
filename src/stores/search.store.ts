import { create } from "zustand";

type SearchFilters = {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: "relevance" | "price-asc" | "price-desc" | "rating" | "newest";
};

type SearchState = {
  term: string;
  filters: SearchFilters;
  recent: string[];
};

type SearchActions = {
  setTerm: (term: string) => void;
  setFilters: (filters: SearchFilters) => void;
  setRecent: (recent: string[]) => void;
  reset: () => void;
};

const initialState: SearchState = {
  term: "",
  filters: {},
  recent: [],
};

export const useSearchStore = create<SearchState & SearchActions>()((set) => ({
  ...initialState,
  setTerm: (term) => set({ term }),
  setFilters: (filters) => set({ filters }),
  setRecent: (recent) => set({ recent }),
  reset: () => set(initialState),
}));
