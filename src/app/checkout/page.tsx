import type { Metadata } from "next";
import { Check, CreditCard, Lock, Truck } from "lucide-react";
import { addresses, cartLines, resolve } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Input, Label, Radio, Select, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { OrderSummary } from "@/components/commerce/order-summary";
import { ProductMedia } from "@/components/commerce/product-media";
import { PlaceOrder } from "@/components/commerce/place-order";

export const metadata: Metadata = {
  title: "Checkout",
};

const steps = [
  { label: "Cart", state: "done" },
  { label: "Shipping", state: "current" },
  { label: "Payment", state: "upcoming" },
  { label: "Review", state: "upcoming" },
] as const;

export default function CheckoutPage() {
  const lines = cartLines.map(({ slug, qty }) => ({
    product: resolve([slug])[0],
    qty,
  }));
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);

  return (
    <div className="sb-container">
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Cart", href: "/cart" },
          { label: "Checkout" },
        ]}
        title="Checkout"
        description="Three steps, no account required. Your details are encrypted in transit."
      />

      {/* Step indicator */}
      <ol className="mb-8 flex items-center gap-2 overflow-x-auto no-scrollbar sm:gap-4">
        {steps.map((step, index) => (
          <li key={step.label} className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2.5">
              <span
                className={
                  step.state === "done"
                    ? "grid h-8 w-8 place-items-center rounded-full bg-primary text-white"
                    : step.state === "current"
                      ? "grid h-8 w-8 place-items-center rounded-full border-2 border-primary bg-white text-[13px] font-semibold text-primary"
                      : "grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-[13px] font-medium text-muted"
                }
              >
                {step.state === "done" ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={
                  step.state === "upcoming"
                    ? "text-[13px] text-muted"
                    : "text-[13px] font-medium text-ink"
                }
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <span className="h-px w-8 bg-line sm:w-16" aria-hidden />
            ) : null}
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
        <div className="space-y-6">
          {/* Shipping address */}
          <Card>
            <h2 className="text-[15px] font-semibold text-ink">Shipping address</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {addresses.map((address) => (
                <Radio
                  key={address.id}
                  name="address"
                  defaultChecked={address.isDefault}
                  label={
                    <span className="flex items-center gap-2">
                      {address.label}
                      {address.isDefault ? <Badge tone="neutral">Default</Badge> : null}
                    </span>
                  }
                  description={`${address.name} · ${address.line}, ${address.city} · ${address.phone}`}
                />
              ))}
            </div>

            <div className="mt-6 border-t border-line pt-6">
              <p className="mb-4 text-[13px] font-medium text-ink">Or enter a new address</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="first-name">First name</Label>
                  <Input id="first-name" placeholder="Amara" />
                </div>
                <div>
                  <Label htmlFor="last-name">Last name</Label>
                  <Input id="last-name" placeholder="Bello" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" placeholder="+234 801 234 5678" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="street">Street address</Label>
                  <Input id="street" placeholder="18 Adeola Odeku Street" />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="Lagos" />
                </div>
                <div>
                  <Label htmlFor="postcode">Postal code</Label>
                  <Input id="postcode" placeholder="101241" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="country">Country</Label>
                  <Select id="country" defaultValue="Nigeria">
                    <option>Nigeria</option>
                    <option>Ghana</option>
                    <option>Kenya</option>
                    <option>United Kingdom</option>
                    <option>United States</option>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          {/* Delivery information */}
          <Card>
            <h2 className="text-[15px] font-semibold text-ink">Delivery information</h2>
            <div className="mt-5">
              <Label htmlFor="instructions" hint="Optional">
                Delivery instructions
              </Label>
              <Textarea
                id="instructions"
                placeholder="Gate code, floor, or where to leave the parcel if you are out."
              />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="window">Preferred window</Label>
                <Select id="window">
                  <option>Any time (09:00 – 18:00)</option>
                  <option>Morning (09:00 – 12:00)</option>
                  <option>Afternoon (12:00 – 15:00)</option>
                  <option>Evening (15:00 – 18:00)</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="recipient">Who is receiving?</Label>
                <Select id="recipient">
                  <option>Me</option>
                  <option>A colleague</option>
                  <option>Building concierge</option>
                </Select>
              </div>
            </div>
          </Card>

          {/* Shipping method */}
          <Card>
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <Truck className="h-[18px] w-[18px] text-primary" aria-hidden />
              Shipping method
            </h2>
            <div className="mt-5 space-y-3">
              <Radio
                name="shipping"
                defaultChecked
                label="Express — free (arrives tomorrow, 7 August)"
                description="Dispatched today from the Lagos fulfilment centre"
              />
              <Radio
                name="shipping"
                label="Standard — free (2–4 working days)"
                description="Tracked, signature on delivery"
              />
              <Radio
                name="shipping"
                label={`Scheduled 2-hour window — ${formatPrice(9)}`}
                description="Pick an exact slot on a date that suits you"
              />
              <Radio
                name="shipping"
                label="Store pickup — free (ready in 2 hours)"
                description="Victoria Island, Ikeja, Lekki or Yaba"
              />
            </div>
          </Card>

          {/* Payment */}
          <Card>
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <CreditCard className="h-[18px] w-[18px] text-primary" aria-hidden />
              Payment method
            </h2>
            <p className="mt-1 text-[13px] text-muted">
              Interface only — no payment processing is wired up in this design.
            </p>
            <div className="mt-5 space-y-3">
              <Radio
                name="payment"
                defaultChecked
                label="Card ending 4242 (Visa)"
                description="Expires 08/29 · Amara Bello"
              />
              <Radio name="payment" label="New debit or credit card" />
              <Radio name="payment" label="Pay in 3 — 0% interest" description={`3 × ${formatPrice(Math.round(subtotal / 3))}`} />
              <Radio name="payment" label="Bank transfer" description="Order ships once funds clear" />
              <Radio name="payment" label="ShopBeta wallet" description={`Balance ${formatPrice(24)}`} />
            </div>

            <div className="mt-6 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="card-number">Card number</Label>
                <Input id="card-number" placeholder="4242 4242 4242 4242" inputMode="numeric" />
              </div>
              <div>
                <Label htmlFor="expiry">Expiry</Label>
                <Input id="expiry" placeholder="MM / YY" inputMode="numeric" />
              </div>
              <div>
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" placeholder="123" inputMode="numeric" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="card-name">Name on card</Label>
                <Input id="card-name" placeholder="Amara Bello" />
              </div>
            </div>

            <p className="mt-5 flex items-center gap-2 text-[12px] text-muted">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Card details are never stored on ShopBeta servers.
            </p>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <Card padded={false}>
            <div className="border-b border-line px-5 py-4">
              <h2 className="text-[15px] font-semibold text-ink">
                Products purchased ({lines.length})
              </h2>
            </div>
            <ul className="divide-y divide-line px-5">
              {lines.map(({ product, qty }) => (
                <li key={product.id} className="flex items-center gap-3 py-4">
                  <ProductMedia
                    icon={product.icon}
                    tone={product.tone}
                    name={product.name}
                    className="h-14 w-14 shrink-0"
                    iconClassName="h-2/5 w-2/5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {product.name}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted">Qty {qty}</p>
                  </div>
                  <p className="shrink-0 text-[13px] font-semibold text-ink">
                    {formatPrice(product.price * qty)}
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <OrderSummary subtotal={subtotal} withCoupon footer={<PlaceOrder />} />
        </div>
      </div>
    </div>
  );
}
