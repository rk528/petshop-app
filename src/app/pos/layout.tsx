import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function POSLayout({
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
    console.error("Auth error in POS:", error);
    redirect("/login");
  }

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="h-screen overflow-hidden bg-background">
      {children}
    </div>
  );
}
