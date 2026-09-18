import Link from "next/link";

import {
  ArrowLeft,
  Ship,
} from "lucide-react";

import {
  ChinaPurchaseForm,
} from "@/components/admin/ChinaPurchaseForm";

import {
  createClient,
} from "@/lib/supabase/server";

export const dynamic =
  "force-dynamic";

export default async function NewChinaPurchasePage() {
  const supabase =
    await createClient();

  const { data } =
    await supabase
      .from("series_products")
      .select(`
        id,
        code,
        name,
        sizes,
        pieces_per_series,
        price_preorder,
        price_stock
      `)
      .eq("active", true)
      .order("code");

  return (
    <div className="space-y-6">
      <Link
        href="/admin/series/compras"
        className="inline-flex items-center gap-2 text-sm font-black text-[#8f3a2e]"
      >
        <ArrowLeft
          size={16}
        />

        Volver
      </Link>

      <section className="rounded-[30px] border border-[#eaded3] bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#fff6e9] text-[#d39218]">
            <Ship
              size={19}
            />
          </span>

          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#5a8b86]">
              Compras China
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-[-.04em]">
              Nueva carga
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#7f746c]">
              Aquí nacen los nuevos
              códigos. Al guardar la
              compra, los modelos
              aparecen automáticamente
              en Series.
            </p>
          </div>
        </div>
      </section>

      <ChinaPurchaseForm
        products={
          (data ?? []).map(
            (item) => ({
              ...item,
              price_preorder:
                Number(
                  item.price_preorder ??
                    0
                ),

              price_stock:
                Number(
                  item.price_stock ??
                    0
                ),
            })
          ) as any
        }
      />
    </div>
  );
}
