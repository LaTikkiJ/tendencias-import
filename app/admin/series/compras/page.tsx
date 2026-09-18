import Link from "next/link";

import {
  ArrowRight,
  Plus,
  Ship,
  WalletCards,
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

function label(
  status: string
) {
  if (
    status ===
    "RECIBIDO"
  ) {
    return "Recibido";
  }

  if (
    status ===
    "EN_TRANSITO"
  ) {
    return "En tránsito";
  }

  if (
    status ===
    "CANCELADO"
  ) {
    return "Cancelado";
  }

  return "Pedido";
}

export default async function ChinaPurchasesPage() {
  const supabase =
    await createClient();

  const { data } =
    await supabase
      .from(
        "series_china_purchases"
      )
      .select("*")
      .order(
        "purchase_date",
        {
          ascending:
            false,
        }
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      );

  const purchases =
    data ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-[#eaded3] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#5a8b86]">
              Series
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-[-.04em]">
              Compras China
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-[#7f746c]">
              Primero se registra
              aquí la carga. Desde
              cada compra se crean
              los códigos que luego
              aparecen en Series.
            </p>
          </div>

          <Link
            href="/admin/series/compras/nueva"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] bg-[#b63a2c] px-5 text-sm font-black text-white"
          >
            <Plus
              size={17}
            />

            Nueva compra
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[22px] bg-white p-4 shadow-sm">
          <Ship
            size={18}
            className="text-[#d39218]"
          />

          <p className="mt-3 text-[9px] font-black uppercase text-[#8b8078]">
            En tránsito
          </p>

          <p className="mt-1 text-2xl font-black">
            {
              purchases.filter(
                (item) =>
                  item.status ===
                  "EN_TRANSITO"
              ).length
            }
          </p>
        </div>

        <div className="rounded-[22px] bg-white p-4 shadow-sm">
          <WalletCards
            size={18}
            className="text-[#b63a2c]"
          />

          <p className="mt-3 text-[9px] font-black uppercase text-[#8b8078]">
            Total invertido
          </p>

          <p className="mt-1 text-2xl font-black text-[#b63a2c]">
            {money(
              purchases
                .filter(
                  (item) =>
                    item.status !==
                    "CANCELADO"
                )
                .reduce(
                  (
                    sum,
                    item
                  ) =>
                    sum +
                    Number(
                      item.total_paid ??
                        0
                    ),
                  0
                )
            )}
          </p>
        </div>

        <div className="rounded-[22px] bg-white p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase text-[#8b8078]">
            Compras
          </p>

          <p className="mt-4 text-2xl font-black text-[#5a8b86]">
            {
              purchases.length
            }
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#eaded3] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[950px] w-full border-collapse">
            <thead>
              <tr className="bg-[#f8f4f0] text-left text-[9px] font-black uppercase tracking-[.08em] text-[#786d65]">
                <th className="px-4 py-3">
                  Compra
                </th>

                <th className="px-4 py-3">
                  Fecha
                </th>

                <th className="px-4 py-3">
                  Proveedor
                </th>

                <th className="px-4 py-3 text-center">
                  Series
                </th>

                <th className="px-4 py-3 text-center">
                  Prendas
                </th>

                <th className="px-4 py-3">
                  Total
                </th>

                <th className="px-4 py-3">
                  Estado
                </th>

                <th className="px-4 py-3" />
              </tr>
            </thead>

            <tbody>
              {purchases.map(
                (item) => (
                  <tr
                    key={
                      item.id
                    }
                    className="border-t border-[#f0e7df] text-sm"
                  >
                    <td className="px-4 py-3 font-black">
                      {
                        item.code
                      }
                    </td>

                    <td className="px-4 py-3">
                      {
                        item.purchase_date
                      }
                    </td>

                    <td className="px-4 py-3 font-bold">
                      {item.supplier ||
                        "—"}
                    </td>

                    <td className="px-4 py-3 text-center font-black">
                      {
                        item.total_series
                      }
                    </td>

                    <td className="px-4 py-3 text-center font-black">
                      {
                        item.total_pieces
                      }
                    </td>

                    <td className="px-4 py-3 font-black text-[#b63a2c]">
                      {money(
                        item.total_paid
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#f7f2ec] px-3 py-1.5 text-[10px] font-black">
                        {label(
                          item.status
                        )}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/series/compras/${item.id}`}
                        className="inline-flex size-9 items-center justify-center rounded-full bg-[#fff0e9] text-[#9b382b]"
                      >
                        <ArrowRight
                          size={
                            15
                          }
                        />
                      </Link>
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
