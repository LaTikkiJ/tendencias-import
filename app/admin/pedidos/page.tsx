import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(`
      id, order_number, customer_name, phone, department, district,
      subtotal, total, status, expires_at, created_at,
      order_items(id, product_code, product_name, qty, unit_price)
    `)
    .order("created_at", { ascending: false });

  return (
    <div>
      <p className="text-sm font-black tracking-[.16em] text-[#5a8b86]">PEDIDOS</p>
      <h1 className="mt-2 text-4xl font-black tracking-[-.04em]">Reservas de series</h1>

      <div className="mt-7 grid gap-4">
        {(data ?? []).map((order: any) => (
          <article key={order.id} className="ti-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black tracking-[.16em] text-[#5a8b86]">{order.order_number}</p>
                <h2 className="mt-1 text-xl font-black">{order.customer_name}</h2>
                <p className="text-sm text-[#7f746c]">{order.phone} · {order.district}, {order.department}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black">S/ {Number(order.total).toFixed(2)}</p>
                <span className="ti-pill mt-2">{order.status}</span>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {(order.order_items ?? []).map((line: any) => (
                <div key={line.id} className="flex justify-between rounded-2xl bg-white p-3 text-sm">
                  <span><b>{line.product_code}</b> · {line.product_name} × {line.qty}</span>
                  <b>S/ {(Number(line.unit_price) * line.qty).toFixed(2)}</b>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
