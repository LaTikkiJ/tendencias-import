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
  markChinaPurchaseReceivedV2,
  setChinaPurchaseStatusV2,
} from "@/app/admin/actions";

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

export default async function ChinaPurchaseDetailPage({
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
    { data: purchase },
    { data: items },
  ] = await Promise.all([
    supabase
      .from(
        "series_china_purchases"
      )
      .select("*")
      .eq("id", id)
      .single(),

    supabase
      .from(
        "series_china_purchase_items"
      )
      .select(`
        *,
        series_products (
          id,
          code,
          name
        ),
        series_china_purchase_item_colors (
          color,
          series_qty
        )
      `)
      .eq(
        "purchase_id",
        id
      )
      .order("line_no"),
  ]);

  if (!purchase) {
    notFound();
  }

  const rows =
    (items ?? []) as any[];

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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#5a8b86]">
              {
                purchase.code
              }
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Compra China
            </h1>

            <p className="mt-2 text-sm text-[#7f746c]">
              {
                purchase.purchase_date
              }
              {purchase.supplier
                ? ` · ${purchase.supplier}`
                : ""}
            </p>
          </div>

          <div className="flex gap-2">
            {purchase.status ===
              "PEDIDO" && (
              <form
                action={
                  setChinaPurchaseStatusV2
                }
              >
                <input
                  type="hidden"
                  name="id"
                  value={
                    purchase.id
                  }
                />

                <input
                  type="hidden"
                  name="status"
                  value="EN_TRANSITO"
                />

                <button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#fff6e9] px-4 text-xs font-black text-[#9b6510]">
                  <Ship
                    size={14}
                  />

                  En tránsito
                </button>
              </form>
            )}

            {purchase.status ===
              "EN_TRANSITO" && (
              <form
                action={
                  markChinaPurchaseReceivedV2
                }
              >
                <input
                  type="hidden"
                  name="id"
                  value={
                    purchase.id
                  }
                />

                <button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#5a8b86] px-4 text-xs font-black text-white">
                  <PackageCheck
                    size={14}
                  />

                  Marcar recibido
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[18px] bg-[#f8f4f0] p-3">
            <p className="text-[9px] font-black uppercase text-[#8b8078]">
              Mercadería
            </p>

            <p className="mt-1 font-black">
              {money(
                purchase.merchandise_total
              )}
            </p>
          </div>

          <div className="rounded-[18px] bg-[#fff8e9] p-3">
            <p className="text-[9px] font-black uppercase text-[#9b6510]">
              Gastos
            </p>

            <p className="mt-1 font-black">
              {money(
                Number(
                  purchase.freight ??
                    0
                ) +
                  Number(
                    purchase.taxes ??
                      0
                  ) +
                  Number(
                    purchase.commissions ??
                      0
                  ) +
                  Number(
                    purchase.local_transport ??
                      0
                  ) +
                  Number(
                    purchase.other_costs ??
                      0
                  )
              )}
            </p>
          </div>

          <div className="rounded-[18px] bg-[#8f3a2e] p-3 text-white">
            <p className="text-[9px] font-black uppercase text-white/70">
              Total pagado
            </p>

            <p className="mt-1 font-black">
              {money(
                purchase.total_paid
              )}
            </p>
          </div>

          <div className="rounded-[18px] bg-[#edf7f5] p-3">
            <p className="text-[9px] font-black uppercase text-[#42746e]">
              Series / prendas
            </p>

            <p className="mt-1 font-black text-[#42746e]">
              {
                purchase.total_series
              }{" "}
              /{" "}
              {
                purchase.total_pieces
              }
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#eaded3] bg-white shadow-sm">
        <div className="border-b border-[#eaded3] px-5 py-4">
          <p className="font-black">
            Códigos creados /
            comprados
          </p>

          <p className="mt-1 text-xs text-[#7f746c]">
            Estos códigos ya
            aparecen
            automáticamente en
            Series.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1400px] w-full border-collapse">
            <thead>
              <tr className="bg-[#f8f4f0] text-left text-[9px] font-black uppercase text-[#786d65]">
                <th className="px-3 py-3">
                  Código
                </th>

                <th className="px-3 py-3">
                  Modelo
                </th>

                <th className="px-3 py-3">
                  Colores
                </th>

                <th className="px-3 py-3 text-center">
                  Series
                </th>

                <th className="px-3 py-3">
                  Prov./serie
                </th>

                <th className="px-3 py-3">
                  Prov./prenda
                </th>

                <th className="px-3 py-3">
                  Gastos
                </th>

                <th className="px-3 py-3">
                  Real/serie
                </th>

                <th className="px-3 py-3">
                  Real/prenda
                </th>

                <th className="px-3 py-3">
                  Preventa
                </th>

                <th className="px-3 py-3">
                  Stock
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map(
                (row) => (
                  <tr
                    key={
                      row.id
                    }
                    className="border-t border-[#f0e7df] text-xs"
                  >
                    <td className="px-3 py-3 font-black text-[#5a8b86]">
                      {
                        row.series_products
                          ?.code
                      }
                    </td>

                    <td className="px-3 py-3 font-black">
                      {
                        row.series_products
                          ?.name
                      }
                    </td>

                    <td className="px-3 py-3">
                      {(
                        row.series_china_purchase_item_colors ??
                        []
                      )
                        .map(
                          (
                            color: any
                          ) =>
                            `${color.color} ${color.series_qty}`
                        )
                        .join(
                          " · "
                        )}
                    </td>

                    <td className="px-3 py-3 text-center font-black">
                      {
                        row.total_series
                      }
                    </td>

                    <td className="px-3 py-3 font-bold">
                      {money(
                        row.supplier_cost_series_pen
                      )}
                    </td>

                    <td className="px-3 py-3 font-bold">
                      {money(
                        row.supplier_cost_piece_pen
                      )}
                    </td>

                    <td className="px-3 py-3 font-bold text-[#d39218]">
                      {money(
                        row.extra_cost_allocated
                      )}
                    </td>

                    <td className="px-3 py-3 font-black text-[#42746e]">
                      {money(
                        row.landed_cost_series
                      )}
                    </td>

                    <td className="px-3 py-3 font-black text-[#42746e]">
                      {money(
                        row.landed_cost_piece
                      )}
                    </td>

                    <td className="px-3 py-3 font-black text-[#9b6510]">
                      {money(
                        row.preorder_price_snapshot
                      )}
                    </td>

                    <td className="px-3 py-3 font-black text-[#b63a2c]">
                      {money(
                        row.stock_price_snapshot
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
