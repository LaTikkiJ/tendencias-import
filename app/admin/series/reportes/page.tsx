import { createClient } from "@/lib/supabase/server";
import { BarChart3, Banknote, PackageCheck, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

export default async function SeriesReportsPage() {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("customer_order_items")
    .select(`
      id,
      product_code,
      product_name,
      qty_series,
      subtotal,
      customer_orders (
        status,
        source,
        created_at
      ),
      customer_order_item_allocations (
        qty,
        unit_cost,
        state
      )
    `)
    .order("created_at", { ascending: false });

  const valid = (rows ?? []).filter((row: any) => {
    const status = row.customer_orders?.status;
    return ["CONFIRMADO", "PREPARANDO", "ENVIADO"].includes(status);
  });

  const byCode = new Map<string, {
    code: string;
    name: string;
    sales: number;
    cost: number;
    series: number;
  }>();

  let totalSales = 0;
  let totalCost = 0;
  let totalSeries = 0;

  for (const row of valid as any[]) {
    const sales = Number(row.subtotal ?? 0);
    const cost = (row.customer_order_item_allocations ?? [])
      .filter((a: any) => a.state !== "RESTORED")
      .reduce(
        (sum: number, a: any) =>
          sum + Number(a.qty ?? 0) * Number(a.unit_cost ?? 0),
        0,
      );

    totalSales += sales;
    totalCost += cost;
    totalSeries += Number(row.qty_series ?? 0);

    const key = String(row.product_code ?? "SIN-CODIGO");
    const current = byCode.get(key) ?? {
      code: key,
      name: String(row.product_name ?? ""),
      sales: 0,
      cost: 0,
      series: 0,
    };

    current.sales += sales;
    current.cost += cost;
    current.series += Number(row.qty_series ?? 0);
    byCode.set(key, current);
  }

  const profit = totalSales - totalCost;
  const margin = totalSales > 0 ? (profit / totalSales) * 100 : 0;
  const products = Array.from(byCode.values()).sort(
    (a, b) => b.sales - a.sales,
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-[#eaded3] bg-white p-5 shadow-sm sm:p-6">
        <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#5a8b86]">
          Series · Rentabilidad
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">
          Reporte de ventas
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7f746c]">
          Compara lo vendido con el costo real de los lotes para ver la utilidad.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric icon={<Banknote size={16} />} label="Ventas" value={money(totalSales)} />
          <Metric icon={<PackageCheck size={16} />} label="Costo" value={money(totalCost)} />
          <Metric icon={<TrendingUp size={16} />} label="Utilidad" value={money(profit)} />
          <Metric icon={<BarChart3 size={16} />} label="Margen" value={`${margin.toFixed(1)}%`} />
        </div>
      </section>

      <section className="overflow-hidden rounded-[26px] border border-[#eaded3] bg-white shadow-sm">
        <div className="border-b border-[#eaded3] px-4 py-4 sm:px-5">
          <p className="font-black">Rentabilidad por código</p>
          <p className="mt-1 text-[9px] text-[#7f746c]">
            {totalSeries} series vendidas en pedidos confirmados/preparando/enviados.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[780px] w-full text-left">
            <thead className="bg-[#f8f4f0] text-[8px] font-black uppercase text-[#7f746c]">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Modelo</th>
                <th className="px-4 py-3 text-right">Series</th>
                <th className="px-4 py-3 text-right">Ventas</th>
                <th className="px-4 py-3 text-right">Costo</th>
                <th className="px-4 py-3 text-right">Utilidad</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={item.code} className="border-t border-[#f0e7df]">
                  <td className="px-4 py-3 text-[10px] font-black text-[#5a8b86]">{item.code}</td>
                  <td className="px-4 py-3 text-[10px] font-black">{item.name}</td>
                  <td className="px-4 py-3 text-right text-[10px]">{item.series}</td>
                  <td className="px-4 py-3 text-right text-[10px] font-black">{money(item.sales)}</td>
                  <td className="px-4 py-3 text-right text-[10px]">{money(item.cost)}</td>
                  <td className="px-4 py-3 text-right text-[10px] font-black text-[#42746e]">
                    {money(item.sales - item.cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="p-8 text-center text-sm text-[#7f746c]">
            Todavía no hay ventas confirmadas para calcular rentabilidad.
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] bg-[#f8f4f0] p-4">
      <div className="flex items-center gap-2 text-[#5a8b86]">
        {icon}
        <p className="text-[8px] font-black uppercase tracking-[.08em]">{label}</p>
      </div>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  );
}
