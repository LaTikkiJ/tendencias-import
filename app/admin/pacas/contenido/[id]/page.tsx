import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

import { MediaManager } from "@/components/admin/MediaManager";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PacaContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: category },
    { data: media },
  ] = await Promise.all([
    supabase
      .from("paca_categories")
      .select(`
        id,
        section_id,
        name,
        slug,
        cover_url,
        active
      `)
      .eq("id", id)
      .single(),

    supabase
      .from("paca_media")
      .select("id,media_type,url,title,sort_order")
      .eq("category_id", id)
      .eq("active", true)
      .order("sort_order"),
  ]);

  if (!category) notFound();

  const { data: section } = category.section_id
    ? await supabase
        .from("paca_sections")
        .select("name,accent_color")
        .eq("id", category.section_id)
        .maybeSingle()
    : { data: null as any };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#eaded3] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/pacas/contenido"
              className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#9b382b]"
            >
              <ArrowLeft size={13} />
              Volver a categorías
            </Link>

            <p
              className="mt-4 text-[9px] font-black uppercase tracking-[.14em]"
              style={{
                color:
                  section?.accent_color ?? "#5a8b86",
              }}
            >
              {section?.name ?? "Pacas"}
            </p>

            <h1 className="mt-1 text-3xl font-black tracking-[-.04em]">
              {category.name}
            </h1>

            <p className="mt-2 text-sm text-[#7f746c]">
              Sube aquí todos los collages, imágenes y videos referenciales.
            </p>
          </div>

          <Link
            href={`/pacas/${category.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full bg-[#f8f4f0] px-4 py-2 text-[10px] font-black text-[#6f655e]"
          >
            Ver en web
            <ExternalLink size={13} />
          </Link>
        </div>
      </section>

      <MediaManager
        ownerType="paca"
        ownerId={category.id}
        initialMedia={(media ?? []) as any}
        currentCover={category.cover_url}
      />
    </div>
  );
}
