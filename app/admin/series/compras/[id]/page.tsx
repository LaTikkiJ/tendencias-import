import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  ArrowLeft,
  Banknote,
  PackageCheck,
  ReceiptText,
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
  ).toFixed(
    2
  )}`;
}

function moneyOriginal(
  value:
    | number
    | string
    | null,
  currency:
    string
) {
  const label =
    currency ===
    "PEN"
      ? "S/"
      : currency;

  return `${label} ${Number(
    value ?? 0
  ).toFixed(
    2
  )}`;
}

export default async function ChinaPurchaseDetailPage({
  params,
}: {
  params:
    Promise<{
      id: string;
    }>;
}) {
  const {
    id,
  } =
    await params;

  const supabase =
    await createClient();

  const [
    {
      data:
        purchase,
    },
    {
      data:
        items,
    },
    {
      data:
        payments,
    },
    {
      data:
        expenses,
    },
  ] =
    await Promise.all([
      supabase
        .from(
          "series_china_purchases"
        )
        .select(
          "*"
        )
        .eq(
          "id",
          id
        )
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
            name,
            cover_url
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
        .order(
          "line_no"
        ),

      supabase
        .from(
          "series_china_purchase_payments"
        )
        .select(
          "*"
        )
        .eq(
          "purchase_id",
          id
        )
        .order(
          "line_no"
        ),

      supabase
        .from(
          "series_china_purchase_expenses"
        )
        .select(
          "*"
        )
        .eq(
          "purchase_id",
          id
        )
        .order(
          "line_no"
        ),
    ]);

  if (
    !purchase
  ) {
    notFound();
  }

  const rows =
    (
      items ??
      []
    ) as any[];

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

      <section className="rounded-[30px] border border-[#eaded3] bg-white p-5 shadow-sm sm:p-6">
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
            </p>
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
          <div className="rounded-[17px] bg-[#edf7f5] p-3">
            <p className="text-[8px] font-black uppercase text-[#42746e]">
              Series
            </p>
            <p className="mt-1 text-xl font-black text-[#42746e]">
              {purchase.total_series}
            </p>
          </div>

          <div className="rounded-[17px] bg-[#edf7f5] p-3">
            <p className="text-[8px] font-black uppercase text-[#42746e]">
              Prendas
            </p>
            <p className="mt-1 text-xl font-black text-[#42746e]">
              {purchase.total_pieces}
            </p>
          </div>

          <div className="rounded-[17px] bg-[#f8f4f0] p-3">
            <p className="text-[8px] font-black uppercase text-[#8b8078]">
              Mercadería
            </p>
            <p className="mt-1 text-xs font-black">
              {moneyOriginal(
                purchase.supplier_total_original,
                purchase.currency
              )}
            </p>
            <p className="mt-1 text-[9px] text-[#7f746c]">
              {moneyPen(
                purchase.supplier_total_pen
              )}
            </p>
          </div>

          <div className="rounded-[17px] bg-[#fff8e9] p-3">
            <p className="text-[8px] font-black uppercase text-[#9b6510]">
              Gastos
            </p>
            <p className="mt-1 text-xs font-black text-[#9b6510]">
              {moneyPen(
                purchase.expenses_total_pen
              )}
            </p>
          </div>

          <div className="col-span-2 rounded-[17px] bg-[#8f3a2e] p-3 text-white lg:col-span-1">
            <p className="text-[8px] font-black uppercase text-white/70">
              Costo carga
            </p>
            <p className="mt-1 text-sm font-black">
              {moneyPen(
                purchase.total_paid
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[26px] border border-[#eaded3] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-2">
          <Banknote
            size={16}
            className="text-[#5a8b86]"
          />

          <div>
            <p className="font-black">
              Pagos al proveedor
            </p>

            <p className="mt-1 text-[9px] text-[#7f746c]">
              Tipo de cambio efectivo:{" "}
              {Number(
                purchase.effective_exchange_rate ??
                  purchase.exchange_rate ??
                  1
              ).toFixed(
                4
              )}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {(payments ??
            []).map(
            (
              payment: any
            ) => (
              <div
                key={
                  payment.id
                }
                className="rounded-[18px] bg-[#f8f4f0] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase text-[#8f3a2e]">
                      {payment.stage}
                    </p>

                    <p className="mt-1 text-xs font-bold text-[#7f746c]">
                      {payment.payment_date}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-black">
                      {moneyOriginal(
                        payment.amount_original,
                        purchase.currency
                      )}
                    </p>

                    <p className="mt-1 text-[9px] text-[#7f746c]">
                      {moneyPen(
                        payment.amount_pen
                      )}
                    </p>
                  </div>
                </div>

                {(payment.payment_method ||
                  payment.reference) && (
                  <p className="mt-3 text-[9px] leading-4 text-[#7f746c]">
                    {payment.payment_method || ""}
                    {payment.payment_method &&
                    payment.reference
                      ? " · "
                      : ""}
                    {payment.reference || ""}
                  </p>
                )}
              </div>
            )
          )}

          {(payments ??
            []).length ===
            0 && (
            <p className="text-xs text-[#8b8078]">
              No hay pagos registrados.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-[26px] border border-[#eaded3] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-2">
          <ReceiptText
            size={16}
            className="text-[#d39218]"
          />

          <p className="font-black">
            Gastos de la carga
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(expenses ??
            []).map(
            (
              expense: any
            ) => (
              <div
                key={
                  expense.id
                }
                className="rounded-[17px] bg-[#fff8e9] p-4"
              >
                <p className="text-[9px] font-black uppercase text-[#9b6510]">
                  {expense.concept}
                </p>

                <p className="mt-2 text-sm font-black">
                  {moneyOriginal(
                    expense.amount,
                    expense.currency
                  )}
                </p>

                <p className="mt-1 text-[9px] text-[#7f746c]">
                  {moneyPen(
                    expense.amount_pen
                  )}
                </p>

                {expense.reference && (
                  <p className="mt-2 text-[9px] text-[#8b8078]">
                    {expense.reference}
                  </p>
                )}
              </div>
            )
          )}

          {(expenses ??
            []).length ===
            0 && (
            <p className="text-xs text-[#8b8078]">
              No hay gastos adicionales.
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <p className="font-black">
            Costos por modelo
          </p>

          <p className="mt-1 text-[10px] text-[#7f746c]">
            El gasto de importación
            ya está repartido entre
            todas las prendas.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map(
            (
              row
            ) => (
              <article
                key={
                  row.id
                }
                className="rounded-[24px] border border-[#eaded3] bg-white p-4 shadow-sm"
              >
                <div className="flex gap-3">
                  <div className="size-20 shrink-0 overflow-hidden rounded-[15px] bg-[#f1e9e1]">
                    {row
                      .series_products
                      ?.cover_url ? (
                      <img
                        src={
                          row
                            .series_products
                            .cover_url
                        }
                        alt={
                          row
                            .series_products
                            ?.name ??
                          ""
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black uppercase text-[#5a8b86]">
                      {row
                        .series_products
                        ?.code}
                    </p>

                    <h3 className="mt-1 truncate font-black">
                      {row
                        .series_products
                        ?.name}
                    </h3>

                    <p className="mt-1 text-[9px] text-[#8b8078]">
                      {row.total_series} series ·{" "}
                      {Number(
                        row.total_series
                      ) *
                        Number(
                          row.pieces_per_series
                        )} prendas
                    </p>

                    <p className="mt-2 text-[9px] leading-4 text-[#7f746c]">
                      {(row
                        .series_china_purchase_item_colors ??
                        [])
                        .map(
                          (
                            color: any
                          ) =>
                            `${color.color} ${color.series_qty}`
                        )
                        .join(" · ")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-[14px] bg-[#f8f4f0] p-3">
                    <p className="text-[7px] font-black uppercase text-[#8b8078]">
                      Proveedor / prenda
                    </p>

                    <p className="mt-1 text-xs font-black">
                      {moneyOriginal(
                        row.supplier_cost_piece_original,
                        purchase.currency
                      )}
                    </p>

                    <p className="mt-1 text-[9px] text-[#7f746c]">
                      {moneyPen(
                        row.supplier_cost_piece_pen
                      )}
                    </p>
                  </div>

                  <div className="rounded-[14px] bg-[#fff8e9] p-3">
                    <p className="text-[7px] font-black uppercase text-[#9b6510]">
                      Gasto / prenda
                    </p>

                    <p className="mt-1 text-xs font-black text-[#9b6510]">
                      {moneyPen(
                        row.extra_cost_piece_pen
                      )}
                    </p>
                  </div>

                  <div className="rounded-[14px] bg-[#edf7f5] p-3">
                    <p className="text-[7px] font-black uppercase text-[#42746e]">
                      Final / prenda
                    </p>

                    <p className="mt-1 text-xs font-black text-[#42746e]">
                      {moneyPen(
                        row.landed_cost_piece
                      )}
                    </p>

                    <p className="mt-1 text-[9px] text-[#64847f]">
                      {moneyOriginal(
                        row.landed_cost_piece_original,
                        purchase.currency
                      )}
                    </p>
                  </div>

                  <div className="rounded-[14px] bg-[#edf7f5] p-3">
                    <p className="text-[7px] font-black uppercase text-[#42746e]">
                      Final / serie
                    </p>

                    <p className="mt-1 text-xs font-black text-[#42746e]">
                      {moneyPen(
                        row.landed_cost_series
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-[14px] bg-[#fffaf0] p-3">
                    <p className="text-[7px] font-black uppercase text-[#9b6510]">
                      Preventa
                    </p>

                    <p className="mt-1 text-sm font-black text-[#9b6510]">
                      {moneyPen(
                        row.preorder_price_snapshot
                      )}
                    </p>

                    <p className="mt-1 text-[8px] text-[#8b8078]">
                      Margen {Number(
                        row.preorder_margin_pct ??
                          20
                      ).toFixed(
                        0
                      )}%
                    </p>
                  </div>

                  <div className="rounded-[14px] bg-[#fff4ef] p-3">
                    <p className="text-[7px] font-black uppercase text-[#9b382b]">
                      Stock
                    </p>

                    <p className="mt-1 text-sm font-black text-[#9b382b]">
                      {moneyPen(
                        row.stock_price_snapshot
                      )}
                    </p>

                    <p className="mt-1 text-[8px] text-[#8b8078]">
                      Margen {Number(
                        row.stock_margin_pct ??
                          20
                      ).toFixed(
                        0
                      )}%
                    </p>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      </section>
    </div>
  );
}
