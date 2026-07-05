import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { serialize } from "@/lib/utils";
import { Ticket, Calendar, Percent, DollarSign, Copy } from "lucide-react";
import { format } from "date-fns";
import { CurrencyAmount } from "@/lib/currency";

async function getCoupons() {
  const coupons = await prisma.coupon.findMany({
    include: {
      _count: {
        select: { sales: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return serialize(coupons);
}

async function CouponsList() {
  const coupons = await getCoupons();
  const now = new Date();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {coupons.length === 0 ? (
        <Card className="col-span-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ticket className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No coupons</h3>
            <p className="text-muted-foreground">No coupons created yet</p>
          </CardContent>
        </Card>
      ) : (
        coupons.map((coupon) => {
          const isActive =
            coupon.isActive &&
            coupon.startDate <= now &&
            coupon.endDate >= now &&
            (!coupon.maxUses || coupon.usedCount < coupon.maxUses);
          const isExpired = coupon.endDate < now;
          const isExhausted =
            coupon.maxUses && coupon.usedCount >= coupon.maxUses;

          const usagePercent = coupon.maxUses
            ? (coupon.usedCount / coupon.maxUses) * 100
            : 0;

          return (
            <Card key={coupon.id} className={!isActive ? "opacity-70" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-primary/10 rounded text-primary font-mono font-bold">
                        {coupon.code}
                      </code>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    {coupon.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {coupon.description}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      isActive
                        ? "default"
                        : isExpired || isExhausted
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {isActive
                      ? "Active"
                      : isExhausted
                      ? "Exhausted"
                      : isExpired
                      ? "Expired"
                      : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-center p-4 rounded-lg bg-muted/50">
                  {coupon.discountType === "PERCENTAGE" ? (
                    <Percent className="h-6 w-6 text-primary mr-2" />
                  ) : (
                    <DollarSign className="h-6 w-6 text-emerald-600 mr-2" />
                  )}
                  <span className="text-3xl font-bold">
                    {coupon.discountType === "PERCENTAGE"
                      ? `${Number(coupon.discountValue)}%`
                      : <CurrencyAmount amount={Number(coupon.discountValue)} />}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(coupon.startDate, "MMM dd")} -{" "}
                      {format(coupon.endDate, "MMM dd, yyyy")}
                    </span>
                  </div>

                  {coupon.minPurchase && (
                    <p className="text-muted-foreground">
                      Minimum purchase: <CurrencyAmount amount={Number(coupon.minPurchase)} />
                    </p>
                  )}

                  {coupon.maxDiscount && (
                    <p className="text-muted-foreground">
                      Maximum discount: <CurrencyAmount amount={Number(coupon.maxDiscount)} />
                    </p>
                  )}
                </div>

                {coupon.maxUses && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Uses</span>
                      <span>
                        {coupon.usedCount} / {coupon.maxUses}
                      </span>
                    </div>
                    <Progress value={usagePercent} className="h-2" />
                  </div>
                )}

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    {coupon._count.sales} sales with this coupon
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

export default function CouponsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">
            Manage discount codes
          </p>
        </div>
        <Button>
          <Ticket className="mr-2 h-4 w-4" />
          New Coupon
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <CouponsList />
      </Suspense>
    </div>
  );
}
