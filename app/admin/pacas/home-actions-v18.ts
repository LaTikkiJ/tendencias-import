"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createPacaHomeBannerV18(formData: FormData) {
  const supabase = await createClient();

  const imageUrl = String(formData.get("image_url") ?? "").trim();

  if (!imageUrl) {
    throw new Error("Sube una imagen para el banner.");
  }

  const { error } = await supabase
    .from("paca_home_banners")
    .insert({
      image_url: imageUrl,
      eyebrow:
        String(formData.get("eyebrow") ?? "").trim() || null,
      title:
        String(formData.get("title") ?? "").trim() || null,
      highlight_text:
        String(formData.get("highlight_text") ?? "").trim() || null,
      subtitle:
        String(formData.get("subtitle") ?? "").trim() || null,
      sort_order: Number(formData.get("sort_order") ?? 0) || 0,
      active: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin/pacas");
}

export async function updatePacaHomeBannerV18(formData: FormData) {
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
      eyebrow:
        String(formData.get("eyebrow") ?? "").trim() || null,
      title:
        String(formData.get("title") ?? "").trim() || null,
      highlight_text:
        String(formData.get("highlight_text") ?? "").trim() || null,
      subtitle:
        String(formData.get("subtitle") ?? "").trim() || null,
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

export async function deletePacaHomeBannerV18(formData: FormData) {
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

export async function updatePacaCategoryHeroV18(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const heroUrl = String(formData.get("hero_url") ?? "").trim();

  if (!id) {
    throw new Error("Categoría inválida.");
  }

  const { data: category, error: categoryError } = await supabase
    .from("paca_categories")
    .select("slug")
    .eq("id", id)
    .single();

  if (categoryError || !category) {
    throw new Error(categoryError?.message ?? "Categoría no encontrada.");
  }

  const { error } = await supabase
    .from("paca_categories")
    .update({
      hero_url: heroUrl || null,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/pacas");
  revalidatePath(`/pacas/${category.slug}`);
  revalidatePath(`/admin/pacas/${id}`);
}
