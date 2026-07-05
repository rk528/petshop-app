"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const sales = [
  {
    name: "John Smith",
    email: "john@email.com",
    amount: "+$1,999.00",
  },
  {
    name: "Sarah Johnson",
    email: "sarah@email.com",
    amount: "+$39.00",
  },
  {
    name: "Mike Wilson",
    email: "mike@email.com",
    amount: "+$299.00",
  },
  {
    name: "Emily Brown",
    email: "emily@email.com",
    amount: "+$99.00",
  },
  {
    name: "David Lee",
    email: "david@email.com",
    amount: "+$39.00",
  },
];

export function RecentSales() {
  return (
    <div className="space-y-8">
      {sales.map((sale, index) => (
        <div key={index} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {sale.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{sale.name}</p>
            <p className="text-sm text-muted-foreground">{sale.email}</p>
          </div>
          <div className="ml-auto font-medium">{sale.amount}</div>
        </div>
      ))}
    </div>
  );
}
