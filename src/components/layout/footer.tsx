import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { categories } from "@/lib/data";
import { Logo } from "@/components/layout/logo";
import {
  FacebookMark,
  InstagramMark,
  LinkedinMark,
  XMark,
  YoutubeMark,
} from "@/components/layout/social-icons";

const columns = [
  {
    title: "Company",
    links: [
      { label: "About ShopBeta", href: "/help" },
      { label: "Careers", href: "/help" },
      { label: "Press", href: "/help" },
      { label: "Contact", href: "/help" },
      { label: "Sustainability", href: "/help" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Help centre", href: "/help" },
      { label: "FAQ", href: "/help" },
      { label: "Track order", href: "/track-order" },
      { label: "Returns", href: "/help" },
      { label: "Refund policy", href: "/help" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/help" },
      { label: "Terms of service", href: "/help" },
      { label: "Cookie policy", href: "/help" },
      { label: "Warranty", href: "/help" },
      { label: "Accessibility", href: "/help" },
    ],
  },
];

const socials = [
  { label: "X", icon: XMark },
  { label: "Instagram", icon: InstagramMark },
  { label: "Facebook", icon: FacebookMark },
  { label: "YouTube", icon: YoutubeMark },
  { label: "LinkedIn", icon: LinkedinMark },
];

const payments = ["Visa", "Mastercard", "Amex", "PayPal", "Apple Pay", "Google Pay"];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-white">
      <div className="sb-container py-14">
        <div className="mb-12 flex flex-col gap-6 rounded-3xl border border-line bg-soft/60 p-7 sm:p-9 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-lg">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink sm:text-2xl">
              Get early access to drops and deals
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              One email a week with new arrivals, price drops and member-only offers. No noise.
            </p>
          </div>
          <form className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="you@example.com"
              className="h-12 flex-1 rounded-full border border-line bg-white px-5 text-sm text-ink outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary-100"
            />
            <button
              type="button"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-600"
            >
              Subscribe
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </form>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-muted">
              A premium marketplace for computers, electronics and everything that plugs in.
              Authorised stock, two-year cover, next-day delivery.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {socials.map(({ label, icon: Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink-soft transition-all duration-200 hover:border-primary-200 hover:text-primary"
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.1em] text-ink">
              Shop
            </h3>
            <ul className="space-y-3">
              {categories.slice(0, 5).map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="text-[14px] text-muted transition-colors hover:text-primary"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.1em] text-ink">
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[14px] text-muted transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-line">
        <div className="sb-container flex flex-col items-center justify-between gap-5 py-6 sm:flex-row">
          <p className="text-[13px] text-muted">
            © 2026 ShopBeta Technologies. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {payments.map((payment) => (
              <span
                key={payment}
                className="rounded-md border border-line px-2.5 py-1.5 text-[11px] font-medium text-muted"
              >
                {payment}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
