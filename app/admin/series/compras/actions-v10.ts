"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type PayloadItem = {
  product_id?: string | null;
  cover_url?: string | null;
};

type PurchasePayload = {
  items?: PayloadItem[];
};

function numberOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  const valueNumber = Number(text.replace(",", "."));

  return Number.isFinite(valueNumber) ? valueNumber : null;
}

export async function createChinaPurchaseV10(formData: FormData) {
  const supabase = await createClient();

  const raw = String(formData.get("payload") ?? "{}");

  let payload: PurchasePayload;

  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error("No se pudo leer la compra.");
  }

  const { data: purchaseId, error } = await supabase.rpc(
    "create_series_china_purchase_v10",
    {
      p_payload: payload,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  const { data: purchaseItems, error: itemsError } = await supabase
    .from("series_china_purchase_items")
    .select("line_no,product_id")
    .eq("purchase_id", purchaseId)
    .order("line_no");

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const rows = payload.items ?? [];

  for (const item of purchaseItems ?? []) {
    const source = rows[Number(item.line_no) - 1];
    const cover = source?.cover_url?.trim();
    const wasCreatedInThisPurchase = !source?.product_id;

    const productPatch: {
      cover_url?: string;
      created_in_purchase_id?: string;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (cover) {
      productPatch.cover_url = cover;
    }

    if (wasCreatedInThisPurchase) {
      productPatch.created_in_purchase_id = String(purchaseId);
    }

    const { error: productError } = await supabase
      .from("series_products")
      .update(productPatch)
      .eq("id", item.product_id);

    if (productError) {
      throw new Error(productError.message);
    }
  }

  revalidatePath("/");
  revalidatePath("/series");
  revalidatePath("/admin");
  revalidatePath("/admin/series");
  revalidatePath("/admin/series/compras");

  redirect(`/admin/series/compras/${purchaseId}`);
}

export async function addChinaPurchasePaymentV10(formData: FormData) {
  const supabase = await createClient();

  const purchaseId = String(formData.get("purchase_id") ?? "");

  const { error } = await supabase.rpc(
    "add_series_china_purchase_payment_v10",
    {
      p_purchase_id: purchaseId,
      p_payment_date: String(formData.get("payment_date") ?? "") || null,
      p_stage: String(formData.get("stage") ?? "pago_adicional"),
      p_garments_amount_original: numberOrNull(
        formData.get("garments_amount_original"),
      ),
      p_freight_amount_original: numberOrNull(
        formData.get("freight_amount_original"),
      ),
      p_other_amount_original: numberOrNull(
        formData.get("other_amount_original"),
      ),
      p_actual_pen: numberOrNull(formData.get("actual_pen")),
      p_exchange_rate: numberOrNull(formData.get("exchange_rate")),
      p_payment_method: String(formData.get("payment_method") ?? ""),
      p_reference: String(formData.get("reference") ?? ""),
      p_notes: String(formData.get("notes") ?? ""),
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/admin/series/compras/${purchaseId}`);
  revalidatePath("/admin/series/compras");
  revalidatePath("/admin/series");
  revalidatePath("/series");
}

export async function addChinaPurchaseExpenseV10(formData: FormData) {
  const supabase = await createClient();

  const purchaseId = String(formData.get("purchase_id") ?? "");

  const { error } = await supabase.rpc(
    "add_series_china_purchase_expense_v10",
    {
      p_purchase_id: purchaseId,
      p_expense_date: String(formData.get("expense_date") ?? "") || null,
      p_category: String(formData.get("category") ?? "otro"),
      p_concept: String(formData.get("concept") ?? "Otro gasto"),
      p_currency: String(formData.get("currency") ?? "PEN"),
      p_amount: numberOrNull(formData.get("amount")),
      p_exchange_rate: numberOrNull(formData.get("exchange_rate")),
      p_reference: String(formData.get("reference") ?? ""),
      p_notes: String(formData.get("notes") ?? ""),
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/admin/series/compras/${purchaseId}`);
  revalidatePath("/admin/series/compras");
  revalidatePath("/admin/series");
  revalidatePath("/series");
}

export async function setChinaPurchaseStatusV10(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!id || !["PEDIDO", "EN_TRANSITO", "CANCELADO"].includes(status)) {
    throw new Error("Estado inválido.");
  }

  const { data: items, error: itemsError } = await supabase
    .from("series_china_purchase_items")
    .select("product_id")
    .eq("purchase_id", id);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const { error } = await supabase
    .from("series_china_purchases")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  for (const productId of Array.from(
    new Set((items ?? []).map((item) => item.product_id).filter(Boolean)),
  )) {
    await supabase.rpc("refresh_series_product_availability", {
      p_product_id: productId,
    });
  }

  revalidatePath(`/admin/series/compras/${id}`);
  revalidatePath("/admin/series/compras");
  revalidatePath("/admin/series");
  revalidatePath("/series");
}

export async function markChinaPurchaseReceivedV10(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase.rpc(
    "mark_series_china_purchase_received_v2",
    {
      p_purchase_id: id,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/admin/series/compras/${id}`);
  revalidatePath("/admin/series/compras");
  revalidatePath("/admin/series");
  revalidatePath("/series");
}


export type DeleteChinaPurchaseState = {
  error?: string;
};

export async function deleteChinaPurchaseV11(
  _previousState: DeleteChinaPurchaseState,
  formData: FormData,
): Promise<DeleteChinaPurchaseState> {
  const supabase = await createClient();

  const purchaseId = String(formData.get("purchase_id") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  const deleteCreatedProducts =
    String(formData.get("delete_created_products") ?? "") === "on";

  if (!purchaseId) {
    return {
      error: "No se encontró la compra.",
    };
  }

  if (confirmation.trim().toUpperCase() !== "ELIMINAR") {
    return {
      error: "Escribe ELIMINAR para confirmar.",
    };
  }

  const { error } = await supabase.rpc(
    "delete_series_china_purchase_v11",
    {
      p_purchase_id: purchaseId,
      p_confirmation: confirmation,
      p_delete_created_products: deleteCreatedProducts,
    },
  );

  if (error) {
    return {
      error: error.message,
    };
  }

  revalidatePath("/");
  revalidatePath("/series");
  revalidatePath("/admin");
  revalidatePath("/admin/series");
  revalidatePath("/admin/series/compras");

  redirect("/admin/series/compras?deleted=1");
}
