import Link from "next/link";
import {
  ArrowRight,
  PackageCheck,
  Plus,
  Ship,
  WalletCards,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function money(value: number | string | null) {
  return `S/ ${Number(value ?? 0).toFixed(2)}`;
}

function statusClasses(status: string) {
  if (status === "RECIBIDO") return "bg-[#edf7f5] text-[#42746e]";
  if (status === "EN_TRANSITO") return "bg-[#fff5e8] text-[#9b6510]";
  if (status === "CANCELADO") return "bg-[#fff0eb] text-[#a33d31]";
  return "bg-[#f1ece8] text-[#6f655e]";
}

function statusLabel(status: string) {
  if (status === "RECIBIDO") return "Recibido";
  if (status === "EN_TRANSITO") return "En tránsito";
  if (status === "CANCELADO") return "Cancelado";
  return "Pedido";
}

export default async function ChinaPurchasesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("series_china_purchases")
    .select(`
      id,
      code,
      purchase_date,
      supplier,
      currency,
      exchange_rate,
      merchandise_total,
      freight,
      taxes,
      commissions,
      local_transport,
      other_costs,
      total_paid,
      total_series,
      total_pieces,
      status,
      created_at
    `)
    .order("purchase_date", { ascending: false })
    .order("created_at", { ascending: false });

  const purchases = data ?? [];
  const inTransit = purchases.filter((item) => item.status === "EN_TRANSITO").length;
  const received = purchases.filter((item) => item.status === "RECIBIDO").length;
  const invested = purchases
    .filter((item) => item.status !== "CANCELADO")
    .reduce((sum, item) => sum + Number(item.total_paid ?? 0), 0);

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-[#eaded3] bg-white p-6 shadow-[0_8px_28px_rgba(100,70,40,.05)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#5a8b86]">
              Series · Compras China
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-[-.04em] text-[#2c2825]">
              Cargas y costos
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7f746c]">
              Registra todos los códigos en una tabla. El sistema calcula costo proveedor por prenda,
              gastos asignados, costo real y disponibilidad.
            </p>
          </div>

          <Link
            href="/admin/series/compras/nueva"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] bg-[#b63a2c] px-5 text-sm font-black text-white"
          >
            <Plus size={17} />
            Nueva compra
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[22px] bg-white p-4 shadow-sm">
          <span className="grid size-10 place-items-center rounded-full bg-[#fff6e9] text-[#d39218]">
            <Ship size={17} />
          </span>
          <p className="mt-4 text-[10px] font-black uppercase tracking-[.12em] text-[#8b8078]">
            En tránsito
          </p>
          <p className="mt-1 text-2xl font-black">{inTransit}</p>
        </div>

        <div className="rounded-[22px] bg-white p-4 shadow-sm">
          <span className="grid size-10 place-items-center rounded-full bg-[#edf7f5] text-[#5a8b86]">
            <PackageCheck size={17} />
          </span>
          <p className="mt-4 text-[10px] font-black uppercase tracking-[.12em] text-[#8b8078]">
            Recibidas
          </p>
          <p className="mt-1 text-2xl font-black">{received}</p>
        </div>

        <div className="rounded-[22px] bg-white p-4 shadow-sm">
          <span className="grid size-10 place-items-center rounded-full bg-[#fff0e9] text-[#b63a2c]">
            <WalletCards size={17} />
          </span>
          <p className="mt-4 text-[10px] font-black uppercase tracking-[.12em] text-[#8b8078]">
            Total invertido
          </p>
          <p className="mt-1 text-2xl font-black text-[#b63a2c]">{money(invested)}</p>
        </div>

        <div className="rounded-[22px] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[.12em] text-[#8b8078]">
            Compras registradas
          </p>
          <p className="mt-4 text-3xl font-black text-[#5a8b86]">{purchases.length}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#eaded3] bg-white shadow-[0_8px_28px_rgba(100,70,40,.05)]">
        <div className="border-b border-[#eaded3] px-5 py-4">
          <p className="font-black">Historial de compras</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1050px] w-full border-collapse">
            <thead>
              <tr className="bg-[#f8f4f0] text-left text-[10px] font-black uppercase tracking-[.08em] text-[#786d65]">
                <th className="px-4 py-3">Compra</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3 text-center">Series</th>
                <th className="px-4 py-3 text-center">Prendas</th>
                <th className="px-4 py-3">Mercadería</th>
                <th className="px-4 py-3">Total pagado</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>

            <tbody>
              {purchases.map((item) => (
                <tr key={item.id} className="border-t border-[#f0e7df] text-sm">
                  <td className="px-4 py-3 font-black text-[#2c2825]">{item.code}</td>
                  <td className="px-4 py-3 text-[#6f655e]">{item.purchase_date}</td>
                  <td className="px-4 py-3 font-bold">{item.supplier || "Sin proveedor"}</td>
                  <td className="px-4 py-3 text-center font-black">{item.total_series}</td>
                  <td className="px-4 py-3 text-center font-black">{item.total_pieces}</td>
                  <td className="px-4 py-3 font-bold">{money(item.merchandise_total)}</td>
                  <td className="px-4 py-3 font-black text-[#b63a2c]">{money(item.total_paid)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1.5 text-[10px] font-black ${statusClasses(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/series/compras/${item.id}`}
                      className="inline-flex size-9 items-center justify-center rounded-full bg-[#fff0e9] text-[#9b382b]"
                    >
                      <ArrowRight size={15} />
                    </Link>
                  </td>
                </tr>
              ))}

              {purchases.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-sm text-[#8b8078]">
                    Aún no hay compras registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
