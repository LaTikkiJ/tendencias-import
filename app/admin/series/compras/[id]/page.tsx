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

function moneyPen(
  value:
    | number
    | string
    | null
) {
  return `S/ ${Number(
    value ?? 0
  ).toFixed(2)}`;
}

function originalSymbol(
  currency: string
) {
  if (
    currency === "USD"
  ) {
    return "$";
  }

  if (
    currency === "CNY"
  ) {
    return "¥";
  }

  return "S/";
}

function moneyOriginal(
  value:
    | number
    | string
    | null,
  currency: string
) {
  return `${originalSymbol(
    currency
  )} ${Number(
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

  const extraTotal =
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
    );

  const exchangeRate =
    Number(
      purchase.exchange_rate ??
        1
    );

  const extraOriginal =
    exchangeRate > 0
      ? extraTotal /
        exchangeRate
      : 0;

  const totalOriginal =
    exchangeRate > 0
      ? Number(
          purchase.total_paid ??
            0
        ) /
        exchangeRate
      : 0;

  const extraPerPiecePen =
    Number(
      purchase.total_pieces ??
        0
    ) > 0
      ? extraTotal /
        Number(
          purchase.total_pieces
        )
      : 0;

  const extraPerPieceOriginal =
    exchangeRate > 0
      ? extraPerPiecePen /
        exchangeRate
      : 0;

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

      <section className="rounded-[28px] border border-[#eaded3] bg-white p-5 shadow-sm sm:rounded-[30px] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#5a8b86]">
              {purchase.code}
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Compra China
            </h1>

            <p className="mt-2 text-sm text-[#7f746c]">
              {purchase.purchase_date}
              {purchase.supplier
                ? ` · ${purchase.supplier}`
                : ""}
              {` · ${purchase.currency}`}
            </p>

            {purchase.currency !==
              "PEN" && (
              <p className="mt-1 text-xs font-bold text-[#5a8b86]">
                Tipo de cambio: S/ {Number(
                  purchase.exchange_rate ??
                    0
                ).toFixed(4)}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
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

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className="rounded-[18px] bg-[#f8f4f0] p-3">
            <p className="text-[8px] font-black uppercase text-[#8b8078]">
              Proveedor
            </p>

            <p className="mt-1 font-black">
              {moneyOriginal(
                purchase.supplier_total_original,
                purchase.currency
              )}
            </p>

            <p className="mt-1 text-[9px] font-bold text-[#7f746c]">
              {moneyPen(
                purchase.supplier_total_pen ??
                  purchase.merchandise_total
              )}
            </p>
          </div>

          <div className="rounded-[18px] bg-[#fff8e9] p-3">
            <p className="text-[8px] font-black uppercase text-[#9b6510]">
              Gastos importación
            </p>

            <p className="mt-1 font-black text-[#9b6510]">
              {moneyPen(
                extraTotal
              )}
            </p>

            <p className="mt-1 text-[9px] font-bold text-[#9b7b48]">
              {moneyOriginal(
                extraOriginal,
                purchase.currency
              )}
            </p>
          </div>

          <div className="col-span-2 rounded-[18px] bg-[#8f3a2e] p-3 text-white lg:col-span-1">
            <p className="text-[8px] font-black uppercase text-white/70">
              Costo total importado
            </p>

            <p className="mt-1 font-black">
              {moneyPen(
                purchase.total_paid
              )}
            </p>

            <p className="mt-1 text-[9px] font-bold text-white/70">
              {moneyOriginal(
                totalOriginal,
                purchase.currency
              )}
            </p>
          </div>

          <div className="rounded-[18px] bg-[#edf7f5] p-3">
            <p className="text-[8px] font-black uppercase text-[#42746e]">
              Extra / prenda
            </p>

            <p className="mt-1 font-black text-[#42746e]">
              {moneyPen(
                extraPerPiecePen
              )}
            </p>

            <p className="mt-1 text-[9px] font-bold text-[#64847f]">
              {moneyOriginal(
                extraPerPieceOriginal,
                purchase.currency
              )}
            </p>
          </div>

          <div className="rounded-[18px] bg-[#edf7f5] p-3">
            <p className="text-[8px] font-black uppercase text-[#42746e]">
              Series / prendas
            </p>

            <p className="mt-1 font-black text-[#42746e]">
              {purchase.total_series} / {purchase.total_pieces}
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <p className="font-black">
            Costo final por modelo
          </p>

          <p className="mt-1 text-xs leading-5 text-[#7f746c]">
            Todos los gastos de importación se repartieron por igual entre las {purchase.total_pieces} prendas de esta carga.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {rows.map(
            (row) => {
              const colors =
                (
                  row.series_china_purchase_item_colors ??
                  []
                )
                  .map(
                    (
                      color: any
                    ) =>
                      `${color.color}: ${color.series_qty}`
                  )
                  .join(" · ");

              const pieces =
                Number(
                  row.total_series ??
                    0
                ) *
                Number(
                  row.pieces_per_series ??
                    0
                );

              return (
                <article
                  key={row.id}
                  className="rounded-[24px] border border-[#eaded3] bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[.12em] text-[#5a8b86]">
                        {row.series_products?.code}
                      </p>

                      <h2 className="mt-1 text-lg font-black">
                        {row.series_products?.name}
                      </h2>

                      <p className="mt-1 text-[10px] leading-5 text-[#7f746c]">
                        {colors || "Sin colores"}
                      </p>
                    </div>

                    <span className="rounded-full bg-[#f7f2ec] px-3 py-1.5 text-[9px] font-black text-[#6f655e]">
                      {row.total_series} series · {pieces} prendas
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <div className="rounded-[15px] bg-[#f8f4f0] p-3">
                      <p className="text-[8px] font-black uppercase text-[#8b8078]">
                        Proveedor / serie
                      </p>

                      <p className="mt-1 text-xs font-black">
                        {moneyOriginal(
                          row.supplier_cost_series_original,
                          purchase.currency
                        )}
                      </p>

                      <p className="mt-1 text-[9px] font-bold text-[#7f746c]">
                        {moneyPen(
                          row.supplier_cost_series_pen
                        )}
                      </p>
                    </div>

                    <div className="rounded-[15px] bg-[#f8f4f0] p-3">
                      <p className="text-[8px] font-black uppercase text-[#8b8078]">
                        Proveedor / prenda
                      </p>

                      <p className="mt-1 text-xs font-black">
                        {moneyOriginal(
                          row.supplier_cost_piece_original,
                          purchase.currency
                        )}
                      </p>

                      <p className="mt-1 text-[9px] font-bold text-[#7f746c]">
                        {moneyPen(
                          row.supplier_cost_piece_pen
                        )}
                      </p>
                    </div>

                    <div className="col-span-2 rounded-[15px] bg-[#fff8e9] p-3 sm:col-span-1">
                      <p className="text-[8px] font-black uppercase text-[#9b6510]">
                        Extra / prenda
                      </p>

                      <p className="mt-1 text-xs font-black text-[#9b6510]">
                        {moneyOriginal(
                          row.extra_cost_piece_original,
                          purchase.currency
                        )}
                      </p>

                      <p className="mt-1 text-[9px] font-bold text-[#9b7b48]">
                        {moneyPen(
                          row.extra_cost_piece_pen
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-[17px] bg-[#edf7f5] p-3.5">
                      <p className="text-[8px] font-black uppercase text-[#42746e]">
                        Costo final / prenda
                      </p>

                      <p className="mt-1 text-sm font-black text-[#42746e]">
                        {moneyOriginal(
                          row.landed_cost_piece_original,
                          purchase.currency
                        )}
                      </p>

                      <p className="mt-1 text-xs font-black text-[#42746e]">
                        {moneyPen(
                          row.landed_cost_piece
                        )}
                      </p>
                    </div>

                    <div className="rounded-[17px] bg-[#e7f2ef] p-3.5">
                      <p className="text-[8px] font-black uppercase text-[#356a64]">
                        Costo final / serie
                      </p>

                      <p className="mt-1 text-sm font-black text-[#356a64]">
                        {moneyOriginal(
                          row.landed_cost_series_original,
                          purchase.currency
                        )}
                      </p>

                      <p className="mt-1 text-xs font-black text-[#356a64]">
                        {moneyPen(
                          row.landed_cost_series
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-[14px] bg-[#fffaf0] p-3">
                      <p className="text-[8px] font-black uppercase text-[#9b6510]">
                        Precio preventa
                      </p>

                      <p className="mt-1 text-sm font-black text-[#9b6510]">
                        {moneyPen(
                          row.preorder_price_snapshot
                        )}
                      </p>
                    </div>

                    <div className="rounded-[14px] bg-[#fff4ef] p-3">
                      <p className="text-[8px] font-black uppercase text-[#9b382b]">
                        Precio stock
                      </p>

                      <p className="mt-1 text-sm font-black text-[#9b382b]">
                        {moneyPen(
                          row.stock_price_snapshot
                        )}
                      </p>
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </div>
      </section>
    </div>
  );
}
