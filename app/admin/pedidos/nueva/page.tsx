import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { ManualOrderForm } from "@/components/admin/ManualOrderForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewManualOrderPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("series_products")
    .select(`id,code,name,sizes,cover_url,price_preorder,price_stock,preorder_series_available,stock_series_available`)
    .eq("active", true)
    .order("code");

  return (
    <div className="space-y-6">
      <Link href="/admin/pedidos" className="inline-flex items-center gap-2 text-sm font-black text-[#8f3a2e]"><ArrowLeft size={16} /> Volver a pedidos</Link>

      <section className="rounded-[30px] border border-[#eaded3] bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#fff0e9] text-[#b63a2c]"><Plus size={20} /></span>
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#5a8b86]">Personal</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-.04em]">Nueva venta manual</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7f746c]">Primero nombre y WhatsApp. Luego envío y productos.</p>
          </div>
        </div>
      </section>

      <ManualOrderForm products={(data ?? []) as any} />
    </div>
  );
}
