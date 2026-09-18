"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function savePacaPricesV13(formData: FormData) {
  const supabase = await createClient();

  const categoryId = String(formData.get("category_id") ?? "");
  const slug = String(formData.get("slug") ?? "");

  const price25 = Number(formData.get("price_25") ?? 0);
  const price50 = Number(formData.get("price_50") ?? 0);
  const price100 = Number(formData.get("price_100") ?? 0);

  if (!categoryId) {
    throw new Error("Categoría inválida.");
  }

  const { error } = await supabase.rpc(
    "save_paca_category_prices_v13",
    {
      p_category_id: categoryId,
      p_price_25: Number.isFinite(price25) ? price25 : 0,
      p_price_50: Number.isFinite(price50) ? price50 : 0,
      p_price_100: Number.isFinite(price100) ? price100 : 0,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/pacas");
  revalidatePath("/admin/pacas");
  revalidatePath(`/admin/pacas/${categoryId}`);

  if (slug) {
    revalidatePath(`/pacas/${slug}`);
  }
}
