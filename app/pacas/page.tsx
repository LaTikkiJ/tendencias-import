import Link from "next/link";
import {
  ArrowRight,
  Boxes,
} from "lucide-react";

import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PacasPage() {
  const supabase = await createClient();

  const [
    { data: sections },
    { data: categories },
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
  ]);

  return (
    <>
      <Header />

      <main>
        <section className="border-b border-[#eaded3] bg-[#fff7f0]">
          <div className="ti-container py-10 sm:py-14">
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#5a8b86]">
              Catálogo de Pacas
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">
              Elige tu sección
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#756a62]">
              Revisa las categorías disponibles de Kids, Damas, Varón y las nuevas líneas que Tendencias Import vaya habilitando.
            </p>
          </div>
        </section>

        <div className="ti-container space-y-12 py-9">
          {(sections ?? []).map((section) => {
            const items = (categories ?? []).filter(
              (category) => category.section_id === section.id,
            );

            if (items.length === 0) {
              return null;
            }

            return (
              <section key={section.id}>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p
                      className="text-[10px] font-black uppercase tracking-[.18em]"
                      style={{
                        color: section.accent_color ?? "#5a8b86",
                      }}
                    >
                      Pacas
                    </p>

                    <h2 className="mt-1 text-3xl font-black tracking-[-.04em]">
                      {section.name}
                    </h2>

                    {section.description && (
                      <p className="mt-2 max-w-xl text-xs leading-5 text-[#7f746c]">
                        {section.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  {items.map((item) => (
                    <Link
                      href={`/pacas/${item.slug}`}
                      key={item.id}
                      className="group overflow-hidden rounded-[22px] border border-[#eaded3] bg-white shadow-[0_8px_24px_rgba(100,70,40,.05)] transition hover:-translate-y-1"
                    >
                      <div className="relative aspect-square overflow-hidden bg-[#efe4da]">
                        {item.cover_url ? (
                          <img
                            src={item.cover_url}
                            alt={item.name}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="grid h-full place-items-center">
                            <Boxes
                              size={28}
                              style={{
                                color:
                                  section.accent_color ?? "#b63a2c",
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="p-3.5">
                        <p
                          className="text-[9px] font-black uppercase tracking-[.1em]"
                          style={{
                            color:
                              section.accent_color ?? "#5a8b86",
                          }}
                        >
                          {section.name}
                        </p>

                        <h3 className="mt-1 line-clamp-2 text-[15px] font-black leading-5">
                          {item.name}
                        </h3>

                        <p className="mt-1.5 line-clamp-2 text-[11px] leading-[17px] text-[#7f746c]">
                          {item.description}
                        </p>

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-[.1em] text-[#5a8b86]">
                            Ver categoría
                          </span>

                          <ArrowRight
                            size={14}
                            className="text-[#b63a2c]"
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <Footer />
    </>
  );
}
