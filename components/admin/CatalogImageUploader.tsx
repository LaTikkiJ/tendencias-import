"use client";

import { useState } from "react";
import {
  ImagePlus,
  Loader2,
  Trash2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

async function optimizeImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecciona una imagen.");
  }

  try {
    const bitmap = await createImageBitmap(file);
    const maxWidth = 2200;
    const scale = Math.min(1, maxWidth / bitmap.width);

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.84),
    );

    if (!blob) return file;

    return new File(
      [blob],
      `${file.name.replace(/\.[^/.]+$/, "") || "imagen"}.webp`,
      {
        type: "image/webp",
        lastModified: Date.now(),
      },
    );
  } catch {
    return file;
  }
}

export default function CatalogImageUploader({
  value,
  onChange,
  folder,
  aspect = "wide",
  label = "Subir imagen",
}: {
  value: string;
  onChange: (value: string) => void;
  folder: string;
  aspect?: "wide" | "square";
  label?: string;
}) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);

    try {
      const optimized = await optimizeImage(file);
      const ext =
        optimized.name.split(".").pop()?.toLowerCase() || "webp";

      const path = `${folder}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("catalog-media")
        .upload(path, optimized, {
          cacheControl: "31536000",
          upsert: false,
          contentType: optimized.type,
        });

      if (error) {
        throw new Error(error.message);
      }

      const { data } = supabase.storage
        .from("catalog-media")
        .getPublicUrl(path);

      onChange(data.publicUrl);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "No se pudo subir la imagen.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div
        className={`relative overflow-hidden rounded-[18px] border border-[#eaded3] bg-[#f4ece5] ${
          aspect === "wide"
            ? "aspect-[16/6]"
            : "aspect-square"
        }`}
      >
        {value ? (
          <img
            src={value}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-center">
            <div>
              <ImagePlus
                size={24}
                className="mx-auto text-[#b63a2c]"
              />
              <p className="mt-2 text-[9px] font-black text-[#7f746c]">
                {label}
              </p>
            </div>
          </div>
        )}

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/60 !text-white"
          >
            <Trash2 size={13} />
          </button>
        )}

        <label className="absolute inset-x-3 bottom-3 flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-white/90 px-4 text-[10px] font-black text-[#8f3a2e] shadow-sm backdrop-blur">
          {uploading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <ImagePlus size={14} />
          )}

          {uploading ? "Subiendo..." : value ? "Cambiar imagen" : label}

          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );
}
