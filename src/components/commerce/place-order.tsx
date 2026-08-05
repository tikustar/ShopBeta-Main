"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { SuccessIllustration } from "@/components/ui/illustrations";
import { Modal, ModalShell } from "@/components/ui/modal";

export function PlaceOrder() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-primary px-7 text-[15px] font-medium text-white shadow-[0_8px_20px_-10px_rgba(253,70,70,0.85)] transition-all duration-200 ease-premium hover:bg-primary-600 active:scale-[0.985]"
      >
        <Lock className="h-4 w-4" aria-hidden />
        Place order
      </button>
      <p className="mt-4 text-center text-[12px] leading-relaxed text-muted">
        By placing this order you agree to the ShopBeta terms of service and returns
        policy.
      </p>

      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalShell
          title="Order placed"
          description="A confirmation email is on its way to amara.bello@example.com."
          onClose={() => setOpen(false)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-white px-5 text-sm font-medium text-ink transition-colors hover:bg-soft"
              >
                Keep shopping
              </button>
              <Link
                href="/order-success"
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
              >
                View order
              </Link>
            </>
          }
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-40">
              <SuccessIllustration />
            </div>
            <p className="mt-4 text-[15px] font-semibold text-ink">Order SB-72905</p>
            <p className="mt-1 text-[13px] text-muted">
              Estimated delivery: Thursday, 7 August
            </p>
          </div>
        </ModalShell>
      </Modal>
    </>
  );
}
