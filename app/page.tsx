import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  PackageCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: series }] = await Promise.all([
    supabase
      .from("paca_categories")
      .select("id,name,slug,audience,description,cover_url")
      .eq("active", true)
      .order("sort_order")
      .limit(8),

    supabase
      .from("series_products")
      .select("id,code,name,slug,price,cover_url,series_available,status,sizes")
      .eq("active", true)
      .gt("series_available", 0)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  return (
    <>
      <Header />

      <main>
        <section className="overflow-hidden bg-[#fff7f0]">
          <div className="ti-container grid min-h-[610px] items-center gap-8 py-10 lg:grid-cols-[1.04fr_.96fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#eaded3] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[.16em] text-[#5a8b86] shadow-sm">
                <Sparkles size={14} />
                Mayorista · Perú
              </span>

              <h1 className="mt-5 max-w-[780px] text-[clamp(46px,7vw,88px)] font-black leading-[.9] tracking-[-.065em] text-[#2c2825]">
                Encuentra
                <span className="block text-[#b63a2c]">
                  lo que tu negocio
                </span>
                necesita.
              </h1>

              <p className="mt-6 max-w-xl text-[16px] leading-7 text-[#72675f] sm:text-[18px] sm:leading-8">
                Explora pacas Kids y Damas con collages y videos, o arma tu
                carrito de Series Kids y envíalo directo a Tendencias Import.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/pacas"
                  className="flex min-h-12 items-center gap-2 rounded-full bg-[#b63a2c] px-6 text-sm font-black text-white shadow-[0_12px_28px_rgba(182,58,44,.2)] transition hover:-translate-y-0.5"
                >
                  Ver pacas
                  <ArrowRight size={17} />
                </Link>

                <Link
                  href="/series"
                  className="flex min-h-12 items-center gap-2 rounded-full border border-[#e8cabf] bg-white px-6 text-sm font-black text-[#9b382b] transition hover:bg-[#fff0ea]"
                >
                  <ShoppingBag size={17} />
                  Ver series
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/pacas"
                className="relative col-span-2 min-h-[210px] overflow-hidden rounded-[30px] bg-[#b63a2c] p-6 text-white shadow-[0_18px_45px_rgba(120,60,35,.14)]"
              >
                <div className="absolute -right-8 -top-8 size-40 rounded-full bg-white/10" />
                <Boxes size={28} />

                <p className="mt-16 text-3xl font-black">
                  Pacas Kids
                </p>

                <p className="mt-2 max-w-sm text-sm leading-6 text-white/75">
                  Collages, videos, tallas y opciones para tu negocio.
                </p>
              </Link>

              <Link
                href="/pacas"
                className="min-h-[170px] rounded-[26px] bg-[#d39218] p-5 text-white"
              >
                <Boxes size={24} />

                <p className="mt-10 text-xl font-black">
                  Damas
                </p>

                <p className="mt-1 text-xs leading-5 text-white/80">
                  Categorías y modelos por temporada.
                </p>
              </Link>

              <Link
                href="/series"
                className="min-h-[170px] rounded-[26px] bg-[#5a8b86] p-5 text-white"
              >
                <PackageCheck size={24} />

                <p className="mt-10 text-xl font-black">
                  Series Kids
                </p>

                <p className="mt-1 text-xs leading-5 text-white/80">
                  Código, tallas, precio y stock disponible.
                </p>
              </Link>
            </div>
          </div>
        </section>

        <section className="ti-container py-14 sm:py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#5a8b86]">
                Pacas
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-5xl">
                Elige tu categoría
              </h2>
            </div>

            <Link
              href="/pacas"
              className="hidden items-center gap-2 text-sm font-black text-[#8f3a2e] sm:flex"
            >
              Ver todas
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {(categories ?? []).map((category) => (
              <Link
                href={`/pacas/${category.slug}`}
                key={category.id}
                className="group overflow-hidden rounded-[22px] border border-[#eaded3] bg-white shadow-[0_8px_24px_rgba(100,70,40,.05)] transition hover:-translate-y-1"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-[#f3e7dc]">
                  {category.cover_url ? (
                    <img
                      src={category.cover_url}
                      alt={category.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <Boxes size={28} className="text-[#b63a2c]" />
                    </div>
                  )}

                  <span
                    className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] text-white ${
                      category.audience === "kids"
                        ? "bg-[#b63a2c]"
                        : "bg-[#d39218]"
                    }`}
                  >
                    {category.audience}
                  </span>
                </div>

                <div className="p-3.5">
                  <h3 className="line-clamp-2 text-[15px] font-black leading-5">
                    {category.name}
                  </h3>

                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-[17px] text-[#7f746c]">
                    {category.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-[.12em] text-[#5a8b86]">
                      Ver contenido
                    </span>

                    <ArrowRight size={14} className="text-[#b63a2c]" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-white/55 py-14 sm:py-16">
          <div className="ti-container">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#d39218]">
                  Series Kids
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-5xl">
                  Disponibles ahora
                </h2>
              </div>

              <Link
                href="/series"
                className="hidden items-center gap-2 rounded-full bg-[#b63a2c] px-4 py-2 text-sm font-black text-white sm:flex"
              >
                Armar carrito
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {(series ?? []).map((item) => (
                <Link
                  key={item.id}
                  href={`/series/${item.slug}`}
                  className="overflow-hidden rounded-[22px] border border-[#eaded3] bg-white shadow-[0_8px_24px_rgba(100,70,40,.05)] transition hover:-translate-y-1"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#efe5dc]">
                    {item.cover_url ? (
                      <img
                        src={item.cover_url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center">
                        <PackageCheck size={28} className="text-[#5a8b86]" />
                      </div>
                    )}

                    <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-black tracking-[.12em] text-[#5a8b86]">
                      {item.code}
                    </span>
                  </div>

                  <div className="p-3.5">
                    <h3 className="line-clamp-2 text-[15px] font-black leading-5">
                      {item.name}
                    </h3>

                    <p className="mt-2 text-[16px] font-black text-[#b63a2c]">
                      S/ {Number(item.price).toFixed(2)}
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[9px] font-black text-[#5a8b86]">
                        {item.series_available} disponibles
                      </span>

                      <span className="truncate text-[9px] font-bold text-[#8b8078]">
                        {(item.sizes ?? []).join(" · ")}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="como-comprar" className="ti-container py-16">
          <div className="rounded-[32px] bg-[#8f3a2e] p-6 text-white shadow-[0_16px_40px_rgba(100,55,35,.14)] sm:p-9">
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f0c86a]">
              Cómo comprar
            </p>

            <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-.04em] sm:text-5xl">
              Mira, elige y envía tu carrito.
            </h2>

            <div className="mt-7 grid gap-3 md:grid-cols-3">
              <div className="rounded-[22px] bg-white/10 p-4">
                <span className="text-xs font-black text-[#f0c86a]">01</span>
                <p className="mt-2 font-black">Explora</p>
                <p className="mt-1 text-sm leading-6 text-white/70">
                  Mira fotos, collages y videos.
                </p>
              </div>

              <div className="rounded-[22px] bg-white/10 p-4">
                <span className="text-xs font-black text-[#f0c86a]">02</span>
                <p className="mt-2 font-black">Elige</p>
                <p className="mt-1 text-sm leading-6 text-white/70">
                  Agrega las series que te interesan.
                </p>
              </div>

              <div className="rounded-[22px] bg-white/10 p-4">
                <span className="text-xs font-black text-[#f0c86a]">03</span>
                <p className="mt-2 font-black">WhatsApp</p>
                <p className="mt-1 text-sm leading-6 text-white/70">
                  Envía tu carrito y confirma disponibilidad.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
