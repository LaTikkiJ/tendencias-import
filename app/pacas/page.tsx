import Link from "next/link";
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
      <main className="ti-container py-12">
        <span className="ti-pill">CATÁLOGO DE PACAS</span>
        <h1 className="ti-section-title mt-5">Kids y Damas</h1>
        <p className="mt-4 max-w-2xl text-[#7f746c]">
          Cada categoría puede tener sus propios collages, videos, descripción,
          rangos de tallas, cantidades y botón de pedido.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((item) => (
            <Link href={`/pacas/${item.slug}`} key={item.id} className="ti-card overflow-hidden">
              <div
                className="aspect-[4/3] bg-[#efe4da] bg-cover bg-center"
                style={item.cover_url ? { backgroundImage: `url(${item.cover_url})` } : {}}
              />
              <div className="p-5">
                <p className="text-xs font-black uppercase tracking-[.18em] text-[#5a8b86]">
                  {item.audience}
                </p>
                <h2 className="mt-2 text-2xl font-black">{item.name}</h2>
                <p className="mt-2 text-sm leading-6 text-[#7f746c]">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
