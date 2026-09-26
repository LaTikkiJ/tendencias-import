import Link from "next/link";
import {
  ArrowRight,
  Images,
  Plus,
} from "lucide-react";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPacaSectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: section } = await supabase
    .from("paca_sections")
    .select(`
      id,
      name,
      slug,
      description,
      accent_color,
      cover_url,
      hero_url
    `)
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (!section) notFound();

  const [
    { data: categories },
    { data: mediaRows },
  ] = await Promise.all([
    supabase
      .from("paca_categories")
      .select("id,name,slug,cover_url,description")
      .eq("section_id", section.id)
      .eq("active", true)
      .order("sort_order")
      .order("name"),

    supabase
      .from("paca_media")
      .select("category_id,media_type")
      .eq("active", true),
  ]);

  const counts = new Map<string, number>();
  for (const row of mediaRows ?? []) {
    counts.set(
      row.category_id,
      (counts.get(row.category_id) ?? 0) + 1,
    );
  }

  return (
    <div className="space-y-6">
      <section
        className="relative overflow-hidden rounded-[30px] p-6 text-white shadow-sm sm:p-8"
        style={{
          backgroundColor:
            section.accent_color ?? "#b63a2c",
        }}
      >
        {section.hero_url && (
          <>
            <img
              src={section.hero_url}
              alt={section.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/55" />
          </>
        )}

        <div className="relative z-10">
          <p className="text-[9px] font-black uppercase tracking-[.2em] text-white/70">
            Web Pacas
          </p>

          <h1 className="mt-2 text-4xl font-black">
            {section.name}
          </h1>

          <p className="mt-2 max-w-xl text-sm text-white/80">
            {section.description ??
              "Administra las categorías y su contenido."}
          </p>
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        <Link
          href="/admin/pacas#secciones"
          className="rounded-full bg-white px-4 py-2 text-[10px] font-black text-[#6f655e] shadow-sm"
        >
          Editar sección
        </Link>

        <Link
          href="/admin/pacas#nueva-categoria"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#b63a2c] px-4 py-2 text-[10px] font-black !text-white shadow-sm"
        >
          <Plus size={13} />
          Nueva categoría
        </Link>
      </section>

      <section>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.16em] text-[#5a8b86]">
              Categorías
            </p>

            <h2 className="mt-1 text-2xl font-black">
              {section.name}
            </h2>
          </div>

          <p className="text-xs text-[#7f746c]">
            {(categories ?? []).length} registradas
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {(categories ?? []).map((category) => (
            <article
              key={category.id}
              className="overflow-hidden rounded-[22px] border border-[#eaded3] bg-white shadow-sm"
            >
              <div className="aspect-square bg-[#efe5dc]">
                {category.cover_url ? (
                  <img
                    src={category.cover_url}
                    alt={category.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center">
                    <Images size={28} className="text-[#b63a2c]" />
                  </div>
                )}
              </div>

              <div className="p-3.5">
                <h3 className="text-[15px] font-black sm:text-lg">
                  {category.name}
                </h3>

                <p className="mt-1 text-[9px] text-[#7f746c]">
                  {counts.get(category.id) ?? 0} archivos
                </p>

                <div className="mt-3 grid gap-2">
                  <Link
                    href={`/admin/pacas/contenido/${category.id}`}
                    className="flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-[#b63a2c] px-3 text-[9px] font-black !text-white"
                  >
                    <Images size={12} />
                    Subir contenido
                  </Link>

                  <Link
                    href={`/admin/pacas/${category.id}`}
                    className="flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-[#f8f4f0] px-3 text-[9px] font-black text-[#6f655e]"
                  >
                    Editar categoría
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
