"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader, StatCard, AdminTable } from "@/components/admin/admin-ui";
import { ButtonLink } from "@/components/ui/button";
import {
  getAdminDashboardStats,
  type DashboardStats,
} from "@/services/admin-stats.service";
import { formatPrice } from "@/lib/utils";

function formatOrderDate(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  const minutesStr = minutes.toString().padStart(2, '0');
  
  return `${month} ${day}, ${year} • ${hours12}:${minutesStr} ${ampm}`;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getAdminDashboardStats()
      .then(setStats)
      .catch(() => setError("Could not load dashboard statistics."));
  }, []);

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Live store overview from Firestore."
        actions={
          <>
            <ButtonLink href="/admin/products" size="sm" variant="outline">
              Products
            </ButtonLink>
            <ButtonLink href="/admin/orders" size="sm">
              Orders
            </ButtonLink>
          </>
        }
      />

      {error ? (
        <p className="text-sm text-primary" role="alert">
          {error}
        </p>
      ) : null}

      {!stats ? (
        <p className="text-sm text-muted">Loading statistics…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard 
              label="Total revenue" 
              value={stats.totalRevenueLabel} 
              secondaryValue={stats.todayRevenueLabel}
            />
            <StatCard 
              label="Orders today" 
              value={stats.ordersToday} 
              secondaryValue={`+${stats.todayPaidOrders}`}
            />
            <StatCard label="Orders this month" value={stats.ordersThisMonth} />
            <StatCard label="Pending orders" value={stats.pendingOrders} />
            <StatCard 
              label="Paid orders" 
              value={stats.paidOrders} 
              secondaryValue={`+${stats.todayPaidOrders}`}
            />
            <StatCard label="Cancelled" value={stats.cancelledOrders} />
            <StatCard
              label="Total Ads Expenses"
              value={stats.totalAdsExpensesLabel}
              secondaryValue={`Revenue After Ads: ${stats.revenueAfterAdsLabel}`}
            />
            <StatCard 
              label="Products" 
              value={stats.products} 
              secondaryValue={`-${stats.archivedProducts} (archived)`}
            />
            <StatCard label="Categories" value={stats.categories} />
            <StatCard label="Brands" value={stats.brands} />
            <StatCard label="Customers" value={stats.customers} />
            <StatCard label="Coupons" value={stats.coupons} />
            <StatCard label="Notifications" value={stats.notifications} />
            <StatCard
              label="Low stock"
              value={stats.lowStock}
              hint="At or below threshold"
            />
            <StatCard label="Out of stock" value={stats.outOfStock} />
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <div>
              <h2 className="mb-3 text-sm font-semibold text-ink">
                Recent orders
              </h2>
              <AdminTable headers={["Order", "Customer", "Total", "Status", "Date"]}>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="text-[13px]">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders?id=${order.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {order.orderNumber ?? order.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {order.customer?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {formatPrice(Number(order.total ?? 0))}
                    </td>
                    <td className="px-4 py-3 capitalize text-muted">
                      {order.orderStatus ?? order.status ?? "pending"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {order.createdAt ? (
                        order.createdAt instanceof Date ? (
                          formatOrderDate(order.createdAt)
                        ) : typeof order.createdAt === 'object' && 'toDate' in order.createdAt ? (
                          formatOrderDate((order.createdAt as { toDate: () => Date }).toDate())
                        ) : (
                          "—"
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </AdminTable>
            </div>
            <div>
              <h2 className="mb-3 text-sm font-semibold text-ink">
                Low stock products
              </h2>
              <AdminTable headers={["Product", "Stock", "SKU"]}>
                {stats.lowStockProducts.map((product) => (
                  <tr key={product.id} className="text-[13px]">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products?edit=${product.id}`}
                        className="font-medium text-ink hover:text-primary"
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-primary">{product.stock}</td>
                    <td className="px-4 py-3 text-muted">
                      {product.sku ?? "—"}
                    </td>
                  </tr>
                ))}
              </AdminTable>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
