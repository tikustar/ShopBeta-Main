"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, CreditCard, Truck } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { APP_NAME, APP_TAGLINE } from "@/constants/app";
import {
  FacebookMark,
  InstagramMark,
  LinkedinMark,
  XMark,
  YoutubeMark,
} from "@/components/layout/social-icons";
import { useCatalogNav } from "@/providers/catalog-nav-provider";

const columns = [
  {
    title: "Company",
    links: [
      { label: "About Zenvexa", href: "/help" },
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


const payments = ["Visa", "Mastercard", "Verve", "Bank transfer", "USSD", "Pay on delivery"];

const assurances = [
  { icon: Truck, title: "Express delivery", body: "1–2 days across Lagos & Abuja" },
  { icon: CreditCard, title: "Flexible payment", body: "Card, transfer, USSD or on delivery" },
  { icon: BadgeCheck, title: "Buyer protection", body: "Genuine products, easy returns" },
];

export function Footer() {
  const { categories } = useCatalogNav();
  return (
    <footer className="mt-20 bg-primary-800 text-white">
      <div className="border-b border-white/10">
        <div className="sb-container grid gap-4 py-6 sm:grid-cols-3">
          {assurances.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-primary-800">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block text-[13px] text-white/65">{body}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="sb-container py-14">
        <div className="mb-12 flex flex-col gap-6 rounded-3xl bg-white/[0.06] p-7 ring-1 ring-white/10 sm:p-9 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-lg">
            <h2 className="text-xl font-semibold tracking-[-0.02em] sm:text-2xl">
              Get the best <span className="text-accent">Awoof deals</span> first
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-white/70">
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
              className="h-12 w-full rounded-full border border-white/15 sm:w-auto sm:flex-1 bg-white px-5 text-sm text-ink outline-none transition-colors placeholder:text-muted-foreground focus:border-accent focus:ring-4 focus:ring-accent/30"
            />
            <button
              type="button"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-primary-800 transition-colors hover:bg-accent-300"
            >
              Subscribe
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </form>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo tone="light" />
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-white/70">
              {APP_TAGLINE} Electronics, gadgets, fashion and home essentials from trusted brands.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {socials.map(({ label, icon: Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/80 transition-all duration-200 hover:border-accent hover:bg-accent hover:text-primary-800"
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.1em] text-accent">
              Shop
            </h3>
            <ul className="space-y-3">
              {categories.slice(0, 5).map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="text-[14px] text-white/70 transition-colors hover:text-white"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.1em] text-accent">
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[14px] text-white/70 transition-colors hover:text-white"
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

      <div className="border-t border-white/10 bg-primary-900">
        <div className="sb-container flex flex-col items-center justify-between gap-5 py-6 sm:flex-row">
          <p className="text-[13px] text-white/60">
            © {new Date().getFullYear()} {APP_NAME} — Commerce Hug. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {payments.map((payment) => (
              <span
                key={payment}
                className="rounded-md border border-white/15 px-2.5 py-1.5 text-[11px] font-medium text-white/70"
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