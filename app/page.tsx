import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  PackageCheck,
  Sparkles,
} from "lucide-react";

import { Footer } from "@/components/store/Footer";
import { Header } from "@/components/store/Header";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const [
    { data: sections },
    { data: categories },
    { data: series },
  ] = await Promise.all([
    supabase
      .from("paca_sections")
      .select(`
        id,
        name,
        slug,
        description,
        accent_color,
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

  const homeSections = (sections ?? []).slice(0, 6);

  return (
    <>
      <Header />

      <main>
        <section className="ti-container grid items-center gap-8 py-10 lg:min-h-[620px] lg:grid-cols-[1.08fr_.92fr]">
          <div>
            <span className="ti-pill">
              <Sparkles size={15} />
              MAYORISTA · PERÚ
            </span>

            <h1 className="ti-home-hero-title mt-6 max-w-3xl">
              Moda para
              <span className="block text-[#b63a2c]">
                hacer crecer
              </span>
              tu negocio.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-[#6f655e]">
              Explora las líneas de Pacas en preventa o elige Series Kids disponibles desde nuestra tienda.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/pacas"
                className="ti-button ti-button-primary"
              >
                Ver Pacas
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/series"
                className="ti-button ti-button-soft"
              >
                Ver Series Kids
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#eaded3] bg-white p-3 shadow-[0_12px_30px_rgba(67,47,34,.08)] sm:p-5">
            <div className="grid grid-cols-2 gap-3">
              {homeSections.map((section) => (
                <Link
                  key={section.id}
                  href="/pacas"
                  className="flex aspect-square flex-col justify-between rounded-[24px] p-4 text-white shadow-sm transition hover:-translate-y-0.5 sm:p-5"
                  style={{
                    backgroundColor:
                      section.accent_color ?? "#b63a2c",
                  }}
                >
                  <Boxes size={24} />

                  <div>
                    <p className="text-xl font-black leading-tight sm:text-2xl">
                      Pacas {section.name}
                    </p>

                    <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-white/80 sm:text-xs">
                      {section.description ??
                        "Explora las categorías disponibles."}
                    </p>
                  </div>
                </Link>
              ))}

              <Link
                href="/series"
                className="flex aspect-square flex-col justify-between rounded-[24px] bg-[#5a8b86] p-4 text-white shadow-sm transition hover:-translate-y-0.5 sm:p-5"
              >
                <PackageCheck size={24} />

                <div>
                  <p className="text-xl font-black leading-tight sm:text-2xl">
                    Series Kids
                  </p>

                  <p className="mt-2 text-[10px] leading-4 text-white/80 sm:text-xs">
                    Stock real por código.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section className="ti-container py-12 sm:py-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="ti-pill">
                PACAS
              </span>

              <h2 className="ti-brand-section-title mt-4">
                Elige lo que quieres vender
              </h2>
            </div>

            <Link
              href="/pacas"
              className="hidden font-extrabold text-[#b63a2c] sm:block"
            >
              Ver todo →
            </Link>
          </div>

          <div className="mt-7 space-y-8">
            {homeSections.map((section) => {
              const items = (categories ?? [])
                .filter(
                  (category) =>
                    category.section_id === section.id,
                )
                .slice(0, 4);

              if (items.length === 0) {
                return null;
              }

              return (
                <div key={section.id}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-black">
                      {section.name}
                    </h3>

                    <Link
                      href="/pacas"
                      className="text-[10px] font-black text-[#9b382b]"
                    >
                      Ver sección →
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                    {items.map((category) => (
                      <Link
                        href={`/pacas/${category.slug}`}
                        key={category.id}
                        className="group overflow-hidden rounded-[22px] border border-[#eaded3] bg-white shadow-[0_8px_22px_rgba(67,47,34,.07)] transition hover:-translate-y-1"
                      >
                        <div
                          className="aspect-square bg-[#f0e6dc] bg-cover bg-center"
                          style={
                            category.cover_url
                              ? {
                                  backgroundImage: `url(${category.cover_url})`,
                                }
                              : {}
                          }
                        />

                        <div className="p-3.5 sm:p-5">
                          <span
                            className="text-[9px] font-black uppercase tracking-[.16em] sm:text-xs"
                            style={{
                              color:
                                section.accent_color ?? "#5a8b86",
                            }}
                          >
                            {section.name}
                          </span>

                          <h4 className="mt-2 text-[17px] font-black leading-tight sm:text-2xl">
                            {category.name}
                          </h4>

                          <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black text-[#9b382b] sm:text-sm">
                            Ver categoría
                            <ArrowRight size={14} />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white/50 py-8 sm:py-10">
          <div className="ti-container">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="ti-pill">
                  STOCK REAL
                </span>

                <h2 className="ti-brand-section-title mt-4">
                  Series Kids disponibles
                </h2>
              </div>

              <Link
                href="/series"
                className="hidden font-extrabold text-[#b63a2c] sm:block"
              >
                Ver Series →
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
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
                    className="ti-card overflow-hidden"
                  >
                    <div
                      className="aspect-square bg-[#f1e8df] bg-cover bg-center"
                      style={
                        item.cover_url
                          ? {
                              backgroundImage: `url(${item.cover_url})`,
                            }
                          : {}
                      }
                    />

                    <div className="p-4">
                      <p className="text-[10px] font-black tracking-[.14em] text-[#5a8b86]">
                        {item.code}
                      </p>

                      <p className="mt-1 font-black">
                        {item.name}
                      </p>

                      <div className="mt-3 flex items-end justify-between gap-2">
                        <p className="text-base font-black text-[#b63a2c]">
                          S/ {price.toFixed(2)}
                        </p>

                        <span className="text-[9px] font-black text-[#7f746c]">
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
