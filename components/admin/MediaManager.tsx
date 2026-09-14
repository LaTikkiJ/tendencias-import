"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Star, Trash2, UploadCloud, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type MediaItem = {
  id: string;
  media_type: "image" | "video";
  url: string;
  title: string | null;
  sort_order: number;
};

type Props = {
  ownerType: "paca" | "series";
  ownerId: string;
  initialMedia: MediaItem[];
  currentCover?: string | null;
};

export function MediaManager({
  ownerType,
  ownerId,
  initialMedia,
  currentCover,
}: Props) {
  const supabase = createClient();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [media, setMedia] = useState(initialMedia);
  const [uploading, setUploading] = useState(false);
  const [cover, setCover] = useState(currentCover ?? null);
  const [dragging, setDragging] = useState(false);

  const mediaTable = ownerType === "paca" ? "paca_media" : "series_media";
  const ownerColumn = ownerType === "paca" ? "category_id" : "product_id";
  const ownerTable = ownerType === "paca" ? "paca_categories" : "series_products";

  function cleanName(name: string) {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();
  }

  async function uploadFiles(files: FileList | File[]) {
    const selected = Array.from(files);
    if (!selected.length) return;

    setUploading(true);

    try {
      for (let index = 0; index < selected.length; index++) {
        const file = selected[index];

        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
          continue;
        }

        const ext = file.name.split(".").pop() ?? "file";
        const base = cleanName(file.name.replace(/\.[^/.]+$/, ""));
        const filename = `${Date.now()}-${crypto.randomUUID()}-${base}.${ext}`;
        const storagePath = `${ownerType}/${ownerId}/${filename}`;

        const { error: uploadError } = await supabase.storage
          .from("catalog-media")
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("catalog-media")
          .getPublicUrl(storagePath);

        const url = publicUrlData.publicUrl;
        const mediaType = file.type.startsWith("video/") ? "video" : "image";

        const { data: inserted, error: insertError } = await supabase
          .from(mediaTable)
          .insert({
            [ownerColumn]: ownerId,
            media_type: mediaType,
            url,
            title: file.name,
            sort_order: media.length + index,
            active: true,
          })
          .select("id,media_type,url,title,sort_order")
          .single();

        if (insertError) throw insertError;

        setMedia((old) => [...old, inserted as MediaItem]);

        // Si todavía no hay portada, la primera imagen subida se vuelve portada.
        if (!cover && mediaType === "image") {
          const { error: coverError } = await supabase
            .from(ownerTable)
            .update({ cover_url: url })
            .eq("id", ownerId);

          if (coverError) throw coverError;
          setCover(url);
        }
      }

      router.refresh();
    } catch (error: any) {
      alert(error?.message ?? "No se pudo subir el archivo.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function makeCover(item: MediaItem) {
    if (item.media_type !== "image") return;

    const { error } = await supabase
      .from(ownerTable)
      .update({ cover_url: item.url })
      .eq("id", ownerId);

    if (error) {
      alert(error.message);
      return;
    }

    setCover(item.url);
    router.refresh();
  }

  async function remove(item: MediaItem) {
    const confirmed = window.confirm(
      "¿Eliminar este archivo del catálogo? Esta acción no se puede deshacer."
    );
    if (!confirmed) return;

    try {
      const url = new URL(item.url);
      const marker = "/storage/v1/object/public/catalog-media/";
      const path = decodeURIComponent(url.pathname.split(marker)[1] ?? "");

      const { error: deleteRowError } = await supabase
        .from(mediaTable)
        .delete()
        .eq("id", item.id);

      if (deleteRowError) throw deleteRowError;

      if (path) {
        const { error: storageError } = await supabase.storage
          .from("catalog-media")
          .remove([path]);

        if (storageError) console.warn(storageError.message);
      }

      setMedia((old) => old.filter((x) => x.id !== item.id));

      if (cover === item.url) {
        const nextImage = media.find(
          (x) => x.id !== item.id && x.media_type === "image"
        );
        const nextCover = nextImage?.url ?? null;

        const { error: updateCoverError } = await supabase
          .from(ownerTable)
          .update({ cover_url: nextCover })
          .eq("id", ownerId);

        if (updateCoverError) throw updateCoverError;
        setCover(nextCover);
      }

      router.refresh();
    } catch (error: any) {
      alert(error?.message ?? "No se pudo eliminar.");
    }
  }

  return (
    <section className="ti-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#5a8b86]">
            GALERÍA
          </p>
          <h2 className="mt-1 text-2xl font-black">
            Fotos, collages y videos
          </h2>
          <p className="mt-2 text-sm text-[#7f746c]">
            La primera imagen se usa como portada automáticamente. Después puedes cambiarla.
          </p>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="ti-button ti-button-primary disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <UploadCloud size={18} />
          )}
          {uploading ? "Subiendo..." : "Subir archivos"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) uploadFiles(e.target.files);
        }}
      />

      <button
        type="button"
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`mt-5 grid min-h-40 w-full place-items-center rounded-[22px] border-2 border-dashed p-5 text-center transition ${
          dragging
            ? "border-[#b63a2c] bg-[#fff0eb]"
            : "border-[#e7d7ca] bg-white/70"
        }`}
      >
        <div>
          <ImagePlus className="mx-auto text-[#b63a2c]" size={28} />
          <p className="mt-3 font-black">
            Arrastra fotos o videos aquí
          </p>
          <p className="mt-1 text-sm text-[#7f746c]">
            o toca para elegir desde tu computadora/celular
          </p>
        </div>
      </button>

      {media.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {media.map((item) => {
            const isCover = cover === item.url;

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-[20px] border border-[#eaded3] bg-white"
              >
                <div className="relative aspect-[4/5] bg-[#efe5dc]">
                  {item.media_type === "video" ? (
                    <video
                      src={item.url}
                      controls
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.title ?? "Imagen"}
                      className="h-full w-full object-cover"
                    />
                  )}

                  <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                    {item.media_type === "video" ? (
                      <>
                        <Video size={11} className="mr-1 inline" /> Video
                      </>
                    ) : (
                      "Foto"
                    )}
                  </span>

                  {isCover && (
                    <span className="absolute right-2 top-2 rounded-full bg-[#c78316] px-2 py-1 text-[10px] font-black text-white">
                      PORTADA
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 p-3">
                  {item.media_type === "image" ? (
                    <button
                      type="button"
                      onClick={() => makeCover(item)}
                      disabled={isCover}
                      className="flex min-h-9 flex-1 items-center justify-center gap-1 rounded-full bg-[#fff5e8] px-2 text-[11px] font-black text-[#9b6510] disabled:opacity-50"
                    >
                      <Star size={13} />
                      {isCover ? "Portada" : "Usar portada"}
                    </button>
                  ) : (
                    <span className="flex-1 text-xs font-bold text-[#7f746c]">
                      Video
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => remove(item)}
                    className="grid size-9 place-items-center rounded-full bg-[#fff0eb] text-[#b63a2c]"
                    aria-label="Eliminar archivo"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
