import AdminShell from "@/components/admin/AdminShell";
import { api } from "@/convex/_generated/api";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await convexAuthNextjsToken();
  if (!token) {
    redirect("/signin");
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  }

  const client = new ConvexHttpClient(convexUrl, { auth: token });
  const user = await client.query(api.admin.getCurrentUser, {});
  if (!user || user.role !== "admin") {
    redirect("/");
  }

  return <AdminShell>{children}</AdminShell>;
}
