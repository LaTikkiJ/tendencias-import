import StaffUsersManager from "@/components/admin/StaffUsersManager";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdministradoresPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role,active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    !currentProfile ||
    currentProfile.role !== "admin" ||
    !currentProfile.active
  ) {
    return (
      <section className="rounded-[28px] border border-[#eaded3] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black">
          Acceso restringido
        </h1>
        <p className="mt-2 text-sm text-[#7f746c]">
          Solo un administrador puede gestionar el personal.
        </p>
      </section>
    );
  }

  const admin = createSupabaseAdmin();

  const [
    { data: profiles },
    { data: authUsers, error: usersError },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("user_id,full_name,role,active,updated_at")
      .order("full_name"),

    admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    }),
  ]);

  if (usersError) {
    throw new Error(usersError.message);
  }

  const emailById = new Map(
    (authUsers.users ?? []).map((authUser) => [
      authUser.id,
      authUser.email ?? "",
    ]),
  );

  const staff = (profiles ?? [])
    .filter((profile) =>
      ["admin", "ventas", "contenido", "inventario"].includes(
        profile.role,
      ),
    )
    .map((profile) => ({
      ...profile,
      email: emailById.get(profile.user_id) ?? "",
    }));

  return (
    <StaffUsersManager
      users={staff as any}
    />
  );
}
