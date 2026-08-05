import type { Metadata } from "next";
import Link from "next/link";
import {
  Camera,
  CreditCard,
  Heart,
  LogOut,
  MapPin,
  Package,
  Pencil,
  Plus,
  Settings,
  Star,
} from "lucide-react";
import {
  addresses,
  orders,
  paymentMethods,
  recentlyViewedSlugs,
  resolve,
  user,
  wishlistSlugs,
} from "@/lib/data";
import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/field";
import { OrderCard } from "@/components/commerce/order-card";
import { ProductCard } from "@/components/commerce/product-card";

export const metadata: Metadata = {
  title: "Your profile",
};

const stats = [
  { label: "Orders placed", value: user.orders, icon: Package },
  { label: "Wishlist items", value: user.wishlist, icon: Heart },
  { label: "Reviews written", value: user.reviews, icon: Star },
];

export default function ProfilePage() {
  const wishlist = resolve(wishlistSlugs).slice(0, 4);
  const recentlyViewed = resolve(recentlyViewedSlugs);

  return (
    <div className="sb-container">
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Profile" }]}
        title="Your profile"
        description="Manage your details, addresses, payment methods and order history."
        action={
          <div className="flex items-center gap-2">
            <ButtonLink href="/settings" variant="outline" size="sm">
              <Settings className="h-4 w-4" aria-hidden />
              Settings
            </ButtonLink>
            <Button variant="danger" size="sm">
              <LogOut className="h-4 w-4" aria-hidden />
              Log out
            </Button>
          </div>
        }
      />

      {/* Profile header */}
      <Card className="overflow-hidden" padded={false}>
        <div className="h-28 bg-soft sm:h-32" aria-hidden />
        <div className="flex flex-col gap-5 px-5 pb-6 sm:flex-row sm:items-end sm:px-6">
          <div className="relative -mt-12 shrink-0 sm:-mt-14">
            <span className="grid h-24 w-24 place-items-center rounded-full border-4 border-white bg-ink text-2xl font-semibold text-white sm:h-28 sm:w-28">
              {user.initials}
            </span>
            <button
              type="button"
              aria-label="Change profile picture"
              className="absolute bottom-1 right-1 grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-ink transition-colors hover:bg-soft"
            >
              <Camera className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink">
                {user.name}
              </h2>
              <Badge tone="primary">{user.tier}</Badge>
            </div>
            <p className="mt-1 text-[14px] text-muted">
              {user.email} · {user.joined}
            </p>
            <p className="mt-1 text-[13px] text-muted">
              {user.points.toLocaleString()} points — worth $
              {(user.points / 100).toFixed(2)} off your next order
            </p>
          </div>
          <Button variant="outline" size="sm" className="sm:mb-1">
            <Pencil className="h-4 w-4" aria-hidden />
            Edit profile
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-muted">{label}</p>
              <Icon className="h-[18px] w-[18px] text-primary" aria-hidden />
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-ink">
              {value}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Personal information */}
        <Card>
          <CardHeader
            title="Personal information"
            description="Used for delivery updates and invoices."
            action={
              <Button variant="ghost" size="sm">
                Save changes
              </Button>
            }
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="p-first">First name</Label>
              <Input id="p-first" defaultValue="Amara" />
            </div>
            <div>
              <Label htmlFor="p-last">Last name</Label>
              <Input id="p-last" defaultValue="Bello" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="p-email">Email</Label>
              <Input id="p-email" type="email" defaultValue={user.email} />
            </div>
            <div>
              <Label htmlFor="p-phone">Phone</Label>
              <Input id="p-phone" type="tel" defaultValue={user.phone} />
            </div>
            <div>
              <Label htmlFor="p-dob">Date of birth</Label>
              <Input id="p-dob" type="date" defaultValue="1994-05-18" />
            </div>
          </div>
        </Card>

        {/* Addresses */}
        <Card>
          <CardHeader
            title="Saved addresses"
            description="Choose a default for faster checkout."
            action={
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" aria-hidden />
                Add
              </Button>
            }
          />
          <ul className="mt-5 space-y-3">
            {addresses.map((address) => (
              <li
                key={address.id}
                className="flex items-start gap-3 rounded-xl border border-line p-4"
              >
                <MapPin className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{address.label}</p>
                    {address.isDefault ? <Badge tone="neutral">Default</Badge> : null}
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                    {address.name} · {address.line}, {address.city}
                  </p>
                  <p className="mt-1 text-[13px] text-muted">{address.phone}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    className="text-[13px] font-medium text-primary hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-[13px] text-muted hover:text-primary"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Payment methods */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Payment methods"
            description="Cards are tokenised — full numbers are never stored."
            action={
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" aria-hidden />
                Add card
              </Button>
            }
          />
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {paymentMethods.map((method) => (
              <li
                key={method.id}
                className="flex items-center gap-4 rounded-xl border border-line p-4"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-soft">
                  <CreditCard className="h-5 w-5 text-ink" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">
                      {method.brand} •••• {method.last4}
                    </p>
                    {method.isDefault ? <Badge tone="neutral">Default</Badge> : null}
                  </div>
                  <p className="mt-1 text-[13px] text-muted">Expires {method.expiry}</p>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-[13px] text-muted hover:text-primary"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Order history */}
      <section className="pt-16 sm:pt-20">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-[-0.025em] text-ink">
            Recent orders
          </h2>
          <ButtonLink href="/orders" variant="outline" size="sm">
            All orders
          </ButtonLink>
        </div>
        <div className="space-y-4">
          {orders.slice(0, 2).map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </section>

      {/* Wishlist */}
      <section className="pt-16 sm:pt-20">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-[-0.025em] text-ink">
            Your wishlist
          </h2>
          <Link
            href="/wishlist"
            className="text-[13px] font-medium text-primary hover:underline"
          >
            View all {user.wishlist} items
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Recently viewed */}
      <section className="pt-16 sm:pt-20">
        <h2 className="mb-6 text-2xl font-semibold tracking-[-0.025em] text-ink">
          Recently viewed
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {recentlyViewed.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
