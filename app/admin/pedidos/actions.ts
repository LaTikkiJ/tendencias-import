"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateCustomerOrderStatusV4(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));

  const { error } = await supabase.rpc("update_customer_order_status_v4", {
    p_order_id: id,
    p_status: status,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/series");
  revalidatePath("/admin");
  revalidatePath("/admin/series");
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
}

export async function createManualOrderV4(formData: FormData) {
  const supabase = await createClient();
  const raw = String(formData.get("payload") ?? "{}");

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error("No se pudo leer la venta manual.");
  }

  const { data, error } = await supabase.rpc("create_manual_customer_order_v4", {
    p_payload: payload,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/series");
  revalidatePath("/admin");
  revalidatePath("/admin/series");
  revalidatePath("/admin/pedidos");

  redirect(`/admin/pedidos/${data.id}`);
}

export async function deleteCustomerOrderV4(id: string) {
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("customer_orders")
    .select("payment_proof_path")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.rpc("delete_customer_order_v4", {
    p_order_id: id,
  });

  if (error) throw new Error(error.message);

  if (order?.payment_proof_path) {
    await supabase.storage
      .from("payment-proofs")
      .remove([order.payment_proof_path]);
  }

  revalidatePath("/");
  revalidatePath("/series");
  revalidatePath("/admin");
  revalidatePath("/admin/series");
  revalidatePath("/admin/pedidos");

  redirect("/admin/pedidos");
}
