import type { Metadata } from "next";
import { Download, Search } from "lucide-react";
import { orders } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { Tabs } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { EmptyBoxIllustration } from "@/components/ui/illustrations";
import { OrderCard } from "@/components/commerce/order-card";

export const metadata: Metadata = {
  title: "Order history",
};

function OrderList({ status }: { status?: string }) {
  const list = status ? orders.filter((order) => order.status === status) : orders;

  if (!list.length) {
    return (
      <EmptyState
        illustration={<EmptyBoxIllustration />}
        title={`No ${status?.toLowerCase()} orders`}
        description="When an order reaches this stage it will appear here with tracking and invoice options."
        compact
      />
    );
  }

  return (
    <div className="space-y-4">
      {list.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

export default function OrderHistoryPage() {
  const invoiceRows = orders.map((order) => [
    <span key="id" className="font-medium text-ink">
      {order.id}
    </span>,
    order.placedOn,
    <Badge
      key="status"
      tone={
        order.status === "Completed"
          ? "success"
          : order.status === "Pending"
            ? "warning"
            : order.status === "Shipped"
              ? "info"
              : "neutral"
      }
    >
      {order.status}
    </Badge>,
    `${order.items.length} item${order.items.length > 1 ? "s" : ""}`,
    <span key="total" className="font-semibold text-ink">
      {formatPrice(order.total)}
    </span>,
    <button
      key="invoice"
      type="button"
      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
    >
      <Download className="h-4 w-4" aria-hidden />
      Invoice
    </button>,
  ]);

  return (
    <div className="sb-container">
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Profile", href: "/profile" },
          { label: "Order history" },
        ]}
        title="Order history"
        description="Every order you have placed, with invoices, tracking and one-tap reordering."
        action={
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </Button>
        }
      />

      <Card className="mb-8">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Search by order number or product"
              aria-label="Search orders"
              icon={<Search className="h-[18px] w-[18px]" />}
            />
          </div>
          <Button size="lg" variant="outline" className="sm:w-auto">
            Last 12 months
          </Button>
        </div>
      </Card>

      <Tabs
        variant="pill"
        items={[
          { id: "all", label: "All", count: orders.length, content: <OrderList /> },
          {
            id: "completed",
            label: "Completed",
            count: orders.filter((o) => o.status === "Completed").length,
            content: <OrderList status="Completed" />,
          },
          {
            id: "pending",
            label: "Pending",
            count: orders.filter((o) => o.status === "Pending").length,
            content: <OrderList status="Pending" />,
          },
          {
            id: "cancelled",
            label: "Cancelled",
            count: orders.filter((o) => o.status === "Cancelled").length,
            content: <OrderList status="Cancelled" />,
          },
          {
            id: "returned",
            label: "Returned",
            count: orders.filter((o) => o.status === "Returned").length,
            content: <OrderList status="Returned" />,
          },
        ]}
      />

      <section className="pt-16 sm:pt-20">
        <h2 className="mb-6 text-2xl font-semibold tracking-[-0.025em] text-ink">
          Invoices
        </h2>
        <DataTable
          caption="All invoices from the last 12 months"
          columns={["Order", "Date", "Status", "Items", "Total", "Invoice"]}
          rows={invoiceRows}
        />
      </section>
    </div>
  );
}
