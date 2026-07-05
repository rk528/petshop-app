import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { serialize } from "@/lib/utils";
import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { CurrencyAmount } from "@/lib/currency";
import { getStoreSettings } from "@/lib/store-settings.server";

async function getStats() {
  const today = new Date();
  const startOfToday = new Date(today.setHours(0, 0, 0, 0));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalProducts,
    lowStockProducts,
    todaySales,
    monthSales,
    recentSales,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({
      where: {
        isActive: true,
        stockQuantity: { lte: prisma.product.fields.lowStockThreshold },
      },
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfToday } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        items: { include: { product: true } },
      },
    }),
  ]);

  // Get low stock products
  const lowStockList = await prisma.product.findMany({
    where: {
      isActive: true,
      stockQuantity: { lte: prisma.product.fields.lowStockThreshold },
    },
    orderBy: { stockQuantity: "asc" },
    take: 5,
    include: { category: true },
  });

  return {
    totalProducts,
    lowStockProducts,
    todaySales: {
      total: Number(todaySales._sum.total || 0),
      count: todaySales._count,
    },
    monthSales: {
      total: Number(monthSales._sum.total || 0),
      count: monthSales._count,
    },
    recentSales: serialize(recentSales),
    lowStockList: serialize(lowStockList),
  };
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-20" />
      </CardContent>
    </Card>
  );
}

async function StatsCards() {
  const stats = await getStats();

  return (
    <>
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Today's Sales
          </CardTitle>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            <CurrencyAmount amount={stats.todaySales.total} />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {stats.todaySales.count} transactions
            </Badge>
            <span className="text-xs text-emerald-600 flex items-center">
              <ArrowUpRight className="h-3 w-3" />
              +12.5%
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Monthly Sales
          </CardTitle>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            <CurrencyAmount amount={stats.monthSales.total} />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {stats.monthSales.count} transactions
            </Badge>
            <span className="text-xs text-emerald-600 flex items-center">
              <ArrowUpRight className="h-3 w-3" />
              +8.2%
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Products
          </CardTitle>
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalProducts}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Active products in catalog
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Low Stock
          </CardTitle>
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-destructive">
            {stats.lowStockProducts}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Products need restocking
          </p>
        </CardContent>
      </Card>
    </>
  );
}

async function LowStockAlerts() {
  const stats = await getStats();

  if (stats.lowStockList.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No low stock products</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stats.lowStockList.map((product) => (
        <div
          key={product.id}
          className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{product.name}</p>
            <p className="text-xs text-muted-foreground">
              {product.category.name}
            </p>
          </div>
          <div className="text-right ml-4">
            <Badge variant="destructive" className="text-xs">
              {product.stockQuantity} units
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Min: {product.lowStockThreshold}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

async function RecentSalesSection() {
  const stats = await getStats();

  return (
    <div className="space-y-4">
      {stats.recentSales.map((sale) => (
        <div
          key={sale.id}
          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{sale.receiptNumber}</p>
              <p className="text-xs text-muted-foreground">
                {sale.customerName || "Anonymous customer"} • {sale.user.name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold"><CurrencyAmount amount={Number(sale.total)} /></p>
            <p className="text-xs text-muted-foreground">
              {format(sale.createdAt, "HH:mm")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const { storeName } = await getStoreSettings();
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the {storeName} Point of Sale System
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Suspense
          fallback={
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          }
        >
          <StatsCards />
        </Suspense>
      </div>

      {/* Charts and Lists */}
      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Stock Alerts</CardTitle>
            <Badge variant="destructive" className="text-xs">
              Urgent
            </Badge>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-48 w-full" />}>
              <LowStockAlerts />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <RecentSalesSection />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <a
              href="/pos"
              className="flex flex-col items-center justify-center p-6 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors group"
            >
              <ShoppingCart className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-medium">New Sale</span>
            </a>
            <a
              href="/dashboard/products"
              className="flex flex-col items-center justify-center p-6 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 transition-colors group"
            >
              <Package className="h-8 w-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Products</span>
            </a>
            <a
              href="/dashboard/sales"
              className="flex flex-col items-center justify-center p-6 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors group"
            >
              <TrendingUp className="h-8 w-8 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Reports</span>
            </a>
            <a
              href="/dashboard/low-stock"
              className="flex flex-col items-center justify-center p-6 rounded-xl bg-destructive/5 hover:bg-destructive/10 transition-colors group"
            >
              <AlertTriangle className="h-8 w-8 text-destructive mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Low Stock</span>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
