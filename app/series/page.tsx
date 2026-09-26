import { Footer } from "@/components/store/Footer";
import { Header } from "@/components/store/Header";
import { SeriesShop } from "@/components/store/SeriesShop";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const cooperStyle = {
  fontFamily:
    '"Cooper Black", "Cooper Std Black", Georgia, serif',
};

export default async function SeriesPage() {
  const supabase = await createClient();

  const [
    { data: settings },
    { data: products },
    { data: availability },
  ] = await Promise.all([
    supabase
      .from("series_storefront_settings")
      .select(`
        id,
        eyebrow,
        title,
        highlight_text,
        subtitle,
        hero_url
      `)
      .eq("active", true)
      .limit(1)
      .maybeSingle(),

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

  const heroImage =
    settings?.hero_url ||
    products?.find((item) => item.cover_url)?.cover_url ||
    null;

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#fffaf6]">
        <section className="relative overflow-hidden border-b border-[#eaded3]">
          {heroImage ? (
            <img
              src={heroImage}
              alt={settings?.title ?? "Series Kids"}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#5a8b86,#335f5b)]" />
          )}

          <div className="absolute inset-0 bg-gradient-to-r from-[#211815]/78 via-[#211815]/35 to-transparent" />

          <div className="relative z-10">
            <div className="ti-container flex min-h-[340px] items-end py-10 sm:min-h-[440px] sm:py-14 lg:min-h-[520px]">
              <div className="max-w-4xl">
                <p className="text-[9px] font-black uppercase tracking-[.24em] text-[#ffd47b] sm:text-[11px]">
                  {settings?.eyebrow ?? "TENDENCIAS IMPORT"}
                </p>

                <h1
                  className="mt-2 text-4xl leading-[.92] tracking-[-.035em] text-white sm:text-6xl lg:text-7xl"
                  style={cooperStyle}
                >
                  {settings?.title ?? "Series Kids"}
                </h1>

                <p
                  className="mt-1 text-3xl leading-[.95] text-[#ef7458] sm:text-5xl lg:text-6xl"
                  style={cooperStyle}
                >
                  {settings?.highlight_text ??
                    "modelos listos para tu negocio"}
                </p>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/82 sm:text-base">
                  {settings?.subtitle ??
                    "Elige un modelo, revisa stock o preventa y arma tu surtido por tallas y colores."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="ti-container py-10 sm:py-14">
          <div className="text-center">
            <p className="text-[9px] font-black uppercase tracking-[.22em] text-[#5a8b86]">
              Catálogo de Series
            </p>

            <h2
              className="mt-2 text-3xl leading-none text-[#2c2825] sm:text-5xl"
              style={cooperStyle}
            >
              Elige tu modelo
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-xs leading-6 text-[#7f746c] sm:text-sm">
              Revisa los códigos disponibles y elige stock o preventa según cada modelo.
            </p>
          </div>

          <div className="mt-8">
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
              whatsappNumber={
                process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""
              }
            />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
