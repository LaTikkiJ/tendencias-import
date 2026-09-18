"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const validStatuses = [
  "NUEVA",
  "CONTACTADA",
  "CONFIRMADA",
  "EN_ARMADO",
  "ENVIADA",
  "CANCELADA",
];

export async function updatePacaRequestStatusV15(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!id || !validStatuses.includes(status)) {
    throw new Error("Estado inválido.");
  }

  const { error } = await supabase
    .from("paca_requests")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/pacas/solicitudes");
  revalidatePath(`/admin/pacas/solicitudes/${id}`);
}

export async function markNotificationReadV15(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  if (!id) return;

  const { error } = await supabase
    .from("admin_notifications")
    .update({
      read_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/notificaciones");
}

export async function markAllNotificationsReadV15() {
  const supabase = await createClient();

  const { error } = await supabase
    .from("admin_notifications")
    .update({
      read_at: new Date().toISOString(),
    })
    .is("read_at", null);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/notificaciones");
}

export async function cleanupOldPacaReferencesV15() {
  const supabase = await createClient();

  const cutoff = new Date(
    Date.now() - 60 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: refs, error } = await supabase
    .from("paca_request_references")
    .select("id,storage_path")
    .lt("created_at", cutoff)
    .is("deleted_at", null)
    .not("storage_path", "is", null)
    .limit(500);

  if (error) {
    throw new Error(error.message);
  }

  const paths = (refs ?? [])
    .map((item) => item.storage_path)
    .filter(Boolean) as string[];

  if (paths.length === 0) {
    return;
  }

  const { error: storageError } = await supabase.storage
    .from("paca-references")
    .remove(paths);

  if (storageError) {
    throw new Error(storageError.message);
  }

  const ids = (refs ?? []).map((item) => item.id);

  const { error: updateError } = await supabase
    .from("paca_request_references")
    .update({
      deleted_at: new Date().toISOString(),
      url: null,
    })
    .in("id", ids);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/admin/pacas/solicitudes");
}
