import { MessageCircle, Play } from "lucide-react";
import { notFound } from "next/navigation";

import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PacaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("paca_categories")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (!category) {
    notFound();
  }

  const { data: media } = await supabase
    .from("paca_media")
    .select("*")
    .eq("category_id", category.id)
    .eq("active", true)
    .order("sort_order");

  const whatsapp =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

  return (
    <>
      <Header />

      <main>
        <section className="border-b border-[#eaded3] bg-[#fff7f0]">
          <div className="ti-container py-9">
            <span
              className={`inline-flex rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[.14em] text-white ${
                category.audience === "kids"
                  ? "bg-[#b63a2c]"
                  : "bg-[#d39218]"
              }`}
            >
              {category.audience}
            </span>

            <h1 className="mt-4 text-4xl font-black tracking-[-.05em] sm:text-6xl">
              {category.name}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#756a62]">
              {category.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {(category.size_ranges ?? []).map((size: string) => (
                <span
                  key={size}
                  className="rounded-full border border-[#eaded3] bg-white px-3 py-2 text-[10px] font-black text-[#5a8b86]"
                >
                  {size}
                </span>
              ))}

              {(category.box_quantities ?? []).map((quantity: number) => (
                <span
                  key={quantity}
                  className="rounded-full border border-[#eaded3] bg-white px-3 py-2 text-[10px] font-black text-[#8f3a2e]"
                >
                  {quantity} prendas
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="ti-container py-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {(media ?? []).map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-[20px] border border-[#eaded3] bg-white shadow-sm"
              >
                {item.media_type === "video" ? (
                  <div className="relative aspect-[4/5] bg-black">
                    <video
                      src={item.url}
                      controls
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />

                    <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[9px] font-black text-white">
                      <Play size={10} className="mr-1 inline" />
                      Video
                    </span>
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={item.title ?? category.name}
                    className="aspect-[4/5] w-full object-cover"
                  />
                )}

                {item.title && (
                  <p className="line-clamp-1 p-2.5 text-[10px] font-bold text-[#6f655e]">
                    {item.title}
                  </p>
                )}
              </article>
            ))}
          </div>

          <div className="sticky bottom-4 z-30 mt-8 flex justify-center">
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                `Hola Tendencias Import 💛 Quiero información de la paca ${category.name}.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-12 items-center gap-2 rounded-full bg-[#b63a2c] px-6 text-sm font-black text-white shadow-[0_14px_30px_rgba(182,58,44,.25)]"
            >
              <MessageCircle size={18} />
              Consultar por WhatsApp
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
