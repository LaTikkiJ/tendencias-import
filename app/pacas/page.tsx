import Link from "next/link";
import { ArrowRight, Boxes } from "lucide-react";

import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PacasPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("paca_categories")
    .select("*")
    .eq("active", true)
    .order("audience")
    .order("sort_order");

  return (
    <>
      <Header />

      <main>
        <section className="border-b border-[#eaded3] bg-[#fff7f0]">
          <div className="ti-container py-10 sm:py-14">
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#5a8b86]">
              Catálogo de pacas
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">
              Kids y Damas
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#756a62]">
              Elige una categoría para ver collages, videos, tallas y cantidades.
            </p>
          </div>
        </section>

        <section className="ti-container py-9">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {(data ?? []).map((item) => (
              <Link
                href={`/pacas/${item.slug}`}
                key={item.id}
                className="group overflow-hidden rounded-[22px] border border-[#eaded3] bg-white shadow-[0_8px_24px_rgba(100,70,40,.05)] transition hover:-translate-y-1"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-[#efe4da]">
                  {item.cover_url ? (
                    <img
                      src={item.cover_url}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <Boxes size={28} className="text-[#b63a2c]" />
                    </div>
                  )}

                  <span
                    className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase text-white ${
                      item.audience === "kids"
                        ? "bg-[#b63a2c]"
                        : "bg-[#d39218]"
                    }`}
                  >
                    {item.audience}
                  </span>
                </div>

                <div className="p-3.5">
                  <h2 className="line-clamp-2 text-[15px] font-black leading-5">
                    {item.name}
                  </h2>

                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-[17px] text-[#7f746c]">
                    {item.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-[.1em] text-[#5a8b86]">
                      Ver categoría
                    </span>

                    <ArrowRight size={14} className="text-[#b63a2c]" />
                  </div>
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
