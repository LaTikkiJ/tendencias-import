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
    { data: categories },
    { data: series },
  ] = await Promise.all([
    supabase
      .from("paca_categories")
      .select(
        "id,name,slug,audience,description,cover_url",
      )
      .eq("active", true)
      .order("sort_order"),

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
      .order("created_at", {
        ascending: false,
      })
      .limit(6),
  ]);

  return (
    <>
      <Header />

      <main>
        {/* HERO */}
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
              Explora Pacas Kids y Damas en preventa, o elige
              Series Kids disponibles desde nuestra tienda.
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

          {/* MOSAICO PRINCIPAL: SIEMPRE 2 COLUMNAS, TAMBIÉN EN CELULAR */}
          <div className="rounded-[28px] border border-[#eaded3] bg-white p-3 shadow-[0_12px_30px_rgba(67,47,34,.08)] sm:p-5">
            <div className="grid grid-cols-[1.08fr_.92fr] grid-rows-2 gap-3">
              <Link
                href="/pacas"
                className="row-span-2 flex min-h-[320px] flex-col justify-between rounded-[26px] bg-[#b63a2c] p-5 text-white shadow-sm transition hover:-translate-y-0.5 sm:min-h-[390px] sm:p-7"
              >
                <Boxes size={30} />

                <div>
                  <p className="text-[2rem] font-black leading-[.98] sm:text-[2.65rem]">
                    Pacas
                    <br />
                    Kids
                  </p>

                  <p className="mt-3 text-[12px] leading-5 text-white/80 sm:text-sm sm:leading-6">
                    Fotos, videos y pedido personalizado.
                  </p>
                </div>
              </Link>

              <Link
                href="/pacas"
                className="flex min-h-[154px] flex-col justify-end rounded-[24px] bg-[#c78316] p-4 text-white shadow-sm transition hover:-translate-y-0.5 sm:min-h-[188px] sm:p-5"
              >
                <p className="text-2xl font-black sm:text-[2rem]">
                  Damas
                </p>

                <p className="mt-2 text-[11px] leading-5 text-white/82 sm:text-sm">
                  Categorías por temporada.
                </p>
              </Link>

              <Link
                href="/series"
                className="flex min-h-[154px] flex-col justify-between rounded-[24px] bg-[#5a8b86] p-4 text-white shadow-sm transition hover:-translate-y-0.5 sm:min-h-[188px] sm:p-5"
              >
                <PackageCheck size={24} />

                <div>
                  <p className="text-xl font-black sm:text-[2rem]">
                    Series Kids
                  </p>

                  <p className="mt-2 text-[11px] leading-5 text-white/82 sm:text-sm">
                    Stock real por código.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* PACAS: 2 POR FILA EN CELULAR */}
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

          <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {(categories ?? [])
              .slice(0, 8)
              .map((category) => (
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
                    <span className="text-[9px] font-black uppercase tracking-[.16em] text-[#5a8b86] sm:text-xs">
                      {category.audience}
                    </span>

                    <h3 className="mt-2 text-[17px] font-black leading-tight sm:text-2xl">
                      {category.name}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-[#7f746c] sm:text-sm sm:leading-6">
                      {category.description}
                    </p>

                    <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black text-[#9b382b] sm:text-sm">
                      Ver categoría
                      <ArrowRight
                        size={14}
                        className="transition group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        </section>

        {/* SERIES */}
        <section className="bg-white/50 py-12 sm:py-14">
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
              {(series ?? []).map(
                (item) => {
                  const stock =
                    Number(
                      item.stock_series_available ??
                        0,
                    );

                  const preorder =
                    Number(
                      item.preorder_series_available ??
                        0,
                    );

                  const price =
                    stock > 0
                      ? Number(
                          item.price_stock ??
                            0,
                        )
                      : Number(
                          item.price_preorder ??
                            0,
                        );

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
                },
              )}
            </div>
          </div>
        </section>

        {/* SOLO DESKTOP / TABLET: OCULTO COMPLETAMENTE EN CELULAR */}
        <section
          id="como-comprar"
          className="hidden md:block"
        >
          <div className="ti-container py-14">
            <div className="rounded-[30px] bg-[#9d3d31] p-7 shadow-[0_18px_45px_rgba(117,48,38,.15)]">
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#ffd46a]">
                Cómo comprar
              </p>

              <h2 className="mt-2 text-4xl font-black tracking-[-.03em] text-white">
                Explora, elige y compra.
              </h2>

              <div className="mt-5 grid grid-cols-3 gap-4">
                {[
                  ["01", "Explora", "Mira fotos y videos."],
                  ["02", "Elige", "Selecciona tu opción."],
                  ["03", "Compra", "Finaliza por WhatsApp."],
                ].map(([number, title, description]) => (
                  <div
                    key={number}
                    className="rounded-[22px] bg-white/[.10] p-5"
                  >
                    <p className="text-sm font-black text-[#ffd46a]">
                      {number}
                    </p>

                    <h3 className="mt-2 text-2xl font-black text-white">
                      {title}
                    </h3>

                    <p className="mt-1 text-[11px] leading-5 text-white/70">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
