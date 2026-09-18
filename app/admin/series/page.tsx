import Link from "next/link";

import {
  ImagePlus,
  PackageCheck,
  Settings2,
  Ship,
  ShoppingCart,
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

  const stockTotal =
    products.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.stock_series_available ??
            0
        ),
      0
    );

  const preorderTotal =
    products.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.preorder_series_available ??
            0
        ),
      0
    );

  return (
    <div className="space-y-5">
      <section className="rounded-[26px] border border-[#eaded3] bg-white p-5 shadow-sm sm:rounded-[30px] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#5a8b86] sm:text-xs">
              Series
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">
              Inventario Series
            </h1>

            <p className="mt-2 max-w-2xl text-xs leading-5 text-[#7f746c] sm:text-sm sm:leading-6">
              Aquí quedan todos los
              códigos que nacen desde
              Compras China. También
              administras lo que verá
              la clienta en la web:
              nombre, fotos, videos y
              precios.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/admin/pedidos/nueva"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[17px] bg-[#5a8b86] px-5 text-xs font-black text-white sm:min-h-12 sm:text-sm"
            >
              <ShoppingCart size={16} />
              Venta manual
            </Link>

            <Link
              href="/admin/series/compras/nueva"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[17px] bg-[#b63a2c] px-5 text-xs font-black text-white sm:min-h-12 sm:text-sm"
            >
              <Ship size={16} />
              Registrar compra
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-[20px] bg-[#edf7f5] p-4">
          <p className="text-[8px] font-black uppercase tracking-[.08em] text-[#42746e]">
            Stock
          </p>

          <p className="mt-2 text-2xl font-black text-[#42746e]">
            {
              stockTotal
            }
          </p>

          <p className="mt-1 text-[9px] text-[#64847f]">
            series posibles
          </p>
        </div>

        <div className="rounded-[20px] bg-[#fff8e9] p-4">
          <p className="text-[8px] font-black uppercase tracking-[.08em] text-[#9b6510]">
            Preventa
          </p>

          <p className="mt-2 text-2xl font-black text-[#9b6510]">
            {
              preorderTotal
            }
          </p>

          <p className="mt-1 text-[9px] text-[#9b7b48]">
            en camino
          </p>
        </div>

        <div className="col-span-2 rounded-[20px] bg-white p-4 sm:col-span-1">
          <p className="text-[8px] font-black uppercase tracking-[.08em] text-[#8b8078]">
            Modelos
          </p>

          <p className="mt-2 text-2xl font-black text-[#8f3a2e]">
            {
              products.length
            }
          </p>

          <p className="mt-1 text-[9px] text-[#8b8078]">
            códigos registrados
          </p>
        </div>
      </section>

      {products.length ===
      0 ? (
        <section className="rounded-[26px] border border-[#eaded3] bg-white p-8 text-center">
          <PackageCheck
            size={
              30
            }
            className="mx-auto text-[#5a8b86]"
          />

          <p className="mt-4 font-black">
            Aún no hay códigos
          </p>

          <p className="mt-2 text-sm text-[#7f746c]">
            Registra una compra
            China y aparecerán
            aquí automáticamente.
          </p>
        </section>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {products.map(
            (
              item
            ) => (
              <article
                key={
                  item.id
                }
                className="overflow-hidden rounded-[22px] border border-[#eaded3] bg-white shadow-[0_7px_22px_rgba(100,70,40,.05)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#efe5dc]">
                  {item.cover_url ? (
                    <img
                      src={
                        item.cover_url
                      }
                      alt={
                        item.name
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <ImagePlus
                        size={
                          27
                        }
                        className="text-[#bda99b]"
                      />
                    </div>
                  )}

                  <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[8px] font-black text-[#5a8b86]">
                    {
                      item.code
                    }
                  </span>

                  <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
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
                        Preventa{" "}
                        {
                          item.preorder_series_available
                        }
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5">
                  <h2 className="line-clamp-2 text-sm font-black">
                    {
                      item.name
                    }
                  </h2>

                  <p className="mt-1 truncate text-[9px] font-bold text-[#8b8078]">
                    {(
                      item.sizes ??
                      []
                    ).join(
                      " · "
                    )}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-[13px] bg-[#fff8e9] p-2.5">
                      <p className="text-[7px] font-black uppercase text-[#9b6510]">
                        Preventa
                      </p>

                      <p className="mt-1 text-xs font-black text-[#9b6510]">
                        {money(
                          item.price_preorder
                        )}
                      </p>
                    </div>

                    <div className="rounded-[13px] bg-[#fff0e9] p-2.5">
                      <p className="text-[7px] font-black uppercase text-[#9b382b]">
                        Stock
                      </p>

                      <p className="mt-1 text-xs font-black text-[#9b382b]">
                        {money(
                          item.price_stock
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 rounded-[13px] bg-[#f4faf8] p-2.5">
                    <p className="text-[7px] font-black uppercase text-[#42746e]">
                      Costo real
                    </p>

                    <div className="mt-1 flex items-center justify-between gap-2 text-[9px]">
                      <span>
                        Serie
                      </span>

                      <b>
                        {money(
                          item.avg_landed_cost_series
                        )}
                      </b>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2 text-[9px]">
                      <span>
                        Prenda
                      </span>

                      <b>
                        {money(
                          item.avg_landed_cost_piece
                        )}
                      </b>
                    </div>
                  </div>

                  <Link
                    href={`/admin/series/${item.id}`}
                    className="mt-3 flex min-h-10 items-center justify-center gap-2 rounded-[14px] bg-[#fff0e9] text-[10px] font-black text-[#9b382b]"
                  >
                    <Settings2
                      size={
                        13
                      }
                    />

                    Inventario y ficha web
                  </Link>
                </div>
              </article>
            )
          )}
        </section>
      )}
    </div>
  );
}
