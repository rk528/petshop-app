import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SalesTable } from "@/components/dashboard/sales/sales-table";
import { serialize } from "@/lib/utils";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { format, startOfMonth, startOfWeek, startOfDay } from "date-fns";
import { CurrencyAmount } from "@/lib/currency";

async function getSalesStats() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  const [todaySales, weekSales, monthSales, totalCustomers] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: todayStart } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: weekStart } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: monthStart } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.count({
      where: {
        customerEmail: { not: null },
        createdAt: { gte: monthStart },
      },
    }),
  ]);

  return {
    today: {
      total: Number(todaySales._sum.total || 0),
      count: todaySales._count,
    },
    week: {
      total: Number(weekSales._sum.total || 0),
      count: weekSales._count,
    },
    month: {
      total: Number(monthSales._sum.total || 0),
      count: monthSales._count,
    },
    customers: totalCustomers,
  };
}

async function getSales() {
  const sales = await prisma.sale.findMany({
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
      coupon: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return serialize(sales);
}

async function StatsCards() {
  const stats = await getSalesStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Today's Sales
          </CardTitle>
          <DollarSign className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold"><CurrencyAmount amount={stats.today.total} /></div>
          <p className="text-xs text-muted-foreground">
            {stats.today.count} transactions
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            This Week
          </CardTitle>
          <TrendingUp className="h-5 w-5 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold"><CurrencyAmount amount={stats.week.total} /></div>
          <p className="text-xs text-muted-foreground">
            {stats.week.count} transactions
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            This Month
          </CardTitle>
          <ShoppingCart className="h-5 w-5 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold"><CurrencyAmount amount={stats.month.total} /></div>
          <p className="text-xs text-muted-foreground">
            {stats.month.count} transactions
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Customers
          </CardTitle>
          <Users className="h-5 w-5 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.customers}</div>
          <p className="text-xs text-muted-foreground">This month</p>
        </CardContent>
      </Card>
    </div>
  );
}

async function SalesList() {
  const sales = await getSales();
  return <SalesTable sales={sales} />;
}

export default function SalesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Reports</h1>
          <p className="text-muted-foreground">
            Transaction history and analysis
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {format(new Date(), "MMMM yyyy")}
        </Badge>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <StatsCards />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <SalesList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
