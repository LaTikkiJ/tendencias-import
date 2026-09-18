import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Boxes,
  PackageCheck,
  Ship,
  WalletCards,
} from "lucide-react";

import {
  markChinaPurchaseReceived,
  setChinaPurchaseStatus,
} from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function money(value: number | string | null) {
  return `S/ ${Number(value ?? 0).toFixed(2)}`;
}

function statusLabel(status: string) {
  if (status === "RECIBIDO") return "Recibido";
  if (status === "EN_TRANSITO") return "En tránsito";
  if (status === "CANCELADO") return "Cancelado";
  return "Pedido";
}

function statusClasses(status: string) {
  if (status === "RECIBIDO") return "bg-[#edf7f5] text-[#42746e]";
  if (status === "EN_TRANSITO") return "bg-[#fff5e8] text-[#9b6510]";
  if (status === "CANCELADO") return "bg-[#fff0eb] text-[#a33d31]";
  return "bg-[#f1ece8] text-[#6f655e]";
}

export default async function ChinaPurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: purchase }, { data: items }] = await Promise.all([
    supabase.from("series_china_purchases").select("*").eq("id", id).single(),
    supabase
      .from("series_china_purchase_items")
      .select(`
        *,
        series_products (
          id,
          code,
          name,
          sizes,
          preorder_markup_pct,
          stock_markup_pct,
          price_preorder,
          price_stock
        )
      `)
      .eq("purchase_id", id)
      .order("line_no"),
  ]);

  if (!purchase) notFound();

  const rows = (items ?? []) as any[];
  const extraCosts =
    Number(purchase.freight ?? 0) +
    Number(purchase.taxes ?? 0) +
    Number(purchase.commissions ?? 0) +
    Number(purchase.local_transport ?? 0) +
    Number(purchase.other_costs ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/series/compras"
          className="inline-flex items-center gap-2 text-sm font-black text-[#8f3a2e]"
        >
          <ArrowLeft size={16} />
          Volver a compras
        </Link>

        <span className={`rounded-full px-4 py-2 text-xs font-black ${statusClasses(purchase.status)}`}>
          {statusLabel(purchase.status)}
        </span>
      </div>

      <section className="rounded-[30px] border border-[#eaded3] bg-white p-6 shadow-[0_8px_28px_rgba(100,70,40,.05)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#5a8b86]">{purchase.code}</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-.04em]">Compra China</h1>
            <p className="mt-2 text-sm text-[#7f746c]">
              {purchase.purchase_date}
              {purchase.supplier ? ` · ${purchase.supplier}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {purchase.status === "PEDIDO" && (
              <form action={setChinaPurchaseStatus}>
                <input type="hidden" name="id" value={purchase.id} />
                <input type="hidden" name="status" value="EN_TRANSITO" />
                <button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#fff6e9] px-5 text-xs font-black text-[#9b6510]">
                  <Ship size={15} />
                  Marcar en tránsito
                </button>
              </form>
            )}

            {purchase.status === "EN_TRANSITO" && (
              <form action={markChinaPurchaseReceived}>
                <input type="hidden" name="id" value={purchase.id} />
                <button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#5a8b86] px-5 text-xs font-black text-white">
                  <PackageCheck size={15} />
                  Marcar como recibido
                </button>
              </form>
            )}
          </div>
        </div>

        {purchase.status === "EN_TRANSITO" && (
          <div className="mt-5 rounded-[20px] border border-[#f1dfbd] bg-[#fff8e9] p-4">
            <p className="text-sm font-black text-[#8c5d12]">Preventa activa</p>
            <p className="mt-1 text-xs leading-5 text-[#8c6b35]">
              Mientras esta carga esté en tránsito, la web usa el precio de preventa. Al marcar
              “Recibido”, se crea el inventario por color/talla y la web cambia automáticamente al
              precio de stock.
            </p>
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-[22px] bg-white p-4 shadow-sm">
          <span className="grid size-10 place-items-center rounded-full bg-[#fff0e9] text-[#b63a2c]">
            <WalletCards size={17} />
          </span>
          <p className="mt-3 text-[9px] font-black uppercase tracking-[.1em] text-[#8b8078]">Mercadería</p>
          <p className="mt-1 text-xl font-black">{money(purchase.merchandise_total)}</p>
        </div>

        <div className="rounded-[22px] bg-white p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#8b8078]">Gastos extra</p>
          <p className="mt-4 text-xl font-black text-[#d39218]">{money(extraCosts)}</p>
        </div>

        <div className="rounded-[22px] bg-[#8f3a2e] p-4 text-white shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[.1em] text-white/70">Total pagado</p>
          <p className="mt-4 text-xl font-black">{money(purchase.total_paid)}</p>
        </div>

        <div className="rounded-[22px] bg-white p-4 shadow-sm">
          <Boxes size={18} className="text-[#5a8b86]" />
          <p className="mt-3 text-[9px] font-black uppercase tracking-[.1em] text-[#8b8078]">Series</p>
          <p className="mt-1 text-xl font-black text-[#5a8b86]">{purchase.total_series}</p>
        </div>

        <div className="rounded-[22px] bg-white p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#8b8078]">Prendas</p>
          <p className="mt-4 text-xl font-black text-[#5a8b86]">{purchase.total_pieces}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#eaded3] bg-white shadow-[0_8px_28px_rgba(100,70,40,.05)]">
        <div className="border-b border-[#eaded3] px-5 py-4">
          <p className="font-black">Costos por código y color</p>
          <p className="mt-1 text-xs text-[#7f746c]">
            Aquí Sofía ve cuánto le salió cada serie y cada prenda realmente.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1520px] w-full border-collapse">
            <thead>
              <tr className="bg-[#f8f4f0] text-left text-[10px] font-black uppercase tracking-[.08em] text-[#786d65]">
                <th className="px-3 py-3">Código</th>
                <th className="px-3 py-3">Modelo</th>
                <th className="px-3 py-3">Color</th>
                <th className="px-3 py-3 text-center">Series</th>
                <th className="px-3 py-3 text-center">Pzs</th>
                <th className="px-3 py-3">Prov./serie</th>
                <th className="px-3 py-3">Prov./prenda</th>
                <th className="px-3 py-3">Gastos</th>
                <th className="px-3 py-3">Real/serie</th>
                <th className="px-3 py-3">Real/prenda</th>
                <th className="px-3 py-3">Preventa</th>
                <th className="px-3 py-3">Stock</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#f0e7df] text-xs">
                  <td className="px-3 py-3 font-black text-[#5a8b86]">{row.series_products?.code}</td>
                  <td className="px-3 py-3 font-black">{row.series_products?.name}</td>
                  <td className="px-3 py-3 font-bold">{row.color}</td>
                  <td className="px-3 py-3 text-center font-black">{row.series_qty}</td>
                  <td className="px-3 py-3 text-center font-black">{row.pieces_per_series}</td>
                  <td className="px-3 py-3 font-bold">{money(row.supplier_cost_series_pen)}</td>
                  <td className="px-3 py-3 font-bold">{money(row.supplier_cost_piece_pen)}</td>
                  <td className="px-3 py-3 font-bold text-[#d39218]">{money(row.extra_cost_allocated)}</td>
                  <td className="px-3 py-3 font-black text-[#42746e]">{money(row.landed_cost_series)}</td>
                  <td className="px-3 py-3 font-black text-[#42746e]">{money(row.landed_cost_piece)}</td>
                  <td className="px-3 py-3">
                    <p className="font-black text-[#9b6510]">{money(row.preorder_price_snapshot)}</p>
                    <p className="mt-1 text-[9px] text-[#8b8078]">
                      Sug. {money(Number(row.landed_cost_series) * (1 + Number(row.series_products?.preorder_markup_pct ?? 30) / 100))}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-black text-[#b63a2c]">{money(row.stock_price_snapshot)}</p>
                    <p className="mt-1 text-[9px] text-[#8b8078]">
                      Sug. {money(Number(row.landed_cost_series) * (1 + Number(row.series_products?.stock_markup_pct ?? 40) / 100))}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#eaded3] bg-white p-5">
        <p className="text-xs font-black uppercase tracking-[.12em] text-[#5a8b86]">Gastos de esta carga</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div><p className="text-[10px] font-bold text-[#8b8078]">Flete</p><p className="mt-1 font-black">{money(purchase.freight)}</p></div>
          <div><p className="text-[10px] font-bold text-[#8b8078]">Impuestos</p><p className="mt-1 font-black">{money(purchase.taxes)}</p></div>
          <div><p className="text-[10px] font-bold text-[#8b8078]">Comisiones</p><p className="mt-1 font-black">{money(purchase.commissions)}</p></div>
          <div><p className="text-[10px] font-bold text-[#8b8078]">Transporte</p><p className="mt-1 font-black">{money(purchase.local_transport)}</p></div>
          <div><p className="text-[10px] font-bold text-[#8b8078]">Otros</p><p className="mt-1 font-black">{money(purchase.other_costs)}</p></div>
        </div>
      </section>
    </div>
  );
}
