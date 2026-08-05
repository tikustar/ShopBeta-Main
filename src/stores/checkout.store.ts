import { create } from "zustand";
import type { PaymentMethod } from "@/types/order";
import type { Address } from "@/types/user";

type CheckoutStep = "address" | "shipping" | "payment" | "review";

type CheckoutState = {
  step: CheckoutStep;
  shippingAddress: Address | null;
  paymentMethod: PaymentMethod | null;
  submitting: boolean;
};

type CheckoutActions = {
  setStep: (step: CheckoutStep) => void;
  setShippingAddress: (address: Address | null) => void;
  setPaymentMethod: (method: PaymentMethod | null) => void;
  setSubmitting: (submitting: boolean) => void;
  reset: () => void;
};

const initialState: CheckoutState = {
  step: "address",
  shippingAddress: null,
  paymentMethod: null,
  submitting: false,
};

export const useCheckoutStore = create<CheckoutState & CheckoutActions>()(
  (set) => ({
    ...initialState,
    setStep: (step) => set({ step }),
    setShippingAddress: (shippingAddress) => set({ shippingAddress }),
    setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
    setSubmitting: (submitting) => set({ submitting }),
    reset: () => set(initialState),
  }),
);
