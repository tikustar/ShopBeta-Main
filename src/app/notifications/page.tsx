import type { Metadata } from "next";
import {
  BellRing,
  CheckCheck,
  Package,
  Percent,
  Settings,
  Sparkles,
  Truck,
} from "lucide-react";
import { notifications, type Notification } from "@/lib/data";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { NoBellIllustration } from "@/components/ui/illustrations";

export const metadata: Metadata = {
  title: "Notifications",
};

const typeIcon = {
  Orders: Package,
  Shipping: Truck,
  Promotions: Sparkles,
  Offers: Percent,
} as const;

function NotificationRow({ item }: { item: Notification }) {
  const Icon = typeIcon[item.type];
  return (
    <li
      className={cn(
        "flex items-start gap-4 p-5 transition-colors",
        item.unread ? "bg-primary-50/40" : "bg-white hover:bg-soft/50",
      )}
    >
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
          item.unread ? "bg-primary text-white" : "bg-soft text-ink",
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              "text-[15px] tracking-[-0.01em]",
              item.unread ? "font-semibold text-ink" : "font-medium text-ink-soft",
            )}
          >
            {item.title}
          </p>
          {item.unread ? (
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
          ) : null}
        </div>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{item.body}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Badge tone="outline">{item.type}</Badge>
          <span className="text-[12px] text-muted">{item.time}</span>
          <button
            type="button"
            className="text-[13px] font-medium text-primary hover:underline"
          >
            {item.type === "Shipping" ? "Track order" : "View details"}
          </button>
        </div>
      </div>
    </li>
  );
}

function NotificationList({ type }: { type?: Notification["type"] }) {
  const list = type ? notifications.filter((item) => item.type === type) : notifications;

  if (!list.length) {
    return (
      <EmptyState
        illustration={<NoBellIllustration />}
        title="Nothing here yet"
        description="Updates about orders, delivery and offers will appear in this tab."
        compact
      />
    );
  }

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
      {list.map((item) => (
        <NotificationRow key={item.id} item={item} />
      ))}
    </ul>
  );
}

export default function NotificationsPage() {
  const unread = notifications.filter((item) => item.unread).length;

  return (
    <div className="sb-container">
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Notifications" }]}
        title="Notifications"
        description={`${unread} unread updates about your orders, deliveries and offers.`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <CheckCheck className="h-4 w-4" aria-hidden />
              Mark all read
            </Button>
            <ButtonLink href="/settings" variant="ghost" size="sm">
              <Settings className="h-4 w-4" aria-hidden />
              Preferences
            </ButtonLink>
          </div>
        }
      />

      <Tabs
        variant="pill"
        items={[
          {
            id: "all",
            label: "All",
            count: notifications.length,
            content: <NotificationList />,
          },
          {
            id: "orders",
            label: "Orders",
            count: notifications.filter((n) => n.type === "Orders").length,
            content: <NotificationList type="Orders" />,
          },
          {
            id: "shipping",
            label: "Shipping",
            count: notifications.filter((n) => n.type === "Shipping").length,
            content: <NotificationList type="Shipping" />,
          },
          {
            id: "promotions",
            label: "Promotions",
            count: notifications.filter((n) => n.type === "Promotions").length,
            content: <NotificationList type="Promotions" />,
          },
          {
            id: "offers",
            label: "Offers",
            count: notifications.filter((n) => n.type === "Offers").length,
            content: <NotificationList type="Offers" />,
          },
        ]}
      />

      <section className="pt-16 sm:pt-20">
        <h2 className="mb-4 text-[15px] font-semibold text-ink">
          Empty notifications state
        </h2>
        <EmptyState
          illustration={<NoBellIllustration />}
          title="You are all caught up"
          description="No new notifications. We will let you know as soon as something happens with an order."
          actions={
            <ButtonLink href="/products" variant="outline">
              <BellRing className="h-4 w-4" aria-hidden />
              Browse products
            </ButtonLink>
          }
        />
      </section>
    </div>
  );
}
