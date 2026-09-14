"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

function csvText(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function csvNumbers(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((x) => Number(x.trim()))
    .filter((x) => Number.isFinite(x) && x > 0);
}

export async function createPacaCategory(
  formData: FormData
) {
  const supabase = await createClient();

  const audience = String(
    formData.get("audience") ?? "kids"
  );

  const name = String(
    formData.get("name") ?? ""
  ).trim();

  const description = String(
    formData.get("description") ?? ""
  ).trim();

  const sizeRanges = csvText(
    formData.get("size_ranges")
  );

  const boxQuantities = csvNumbers(
    formData.get("box_quantities")
  );

  if (!name) {
    throw new Error(
      "Debes ingresar el nombre de la categoría."
    );
  }

  const slugBase = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const slug = `${slugBase}-${audience}`;

  const { data, error } = await supabase
    .from("paca_categories")
    .insert({
      audience,
      name,
      slug,
      description,
      size_ranges: sizeRanges,
      box_quantities: boxQuantities,
      active: true,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/pacas");
  revalidatePath("/admin/pacas");

  redirect(`/admin/pacas/${data.id}`);
}

export async function updatePacaCategory(
  formData: FormData
) {
  const supabase = await createClient();

  const id = String(
    formData.get("id")
  );

  const { error } = await supabase
    .from("paca_categories")
    .update({
      audience: String(
        formData.get("audience")
      ),

      name: String(
        formData.get("name") ?? ""
      ).trim(),

      description: String(
        formData.get("description") ?? ""
      ).trim(),

      size_ranges: csvText(
        formData.get("size_ranges")
      ),

      box_quantities: csvNumbers(
        formData.get("box_quantities")
      ),

      active:
        formData.get("active") === "on",
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/pacas");
  revalidatePath("/admin/pacas");
  revalidatePath(
    `/admin/pacas/${id}`
  );
}

export async function setPacaCover(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const url = String(formData.get("url"));

  const { error } = await supabase
    .from("paca_categories")
    .update({ cover_url: url })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/pacas");
  revalidatePath(`/admin/pacas/${id}`);
}

export async function createSeriesProduct(formData: FormData) {
  const supabase = await createClient();

  const name = String(
    formData.get("name") ?? ""
  ).trim();

  const sizes = csvText(
    formData.get("sizes")
  );

  const price = Number(
    formData.get("price")
  );

  const status = String(
    formData.get("status") ?? "stock"
  );

  if (!name) {
    throw new Error(
      "Debes ingresar el nombre del conjunto."
    );
  }

  if (!sizes.length) {
    throw new Error(
      "Debes ingresar al menos una talla."
    );
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(
      "Debes ingresar un precio válido."
    );
  }

  const { data, error } = await supabase
    .from("series_products")
    .insert({
      name,
      price,

      sizes,

      pieces_per_series:
        sizes.length,

      status,

      // El stock se ingresará luego
      // desde administración de inventario.
      series_available: 0,

      description: "",

      active: true,
    })
    .select(
      "id,code,slug"
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/series");
  revalidatePath("/admin/series");

  redirect(
    `/admin/series/${data.id}`
  );
}

export async function updateSeriesProduct(
  formData: FormData
) {
  const supabase =
    await createClient();

  const id = String(
    formData.get("id")
  );

  const name = String(
    formData.get("name") ?? ""
  ).trim();

  const sizes = csvText(
    formData.get("sizes")
  );

  const price = Number(
    formData.get("price")
  );

  const seriesAvailable = Number(
    formData.get(
      "series_available"
    ) ?? 0
  );

  const status = String(
    formData.get("status") ??
      "stock"
  );

  const description = String(
    formData.get(
      "description"
    ) ?? ""
  );

  const { error } =
    await supabase
      .from("series_products")
      .update({
        name,

        price,

        sizes,

        pieces_per_series:
          sizes.length,

        series_available:
          seriesAvailable,

        status,

        description,

        active:
          formData.get(
            "active"
          ) === "on",

        featured:
          formData.get(
            "featured"
          ) === "on",

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id);

  if (error) {
    throw new Error(
      error.message
    );
  }

  revalidatePath("/");
  revalidatePath("/series");
  revalidatePath(
    `/admin/series/${id}`
  );
  revalidatePath(
    "/admin/series"
  );
}

export async function setSeriesCover(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const url = String(formData.get("url"));

  const { error } = await supabase
    .from("series_products")
    .update({ cover_url: url, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/series");
  revalidatePath(`/admin/series/${id}`);
}

export async function adjustSeriesStock(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const series_available = Number(formData.get("series_available"));

  const { error } = await supabase
    .from("series_products")
    .update({
      series_available,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/series");
  revalidatePath("/admin/series");
}
