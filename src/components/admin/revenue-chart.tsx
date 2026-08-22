"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNaira } from "@/lib/money";

type Point = { day: string; revenue: number };

/** 30-day area chart rendering daily revenue with date tooltips and missing day interpolation. */
export function RevenueChart({ data }: { data: Point[] }) {

  // Fill in days with zero revenue so the axis shows the full window.
  const byDay = new Map(data.map((d) => [d.day, d.revenue]));
  const filled: Point[] = [];
  const start = new Date();
  start.setDate(start.getDate() - 29);
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    filled.push({ day: key, revenue: byDay.get(key) ?? 0 });
  }
  const total = filled.reduce((s, p) => s + p.revenue, 0);

  if (total === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No revenue in the last 30 days.
      </p>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={filled} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <defs>
            <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="day"
            tickFormatter={(v: string) => v.slice(5)}
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            fontSize={11}
            tickLine={false}
            width={56}
            tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
          />
          <Tooltip
            formatter={(value) => [formatNaira(Number(value)), "Revenue"]}
            labelFormatter={(label) =>
              new Date(`${label}T00:00:00`).toLocaleDateString("en-NG", {
                dateStyle: "medium",
              })
            }
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--primary)"
            fill="url(#revenue)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
