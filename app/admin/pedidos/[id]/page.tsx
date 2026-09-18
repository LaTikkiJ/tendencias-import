import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Banknote, Boxes, MapPin, Phone, UserRound } from "lucide-react";
import { updateCustomerOrderStatusV4 } from "@/app/admin/pedidos/actions";
import { DeleteOrderButton } from "@/components/admin/DeleteOrderButton";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function money(value: number | string | null) { return `S/ ${Number(value ?? 0).toFixed(2)}`; }
function label(status: string) {
  const map: Record<string, string> = { NUEVO:"Nuevo", ESPERANDO_PAGO:"Esperando pago", PAGO_EN_REVISION:"Pago en revisión", CONFIRMADO:"Confirmado", PREPARANDO:"Preparando", ENVIADO:"Enviado", CANCELADO:"Cancelado" };
  return map[status] ?? status;
}
const statuses = ["NUEVO","ESPERANDO_PAGO","PAGO_EN_REVISION","CONFIRMADO","PREPARANDO","ENVIADO","CANCELADO"];

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from("customer_orders").select("*").eq("id", id).single(),
    supabase.from("customer_order_items").select(`*,customer_order_item_allocations(id,color,size,qty,unit_cost,state)`).eq("order_id", id).order("created_at"),
  ]);

  if (!order) notFound();

  let proofUrl: string | null = null;
  if (order.payment_proof_path) {
    const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(order.payment_proof_path, 3600);
    proofUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/pedidos" className="inline-flex items-center gap-2 text-sm font-black text-[#8f3a2e]"><ArrowLeft size={16} /> Volver a pedidos</Link>
        <DeleteOrderButton orderId={order.id} />
      </div>

      <section className="rounded-[30px] border border-[#eaded3] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#5a8b86]">{order.code}</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-.04em]">{order.client_name}</h1>
            <p className="mt-2 text-sm text-[#7f746c]">{order.source} · Inventario {order.inventory_state}</p>
          </div>

          {order.status !== "CANCELADO" && (
            <form action={updateCustomerOrderStatusV4} className="flex flex-wrap gap-2">
              <input type="hidden" name="id" value={order.id} />
              <select name="status" defaultValue={order.status} className="ti-input min-w-[190px]">
                {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
              </select>
              <button className="min-h-12 rounded-[16px] bg-[#b63a2c] px-5 text-xs font-black text-white">Guardar estado</button>
            </form>
          )}
        </div>

        {order.status === "PAGO_EN_REVISION" && (
          <div className="mt-5 rounded-[20px] bg-[#fff8e9] p-4">
            <p className="text-sm font-black text-[#8a651f]">Revisa el comprobante antes de confirmar.</p>
            <p className="mt-1 text-xs leading-5 text-[#8a7146]">Al cambiar a “Confirmado”, el stock reservado se descuenta físicamente.</p>
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[20px] bg-white p-4 shadow-sm"><UserRound size={17} className="text-[#5a8b86]" /><p className="mt-3 text-[9px] font-black uppercase text-[#8b8078]">Cliente</p><p className="mt-1 font-black">{order.client_name}</p></div>
        <div className="rounded-[20px] bg-white p-4 shadow-sm"><Phone size={17} className="text-[#5a8b86]" /><p className="mt-3 text-[9px] font-black uppercase text-[#8b8078]">WhatsApp</p><p className="mt-1 font-black">{order.client_phone}</p></div>
        <div className="rounded-[20px] bg-white p-4 shadow-sm"><Banknote size={17} className="text-[#d39218]" /><p className="mt-3 text-[9px] font-black uppercase text-[#8b8078]">Pago</p><p className="mt-1 font-black">{order.payment_method || "Pendiente"}</p></div>
        <div className="rounded-[20px] bg-[#8f3a2e] p-4 text-white shadow-sm"><p className="text-[9px] font-black uppercase text-white/70">Total</p><p className="mt-4 text-xl font-black">{money(order.total)}</p></div>
      </section>

      {proofUrl && (
        <section className="rounded-[24px] border border-[#eaded3] bg-white p-5">
          <p className="font-black">Comprobante</p>
          <a href={proofUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block"><img src={proofUrl} alt="Comprobante de pago" className="max-h-[420px] rounded-[18px] border border-[#eaded3] object-contain" /></a>
        </section>
      )}

      <section className="rounded-[24px] border border-[#eaded3] bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f4faf8] text-[#5a8b86]"><MapPin size={16} /></span>
          <div>
            <p className="font-black">Entrega</p>
            <p className="mt-2 text-sm leading-6 text-[#7f746c]">{order.delivery_type}{order.delivery_agency ? ` · ${order.delivery_agency}` : ""}{order.delivery_city ? ` · ${order.delivery_city}` : ""}</p>
            {order.delivery_address && <p className="mt-1 text-sm text-[#7f746c]">{order.delivery_address}</p>}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#eaded3] bg-white shadow-sm">
        <div className="border-b border-[#eaded3] px-5 py-4"><div className="flex items-center gap-2"><Boxes size={17} className="text-[#5a8b86]" /><p className="font-black">Productos e inventario usado</p></div></div>
        <div className="divide-y divide-[#f0e7df]">
          {(items ?? []).map((item: any) => (
            <article key={item.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black text-[#5a8b86]">{item.product_code}</p>
                  <h3 className="mt-1 font-black">{item.product_name}</h3>
                  <p className="mt-1 text-xs text-[#7f746c]">{item.sale_mode === "STOCK" ? "Stock" : "Preventa"} · {item.qty_series} serie(s)</p>
                </div>
                <div className="text-right"><p className="text-xs font-bold text-[#7f746c]">{money(item.unit_price)} c/u</p><p className="mt-1 font-black text-[#b63a2c]">{money(item.subtotal)}</p></div>
              </div>

              {item.sale_mode === "STOCK" && item.customer_order_item_allocations?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.customer_order_item_allocations.map((a: any) => (
                    <span key={a.id} className="rounded-full bg-[#f4faf8] px-3 py-1.5 text-[9px] font-black text-[#42746e]">T{a.size} · {a.color} × {a.qty}</span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
