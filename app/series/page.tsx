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

      <main className="ti-container py-12">
        <span className="ti-pill">SERIES KIDS</span>

        <h1 className="ti-section-title mt-5">
          Elige tus series y arma tu carrito
        </h1>

        <p className="mt-4 max-w-2xl text-[#7f746c]">
          Agrega los códigos que te interesan, revisa tu carrito y envíalo
          directamente al WhatsApp de Tendencias Import. No necesitas pagar
          dentro de la web.
        </p>

        <div className="mt-4 rounded-2xl border border-[#eaded3] bg-white/70 p-4 text-sm text-[#7f746c]">
          La cantidad mostrada es la disponibilidad registrada por Sofía.
          La confirmación final del stock se realiza por WhatsApp.
        </div>

        <div className="mt-10">
          <SeriesShop
            items={(data ?? []) as any}
            whatsappNumber={whatsappNumber}
          />
        </div>
      </main>

      <Footer />
    </>
  );
}
