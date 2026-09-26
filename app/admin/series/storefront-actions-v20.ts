"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveSeriesStorefrontV20(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const heroUrl = String(formData.get("hero_url") ?? "").trim();

  const payload = {
    eyebrow:
      String(formData.get("eyebrow") ?? "").trim() || null,
    title:
      String(formData.get("title") ?? "").trim() || null,
    highlight_text:
      String(formData.get("highlight_text") ?? "").trim() || null,
    subtitle:
      String(formData.get("subtitle") ?? "").trim() || null,
    hero_url: heroUrl || null,
    active: true,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase
      .from("series_storefront_settings")
      .update(payload)
      .eq("id", id);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("series_storefront_settings")
      .insert(payload);

    if (error) throw new Error(error.message);
  }

  revalidatePath("/series");
  revalidatePath("/admin/series");
}
