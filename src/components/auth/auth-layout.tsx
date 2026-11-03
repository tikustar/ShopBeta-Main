import { CreditCard, HeartHandshake, ShieldCheck, Truck } from "lucide-react";
import { BrandMark } from "@/components/layout/logo";
import { APP_DESCRIPTOR, APP_NAME, APP_TAGLINE } from "@/constants/app";

const benefits = [
  { icon: Truck, label: "Track every order from checkout to delivery" },
  { icon: HeartHandshake, label: "Save your wishlist and addresses" },
  { icon: CreditCard, label: "Card, transfer, USSD or pay on delivery" },
  { icon: ShieldCheck, label: "Secure checkout and buyer protection" },
];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sb-container py-10 sm:py-14">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-line bg-white sb-shadow-soft lg:grid-cols-[1fr_1.05fr]">
        <aside className="relative hidden overflow-hidden bg-primary p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <span
            className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
            aria-hidden
          />
          <div className="relative">
            <div className="flex items-center gap-3">
              <BrandMark tone="light" className="h-12 w-12" />
              <span className="leading-none">
                <span className="block text-xl font-extrabold uppercase tracking-[0.03em]">
                  {APP_NAME}
                </span>
                <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
                  {APP_DESCRIPTOR}
                </span>
              </span>
            </div>
            <p className="mt-10 text-[28px] font-bold leading-tight tracking-[-0.02em]">
              {APP_TAGLINE}
            </p>
          </div>
          <ul className="relative mt-10 space-y-4">
            {benefits.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-[14px] text-white/85">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-accent">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </aside>
        <div className="flex items-center justify-center p-4 sm:p-8 lg:p-10 [&>*]:border-0 [&>*]:shadow-none">
          {children}
        </div>
      </div>
    </div>
  );
}
