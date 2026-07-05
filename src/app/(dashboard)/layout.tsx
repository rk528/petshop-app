import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  
  try {
    session = await auth();
  } catch (error) {
    // Suppress expected error during static generation (uses headers/cookies)
    const isDynamicError = error instanceof Error && 
      (error.message.includes("headers") || (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE");
    if (isDynamicError) {
      throw error; // Re-throw to let Next.js handle it silently
    }
    console.error("Auth error in dashboard:", error);
    redirect("/login");
  }

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <DashboardSidebar user={session.user} />
      <SidebarInset>
        <DashboardHeader user={session.user} />
        <main className="flex-1 overflow-auto p-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
