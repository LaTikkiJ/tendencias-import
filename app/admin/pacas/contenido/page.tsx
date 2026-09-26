import Link from "next/link";
import {
  ArrowRight,
  Images,
  Search,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PacaContentPage({
  searchParams,
}: {
  searchParams: Promise<{
    section?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const [
    { data: sections },
    { data: categories },
    { data: mediaRows },
  ] = await Promise.all([
    supabase
      .from("paca_sections")
      .select("id,name,slug,accent_color")
      .eq("active", true)
      .order("sort_order")
      .order("name"),

    supabase
      .from("paca_categories")
      .select("id,section_id,name,slug,cover_url,active")
      .eq("active", true)
      .order("sort_order")
      .order("name"),

    supabase
      .from("paca_media")
      .select("category_id,media_type")
      .eq("active", true),
  ]);

  const counts = new Map<
    string,
    { images: number; videos: number }
  >();

  for (const row of mediaRows ?? []) {
    const current = counts.get(row.category_id) ?? {
      images: 0,
      videos: 0,
    };

    if (row.media_type === "video") current.videos += 1;
    else current.images += 1;

    counts.set(row.category_id, current);
  }

  const activeSection = params.section ?? "all";
  const q = (params.q ?? "").trim().toLowerCase();

  const filtered = (categories ?? []).filter((category) => {
    const section = (sections ?? []).find(
      (item) => item.id === category.section_id,
    );

    const sectionOk =
      activeSection === "all" ||
      section?.slug === activeSection;

    const searchOk =
      !q ||
      category.name.toLowerCase().includes(q) ||
      section?.name.toLowerCase().includes(q);

    return sectionOk && searchOk;
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-[#eaded3] bg-white p-6 shadow-sm md:p-7">
        <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#5a8b86]">
          Web Pacas
        </p>

        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-[-.04em] md:text-4xl">
              Subir contenido
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7f746c]">
              Elige la categoría y entra directo a subir collages, fotos o videos.
            </p>
          </div>

          <div className="rounded-full bg-[#fff4ec] px-4 py-2 text-[10px] font-black text-[#9b382b]">
            {filtered.length} categorías
          </div>
        </div>
      </section>

      <section className="rounded-[26px] border border-[#eaded3] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/pacas/contenido"
            className={`rounded-full px-4 py-2 text-[10px] font-black ${
              activeSection === "all"
                ? "bg-[#b63a2c] !text-white"
                : "bg-[#f8f4f0] text-[#6f655e]"
            }`}
          >
            Todas
          </Link>

          {(sections ?? []).map((section) => (
            <Link
              key={section.id}
              href={`/admin/pacas/contenido?section=${section.slug}`}
              className={`rounded-full px-4 py-2 text-[10px] font-black ${
                activeSection === section.slug
                  ? "bg-[#b63a2c] !text-white"
                  : "bg-[#f8f4f0] text-[#6f655e]"
              }`}
            >
              {section.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((category) => {
          const section = (sections ?? []).find(
            (item) => item.id === category.section_id,
          );

          const count = counts.get(category.id) ?? {
            images: 0,
            videos: 0,
          };

          return (
            <Link
              key={category.id}
              href={`/admin/pacas/contenido/${category.id}`}
              className="group overflow-hidden rounded-[22px] border border-[#eaded3] bg-white shadow-sm transition hover:-translate-y-0.5"
            >
              <div className="aspect-square overflow-hidden bg-[#efe5dc]">
                {category.cover_url ? (
                  <img
                    src={category.cover_url}
                    alt={category.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="grid h-full place-items-center">
                    <Images size={28} className="text-[#b63a2c]" />
                  </div>
                )}
              </div>

              <div className="p-3.5">
                <p
                  className="text-[8px] font-black uppercase tracking-[.12em]"
                  style={{
                    color:
                      section?.accent_color ?? "#5a8b86",
                  }}
                >
                  {section?.name ?? "Pacas"}
                </p>

                <h2 className="mt-1 text-[15px] font-black sm:text-lg">
                  {category.name}
                </h2>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-[#f8f4f0] px-2.5 py-1 text-[8px] font-black text-[#6f655e]">
                    {count.images} fotos
                  </span>

                  <span className="rounded-full bg-[#f8f4f0] px-2.5 py-1 text-[8px] font-black text-[#6f655e]">
                    {count.videos} videos
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-[9px] font-black text-[#9b382b]">
                  Subir contenido
                  <ArrowRight size={13} />
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
