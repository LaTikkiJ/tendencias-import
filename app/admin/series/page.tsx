import Link from "next/link";

import {
  PackageCheck,
  Settings2,
  Ship,
} from "lucide-react";

import {
  createClient,
} from "@/lib/supabase/server";

export const dynamic =
  "force-dynamic";

function money(
  value:
    | number
    | string
    | null
) {
  return `S/ ${Number(
    value ?? 0
  ).toFixed(2)}`;
}

export default async function AdminSeriesPage() {
  const supabase =
    await createClient();

  const { data } =
    await supabase
      .from(
        "series_products"
      )
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
        stock_series_available,
        preorder_series_available,
        avg_supplier_cost_series,
        avg_landed_cost_series,
        avg_landed_cost_piece,
        status,
        active
      `)
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      );

  const products =
    data ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-[#eaded3] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#5a8b86]">
              Inventario
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Series
            </h1>

            <p className="mt-2 max-w-xl text-sm text-[#7f746c]">
              Los nuevos códigos
              nacen desde Compras
              China. Aquí se
              administran después.
            </p>
          </div>

          <Link
            href="/admin/series/compras/nueva"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] bg-[#b63a2c] px-5 text-sm font-black text-white"
          >
            <Ship
              size={17}
            />

            Registrar compra
          </Link>
        </div>
      </section>

      {products.length ===
        0 ? (
        <section className="rounded-[26px] border border-[#eaded3] bg-white p-8 text-center">
          <PackageCheck
            size={30}
            className="mx-auto text-[#5a8b86]"
          />

          <p className="mt-4 font-black">
            Aún no hay códigos
          </p>

          <p className="mt-2 text-sm text-[#7f746c]">
            Registra la primera
            compra China y los
            códigos aparecerán
            aquí automáticamente.
          </p>
        </section>
      ) : (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-4">
          {products.map(
            (item) => (
              <article
                key={
                  item.id
                }
                className="overflow-hidden rounded-[22px] border border-[#eaded3] bg-white shadow-sm"
              >
                <div
                  className="relative aspect-[4/3] bg-[#efe5dc] bg-cover bg-center"
                  style={
                    item.cover_url
                      ? {
                          backgroundImage:
                            `url(${item.cover_url})`,
                        }
                      : undefined
                  }
                >
                  <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-black text-[#5a8b86]">
                    {
                      item.code
                    }
                  </span>

                  <div className="absolute bottom-2 left-2 flex gap-1">
                    {Number(
                      item.stock_series_available
                    ) >
                      0 && (
                      <span className="rounded-full bg-[#5a8b86] px-2 py-1 text-[8px] font-black text-white">
                        Stock{" "}
                        {
                          item.stock_series_available
                        }
                      </span>
                    )}

                    {Number(
                      item.preorder_series_available
                    ) >
                      0 && (
                      <span className="rounded-full bg-[#d39218] px-2 py-1 text-[8px] font-black text-white">
                        Camino{" "}
                        {
                          item.preorder_series_available
                        }
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3">
                  <h2 className="truncate text-sm font-black">
                    {
                      item.name
                    }
                  </h2>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-[13px] bg-[#fff8e9] p-2">
                      <p className="text-[8px] font-black uppercase text-[#9b6510]">
                        Preventa
                      </p>

                      <p className="mt-1 text-xs font-black text-[#9b6510]">
                        {money(
                          item.price_preorder
                        )}
                      </p>
                    </div>

                    <div className="rounded-[13px] bg-[#fff0e9] p-2">
                      <p className="text-[8px] font-black uppercase text-[#9b382b]">
                        Stock
                      </p>

                      <p className="mt-1 text-xs font-black text-[#9b382b]">
                        {money(
                          item.price_stock
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 rounded-[13px] bg-[#f4faf8] p-2">
                    <p className="text-[8px] font-black uppercase text-[#42746e]">
                      Costo real
                    </p>

                    <p className="mt-1 text-[10px] font-black">
                      Serie{" "}
                      {money(
                        item.avg_landed_cost_series
                      )}
                    </p>

                    <p className="mt-1 text-[10px] font-black">
                      Prenda{" "}
                      {money(
                        item.avg_landed_cost_piece
                      )}
                    </p>
                  </div>

                  <Link
                    href={`/admin/series/${item.id}`}
                    className="mt-3 flex min-h-9 items-center justify-center gap-2 rounded-[13px] bg-[#fff0e9] text-[10px] font-black text-[#9b382b]"
                  >
                    <Settings2
                      size={
                        13
                      }
                    />

                    Administrar
                  </Link>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </div>
  );
}
