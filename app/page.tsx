import Link from "next/link";
import { ArrowRight, Boxes, PackageCheck, Sparkles } from "lucide-react";
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
      .order("sort_order"),
    supabase
      .from("series_products")
      .select("id,code,name,slug,price,cover_url,series_available,status,sizes")
      .eq("active", true)
      .gt("series_available", 0)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  return (
    <>
      <Header />

      <main>
        <section className="ti-container grid min-h-[640px] items-center gap-10 py-10 lg:grid-cols-[1.08fr_.92fr]">
          <div>
            <span className="ti-pill">
              <Sparkles size={15} />
              MAYORISTA · PERÚ
            </span>
            <h1 className="mt-6 max-w-3xl text-[clamp(48px,7vw,92px)] font-black leading-[.88] tracking-[-.065em] text-[#2c2825]">
              Moda para
              <span className="block text-[#b63a2c]">hacer crecer</span>
              tu negocio.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#6f655e]">
              Explora pacas Kids y Damas con collages y videos reales, o arma tu carrito de
              series Kids y envíalo directamente por WhatsApp.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/pacas" className="ti-button ti-button-primary">
                Ver pacas <ArrowRight size={18} />
              </Link>
              <Link href="/series" className="ti-button ti-button-soft">
                Ver series Kids
              </Link>
            </div>
          </div>

          <div className="ti-card relative overflow-hidden p-6 md:p-8">
            <div className="absolute right-0 top-0 size-40 rounded-full bg-[#c78316]/10 blur-2xl" />
            <div className="relative grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] bg-[#b63a2c] p-6 text-white sm:row-span-2">
                <Boxes size={32} />
                <p className="mt-20 text-3xl font-black">Pacas Kids</p>
                <p className="mt-2 text-sm text-white/75">
                  Collages, videos, tallas y opciones organizadas.
                </p>
              </div>
              <div className="rounded-[24px] bg-[#c78316] p-6 text-white">
                <p className="text-2xl font-black">Damas</p>
                <p className="mt-2 text-sm text-white/80">Modelos y categorías por temporada.</p>
              </div>
              <div className="rounded-[24px] bg-[#5a8b86] p-6 text-white">
                <PackageCheck size={28} />
                <p className="mt-5 text-2xl font-black">Series Kids</p>
                <p className="mt-2 text-sm text-white/80">Stock real por código.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="ti-container py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="ti-pill">PACAS</span>
              <h2 className="ti-section-title mt-4">Elige lo que quieres vender</h2>
            </div>
            <Link href="/pacas" className="hidden font-extrabold text-[#b63a2c] sm:block">
              Ver todo →
            </Link>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(categories ?? []).slice(0, 6).map((category) => (
              <Link
                href={`/pacas/${category.slug}`}
                key={category.id}
                className="ti-card overflow-hidden transition hover:-translate-y-1"
              >
                <div
                  className="aspect-[4/3] bg-[#f0e6dc] bg-cover bg-center"
                  style={category.cover_url ? { backgroundImage: `url(${category.cover_url})` } : {}}
                />
                <div className="p-5">
                  <span className="text-xs font-black uppercase tracking-[.18em] text-[#5a8b86]">
                    {category.audience}
                  </span>
                  <h3 className="mt-2 text-2xl font-black">{category.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#7f746c]">
                    {category.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-white/50 py-16">
          <div className="ti-container">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="ti-pill">STOCK REAL</span>
                <h2 className="ti-section-title mt-4">Series Kids disponibles</h2>
              </div>
              <Link href="/series" className="hidden font-extrabold text-[#b63a2c] sm:block">
                Armar carrito →
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
              {(series ?? []).map((item) => (
                <Link key={item.id} href={`/series/${item.slug}`} className="ti-card overflow-hidden">
                  <div
                    className="aspect-[4/5] bg-[#f1e8df] bg-cover bg-center"
                    style={item.cover_url ? { backgroundImage: `url(${item.cover_url})` } : {}}
                  />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black tracking-[.16em] text-[#5a8b86]">{item.code}</p>
                        <p className="mt-1 font-black">{item.name}</p>
                      </div>
                      <span className="rounded-full bg-[#edf7f5] px-2 py-1 text-[11px] font-extrabold text-[#42746e]">
                        {item.series_available} series
                      </span>
                    </div>
                    <p className="mt-3 text-lg font-black text-[#b63a2c]">S/ {Number(item.price).toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="como-comprar" className="ti-container py-20">
          <div className="ti-card grid gap-8 p-7 md:grid-cols-3 md:p-10">
            {[
              ["01", "Explora", "Mira fotos, collages y videos por categoría."],
              ["02", "Elige", "En series, agrega los códigos y cantidades que te interesan."],
              ["03", "Compra", "Envía tu carrito por WhatsApp y Sofía confirma disponibilidad y pago."]
            ].map(([n, t, d]) => (
              <div key={n}>
                <span className="text-sm font-black text-[#c78316]">{n}</span>
                <h3 className="mt-3 text-2xl font-black">{t}</h3>
                <p className="mt-2 text-sm leading-6 text-[#7f746c]">{d}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
