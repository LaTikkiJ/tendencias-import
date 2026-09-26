import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login-admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    await supabase.auth.signOut();
    redirect("/login-admin");
  }

  const { data: pacaSections } = await supabase
    .from("paca_sections")
    .select("id,name,slug")
    .eq("active", true)
    .order("sort_order")
    .order("name");

  return (
    <AdminShell
      pacaSections={(pacaSections ?? []) as any}
    >
      {children}
    </AdminShell>
  );
}
