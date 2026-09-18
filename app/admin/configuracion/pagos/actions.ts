"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function savePaymentAccount(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  const payload = {
    method: String(formData.get("method") ?? "").trim(),
    label: String(formData.get("label") ?? "").trim(),
    holder: String(formData.get("holder") ?? "").trim() || null,
    account_number: String(formData.get("account_number") ?? "").trim() || null,
    cci: String(formData.get("cci") ?? "").trim() || null,
    qr_url: String(formData.get("qr_url") ?? "").trim() || null,
    instructions: String(formData.get("instructions") ?? "").trim() || null,
    active: formData.get("active") === "on",
    sort_order: Number(formData.get("sort_order") ?? 0),
    updated_at: new Date().toISOString(),
  };

  if (!payload.method || !payload.label) {
    throw new Error("Método y nombre son obligatorios.");
  }

  if (id) {
    const { error } = await supabase.from("payment_accounts").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("payment_accounts").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/checkout");
  revalidatePath("/admin/configuracion/pagos");
}

export async function deletePaymentAccount(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("payment_accounts").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/checkout");
  revalidatePath("/admin/configuracion/pagos");
}
