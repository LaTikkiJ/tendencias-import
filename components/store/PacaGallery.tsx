"use client";

import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type MediaItem = {
  id: string;
  media_type: "image" | "video";
  url: string;
  title: string | null;
  sort_order: number;
};

const PAGE_SIZE = 12;

export function PacaGallery({
  categoryId,
  initialMedia,
  initialHasMore,
}: {
  categoryId: string;
  initialMedia: MediaItem[];
  initialHasMore: boolean;
}) {
  const supabase = createClient();
  const [items, setItems] = useState(initialMedia);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState<Record<string, boolean>>({});

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);

    const from = items.length;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("paca_media")
      .select("id,media_type,url,title,sort_order")
      .eq("category_id", categoryId)
      .eq("active", true)
      .order("sort_order")
      .range(from, to);

    setLoading(false);

    if (error) {
      alert("No pudimos cargar más archivos.");
      return;
    }

    const next = (data ?? []) as MediaItem[];
    setItems((current) => [...current, ...next]);
    setHasMore(next.length === PAGE_SIZE);
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {items.map((item) => {
          const footerLabel =
            item.media_type === "video"
              ? "Videos referenciales"
              : "Collages referenciales";

          return (
            <article
              key={item.id}
              className="overflow-hidden rounded-[20px] border border-[#eaded3] bg-white shadow-sm"
            >
              {item.media_type === "video" ? (
                <div className="relative aspect-square bg-[#201d1b]">
                  {playing[item.id] ? (
                    <video
                      src={item.url}
                      controls
                      autoPlay
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setPlaying((current) => ({
                          ...current,
                          [item.id]: true,
                        }))
                      }
                      className="grid h-full w-full place-items-center bg-gradient-to-br from-[#3c3531] to-black !text-white"
                      aria-label="Reproducir video"
                    >
                      <span className="grid size-14 place-items-center rounded-full bg-white/15 backdrop-blur">
                        <Play size={24} fill="currentColor" />
                      </span>
                    </button>
                  )}

                  <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-[9px] font-black !text-white">
                    VIDEO
                  </span>
                </div>
              ) : (
                <div className="aspect-square bg-[#eee3d9]">
                  <img
                    src={item.url}
                    alt={item.title ?? "Paca Tendencias Import"}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="flex h-10 items-center justify-center border-t border-[#f0e6dd] bg-white px-3">
                <span className="text-[9px] font-black uppercase tracking-[.14em] text-[#9b382b]">
                  {footerLabel}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {hasMore && (
        <div className="mt-7 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#eaded3] bg-white px-5 text-xs font-black text-[#6f655e] disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Cargando..." : "Ver más fotos y videos"}
          </button>
        </div>
      )}
    </>
  );
}
