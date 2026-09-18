import { notFound } from "next/navigation";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { createClient } from "@/lib/supabase/server";
import { MessageCircle } from "lucide-react";
import { PacaGallery } from "@/components/store/PacaGallery";

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

  if (!category) notFound();

  const { data: media, count } = await supabase
    .from("paca_media")
    .select("id,media_type,url,title,sort_order", { count: "exact" })
    .eq("category_id", category.id)
    .eq("active", true)
    .order("sort_order")
    .range(0, 11);

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

  return (
    <>
      <Header />
      <main className="ti-container py-12">
        <p className="text-xs font-black uppercase tracking-[.18em] text-[#5a8b86]">
          {category.audience}
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-.04em] md:text-6xl">{category.name}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[#7f746c]">{category.description}</p>

        <div className="mt-8 flex flex-wrap gap-2">
          {(category.size_ranges ?? []).map((size: string) => (
            <span key={size} className="ti-pill">{size}</span>
          ))}
          {(category.box_quantities ?? []).map((q: number) => (
            <span key={q} className="ti-pill">{q} prendas</span>
          ))}
        </div>

        <div className="mt-10">
          <PacaGallery
            categoryId={category.id}
            initialMedia={(media ?? []) as any}
            initialHasMore={Number(count ?? 0) > 12}
          />
        </div>

        <div className="sticky bottom-4 z-30 mt-10 flex justify-center">
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
              `Hola, quiero información de la paca: ${category.name}`
            )}`}
            target="_blank"
            className="ti-button ti-button-primary shadow-2xl"
          >
            <MessageCircle size={18} />
            Pedir esta paca por WhatsApp
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
