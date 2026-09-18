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
      preorder_markup_pct,
      stock_markup_pct
    `)
    .eq("active", true)
    .order("code");

  const products = (data ?? []).map((item) => ({
    ...item,
    price_preorder: Number(item.price_preorder ?? 0),
    price_stock: Number(item.price_stock ?? 0),
    preorder_markup_pct: Number(item.preorder_markup_pct ?? 30),
    stock_markup_pct: Number(item.stock_markup_pct ?? 40),
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

      <section className="rounded-[30px] border border-[#eaded3] bg-white p-6 shadow-[0_8px_28px_rgba(100,70,40,.05)]">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#fff6e9] text-[#d39218]">
            <Sparkles size={19} />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#5a8b86]">
              Nueva compra China
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-[-.04em]">Registra toda la carga</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#7f746c]">
              Los códigos se agregan en una tabla para que una compra de 10, 20 o más códigos siga
              siendo fácil de revisar. Si un modelo vino en dos colores, agrega una fila por color.
            </p>
          </div>
        </div>
      </section>

      {products.length === 0 ? (
        <section className="rounded-[26px] border border-[#eaded3] bg-white p-6">
          <p className="font-black">Primero registra tus códigos en Series.</p>
          <p className="mt-2 text-sm text-[#7f746c]">
            La compra se vincula a los modelos existentes para conservar correctamente costos, fotos,
            tallas y stock.
          </p>
          <Link
            href="/admin/series"
            className="mt-4 inline-flex rounded-full bg-[#b63a2c] px-5 py-3 text-sm font-black text-white"
          >
            Ir a Series
          </Link>
        </section>
      ) : (
        <ChinaPurchaseForm products={products as any} />
      )}
    </div>
  );
}
