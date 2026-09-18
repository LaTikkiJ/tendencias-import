import { notFound } from "next/navigation";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { createClient } from "@/lib/supabase/server";
import { PackageOpen } from "lucide-react";
import { PacaGallery } from "@/components/store/PacaGallery";
import PacaOrderConfigurator from "@/components/store/PacaOrderConfigurator";
import { PacaCategorySuggestions } from "@/components/store/PacaCategorySuggestions";

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

  const [
    { data: media, count },
    { data: prices },
    { data: suggestionCategories },
  ] = await Promise.all([
    supabase
      .from("paca_media")
      .select("id,media_type,url,title,sort_order", { count: "exact" })
      .eq("category_id", category.id)
      .eq("active", true)
      .order("sort_order")
      .range(0, 11),

    supabase
      .from("paca_category_prices")
      .select("quantity,price_pen")
      .eq("category_id", category.id)
      .eq("active", true)
      .order("quantity"),

    supabase
      .from("paca_categories")
      .select("id,slug,name,audience")
      .eq("active", true)
      .neq("id", category.id)
      .limit(8),
  ]);

  const suggestionIds = (suggestionCategories ?? []).map(
    (item) => item.id,
  );

  const { data: suggestionMedia } =
    suggestionIds.length > 0
      ? await supabase
          .from("paca_media")
          .select("category_id,url,media_type,sort_order")
          .in("category_id", suggestionIds)
          .eq("active", true)
          .eq("media_type", "image")
          .order("sort_order")
      : { data: [] as any[] };

  const firstImageByCategory = new Map<string, string>();

  for (const item of suggestionMedia ?? []) {
    if (!firstImageByCategory.has(item.category_id)) {
      firstImageByCategory.set(item.category_id, item.url);
    }
  }

  const suggestions = (suggestionCategories ?? [])
    .slice(0, 4)
    .map((item) => ({
      ...item,
      imageUrl: firstImageByCategory.get(item.id) ?? null,
    }));

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

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fff0e9] px-4 py-2 text-[10px] font-black uppercase tracking-[.08em] text-[#9b382b]">
            <PackageOpen size={13} />
            Todo es a pedido
          </span>

          {(category.size_ranges ?? []).map((size: string) => (
            <span key={size} className="ti-pill">{size}</span>
          ))}
        </div>

        <div className="mt-10">
          <PacaGallery
            categoryId={category.id}
            initialMedia={(media ?? []) as any}
            initialHasMore={Number(count ?? 0) > 12}
          />
        </div>

        <PacaOrderConfigurator
          categoryId={category.id}
          categoryName={category.name}
          audience={category.audience}
          sizeRanges={(category.size_ranges ?? []) as string[]}
          prices={(prices ?? []) as any}
          whatsappNumber={whatsapp}
        />

        <PacaCategorySuggestions
          items={suggestions as any}
        />

      </main>
      <Footer />
    </>
  );
}
