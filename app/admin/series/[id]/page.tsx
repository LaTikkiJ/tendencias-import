import Link from "next/link";
import {
  notFound,
} from "next/navigation";

import {
  ArrowLeft,
  PackageCheck,
  Ship,
} from "lucide-react";

import {
  updateSeriesProduct,
} from "@/app/admin/actions";

import {
  MediaManager,
} from "@/components/admin/MediaManager";

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

export default async function AdminSeriesDetailPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;

  const supabase =
    await createClient();

  const [
    { data: product },
    { data: media },
    { data: inventoryRows },
  ] = await Promise.all([
    supabase
      .from(
        "series_products"
      )
      .select("*")
      .eq("id", id)
      .single(),

    supabase
      .from(
        "series_media"
      )
      .select(
        "id,media_type,url,title,sort_order"
      )
      .eq(
        "product_id",
        id
      )
      .order(
        "sort_order"
      ),

    supabase
      .from(
        "series_inventory_lots"
      )
      .select(
        "color,size,qty_available,unit_cost"
      )
      .eq(
        "product_id",
        id
      ),
  ]);

  if (!product) {
    notFound();
  }

  const inventoryMap =
    new Map<
      string,
      Map<
        string,
        number
      >
    >();

  for (
    const row of
    inventoryRows ?? []
  ) {
    const color =
      row.color ||
      "Único";

    if (
      !inventoryMap.has(
        color
      )
    ) {
      inventoryMap.set(
        color,
        new Map()
      );
    }

    const sizes =
      inventoryMap.get(
        color
      )!;

    sizes.set(
      row.size,
      (
        sizes.get(
          row.size
        ) ?? 0
      ) +
        Number(
          row.qty_available ??
            0
        )
    );
  }

  const inventory =
    Array.from(
      inventoryMap.entries()
    );

  return (
    <div className="space-y-6">
      <Link
        href="/admin/series"
        className="inline-flex items-center gap-2 text-sm font-black text-[#8f3a2e]"
      >
        <ArrowLeft
          size={16}
        />

        Volver
      </Link>

      <section className="rounded-[30px] border border-[#eaded3] bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[.18em] text-[#5a8b86]">
          {
            product.code
          }
        </p>

        <h1 className="mt-2 text-4xl font-black">
          {
            product.name
          }
        </h1>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#edf7f5] px-3 py-2 text-xs font-black text-[#42746e]">
            <PackageCheck
              size={13}
            />

            Stock{" "}
            {
              product.stock_series_available ??
              0
            }
          </span>

          <span className="inline-flex items-center gap-2 rounded-full bg-[#fff6e9] px-3 py-2 text-xs font-black text-[#9b6510]">
            <Ship
              size={13}
            />

            En camino{" "}
            {
              product.preorder_series_available ??
              0
            }
          </span>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[20px] bg-white p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase text-[#8b8078]">
            Prov. / serie
          </p>

          <p className="mt-2 text-xl font-black">
            {money(
              product.avg_supplier_cost_series
            )}
          </p>
        </div>

        <div className="rounded-[20px] bg-[#f4faf8] p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase text-[#42746e]">
            Real / serie
          </p>

          <p className="mt-2 text-xl font-black text-[#42746e]">
            {money(
              product.avg_landed_cost_series
            )}
          </p>

          <p className="mt-1 text-xs font-bold text-[#64847f]">
            {money(
              product.avg_landed_cost_piece
            )}{" "}
            / prenda
          </p>
        </div>

        <div className="rounded-[20px] bg-[#fff8e9] p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase text-[#9b6510]">
            Preventa
          </p>

          <p className="mt-2 text-xl font-black text-[#9b6510]">
            {money(
              product.price_preorder
            )}
          </p>
        </div>

        <div className="rounded-[20px] bg-[#fff0e9] p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase text-[#9b382b]">
            Stock
          </p>

          <p className="mt-2 text-xl font-black text-[#9b382b]">
            {money(
              product.price_stock
            )}
          </p>
        </div>
      </section>

      <form
        action={
          updateSeriesProduct
        }
        className="rounded-[28px] border border-[#eaded3] bg-white p-5 shadow-sm"
      >
        <input
          type="hidden"
          name="id"
          value={
            product.id
          }
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-black">
              Nombre
            </label>

            <input
              name="name"
              className="ti-input"
              defaultValue={
                product.name
              }
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black">
              Precio preventa
            </label>

            <input
              name="price_preorder"
              type="number"
              step="0.01"
              min="0"
              className="ti-input"
              defaultValue={
                product.price_preorder ??
                0
              }
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black">
              Precio stock
            </label>

            <input
              name="price_stock"
              type="number"
              step="0.01"
              min="0"
              className="ti-input"
              defaultValue={
                product.price_stock ??
                0
              }
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black">
              % sugerido
              preventa
            </label>

            <input
              name="preorder_markup_pct"
              type="number"
              step="0.01"
              min="0"
              className="ti-input"
              defaultValue={
                product.preorder_markup_pct ??
                30
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black">
              % sugerido
              stock
            </label>

            <input
              name="stock_markup_pct"
              type="number"
              step="0.01"
              min="0"
              className="ti-input"
              defaultValue={
                product.stock_markup_pct ??
                40
              }
            />
          </div>

          <label className="flex items-center gap-3 rounded-[18px] border border-[#eaded3] p-4">
            <input
              type="checkbox"
              name="active"
              defaultChecked={
                product.active
              }
            />

            <span className="font-black">
              Visible
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-[18px] border border-[#eaded3] p-4">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={
                product.featured
              }
            />

            <span className="font-black">
              Destacado
            </span>
          </label>

          <textarea
            name="description"
            className="ti-input min-h-24 py-3 md:col-span-2"
            defaultValue={
              product.description ??
              ""
            }
            placeholder="Descripción..."
          />

          <button className="ti-button ti-button-primary md:col-span-2">
            Guardar cambios
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-[28px] border border-[#eaded3] bg-white shadow-sm">
        <div className="border-b border-[#eaded3] px-5 py-4">
          <p className="font-black">
            Stock por color y
            talla
          </p>
        </div>

        {inventory.length ===
        0 ? (
          <div className="p-8 text-center text-sm text-[#7f746c]">
            Este código todavía
            está en preventa o aún
            no se ha recibido
            físicamente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[650px] w-full">
              <thead>
                <tr className="bg-[#f8f4f0] text-[9px] font-black uppercase text-[#786d65]">
                  <th className="px-4 py-3 text-left">
                    Color
                  </th>

                  {(
                    product.sizes ??
                    []
                  ).map(
                    (
                      size: string
                    ) => (
                      <th
                        key={
                          size
                        }
                        className="px-4 py-3 text-center"
                      >
                        {
                          size
                        }
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {inventory.map(
                  ([
                    color,
                    sizes,
                  ]) => (
                    <tr
                      key={
                        color
                      }
                      className="border-t border-[#f0e7df]"
                    >
                      <td className="px-4 py-3 text-sm font-black">
                        {
                          color
                        }
                      </td>

                      {(
                        product.sizes ??
                        []
                      ).map(
                        (
                          size: string
                        ) => (
                          <td
                            key={
                              size
                            }
                            className="px-4 py-3 text-center text-sm font-black"
                          >
                            {sizes.get(
                              size
                            ) ??
                              0}
                          </td>
                        )
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <MediaManager
        ownerType="series"
        ownerId={
          product.id
        }
        initialMedia={
          (media ??
            []) as any
        }
        currentCover={
          product.cover_url
        }
      />
    </div>
  );
}
