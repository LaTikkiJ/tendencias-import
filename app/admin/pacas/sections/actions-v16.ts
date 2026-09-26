"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function csvText(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanColor(value: string) {
  const color = value.trim();

  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return color;
  }

  return "#b63a2c";
}

export async function createPacaSectionV16(formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const preferences = csvText(formData.get("preference_options"));
  const accentColor = cleanColor(
    String(formData.get("accent_color") ?? "#b63a2c"),
  );
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const coverUrl = String(formData.get("cover_url") ?? "").trim();

  if (!name) {
    throw new Error("Ingresa el nombre de la sección.");
  }

  const slug = slugify(name);

  if (!slug) {
    throw new Error("No se pudo generar el identificador de la sección.");
  }

  const { error } = await supabase
    .from("paca_sections")
    .insert({
      name,
      slug,
      description,
      preference_options:
        preferences.length > 0 ? preferences : [name],
      accent_color: accentColor,
      cover_url: coverUrl || null,
      active: true,
      show_on_home: true,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/pacas");
  revalidatePath("/admin/pacas");
}

export async function updatePacaSectionV16(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const preferences = csvText(formData.get("preference_options"));
  const accentColor = cleanColor(
    String(formData.get("accent_color") ?? "#b63a2c"),
  );
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const coverUrl = String(formData.get("cover_url") ?? "").trim();

  if (!id || !name) {
    throw new Error("Sección inválida.");
  }

  const { data: current, error: currentError } = await supabase
    .from("paca_sections")
    .select("slug")
    .eq("id", id)
    .single();

  if (currentError || !current) {
    throw new Error(currentError?.message ?? "Sección no encontrada.");
  }

  const { error } = await supabase
    .from("paca_sections")
    .update({
      name,
      description,
      preference_options:
        preferences.length > 0 ? preferences : [name],
      accent_color: accentColor,
      cover_url: coverUrl || null,
      active: formData.get("active") === "on",
      show_on_home: formData.get("show_on_home") === "on",
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/pacas");
  revalidatePath("/admin/pacas");
}
