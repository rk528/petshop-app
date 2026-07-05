import { redirect } from "next/navigation";

export default function HomePage() {
  // Always redirect to login - the login page will handle
  // redirecting authenticated users to dashboard
  redirect("/login");
}
