import { notFound } from "next/navigation";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { createClient } from "@/lib/supabase/server";
import { PackageOpen } from "lucide-react";
import { PacaGallery } from "@/components/store/PacaGallery";
import PacaOrderConfigurator from "@/components/store/PacaOrderConfigurator";
import { PacaCategorySuggestions } from "@/components/store/PacaCategorySuggestions";

export const dynamic = "force-dynamic";

const cooperStyle = {
  fontFamily:
    '"Cooper Black", "Cooper Std Black", Georgia, serif',
};

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

  const { data: section } = category.section_id
    ? await supabase
        .from("paca_sections")
        .select("id,name,slug,preference_options,accent_color,active")
        .eq("id", category.section_id)
        .single()
    : { data: null as any };

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
      .select("id,slug,name,audience,section_id")
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

  const suggestionSectionIds = Array.from(
    new Set(
      (suggestionCategories ?? [])
        .map((item) => item.section_id)
        .filter(Boolean),
    ),
  );

  const { data: suggestionSections } =
    suggestionSectionIds.length > 0
      ? await supabase
          .from("paca_sections")
          .select("id,name")
          .in("id", suggestionSectionIds)
      : { data: [] as any[] };

  const suggestionSectionMap = new Map(
    (suggestionSections ?? []).map((item) => [
      item.id,
      item.name,
    ]),
  );

  const suggestions = (suggestionCategories ?? [])
    .slice(0, 4)
    .map((item) => ({
      ...item,
      sectionName:
        suggestionSectionMap.get(item.section_id) ??
        item.audience,
      imageUrl: firstImageByCategory.get(item.id) ?? null,
    }));

  const whatsapp =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

  const heroUrl =
    category.hero_url ||
    category.cover_url ||
    null;

  return (
    <>
      <Header />

      <main>
        <section className="ti-container pt-5">
          <div
            className={`relative overflow-hidden rounded-[28px] ${
              heroUrl
                ? "min-h-[330px] sm:min-h-[420px]"
                : "bg-[#fff5ec]"
            }`}
          >
            {heroUrl && (
              <img
                src={heroUrl}
                alt={category.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}

            <div
              className={`absolute inset-0 ${
                heroUrl
                  ? "bg-gradient-to-r from-[#231814]/72 via-[#231814]/28 to-transparent"
                  : "bg-[linear-gradient(135deg,#fff3e8,#f8eee5)]"
              }`}
            />

            <div className="relative z-10 flex min-h-[330px] items-end p-6 sm:min-h-[420px] sm:p-10">
              <div className="max-w-3xl">
                <p
                  className={`text-[10px] font-black uppercase tracking-[.2em] ${
                    heroUrl
                      ? "text-[#ffd47b]"
                      : "text-[#5a8b86]"
                  }`}
                >
                  {section?.name ?? category.audience}
                </p>

                <h1
                  className={`mt-2 text-4xl leading-[.92] tracking-[-.035em] sm:text-6xl ${
                    heroUrl
                      ? "text-white"
                      : "text-[#2c2825]"
                  }`}
                  style={cooperStyle}
                >
                  {category.name}
                </h1>

                {category.description && (
                  <p
                    className={`mt-4 max-w-2xl text-sm leading-7 sm:text-base ${
                      heroUrl
                        ? "text-white/82"
                        : "text-[#7f746c]"
                    }`}
                  >
                    {category.description}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[.08em] ${
                      heroUrl
                        ? "bg-white/90 text-[#9b382b]"
                        : "bg-[#fff0e9] text-[#9b382b]"
                    }`}
                  >
                    <PackageOpen size={13} />
                    En preventa
                  </span>

                  {(category.size_ranges ?? []).map((size: string) => (
                    <span
                      key={size}
                      className={`rounded-full border px-4 py-2 text-[10px] font-black ${
                        heroUrl
                          ? "border-white/30 bg-black/20 text-white backdrop-blur"
                          : "border-[#eaded3] bg-white text-[#2c2825]"
                      }`}
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="ti-container py-9">
          <div>
            <PacaGallery
              categoryId={category.id}
              initialMedia={(media ?? []) as any}
              initialHasMore={Number(count ?? 0) > 12}
            />
          </div>

          <PacaOrderConfigurator
            categoryId={category.id}
            categoryName={category.name}
            audience={section?.slug ?? category.audience}
            sectionName={section?.name ?? category.audience}
            preferenceOptions={
              (section?.preference_options ?? []) as string[]
            }
            sizeRanges={(category.size_ranges ?? []) as string[]}
            prices={(prices ?? []) as any}
            whatsappNumber={whatsapp}
          />

          <PacaCategorySuggestions
            items={suggestions as any}
          />
        </div>
      </main>

      <Footer />
    </>
  );
}
