"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createPacaHomeBannerV17(formData: FormData) {
  const supabase = await createClient();

  const imageUrl = String(formData.get("image_url") ?? "").trim();

  if (!imageUrl) {
    throw new Error("Sube una imagen para el banner.");
  }

  const { error } = await supabase
    .from("paca_home_banners")
    .insert({
      image_url: imageUrl,
      title: String(formData.get("title") ?? "").trim() || null,
      subtitle: String(formData.get("subtitle") ?? "").trim() || null,
      sort_order: Number(formData.get("sort_order") ?? 0) || 0,
      active: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin/pacas");
}

export async function updatePacaHomeBannerV17(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const imageUrl = String(formData.get("image_url") ?? "").trim();

  if (!id || !imageUrl) {
    throw new Error("Banner inválido.");
  }

  const { error } = await supabase
    .from("paca_home_banners")
    .update({
      image_url: imageUrl,
      title: String(formData.get("title") ?? "").trim() || null,
      subtitle: String(formData.get("subtitle") ?? "").trim() || null,
      sort_order: Number(formData.get("sort_order") ?? 0) || 0,
      active: formData.get("active") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin/pacas");
}

export async function deletePacaHomeBannerV17(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");

  if (!id) return;

  const { error } = await supabase
    .from("paca_home_banners")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin/pacas");
}
