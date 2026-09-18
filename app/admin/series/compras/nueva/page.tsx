import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { ChinaPurchaseForm } from "@/components/admin/ChinaPurchaseForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewChinaPurchasePage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("series_products")
    .select(`
      id,
      code,
      name,
      sizes,
      pieces_per_series,
      price_preorder,
      price_stock,
      cover_url
    `)
    .eq("active", true)
    .order("code");

  const products = (data ?? []).map((item) => ({
    ...item,
    sizes: item.sizes ?? [],
    pieces_per_series: Number(item.pieces_per_series ?? 0),
    price_preorder:
      item.price_preorder === null ? null : Number(item.price_preorder),
    price_stock: item.price_stock === null ? null : Number(item.price_stock),
  }));

  return (
    <div className="space-y-6">
      <Link
        href="/admin/series/compras"
        className="inline-flex items-center gap-2 text-sm font-black text-[#8f3a2e]"
      >
        <ArrowLeft size={16} />
        Volver a compras
      </Link>

      <section className="rounded-[30px] border border-[#eaded3] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#fff6e9] text-[#d39218] sm:size-12">
            <Sparkles size={19} />
          </span>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#5a8b86] sm:text-xs">
              Compras China
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">
              Nueva carga
            </h1>

            <p className="mt-2 max-w-3xl text-xs leading-5 text-[#7f746c] sm:text-sm sm:leading-6">
              Flujo inspirado en el módulo de MAKEK: registra pagos por etapas,
              códigos/modelos, gastos de importación y recién al final revisa el
              costo real y los precios sugeridos. En Tendencias cada código puede
              tener varios colores y venderse surtido.
            </p>
          </div>
        </div>
      </section>

      <ChinaPurchaseForm products={products as any} />
    </div>
  );
}
