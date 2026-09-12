import { LOW_STOCK_THRESHOLD } from "@/constants/app";
import { formatPrice } from "@/lib/utils";
import { listAllProductsAdmin } from "@/services/admin-products.service";
import { listCategoriesAdmin, listBrandsAdmin } from "@/services/admin-catalog.service";
import { listOrdersAdmin } from "@/services/admin-orders.service";
import { listCustomersAdmin } from "@/services/admin-customers.service";
import { listCouponsAdmin } from "@/services/admin-coupons.service";
import { listAllNotificationsAdmin } from "@/services/admin-notifications.service";
import { listAdsAdmin, calculateTotalAdsExpenses } from "@/services/admin-ads.service";
import type { Order } from "@/types/order";
import type { Product } from "@/types/product";

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function orderTime(order: Order) {
  const createdAt = order.createdAt;
  if (createdAt instanceof Date) return createdAt.getTime();
  if (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt) {
    return (createdAt as { toDate: () => Date }).toDate().getTime();
  }
  if (typeof createdAt === 'string' || typeof createdAt === 'number') {
    const date = new Date(createdAt);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  }
  return 0;
}

function isPaid(order: Order) {
  return order.paymentStatus === "paid";
}

export type DashboardStats = {
  totalRevenue: number;
  totalRevenueLabel: string;
  ordersToday: number;
  ordersThisMonth: number;
  pendingOrders: number;
  paidOrders: number;
  cancelledOrders: number;
  products: number;
  categories: number;
  brands: number;
  customers: number;
  coupons: number;
  notifications: number;
  lowStock: number;
  outOfStock: number;
  recentOrders: Order[];
  lowStockProducts: Product[];
  // New secondary values
  todayRevenue: number;
  todayRevenueLabel: string;
  todayPaidOrders: number;
  archivedProducts: number;
  totalAdsExpenses: number;
  totalAdsExpensesLabel: string;
  revenueAfterAds: number;
  revenueAfterAdsLabel: string;
};

export async function getAdminDashboardStats(): Promise<DashboardStats> {
  const [
    products,
    categories,
    brands,
    orders,
    customers,
    coupons,
    notifications,
    ads,
  ] = await Promise.all([
    listAllProductsAdmin(),
    listCategoriesAdmin(),
    listBrandsAdmin(),
    listOrdersAdmin(),
    listCustomersAdmin(),
    listCouponsAdmin(),
    listAllNotificationsAdmin(),
    listAdsAdmin(),
  ]);

  const today = startOfDay().getTime();
  const month = startOfMonth().getTime();

  const paid = orders.filter(isPaid);
  const totalRevenue = paid.reduce(
    (sum, order) => sum + Number(order.total ?? 0),
    0,
  );

  const lowStockProducts = products.filter(
    (p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD && p.active !== false,
  );

  // Calculate today's metrics
  const todayOrders = orders.filter((o) => orderTime(o) >= today);
  const todayPaidOrders = todayOrders.filter(isPaid);
  const todayRevenue = todayPaidOrders.reduce(
    (sum, order) => sum + Number(order.total ?? 0),
    0,
  );
  const archivedProducts = products.filter((p) => p.active === false);
  const totalAdsExpenses = calculateTotalAdsExpenses(ads);
  const revenueAfterAds = totalRevenue - totalAdsExpenses;

  return {
    totalRevenue,
    totalRevenueLabel: formatPrice(totalRevenue),
    ordersToday: todayOrders.length,
    ordersThisMonth: orders.filter((o) => orderTime(o) >= month).length,
    pendingOrders: orders.filter(
      (o) => (o.orderStatus ?? o.status) === "pending",
    ).length,
    paidOrders: paid.length,
    cancelledOrders: orders.filter(
      (o) => (o.orderStatus ?? o.status) === "cancelled",
    ).length,
    products: products.length,
    categories: categories.length,
    brands: brands.length,
    customers: customers.length,
    coupons: coupons.length,
    notifications: notifications.length,
    lowStock: lowStockProducts.length,
    outOfStock: products.filter((p) => p.stock <= 0).length,
    recentOrders: [...orders].sort((a, b) => orderTime(b) - orderTime(a)).slice(0, 8),
    lowStockProducts: lowStockProducts.slice(0, 8),
    // New secondary values
    todayRevenue,
    todayRevenueLabel: `+${formatPrice(todayRevenue)} today`,
    todayPaidOrders: todayPaidOrders.length,
    archivedProducts: archivedProducts.length,
    totalAdsExpenses,
    totalAdsExpensesLabel: formatPrice(totalAdsExpenses),
    revenueAfterAds,
    revenueAfterAdsLabel: formatPrice(revenueAfterAds),
  };
}

export type AnalyticsSnapshot = {
  revenueByDay: Array<{ label: string; value: number }>;
  bestSellers: Array<{ id: string; name: string; sales: number }>;
  mostViewed: Array<{ id: string; name: string; views: number }>;
  orderStatusCounts: Record<string, number>;
  newCustomers: number;
  topCustomers: Array<{ id: string; name: string; spent: number }>;
  couponUsage: Array<{ code: string; used: number }>;
  averageOrderValue: number;
  totalRevenue: number;
};

export async function getAdminAnalytics(): Promise<AnalyticsSnapshot> {
  const [products, orders, customers, coupons] = await Promise.all([
    listAllProductsAdmin(),
    listOrdersAdmin(),
    listCustomersAdmin(),
    listCouponsAdmin(),
  ]);

  const paid = orders.filter(isPaid);
  const totalRevenue = paid.reduce(
    (sum, order) => sum + Number(order.total ?? 0),
    0,
  );

  const dayMap = new Map<string, number>();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, 0);
  }
  for (const order of paid) {
    const t = orderTime(order);
    if (!t) continue;
    const key = new Date(t).toISOString().slice(0, 10);
    if (dayMap.has(key)) {
      dayMap.set(key, (dayMap.get(key) ?? 0) + Number(order.total ?? 0));
    }
  }

  const orderStatusCounts: Record<string, number> = {};
  for (const order of orders) {
    const status = String(order.orderStatus ?? order.status ?? "pending");
    orderStatusCounts[status] = (orderStatusCounts[status] ?? 0) + 1;
  }

  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const newCustomers = customers.filter((c) => {
    const created =
      c.createdAt instanceof Date
        ? c.createdAt.getTime()
        : c.created_time instanceof Date
          ? c.created_time.getTime()
          : 0;
    return created >= monthAgo;
  }).length;

  return {
    revenueByDay: Array.from(dayMap.entries()).map(([label, value]) => ({
      label: label.slice(5),
      value,
    })),
    bestSellers: [...products]
      .sort((a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0))
      .slice(0, 8)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sales: p.salesCount ?? 0,
      })),
    mostViewed: [...products]
      .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      .slice(0, 8)
      .map((p) => ({
        id: p.id,
        name: p.name,
        views: p.viewCount ?? 0,
      })),
    orderStatusCounts,
    newCustomers,
    topCustomers: [...customers]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 8)
      .map((c) => ({
        id: c.id,
        name: c.displayName || c.display_name || c.email || c.id,
        spent: c.totalSpent,
      })),
    couponUsage: coupons.map((c) => ({
      code: c.code,
      used: c.usedCount ?? 0,
    })),
    averageOrderValue: paid.length ? Math.round(totalRevenue / paid.length) : 0,
    totalRevenue,
  };
}
