import { create } from "zustand";
import type { UserProfile } from "@/types/user";

type UserState = {
  profile: UserProfile | null;
  status: "loading" | "authenticated" | "anonymous";
};

type UserActions = {
  setProfile: (profile: UserProfile | null) => void;
  setStatus: (status: UserState["status"]) => void;
  reset: () => void;
};

const initialState: UserState = {
  profile: null,
  status: "loading",
};

export const useUserStore = create<UserState & UserActions>()((set) => ({
  ...initialState,
  setProfile: (profile) => set({ profile }),
  setStatus: (status) => set({ status }),
  reset: () => set(initialState),
}));
