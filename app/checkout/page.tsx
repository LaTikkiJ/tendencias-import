import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: paymentAccounts }] = await Promise.all([
    supabase
      .from("series_products")
      .select(`id,code,name,cover_url,sizes,status,price,price_preorder,price_stock,series_available,preorder_series_available,stock_series_available`)
      .eq("active", true),
    supabase
      .from("payment_accounts")
      .select(`id,method,label,holder,account_number,cci,qr_url,instructions,sort_order`)
      .eq("active", true)
      .order("sort_order"),
  ]);

  return (
    <>
      <Header />
      <main>
        <section className="border-b border-[#eaded3] bg-[#fff7f0]">
          <div className="ti-container py-8 sm:py-10">
            <Link href="/series" className="inline-flex items-center gap-2 text-xs font-black text-[#8f3a2e]">
              <ArrowLeft size={14} /> Volver a Series
            </Link>

            <div className="mt-5 flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#edf7f5] text-[#5a8b86]">
                <ShieldCheck size={18} />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#5a8b86]">Compra por la web</p>
                <h1 className="mt-2 text-4xl font-black tracking-[-.05em] sm:text-5xl">Finaliza tu pedido</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#756a62]">
                  Registra tus datos, elige cómo recibirás tu pedido y revisa las cuentas de Tendencias Import.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="ti-container py-8 sm:py-10">
          <CheckoutForm
            products={(products ?? []) as any}
            paymentAccounts={(paymentAccounts ?? []) as any}
            whatsappNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""}
          />
        </section>
      </main>
      <Footer />
    </>
  );
}
