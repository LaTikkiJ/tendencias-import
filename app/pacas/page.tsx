import Link from "next/link";
import {
  ArrowRight,
  Boxes,
} from "lucide-react";

import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const cooperStyle = {
  fontFamily:
    '"Cooper Black", "Cooper Std Black", Georgia, serif',
};

export default async function PacasPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section: sectionSlug } = await searchParams;
  const supabase = await createClient();

  const { data: sections } = await supabase
    .from("paca_sections")
    .select(`
      id,
      name,
      slug,
      description,
      accent_color,
      cover_url,
      hero_url,
      hero_eyebrow,
      hero_title,
      hero_subtitle,
      sort_order
    `)
    .eq("active", true)
    .order("sort_order")
    .order("name");

  if (!sectionSlug) {
    return (
      <>
        <Header />

        <main className="ti-container py-10 sm:py-14">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#5a8b86]">
              Pacas
            </p>

            <h1
              className="mt-2 text-4xl leading-none sm:text-6xl"
              style={cooperStyle}
            >
              Elige tu sección
            </h1>
          </div>

          <div className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {(sections ?? []).map((section) => (
              <Link
                href={`/pacas?section=${section.slug}`}
                key={section.id}
                className="group relative overflow-hidden rounded-[24px] bg-[#eee5dc]"
              >
                <div className="aspect-[4/3]">
                  {section.cover_url ? (
                    <img
                      src={section.cover_url}
                      alt={section.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="grid h-full place-items-center"
                      style={{
                        backgroundColor:
                          section.accent_color ?? "#b63a2c",
                      }}
                    >
                      <Boxes size={28} className="text-white" />
                    </div>
                  )}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-white">
                  <p className="text-xl font-black">
                    Pacas {section.name}
                  </p>
                  <ArrowRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        </main>

        <Footer />
      </>
    );
  }

  const selected = (sections ?? []).find(
    (section) => section.slug === sectionSlug,
  );

  if (!selected) {
    return (
      <>
        <Header />
        <main className="ti-container py-16 text-center">
          <h1 className="text-3xl font-black">
            Esta sección no está disponible.
          </h1>
          <Link
            href="/"
            className="mt-5 inline-flex font-black text-[#b63a2c]"
          >
            Volver al inicio
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const { data: categories } = await supabase
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
    .eq("section_id", selected.id)
    .order("sort_order")
    .order("name");

  const heroImage =
    selected.hero_url ||
    selected.cover_url ||
    null;

  return (
    <>
      <Header />

      <main>
        <section className="ti-container pt-6 sm:pt-8">
          <div className="overflow-hidden rounded-[30px] border border-[#eaded3] bg-[#fffaf6] shadow-[0_14px_38px_rgba(70,45,35,.07)]">
            <div className="grid lg:grid-cols-[.9fr_1.1fr]">
              <div className="flex items-center p-6 sm:p-9 lg:p-12">
                <div>
                  <p
                    className="text-[9px] font-black uppercase tracking-[.22em]"
                    style={{
                      color:
                        selected.accent_color ?? "#b63a2c",
                    }}
                  >
                    {selected.hero_eyebrow ||
                      `Tendencias · Pacas ${selected.name}`}
                  </p>

                  <h1
                    className="mt-3 text-4xl leading-[.92] sm:text-6xl"
                    style={cooperStyle}
                  >
                    {selected.hero_title ||
                      `Pacas ${selected.name}`}
                  </h1>

                  <p className="mt-4 max-w-xl text-sm leading-7 text-[#746a63]">
                    {selected.hero_subtitle ||
                      selected.description ||
                      "Revisa nuestras categorías y referencias."}
                  </p>
                </div>
              </div>

              <div className="min-h-[260px] bg-[#eee4da] sm:min-h-[360px]">
                {heroImage ? (
                  <img
                    src={heroImage}
                    alt={`Pacas ${selected.name}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="grid h-full min-h-[260px] place-items-center"
                    style={{
                      backgroundColor:
                        selected.accent_color ?? "#b63a2c",
                    }}
                  >
                    <Boxes size={44} className="text-white/80" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="ti-container py-12 sm:py-16">
          <div className="text-center">
            <h2
              className="text-3xl leading-none sm:text-5xl"
              style={cooperStyle}
            >
              Explora nuestras categorías{" "}
              <span
                style={{
                  color:
                    selected.accent_color ?? "#b63a2c",
                }}
              >
                {selected.name}
              </span>
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
            {(categories ?? []).map((item) => (
              <Link
                href={`/pacas/${item.slug}`}
                key={item.id}
                className="group overflow-hidden rounded-[22px] bg-white shadow-[0_8px_24px_rgba(100,70,40,.06)]"
              >
                <div className="aspect-square overflow-hidden bg-[#efe4da]">
                  {item.cover_url ? (
                    <img
                      src={item.cover_url}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div
                      className="grid h-full place-items-center"
                      style={{
                        backgroundColor:
                          selected.accent_color ?? "#b63a2c",
                      }}
                    >
                      <Boxes size={28} className="text-white/85" />
                    </div>
                  )}
                </div>

                <div className="p-3.5 sm:p-4">
                  <p
                    className="text-[8px] font-black uppercase tracking-[.14em]"
                    style={{
                      color:
                        selected.accent_color ?? "#b63a2c",
                    }}
                  >
                    {selected.name}
                  </p>

                  <h3 className="mt-1 text-[16px] font-black sm:text-xl">
                    {item.name}
                  </h3>

                  <span className="mt-3 inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[.08em] text-[#9b382b]">
                    Ver referencias
                    <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
