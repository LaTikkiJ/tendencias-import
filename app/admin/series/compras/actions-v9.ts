"use server";

import {
  redirect,
} from "next/navigation";

import {
  revalidatePath,
} from "next/cache";

import {
  createClient,
} from "@/lib/supabase/server";

type PayloadItem = {
  cover_url?: string | null;
};

type PurchasePayload = {
  items?: PayloadItem[];
};

export async function createChinaPurchaseV9(
  formData: FormData
) {
  const supabase =
    await createClient();

  const raw =
    String(
      formData.get(
        "payload"
      ) ?? "{}"
    );

  let payload:
    PurchasePayload;

  try {
    payload =
      JSON.parse(
        raw
      );
  } catch {
    throw new Error(
      "No se pudo leer la compra."
    );
  }

  const {
    data:
      purchaseId,
    error,
  } =
    await supabase.rpc(
      "create_series_china_purchase_v9",
      {
        p_payload:
          payload,
      }
    );

  if (error) {
    throw new Error(
      error.message
    );
  }

  const {
    data:
      purchaseItems,
    error:
      itemsError,
  } =
    await supabase
      .from(
        "series_china_purchase_items"
      )
      .select(
        "line_no,product_id"
      )
      .eq(
        "purchase_id",
        purchaseId
      )
      .order(
        "line_no"
      );

  if (itemsError) {
    throw new Error(
      itemsError.message
    );
  }

  const rows =
    payload.items ??
    [];

  for (
    const item of
    purchaseItems ??
    []
  ) {
    const source =
      rows[
        Number(
          item.line_no
        ) - 1
      ];

    const cover =
      source
        ?.cover_url
        ?.trim();

    if (!cover) {
      continue;
    }

    const {
      error:
        coverError,
    } =
      await supabase
        .from(
          "series_products"
        )
        .update({
          cover_url:
            cover,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          item.product_id
        );

    if (coverError) {
      throw new Error(
        coverError.message
      );
    }
  }

  revalidatePath("/");
  revalidatePath("/series");
  revalidatePath("/admin");
  revalidatePath("/admin/series");
  revalidatePath("/admin/series/compras");

  redirect(
    `/admin/series/compras/${purchaseId}`
  );
}
