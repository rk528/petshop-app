"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCurrency } from "@/lib/currency";

const data = [
  { name: "Mon", sales: 1200, orders: 45 },
  { name: "Tue", sales: 1800, orders: 52 },
  { name: "Wed", sales: 1400, orders: 38 },
  { name: "Thu", sales: 2100, orders: 65 },
  { name: "Fri", sales: 2800, orders: 78 },
  { name: "Sat", sales: 3200, orders: 95 },
  { name: "Sun", sales: 1900, orders: 58 },
];

export function SalesChart() {
  const { symbol: currencySymbol } = useCurrency();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          tickFormatter={(value) => `${currencySymbol}${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
          labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
          formatter={(value, name) => [
            name === "sales" ? `${currencySymbol}${value}` : value,
            name === "sales" ? "Sales" : "Orders",
          ]}
        />
        <Area
          type="monotone"
          dataKey="sales"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorSales)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
