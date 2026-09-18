import Link from "next/link";
import { Calculator, Plus, Settings2, Ship } from "lucide-react";

import { createSeriesProduct } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function money(value: number | string | null) {
  return `S/ ${Number(value ?? 0).toFixed(2)}`;
}

export default async function AdminSeriesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("series_products")
    .select(`
      id,
      code,
      name,
      slug,
      cover_url,
      sizes,
      pieces_per_series,
      price_preorder,
      price_stock,
      preorder_markup_pct,
      stock_markup_pct,
      stock_series_available,
      preorder_series_available,
      avg_supplier_cost_series,
      avg_landed_cost_series,
      avg_landed_cost_piece,
      active
    `)
    .order("created_at", { ascending: false });

  const products = data ?? [];
  const totalStock = products.reduce(
    (sum, item) => sum + Number(item.stock_series_available ?? 0),
    0
  );
  const totalPreorder = products.reduce(
    (sum, item) => sum + Number(item.preorder_series_available ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-[#eaded3] bg-white p-6 shadow-[0_8px_28px_rgba(100,70,40,.05)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#5a8b86]">Series Kids</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-.04em]">Inventario de Series</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7f746c]">
              Precio preventa, precio stock, costo real por serie y costo real por prenda.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/series/compras"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f4faf8] px-4 text-xs font-black text-[#42746e]"
            >
              <Ship size={15} />
              Compras China
            </Link>

            <Link
              href="/admin/series/compras/nueva"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#b63a2c] px-4 text-xs font-black text-white"
            >
              <Plus size={15} />
              Nueva compra
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[20px] bg-[#edf7f5] p-4">
            <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#42746e]">Stock físico</p>
            <p className="mt-2 text-2xl font-black text-[#42746e]">{totalStock}</p>
            <p className="mt-1 text-xs text-[#64847f]">series completas posibles</p>
          </div>
          <div className="rounded-[20px] bg-[#fff6e9] p-4">
            <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#9b6510]">En preventa</p>
            <p className="mt-2 text-2xl font-black text-[#9b6510]">{totalPreorder}</p>
            <p className="mt-1 text-xs text-[#9b7b48]">series que vienen en camino</p>
          </div>
          <div className="rounded-[20px] bg-[#fff0e9] p-4">
            <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#9b382b]">Modelos</p>
            <p className="mt-2 text-2xl font-black text-[#9b382b]">{products.length}</p>
            <p className="mt-1 text-xs text-[#997068]">códigos registrados</p>
          </div>
        </div>
      </section>

      <details className="overflow-hidden rounded-[28px] border border-[#eaded3] bg-white shadow-[0_8px_28px_rgba(100,70,40,.05)]">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 font-black">
          <span className="grid size-10 place-items-center rounded-full bg-[#fff0e9] text-[#b63a2c]">
            <Plus size={17} />
          </span>
          Crear nuevo código
        </summary>

        <form
          action={createSeriesProduct}
          className="grid gap-4 border-t border-[#eaded3] bg-[#fffdfb] p-5 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-black">Nombre del conjunto</label>
            <input name="name" className="ti-input" placeholder="Ej: Conjunto Floral" required />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black">Tallas de la serie</label>
            <input name="sizes" className="ti-input" placeholder="Ej: 1,2,3,4,5" required />
            <p className="mt-2 text-xs text-[#7f746c]">
              El sistema calcula cuántas prendas tiene cada serie.
            </p>
          </div>

          <div className="rounded-[18px] bg-[#f7f2ec] p-4">
            <p className="text-xs font-black uppercase tracking-[.1em] text-[#5a8b86]">Código automático</p>
            <p className="mt-2 text-sm font-black">TI0001, TI0002, TI0003...</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black">Precio preventa</label>
            <div className="flex overflow-hidden rounded-[18px] border border-[#d8c6b8] bg-white">
              <div className="grid min-w-[58px] place-items-center border-r border-[#eaded3] bg-[#fff6e9] font-black text-[#9b6510]">S/</div>
              <input
                name="price_preorder"
                type="number"
                step="0.01"
                min="0"
                className="h-14 min-w-0 flex-1 border-0 bg-transparent px-4 text-lg font-black outline-none"
                placeholder="230.00"
                required
              />
            </div>
            <p className="mt-2 text-xs text-[#7f746c]">Se usa cuando la carga está en tránsito.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black">Precio stock</label>
            <div className="flex overflow-hidden rounded-[18px] border border-[#d8c6b8] bg-white">
              <div className="grid min-w-[58px] place-items-center border-r border-[#eaded3] bg-[#fff0e9] font-black text-[#9b382b]">S/</div>
              <input
                name="price_stock"
                type="number"
                step="0.01"
                min="0"
                className="h-14 min-w-0 flex-1 border-0 bg-transparent px-4 text-lg font-black outline-none"
                placeholder="260.00"
                required
              />
            </div>
            <p className="mt-2 text-xs text-[#7f746c]">Se usa cuando la mercadería ya llegó.</p>
          </div>

          <button className="ti-button ti-button-primary md:col-span-2">Crear código</button>
        </form>
      </details>

      <section>
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#5a8b86]">Modelos</p>
          <h2 className="mt-1 text-2xl font-black">Costos y disponibilidad</h2>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-4">
          {products.map((item) => {
            const pieces = Math.max(Number(item.pieces_per_series || item.sizes?.length || 1), 1);
            const preorderPerPiece = Number(item.price_preorder ?? 0) / pieces;
            const stockPerPiece = Number(item.price_stock ?? 0) / pieces;
            const suggestedPreorder =
              Number(item.avg_landed_cost_series ?? 0) *
              (1 + Number(item.preorder_markup_pct ?? 30) / 100);
            const suggestedStock =
              Number(item.avg_landed_cost_series ?? 0) *
              (1 + Number(item.stock_markup_pct ?? 40) / 100);

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-[24px] border border-[#eaded3] bg-white shadow-[0_7px_22px_rgba(100,70,40,.05)]"
              >
                <div
                  className="relative aspect-[4/3] bg-[#efe5dc] bg-cover bg-center"
                  style={item.cover_url ? { backgroundImage: `url(${item.cover_url})` } : undefined}
                >
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-black tracking-[.1em] text-[#5a8b86]">
                    {item.code}
                  </span>
                  <div className="absolute bottom-2.5 left-2.5 flex gap-1.5">
                    {Number(item.stock_series_available) > 0 && (
                      <span className="rounded-full bg-[#5a8b86] px-2.5 py-1 text-[9px] font-black text-white">
                        Stock {item.stock_series_available}
                      </span>
                    )}
                    {Number(item.preorder_series_available) > 0 && (
                      <span className="rounded-full bg-[#d39218] px-2.5 py-1 text-[9px] font-black text-white">
                        Camino {item.preorder_series_available}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5">
                  <h3 className="truncate text-[15px] font-black">{item.name}</h3>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-[14px] bg-[#fff8e9] p-2.5">
                      <p className="text-[8px] font-black uppercase tracking-[.08em] text-[#9b6510]">Preventa</p>
                      <p className="mt-1 text-sm font-black text-[#9b6510]">{money(item.price_preorder)}</p>
                      <p className="mt-1 text-[9px] font-bold text-[#9b7b48]">{money(preorderPerPiece)} / prenda</p>
                    </div>
                    <div className="rounded-[14px] bg-[#fff0e9] p-2.5">
                      <p className="text-[8px] font-black uppercase tracking-[.08em] text-[#9b382b]">Stock</p>
                      <p className="mt-1 text-sm font-black text-[#9b382b]">{money(item.price_stock)}</p>
                      <p className="mt-1 text-[9px] font-bold text-[#9e6d64]">{money(stockPerPiece)} / prenda</p>
                    </div>
                  </div>

                  <div className="mt-2 rounded-[14px] bg-[#f4faf8] p-2.5">
                    <div className="flex items-center gap-2">
                      <Calculator size={13} className="text-[#5a8b86]" />
                      <p className="text-[8px] font-black uppercase tracking-[.08em] text-[#42746e]">Costo real</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
                      <span className="text-[#6f655e]">Serie</span><b>{money(item.avg_landed_cost_series)}</b>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[10px]">
                      <span className="text-[#6f655e]">Prenda</span><b>{money(item.avg_landed_cost_piece)}</b>
                    </div>
                  </div>

                  {Number(item.avg_landed_cost_series) > 0 && (
                    <div className="mt-2 text-[9px] font-bold text-[#8b8078]">
                      Sug. preventa {money(suggestedPreorder)} · stock {money(suggestedStock)}
                    </div>
                  )}

                  <Link
                    href={`/admin/series/${item.id}`}
                    className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-[14px] bg-[#fff0e9] text-[11px] font-black text-[#9b382b]"
                  >
                    <Settings2 size={14} />
                    Administrar
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
