import { Footer } from "@/components/store/Footer";
import { Header } from "@/components/store/Header";
import { SeriesShop } from "@/components/store/SeriesShop";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SeriesPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: availability }] = await Promise.all([
    supabase
      .from("series_products")
      .select(`
        id,
        code,
        name,
        slug,
        description,
        cover_url,
        sizes,
        price_preorder,
        price_stock,
        stock_series_available,
        preorder_series_available
      `)
      .eq("active", true)
      .or("stock_series_available.gt.0,preorder_series_available.gt.0")
      .order("created_at", { ascending: false }),

    supabase.rpc("get_public_series_color_availability_v7"),
  ]);

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#fffaf6]">
        <section className="border-b border-[#eaded3] bg-[#fff7f0]">
          <div className="ti-container py-8 sm:py-10">
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#5a8b86]">
              Tendencias Import
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-[-.05em] sm:text-5xl">
              Series Kids
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#756a62]">
              Elige un modelo y arma la serie a tu gusto. Puedes dejar que el sistema
              combine colores disponibles o elegir el color de cada talla.
            </p>
          </div>
        </section>

        <section className="ti-container py-7 sm:py-9">
          <SeriesShop
            items={(products ?? []).map((item) => ({
              ...item,
              description: item.description ?? "",
              cover_url: item.cover_url ?? null,
              sizes: item.sizes ?? [],
              price_preorder: Number(item.price_preorder ?? 0),
              price_stock: Number(item.price_stock ?? 0),
              stock_series_available: Number(item.stock_series_available ?? 0),
              preorder_series_available: Number(item.preorder_series_available ?? 0),
            })) as any}
            availability={(availability ?? []) as any}
            whatsappNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""}
          />
        </section>
      </main>

      <Footer />
    </>
  );
}
