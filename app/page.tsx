import Link from "next/link";
import {
  ArrowRight,
  Boxes,
} from "lucide-react";

import { Footer } from "@/components/store/Footer";
import { Header } from "@/components/store/Header";
import PacaHomeHero from "@/components/store/PacaHomeHero";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const [
    { data: banners },
    { data: sections },
    { data: categories },
    { data: series },
  ] = await Promise.all([
    supabase
      .from("paca_home_banners")
      .select("id,image_url,title,subtitle,sort_order")
      .eq("active", true)
      .order("sort_order")
      .order("created_at"),

    supabase
      .from("paca_sections")
      .select(`
        id,
        name,
        slug,
        description,
        accent_color,
        cover_url,
        sort_order
      `)
      .eq("active", true)
      .eq("show_on_home", true)
      .order("sort_order")
      .order("name"),

    supabase
      .from("paca_categories")
      .select(`
        id,
        section_id,
        name,
        slug,
        description,
        cover_url,
        sort_order
      `)
      .eq("active", true)
      .order("sort_order")
      .order("name"),

    supabase
      .from("series_products")
      .select(`
        id,
        code,
        name,
        slug,
        cover_url,
        price_preorder,
        price_stock,
        stock_series_available,
        preorder_series_available
      `)
      .eq("active", true)
      .or(
        "stock_series_available.gt.0,preorder_series_available.gt.0",
      )
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  return (
    <>
      <Header />

      <main>
        <PacaHomeHero banners={(banners ?? []) as any} />

        <section className="border-t border-[#efe4da] bg-white/55 py-12 sm:py-16">
          <div className="ti-container">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[.24em] text-[#b63a2c]">
              Tendencias Import
            </p>

            <h2 className="mx-auto mt-2 max-w-4xl text-3xl font-black tracking-[-.045em] sm:text-5xl">
              Todo lo que necesitas para abastecer tu negocio
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-xs leading-6 text-[#7f746c] sm:text-sm">
              Elige una sección y revisa sus categorías, collages y videos referenciales.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {(sections ?? []).map((section) => (
              <Link
                key={section.id}
                href={`/pacas?section=${section.slug}`}
                className="group relative overflow-hidden rounded-[24px] bg-[#eee5dc] shadow-[0_12px_30px_rgba(75,50,40,.09)]"
              >
                <div className="aspect-[4/3] sm:aspect-[16/10]">
                  {section.cover_url ? (
                    <img
                      src={section.cover_url}
                      alt={`Pacas ${section.name}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div
                      className="grid h-full place-items-center"
                      style={{
                        backgroundColor:
                          section.accent_color ?? "#b63a2c",
                      }}
                    >
                      <Boxes size={34} className="text-white/85" />
                    </div>
                  )}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white sm:p-5">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[.14em] text-white/70">
                      Pacas
                    </p>

                    <h3 className="mt-1 text-xl font-black sm:text-3xl">
                      {section.name}
                    </h3>
                  </div>

                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white !text-[#9b382b] shadow">
                    <ArrowRight size={15} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="ti-container py-12 sm:py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#c78316]">
                Series Kids
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-5xl">
                Series disponibles
              </h2>
            </div>

            <Link
              href="/series"
              className="hidden text-xs font-black text-[#9b382b] sm:block"
            >
              Ver todas →
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {(series ?? []).map((item) => {
              const stock = Number(
                item.stock_series_available ?? 0,
              );

              const preorder = Number(
                item.preorder_series_available ?? 0,
              );

              const price =
                stock > 0
                  ? Number(item.price_stock ?? 0)
                  : Number(item.price_preorder ?? 0);

              return (
                <Link
                  key={item.id}
                  href={`/series/${item.slug}`}
                  className="group overflow-hidden rounded-[22px] border border-[#eaded3] bg-white shadow-[0_8px_24px_rgba(65,45,35,.06)]"
                >
                  <div className="aspect-square overflow-hidden bg-[#eee5dc]">
                    {item.cover_url && (
                      <img
                        src={item.cover_url}
                        alt={item.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    )}
                  </div>

                  <div className="p-3.5 sm:p-4">
                    <p className="text-[8px] font-black uppercase tracking-[.12em] text-[#5a8b86]">
                      {item.code}
                    </p>

                    <p className="mt-1 text-sm font-black sm:text-lg">
                      {item.name}
                    </p>

                    <div className="mt-3 flex items-end justify-between gap-2">
                      <p className="text-sm font-black text-[#b63a2c] sm:text-base">
                        S/ {price.toFixed(2)}
                      </p>

                      <span className="text-[8px] font-black text-[#7f746c]">
                        {stock > 0
                          ? `${stock} stock`
                          : `${preorder} preventa`}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
