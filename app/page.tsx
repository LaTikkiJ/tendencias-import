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
        <section className="ti-container grid min-h-[620px] items-center gap-10 py-10 lg:grid-cols-[1.08fr_.92fr]">
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
              Explora Pacas Kids y Damas a pedido, o elige Series Kids
              disponibles desde nuestra tienda.
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

          <div className="ti-card relative overflow-hidden p-6 md:p-8">
            <div className="absolute right-0 top-0 size-40 rounded-full bg-[#c78316]/10 blur-2xl" />

            <div className="relative grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] bg-[#b63a2c] p-6 text-white sm:row-span-2">
                <Boxes size={32} />
                <p className="mt-20 text-3xl font-black">
                  Pacas Kids
                </p>
                <p className="mt-2 text-sm text-white/75">
                  Fotos, videos y pedido personalizado.
                </p>
              </div>

              <div className="rounded-[24px] bg-[#c78316] p-6 text-white">
                <p className="text-2xl font-black">
                  Damas
                </p>
                <p className="mt-2 text-sm text-white/80">
                  Categorías por temporada.
                </p>
              </div>

              <div className="rounded-[24px] bg-[#5a8b86] p-6 text-white">
                <PackageCheck size={28} />
                <p className="mt-5 text-2xl font-black">
                  Series Kids
                </p>
                <p className="mt-2 text-sm text-white/80">
                  Stock real por código.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="ti-container py-14">
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

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(categories ?? [])
              .slice(0, 6)
              .map((category) => (
                <Link
                  href={`/pacas/${category.slug}`}
                  key={category.id}
                  className="ti-card overflow-hidden transition hover:-translate-y-1"
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

                  <div className="p-5">
                    <span className="text-xs font-black uppercase tracking-[.18em] text-[#5a8b86]">
                      {category.audience}
                    </span>

                    <h3 className="ti-card-title mt-2">
                      {category.name}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#7f746c]">
                      {category.description}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </section>

        <section className="bg-white/50 py-14">
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

        <section
          id="como-comprar"
          className="ti-container py-16 sm:py-20"
        >
          <div className="rounded-[30px] bg-[#9d3d31] p-5 shadow-[0_18px_45px_rgba(117,48,38,.15)] sm:p-7">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#ffd46a]">
                Cómo comprar
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-[-.03em] text-white sm:text-4xl">
                Explora, elige y compra.
              </h2>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-4">
              {[
                [
                  "01",
                  "Explora",
                  "Mira fotos y videos.",
                ],
                [
                  "02",
                  "Elige",
                  "Selecciona tu opción.",
                ],
                [
                  "03",
                  "Compra",
                  "Finaliza por WhatsApp.",
                ],
              ].map(
                ([number, title, description]) => (
                  <div
                    key={number}
                    className="min-w-0 rounded-[18px] bg-white/[.10] p-3 sm:rounded-[22px] sm:p-5"
                  >
                    <p className="text-[11px] font-black text-[#ffd46a] sm:text-sm">
                      {number}
                    </p>

                    <h3 className="mt-2 text-[14px] font-black text-white sm:text-2xl">
                      {title}
                    </h3>

                    <p className="mt-1 hidden text-[11px] leading-5 text-white/70 sm:block">
                      {description}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
