"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AdminEmpty,
  AdminPageHeader,
  AdminTable,
} from "@/components/admin/admin-ui";
import { RequireAdmin } from "@/components/auth/require-admin";
import { Input, Label, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/constants/app";
import {
  listOrdersAdmin,
  setOrderTrackingAdmin,
  updateOrderPaymentStatusAdmin,
  updateOrderStatusAdmin,
} from "@/services/admin-orders.service";
import { useUserStore } from "@/stores/user.store";
import { toastSuccess } from "@/stores/toast.store";
import { formatPrice } from "@/lib/utils";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";

function OrdersInner() {
  const searchParams = useSearchParams();
  const authUser = useUserStore((s) => s.authUser);
  const profile = useUserStore((s) => s.profile);
  const actor = {
    id: authUser?.uid ?? "",
    email: profile?.email ?? authUser?.email ?? undefined,
  };
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [tracking, setTracking] = useState("");

  const reload = () => listOrdersAdmin().then(setOrders).catch(() => undefined);
  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id || !orders.length) return;
    const found = orders.find((o) => o.id === id);
    if (found) {
      setSelected(found);
      setTracking(found.trackingNumber ?? "");
    }
  }, [orders, searchParams]);

  const filtered = useMemo(() => {
    let next = orders;
    const q = query.trim().toLowerCase();
    if (q) {
      next = next.filter((o) =>
        [o.orderNumber, o.id, o.customer?.name, o.customer?.email, o.userId]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    if (statusFilter !== "all") {
      next = next.filter(
        (o) => (o.orderStatus ?? o.status) === statusFilter,
      );
    }
    return next;
  }, [orders, query, statusFilter]);

  return (
    <RequireAdmin permission="orders:read">
      <AdminPageHeader
        title="Orders"
        description="Search, filter and update fulfilment and payment status. Refunds are prepared for Paystack Admin later."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Search orders…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {ORDER_STATUS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {!filtered.length ? (
          <AdminEmpty title="No orders found" />
        ) : (
          <AdminTable
            headers={["Order", "Customer", "Total", "Payment", "Status"]}
          >
            {filtered.map((order) => (
              <tr
                key={order.id}
                className="cursor-pointer text-[13px] hover:bg-soft/60"
                onClick={() => {
                  setSelected(order);
                  setTracking(order.trackingNumber ?? "");
                }}
              >
                <td className="px-4 py-3 font-medium text-ink">
                  {order.orderNumber ?? order.id}
                </td>
                <td className="px-4 py-3 text-muted">
                  {order.customer?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {formatPrice(Number(order.total ?? 0))}
                </td>
                <td className="px-4 py-3 capitalize text-muted">
                  {order.paymentStatus ?? "pending"}
                </td>
                <td className="px-4 py-3 capitalize text-muted">
                  {order.orderStatus ?? order.status ?? "pending"}
                </td>
              </tr>
            ))}
          </AdminTable>
        )}

        <div className="rounded-2xl border border-line bg-white p-4">
          {!selected ? (
            <p className="text-sm text-muted">Select an order to manage.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                  Order
                </p>
                <h2 className="text-lg font-semibold text-ink">
                  {selected.orderNumber ?? selected.id}
                </h2>
                <p className="text-[13px] text-muted">
                  {selected.customer?.name} · {selected.customer?.email}
                </p>
                <p className="mt-1 text-[13px] text-muted">
                  Method: {selected.paymentMethod ?? "—"} · Ref:{" "}
                  {selected.paymentReference ?? "—"}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => window.print()}
                >
                  Print invoice
                </Button>
              </div>

              <div>
                <Label htmlFor="orderStatus">Order status</Label>
                <Select
                  id="orderStatus"
                  value={selected.orderStatus ?? selected.status ?? "pending"}
                  onChange={(e) => {
                    const value = e.target.value as OrderStatus;
                    void updateOrderStatusAdmin(selected.id, value, actor).then(
                      () => {
                        toastSuccess("Order status updated");
                        return reload().then(() =>
                          setSelected((s) =>
                            s ? { ...s, orderStatus: value, status: value } : s,
                          ),
                        );
                      },
                    );
                  }}
                >
                  {ORDER_STATUS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="payStatus">Payment status</Label>
                <Select
                  id="payStatus"
                  value={selected.paymentStatus ?? "pending"}
                  onChange={(e) => {
                    const value = e.target.value as PaymentStatus;
                    void updateOrderPaymentStatusAdmin(
                      selected.id,
                      value,
                      actor,
                    ).then(() => {
                      toastSuccess("Payment status updated");
                      return reload().then(() =>
                        setSelected((s) =>
                          s ? { ...s, paymentStatus: value } : s,
                        ),
                      );
                    });
                  }}
                >
                  {PAYMENT_STATUS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
                <p className="mt-1 text-[11px] text-muted">
                  Do not mark paid unless Paystack verification succeeded.
                </p>
              </div>

              <div>
                <Label htmlFor="tracking">Tracking number</Label>
                <div className="flex gap-2">
                  <Input
                    id="tracking"
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                  />
                  <Button
                    type="button"
                    onClick={() =>
                      void setOrderTrackingAdmin(
                        selected.id,
                        tracking.trim(),
                        actor,
                      ).then(() => toastSuccess("Tracking updated"))
                    }
                  >
                    Save
                  </Button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[13px] font-medium text-ink">Timeline</p>
                <ul className="space-y-2 text-[12px] text-muted">
                  {(selected.timeline ?? []).map((entry, index) => (
                    <li key={`${entry.event}-${index}`}>
                      <span className="font-medium text-ink">{entry.label}</span>
                      {entry.description ? ` — ${entry.description}` : ""}
                    </li>
                  ))}
                  {!selected.timeline?.length ? (
                    <li>No timeline entries yet.</li>
                  ) : null}
                </ul>
              </div>

              <div>
                <p className="mb-2 text-[13px] font-medium text-ink">Items</p>
                <ul className="space-y-1 text-[13px] text-muted">
                  {(selected.products ?? selected.items ?? []).map((line) => (
                    <li key={`${line.productId}-${line.variation ?? ""}`}>
                      {line.name} × {line.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </RequireAdmin>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <OrdersInner />
    </Suspense>
  );
}
