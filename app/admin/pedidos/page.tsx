import Link from "next/link";
import { ArrowRight, ClipboardList, Clock3, CreditCard, PackageCheck, Plus, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function money(value: number | string | null) {
  return `S/ ${Number(value ?? 0).toFixed(2)}`;
}

function label(status: string) {
  const map: Record<string, string> = {
    NUEVO: "Nuevo",
    ESPERANDO_PAGO: "Esperando pago",
    PAGO_EN_REVISION: "Pago en revisión",
    CONFIRMADO: "Confirmado",
    PREPARANDO: "Preparando",
    ENVIADO: "Enviado",
    CANCELADO: "Cancelado",
  };
  return map[status] ?? status;
}

function statusClasses(status: string) {
  if (status === "ESPERANDO_PAGO") return "bg-[#fff8e9] text-[#9b6510]";
  if (status === "PAGO_EN_REVISION") return "bg-[#fff2e8] text-[#a65c18]";
  if (status === "CONFIRMADO") return "bg-[#edf7f5] text-[#42746e]";
  if (status === "PREPARANDO") return "bg-[#f1edfb] text-[#6555a0]";
  if (status === "ENVIADO") return "bg-[#eaf3fb] text-[#396c96]";
  if (status === "CANCELADO") return "bg-[#fff0eb] text-[#a33d31]";
  return "bg-[#eef8f6] text-[#42746e]";
}

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customer_orders")
    .select(`id,code,source,client_name,client_phone,total,status,inventory_state,payment_method,created_at`)
    .order("created_at", { ascending: false });

  const orders = data ?? [];
  const pending = orders.filter((x) => x.status === "NUEVO" || x.status === "ESPERANDO_PAGO").length;
  const review = orders.filter((x) => x.status === "PAGO_EN_REVISION").length;
  const confirmed = orders.filter((x) => x.status === "CONFIRMADO" || x.status === "PREPARANDO").length;
  const sent = orders.filter((x) => x.status === "ENVIADO").length;

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-[#eaded3] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#fff0e9] text-[#b63a2c]"><ClipboardList size={20} /></span>
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#5a8b86]">Ventas</p>
              <h1 className="mt-2 text-4xl font-black tracking-[-.04em]">Pedidos</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7f746c]">Web, WhatsApp y venta manual en el mismo lugar.</p>
            </div>
          </div>

          <Link href="/admin/pedidos/nueva" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] bg-[#b63a2c] px-5 text-sm font-black text-white"><Plus size={16} /> Nueva venta manual</Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-[22px] bg-white p-4 shadow-sm"><Clock3 size={17} className="text-[#d39218]" /><p className="mt-3 text-[9px] font-black uppercase text-[#8b8078]">Pendientes</p><p className="mt-1 text-2xl font-black text-[#d39218]">{pending}</p></div>
        <div className="rounded-[22px] bg-white p-4 shadow-sm"><CreditCard size={17} className="text-[#b96a27]" /><p className="mt-3 text-[9px] font-black uppercase text-[#8b8078]">Revisar pago</p><p className="mt-1 text-2xl font-black text-[#b96a27]">{review}</p></div>
        <div className="rounded-[22px] bg-white p-4 shadow-sm"><PackageCheck size={17} className="text-[#5a8b86]" /><p className="mt-3 text-[9px] font-black uppercase text-[#8b8078]">Confirmados</p><p className="mt-1 text-2xl font-black text-[#5a8b86]">{confirmed}</p></div>
        <div className="rounded-[22px] bg-white p-4 shadow-sm"><Truck size={17} className="text-[#4b78a0]" /><p className="mt-3 text-[9px] font-black uppercase text-[#8b8078]">Enviados</p><p className="mt-1 text-2xl font-black text-[#4b78a0]">{sent}</p></div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#eaded3] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full border-collapse">
            <thead>
              <tr className="bg-[#f8f4f0] text-left text-[9px] font-black uppercase tracking-[.08em] text-[#786d65]">
                <th className="px-4 py-3">Pedido</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">WhatsApp</th><th className="px-4 py-3">Origen</th><th className="px-4 py-3">Pago</th><th className="px-4 py-3">Inventario</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((item) => (
                <tr key={item.id} className="border-t border-[#f0e7df] text-sm">
                  <td className="px-4 py-3 font-black text-[#5a8b86]">{item.code}</td>
                  <td className="px-4 py-3 font-black">{item.client_name}</td>
                  <td className="px-4 py-3">{item.client_phone}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-[#f7f2ec] px-2.5 py-1 text-[9px] font-black">{item.source}</span></td>
                  <td className="px-4 py-3 font-bold">{item.payment_method || "—"}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-[#f4faf8] px-2.5 py-1 text-[9px] font-black text-[#42746e]">{item.inventory_state}</span></td>
                  <td className="px-4 py-3 font-black text-[#b63a2c]">{money(item.total)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-3 py-1.5 text-[9px] font-black ${statusClasses(item.status)}`}>{label(item.status)}</span></td>
                  <td className="px-4 py-3 text-right"><Link href={`/admin/pedidos/${item.id}`} className="inline-flex size-9 items-center justify-center rounded-full bg-[#fff0e9] text-[#9b382b]"><ArrowRight size={15} /></Link></td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-[#8b8078]">Aún no hay pedidos.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
