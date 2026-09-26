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

const cooperStyle = {
  fontFamily:
    '"Cooper Black", "Cooper Std Black", Georgia, serif',
};

export default async function HomePage() {
  const supabase = await createClient();

  const [
    { data: banners },
    { data: sections },
    { data: series },
  ] = await Promise.all([
    supabase
      .from("paca_home_banners")
      .select(`
        id,
        image_url,
        eyebrow,
        title,
        highlight_text,
        subtitle,
        sort_order
      `)
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
      .from("series_products")
      .select(`
        id,
        name,
        cover_url,
        stock_series_available,
        preorder_series_available
      `)
      .eq("active", true)
      .or(
        "stock_series_available.gt.0,preorder_series_available.gt.0",
      )
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const sectionItems = sections ?? [];
  const oddSections = sectionItems.length % 2 === 1;
  const seriesBannerImage = series?.[0]?.cover_url ?? null;

  return (
    <>
      <Header />

      <main>
        <PacaHomeHero banners={(banners ?? []) as any} />

        <section className="ti-container py-12 sm:py-16">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[.24em] text-[#b63a2c]">
              Tendencias Import
            </p>

            <h2
              className="mx-auto mt-2 max-w-4xl text-3xl leading-[.95] sm:text-5xl"
              style={cooperStyle}
            >
              Elige la línea que quieres vender
            </h2>
          </div>

          <div className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {sectionItems.map((section, index) => {
              const isLastOdd =
                oddSections && index === sectionItems.length - 1;

              return (
                <Link
                  key={section.id}
                  href={`/pacas?section=${section.slug}`}
                  className={`group relative overflow-hidden rounded-[24px] bg-[#eee5dc] shadow-[0_12px_30px_rgba(75,50,40,.09)] ${
                    isLastOdd
                      ? "col-span-2 w-[calc(50%-6px)] justify-self-center lg:col-span-1 lg:w-auto"
                      : ""
                  }`}
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

                  <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/5 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white sm:p-5">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[.14em] text-white/70">
                        Pacas
                      </p>

                      <h3
                        className="mt-1 text-xl leading-none sm:text-3xl"
                        style={cooperStyle}
                      >
                        {section.name}
                      </h3>
                    </div>

                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white !text-[#9b382b] shadow">
                      <ArrowRight size={15} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="border-t border-[#efe4da] bg-white/55 py-12 sm:py-16">
          <div className="ti-container">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#5a8b86]">
                Tendencias Import
              </p>

              <h2
                className="mt-2 text-3xl leading-none sm:text-5xl"
                style={cooperStyle}
              >
                Series Kids
              </h2>
            </div>

            <Link
              href="/series"
              className="group relative mx-auto mt-7 block max-w-6xl overflow-hidden rounded-[26px] bg-[#5a8b86] shadow-[0_14px_38px_rgba(70,45,35,.10)]"
            >
              <div className="aspect-[16/6] min-h-[230px]">
                {seriesBannerImage ? (
                  <img
                    src={seriesBannerImage}
                    alt="Series Kids"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="h-full bg-[linear-gradient(135deg,#5a8b86,#386a66)]" />
                )}
              </div>

              <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/20 to-transparent" />

              <div className="absolute inset-0 flex items-end justify-between gap-4 p-6 text-white sm:p-9">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[.2em] text-white/70">
                    Stock y preventa
                  </p>

                  <p
                    className="mt-1 text-3xl leading-none sm:text-5xl"
                    style={cooperStyle}
                  >
                    Explora nuestras Series Kids
                  </p>
                </div>

                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white !text-[#9b382b] shadow-lg">
                  <ArrowRight size={18} />
                </span>
              </div>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
