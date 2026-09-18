"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login-admin");
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

// ============================================================
// PACAS
// ============================================================

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
  revalidatePath(`/admin/pacas/${id}`);
}

export async function setPacaCover(
  formData: FormData
) {
  const supabase = await createClient();

  const id = String(
    formData.get("id")
  );

  const url = String(
    formData.get("url")
  );

  const { error } = await supabase
    .from("paca_categories")
    .update({
      cover_url: url,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/pacas");
  revalidatePath(`/admin/pacas/${id}`);
}


// ============================================================
// SERIES
// NUEVOS CÓDIGOS YA NO SE CREAN AQUÍ.
// NACEN DESDE UNA COMPRA CHINA.
// ============================================================

export async function updateSeriesProduct(
  formData: FormData
) {
  const supabase = await createClient();

  const id = String(
    formData.get("id")
  );

  const name = String(
    formData.get("name") ?? ""
  ).trim();

  const pricePreorder = Number(
    formData.get("price_preorder") ?? 0
  );

  const priceStock = Number(
    formData.get("price_stock") ?? 0
  );

  const preorderMarkup = Number(
    formData.get(
      "preorder_markup_pct"
    ) ?? 30
  );

  const stockMarkup = Number(
    formData.get(
      "stock_markup_pct"
    ) ?? 40
  );

  const description = String(
    formData.get("description") ?? ""
  );

  if (
    !Number.isFinite(pricePreorder) ||
    pricePreorder <= 0
  ) {
    throw new Error(
      "Ingresa un precio de preventa válido."
    );
  }

  if (
    !Number.isFinite(priceStock) ||
    priceStock <= 0
  ) {
    throw new Error(
      "Ingresa un precio de stock válido."
    );
  }

  const { error } = await supabase
    .from("series_products")
    .update({
      name,

      price_preorder:
        pricePreorder,

      price_stock:
        priceStock,

      preorder_markup_pct:
        Number.isFinite(
          preorderMarkup
        )
          ? preorderMarkup
          : 30,

      stock_markup_pct:
        Number.isFinite(
          stockMarkup
        )
          ? stockMarkup
          : 40,

      description,

      active:
        formData.get("active") === "on",

      featured:
        formData.get("featured") === "on",

      updated_at:
        new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/series");
  revalidatePath("/admin/series");
  revalidatePath(`/admin/series/${id}`);
}

export async function setSeriesCover(
  formData: FormData
) {
  const supabase = await createClient();

  const id = String(
    formData.get("id")
  );

  const url = String(
    formData.get("url")
  );

  const { error } = await supabase
    .from("series_products")
    .update({
      cover_url: url,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/series");
  revalidatePath(`/admin/series/${id}`);
}


// ============================================================
// COMPRAS CHINA
// ============================================================

export async function createChinaPurchaseV2(
  formData: FormData
) {
  const supabase = await createClient();

  const raw = String(
    formData.get("payload") ?? "{}"
  );

  let payload: unknown;

  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error(
      "No se pudo leer la compra."
    );
  }

  const { data, error } =
    await supabase.rpc(
      "create_series_china_purchase_v2",
      {
        p_payload: payload,
      }
    );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/series");
  revalidatePath("/admin");
  revalidatePath("/admin/series");
  revalidatePath("/admin/series/compras");

  redirect(
    `/admin/series/compras/${data}`
  );
}

export async function setChinaPurchaseStatusV2(
  formData: FormData
) {
  const supabase = await createClient();

  const id = String(
    formData.get("id")
  );

  const status = String(
    formData.get("status")
  );

  const { error } =
    await supabase.rpc(
      "set_series_china_purchase_status_v2",
      {
        p_purchase_id: id,
        p_status: status,
      }
    );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/series");
  revalidatePath("/admin");
  revalidatePath("/admin/series");
  revalidatePath("/admin/series/compras");
  revalidatePath(`/admin/series/compras/${id}`);
}

export async function markChinaPurchaseReceivedV2(
  formData: FormData
) {
  const supabase = await createClient();

  const id = String(
    formData.get("id")
  );

  const { error } =
    await supabase.rpc(
      "mark_series_china_purchase_received_v2",
      {
        p_purchase_id: id,
      }
    );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/series");
  revalidatePath("/admin");
  revalidatePath("/admin/series");
  revalidatePath("/admin/series/compras");
  revalidatePath(`/admin/series/compras/${id}`);
}
