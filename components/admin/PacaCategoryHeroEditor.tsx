"use client";

import { useState } from "react";
import { Save } from "lucide-react";

import { updatePacaCategoryHeroV18 } from "@/app/admin/pacas/home-actions-v18";
import CatalogImageUploader from "@/components/admin/CatalogImageUploader";

export default function PacaCategoryHeroEditor({
  categoryId,
  initialHeroUrl,
}: {
  categoryId: string;
  initialHeroUrl: string | null;
}) {
  const [heroUrl, setHeroUrl] = useState(initialHeroUrl ?? "");

  return (
    <section className="rounded-[30px] border border-[#eaded3] bg-white p-5 shadow-[0_10px_30px_rgba(100,70,40,.05)] sm:p-6">
      <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#5a8b86]">
        Banner de la categoría
      </p>

      <h2 className="mt-2 text-2xl font-black">
        Portada horizontal
      </h2>

      <p className="mt-2 text-xs leading-5 text-[#7f746c]">
        Esta imagen aparecerá detrás del título de la categoría en la web.
        Es independiente de la portada cuadrada y de los collages.
      </p>

      <form
        action={updatePacaCategoryHeroV18}
        className="mt-5"
      >
        <input
          type="hidden"
          name="id"
          value={categoryId}
        />

        <input
          type="hidden"
          name="hero_url"
          value={heroUrl}
        />

        <CatalogImageUploader
          value={heroUrl}
          onChange={setHeroUrl}
          folder="tendencias/category-banners"
          aspect="wide"
          label="Subir banner de categoría"
        />

        <button className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[15px] bg-[#5a8b86] px-4 text-xs font-black !text-white">
          <Save size={14} />
          Guardar banner de categoría
        </button>
      </form>
    </section>
  );
}
