"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const ALLOWED_ROLES = [
  "admin",
  "ventas",
  "contenido",
  "inventario",
] as const;

type StaffRole = (typeof ALLOWED_ROLES)[number];

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Tu sesión venció.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin" || !profile.active) {
    throw new Error("No tienes permiso para administrar usuarios.");
  }

  return user;
}

function validateRole(value: string): StaffRole {
  if (!ALLOWED_ROLES.includes(value as StaffRole)) {
    throw new Error("Rol inválido.");
  }

  return value as StaffRole;
}

export async function createStaffUserV22(formData: FormData) {
  await requireAdmin();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = validateRole(
    String(formData.get("role") ?? "contenido"),
  );

  if (!email || !email.includes("@")) {
    throw new Error("Ingresa un correo válido.");
  }

  if (!fullName) {
    throw new Error("Ingresa el nombre del usuario.");
  }

  if (password.length < 8) {
    throw new Error("La contraseña temporal debe tener al menos 8 caracteres.");
  }

  const admin = createSupabaseAdmin();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (error || !data.user) {
    throw new Error(
      error?.message ?? "No se pudo crear el usuario.",
    );
  }

  const { error: profileError } = await admin
    .from("profiles")
    .upsert(
      {
        user_id: data.user.id,
        full_name: fullName,
        role,
        active: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    );

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw new Error(profileError.message);
  }

  revalidatePath("/admin/administradores");
}

export async function updateStaffUserV22(formData: FormData) {
  const currentAdmin = await requireAdmin();

  const userId = String(formData.get("user_id") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = validateRole(
    String(formData.get("role") ?? "contenido"),
  );
  const active = formData.get("active") === "on";

  if (!userId) {
    throw new Error("Usuario inválido.");
  }

  if (userId === currentAdmin.id && (!active || role !== "admin")) {
    throw new Error(
      "No puedes quitarte a ti misma el acceso de administradora.",
    );
  }

  const admin = createSupabaseAdmin();

  const { error } = await admin
    .from("profiles")
    .update({
      full_name: fullName || null,
      role,
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/administradores");
}

export async function changeStaffPasswordV22(formData: FormData) {
  await requireAdmin();

  const userId = String(formData.get("user_id") ?? "");
  const password = String(formData.get("new_password") ?? "");

  if (!userId) {
    throw new Error("Usuario inválido.");
  }

  if (password.length < 8) {
    throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");
  }

  const admin = createSupabaseAdmin();

  const { error } = await admin.auth.admin.updateUserById(
    userId,
    {
      password,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/administradores");
}
