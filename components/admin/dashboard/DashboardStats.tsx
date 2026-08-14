'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  ShoppingCart,
  TrendingUp,
  UtensilsCrossed
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import toast from 'react-hot-toast';
import { formatMYR } from '@/lib/pricing';
import type { DashboardStats as Stats } from '@/types';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  PREPARING:
    'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  READY: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400',
  HEADING_TO_VENDOR: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300',
  OUT_FOR_DELIVERY: 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300',
  DELIVERED:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
};

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then(setStats)
      .catch(() => toast.error('Failed to load dashboard stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800"
          />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <p className="text-neutral-500 dark:text-neutral-400">
        Stats are unavailable right now.
      </p>
    );
  }

  const cards = [
    {
      label: 'Total orders',
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart
    },
    {
      label: 'Revenue',
      value: formatMYR(stats.totalRevenue),
      icon: TrendingUp
    },
    {
      label: 'Active companies',
      value: stats.activeCompanies.toLocaleString(),
      icon: Building2
    },
    {
      label: 'Menu items',
      value: stats.menuItemCount.toLocaleString(),
      icon: UtensilsCrossed
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-neutral-500 dark:text-neutral-400">
          {stats.pendingOrders} order{stats.pendingOrders === 1 ? '' : 's'}{' '}
          waiting to be confirmed
          {stats.pendingCompanies
            ? ` · ${stats.pendingCompanies} company registration${stats.pendingCompanies === 1 ? '' : 's'} to review`
            : ''}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <card.icon className="mb-3 h-5 w-5 text-emerald-500" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {card.label}
            </p>
            <p className="mt-1 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-4 font-semibold">Revenue, last 14 days</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.revenueByDay}>
              <defs>
                <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => d.slice(5)}
                fontSize={12}
                stroke="#a3a3a3"
              />
              <YAxis fontSize={12} stroke="#a3a3a3" width={50} />
              <Tooltip
                formatter={(value) => formatMYR(Number(value ?? 0))}
                labelFormatter={(label) => `Date: ${String(label)}`}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#revenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <h2 className="font-semibold">Recent orders</h2>
          <Link
            href="/admin/orders"
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
          >
            View all
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <p className="px-5 py-10 text-center text-neutral-500 dark:text-neutral-400">
            No orders yet.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {stats.recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-medium">
                      {order.orderNumber}
                    </p>
                    <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {order.employeeName} · {order.company?.name}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                        STATUS_STYLES[order.status] ?? ''
                      }`}
                    >
                      {order.status}
                    </span>
                    <span className="font-semibold">
                      {formatMYR(order.total)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
