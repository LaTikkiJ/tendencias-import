import { notFound } from "next/navigation";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("series_products")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (!item) notFound();

  const { data: media } = await supabase
    .from("series_media")
    .select("*")
    .eq("product_id", item.id)
    .eq("active", true)
    .order("sort_order");

  return (
    <>
      <Header />
      <main className="ti-container grid gap-8 py-12 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-3">
          {(media ?? []).length === 0 && (
            <div
              className="col-span-2 aspect-[4/5] rounded-[28px] bg-[#efe5dc] bg-cover bg-center"
              style={item.cover_url ? { backgroundImage: `url(${item.cover_url})` } : {}}
            />
          )}
          {(media ?? []).map((m) =>
            m.media_type === "video" ? (
              <video key={m.id} src={m.url} controls playsInline className="aspect-[4/5] w-full rounded-[22px] bg-black object-cover" />
            ) : (
              <div key={m.id} className="aspect-[4/5] rounded-[22px] bg-[#efe5dc] bg-cover bg-center" style={{ backgroundImage: `url(${m.url})` }} />
            )
          )}
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-sm font-black tracking-[.18em] text-[#5a8b86]">{item.code}</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.04em] md:text-6xl">{item.name}</h1>
          <p className="mt-5 text-3xl font-black text-[#b63a2c]">S/ {Number(item.price).toFixed(2)}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {(item.sizes ?? []).map((size: string) => <span className="ti-pill" key={size}>{size}</span>)}
          </div>
          <div className="mt-6 rounded-[22px] bg-white p-5">
            <p className="font-black">{item.series_available} series disponibles</p>
            <p className="mt-2 text-sm leading-6 text-[#7f746c]">{item.description}</p>
          </div>
          <a href="/series" className="ti-button ti-button-primary mt-6 w-full">Agregar desde el catálogo</a>
        </div>
      </main>
      <Footer />
    </>
  );
}
