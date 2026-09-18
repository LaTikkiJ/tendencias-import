import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { SeriesShop } from "@/components/store/SeriesShop";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SeriesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("series_products")
    .select("id,code,name,slug,price,cover_url,series_available,status,sizes")
    .eq("active", true)
    .gt("series_available", 0)
    .order("created_at", { ascending: false });

  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "51999999999";

  return (
    <>
      <Header />

      <main>
        <section className="border-b border-[#eaded3] bg-[#fff7f0]">
          <div className="ti-container py-10 sm:py-14">
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#5a8b86]">
              Series Kids
            </p>

            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-.05em] sm:text-6xl">
              Arma tu carrito por código
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#756a62]">
              Elige tus modelos, selecciona cuántas series quieres y envía todo
              al WhatsApp de Tendencias Import.
            </p>
          </div>
        </section>

        <section className="ti-container py-8">
          <SeriesShop
            items={(data ?? []) as any}
            whatsappNumber={whatsappNumber}
          />
        </section>
      </main>

      <Footer />
    </>
  );
}
