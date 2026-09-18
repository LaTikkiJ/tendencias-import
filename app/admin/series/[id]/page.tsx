import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calculator, PackageCheck, Ship } from "lucide-react";

import { updateSeriesProduct } from "@/app/admin/actions";
import { MediaManager } from "@/components/admin/MediaManager";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function money(value: number | string | null) {
  return `S/ ${Number(value ?? 0).toFixed(2)}`;
}

export default async function AdminSeriesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: media }, { data: inventoryRows }] = await Promise.all([
    supabase.from("series_products").select("*").eq("id", id).single(),
    supabase
      .from("series_media")
      .select("id,media_type,url,title,sort_order")
      .eq("product_id", id)
      .order("sort_order"),
    supabase
      .from("series_inventory_lots")
      .select("color,size,qty_available,unit_cost")
      .eq("product_id", id),
  ]);

  if (!product) notFound();

  const pieces = Math.max(
    Number(product.pieces_per_series || product.sizes?.length || 1),
    1
  );

  const suggestedPreorder =
    Number(product.avg_landed_cost_series ?? 0) *
    (1 + Number(product.preorder_markup_pct ?? 30) / 100);

  const suggestedStock =
    Number(product.avg_landed_cost_series ?? 0) *
    (1 + Number(product.stock_markup_pct ?? 40) / 100);

  const inventoryMap = new Map<string, Map<string, number>>();

  for (const row of inventoryRows ?? []) {
    const color = row.color || "Único";
    if (!inventoryMap.has(color)) inventoryMap.set(color, new Map());
    const sizes = inventoryMap.get(color)!;
    sizes.set(row.size, (sizes.get(row.size) ?? 0) + Number(row.qty_available ?? 0));
  }

  const inventory = Array.from(inventoryMap.entries());

  return (
    <div className="space-y-6">
      <Link
        href="/admin/series"
        className="inline-flex items-center gap-2 text-sm font-black text-[#8f3a2e]"
      >
        <ArrowLeft size={16} />
        Volver a series
      </Link>

      <section className="rounded-[30px] border border-[#eaded3] bg-white p-6 shadow-[0_8px_28px_rgba(100,70,40,.05)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#5a8b86]">{product.code}</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-.04em]">{product.name}</h1>
            <p className="mt-2 text-sm text-[#7f746c]">
              {(product.sizes ?? []).join(" · ")} · {pieces} prendas por serie
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#edf7f5] px-4 py-2 text-xs font-black text-[#42746e]">
              <PackageCheck size={14} />
              Stock {product.stock_series_available ?? 0}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#fff6e9] px-4 py-2 text-xs font-black text-[#9b6510]">
              <Ship size={14} />
              En camino {product.preorder_series_available ?? 0}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[22px] bg-white p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#8b8078]">
            Costo proveedor / serie
          </p>
          <p className="mt-2 text-xl font-black">{money(product.avg_supplier_cost_series)}</p>
          <p className="mt-1 text-xs text-[#8b8078]">
            {money(Number(product.avg_supplier_cost_series ?? 0) / pieces)} por prenda
          </p>
        </div>

        <div className="rounded-[22px] bg-[#f4faf8] p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#42746e]">
            Costo real / serie
          </p>
          <p className="mt-2 text-xl font-black text-[#42746e]">{money(product.avg_landed_cost_series)}</p>
          <p className="mt-1 text-xs font-bold text-[#64847f]">
            {money(product.avg_landed_cost_piece)} por prenda
          </p>
        </div>

        <div className="rounded-[22px] bg-[#fff8e9] p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#9b6510]">Precio preventa</p>
          <p className="mt-2 text-xl font-black text-[#9b6510]">{money(product.price_preorder)}</p>
          <p className="mt-1 text-xs font-bold text-[#9b7b48]">
            {money(Number(product.price_preorder ?? 0) / pieces)} por prenda
          </p>
        </div>

        <div className="rounded-[22px] bg-[#fff0e9] p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#9b382b]">Precio stock</p>
          <p className="mt-2 text-xl font-black text-[#9b382b]">{money(product.price_stock)}</p>
          <p className="mt-1 text-xs font-bold text-[#9e6d64]">
            {money(Number(product.price_stock ?? 0) / pieces)} por prenda
          </p>
        </div>
      </section>

      {Number(product.avg_landed_cost_series) > 0 && (
        <section className="rounded-[24px] border border-[#e3ece9] bg-[#f4faf8] p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#5a8b86] text-white">
              <Calculator size={18} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="font-black">Precio sugerido</p>
              <p className="mt-1 text-xs leading-5 text-[#64847f]">
                Se calcula usando el costo real puesto en Perú.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] bg-white p-4">
                  <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#9b6510]">
                    Preventa +{Number(product.preorder_markup_pct ?? 30)}%
                  </p>
                  <p className="mt-2 text-xl font-black text-[#9b6510]">{money(suggestedPreorder)}</p>
                </div>

                <div className="rounded-[18px] bg-white p-4">
                  <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#9b382b]">
                    Stock +{Number(product.stock_markup_pct ?? 40)}%
                  </p>
                  <p className="mt-2 text-xl font-black text-[#9b382b]">{money(suggestedStock)}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <form
        action={updateSeriesProduct}
        className="rounded-[28px] border border-[#eaded3] bg-white p-5 shadow-[0_8px_28px_rgba(100,70,40,.05)]"
      >
        <input type="hidden" name="id" value={product.id} />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-black">Nombre del conjunto</label>
            <input name="name" className="ti-input" defaultValue={product.name} required />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black">Tallas</label>
            <input
              name="sizes"
              className="ti-input"
              defaultValue={(product.sizes ?? []).join(", ")}
              required
            />
          </div>

          <div className="rounded-[18px] bg-[#f7f2ec] p-4">
            <p className="text-[10px] font-black uppercase tracking-[.1em] text-[#5a8b86]">Identificación</p>
            <p className="mt-2 font-black">{product.code}</p>
            <p className="mt-1 break-all text-[10px] text-[#7f746c]">/series/{product.slug}</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black">Precio preventa</label>
            <div className="flex overflow-hidden rounded-[18px] border border-[#e5d9ce]">
              <span className="grid min-w-14 place-items-center bg-[#fff6e9] font-black text-[#9b6510]">S/</span>
              <input
                name="price_preorder"
                type="number"
                min="0"
                step="0.01"
                defaultValue={product.price_preorder ?? 0}
                className="h-14 min-w-0 flex-1 border-0 px-4 text-lg font-black outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black">Precio stock</label>
            <div className="flex overflow-hidden rounded-[18px] border border-[#e5d9ce]">
              <span className="grid min-w-14 place-items-center bg-[#fff0e9] font-black text-[#9b382b]">S/</span>
              <input
                name="price_stock"
                type="number"
                min="0"
                step="0.01"
                defaultValue={product.price_stock ?? 0}
                className="h-14 min-w-0 flex-1 border-0 px-4 text-lg font-black outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black">% sugerido preventa</label>
            <input
              name="preorder_markup_pct"
              type="number"
              min="0"
              step="0.01"
              defaultValue={product.preorder_markup_pct ?? 30}
              className="ti-input"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black">% sugerido stock</label>
            <input
              name="stock_markup_pct"
              type="number"
              min="0"
              step="0.01"
              defaultValue={product.stock_markup_pct ?? 40}
              className="ti-input"
            />
          </div>

          <label className="flex min-h-14 items-center gap-3 rounded-[18px] border border-[#eaded3] bg-white px-4">
            <input type="checkbox" name="active" defaultChecked={product.active} className="size-4" />
            <div>
              <p className="font-black">Visible en la web</p>
              <p className="text-xs text-[#7f746c]">Mostrar a las clientas.</p>
            </div>
          </label>

          <label className="flex min-h-14 items-center gap-3 rounded-[18px] border border-[#eaded3] bg-white px-4">
            <input type="checkbox" name="featured" defaultChecked={product.featured} className="size-4" />
            <div>
              <p className="font-black">Destacado</p>
              <p className="text-xs text-[#7f746c]">Prioridad en la tienda.</p>
            </div>
          </label>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-black">Descripción</label>
            <textarea
              name="description"
              className="ti-input min-h-28 py-3"
              defaultValue={product.description ?? ""}
              placeholder="Detalles del modelo..."
            />
          </div>

          <button className="ti-button ti-button-primary md:col-span-2">Guardar cambios</button>
        </div>
      </form>

      <section className="overflow-hidden rounded-[28px] border border-[#eaded3] bg-white shadow-[0_8px_28px_rgba(100,70,40,.05)]">
        <div className="border-b border-[#eaded3] px-5 py-4">
          <p className="font-black">Inventario físico por color y talla</p>
          <p className="mt-1 text-xs text-[#7f746c]">
            Se genera cuando una compra China se marca como recibida.
          </p>
        </div>

        {inventory.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[#8b8078]">
            Todavía no hay stock físico recibido para este código.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[650px] w-full border-collapse">
              <thead>
                <tr className="bg-[#f8f4f0] text-[10px] font-black uppercase tracking-[.08em] text-[#786d65]">
                  <th className="px-4 py-3 text-left">Color</th>
                  {(product.sizes ?? []).map((size: string) => (
                    <th key={size} className="px-4 py-3 text-center">{size}</th>
                  ))}
                  <th className="px-4 py-3 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(([color, sizes]) => {
                  const total = Array.from(sizes.values()).reduce((sum, qty) => sum + qty, 0);
                  return (
                    <tr key={color} className="border-t border-[#f0e7df]">
                      <td className="px-4 py-3 text-sm font-black">{color}</td>
                      {(product.sizes ?? []).map((size: string) => (
                        <td key={size} className="px-4 py-3 text-center text-sm font-black">
                          {sizes.get(size) ?? 0}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center text-sm font-black text-[#5a8b86]">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <MediaManager
        ownerType="series"
        ownerId={product.id}
        initialMedia={(media ?? []) as any}
        currentCover={product.cover_url}
      />
    </div>
  );
}
