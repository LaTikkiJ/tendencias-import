import { CreditCard } from "lucide-react";
import { PaymentAccountsEditor } from "@/components/admin/PaymentAccountsEditor";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PaymentAccountsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("payment_accounts").select("*").order("sort_order");

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-[#eaded3] bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#fff0e9] text-[#b63a2c]"><CreditCard size={20} /></span>
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#5a8b86]">Checkout</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-.04em]">Cuentas de pago</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7f746c]">Sofía puede cambiar sus cuentas sin tocar código. Solo las activas aparecen a las clientas.</p>
          </div>
        </div>
      </section>

      <PaymentAccountsEditor accounts={(data ?? []) as any} />
    </div>
  );
}
