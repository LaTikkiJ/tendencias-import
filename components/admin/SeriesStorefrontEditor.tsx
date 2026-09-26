"use client";

import { useState } from "react";
import { Save } from "lucide-react";

import { saveSeriesStorefrontV20 } from "@/app/admin/series/storefront-actions-v20";
import CatalogImageUploader from "@/components/admin/CatalogImageUploader";

type Settings = {
  id: string;
  eyebrow: string | null;
  title: string | null;
  highlight_text: string | null;
  subtitle: string | null;
  hero_url: string | null;
};

export default function SeriesStorefrontEditor({
  settings,
}: {
  settings: Settings | null;
}) {
  const [heroUrl, setHeroUrl] = useState(
    settings?.hero_url ?? "",
  );

  return (
    <section className="rounded-[28px] border border-[#eaded3] bg-white p-5 shadow-sm sm:p-6">
      <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#5a8b86]">
        Tienda de Series
      </p>

      <h2 className="mt-2 text-2xl font-black">
        Banner principal de Series
      </h2>

      <p className="mt-2 max-w-2xl text-xs leading-5 text-[#7f746c]">
        Puedes cambiar la imagen y las frases que verá la clienta.
        La tipografía se mantiene automáticamente.
      </p>

      <form
        action={saveSeriesStorefrontV20}
        className="mt-5 grid gap-4"
      >
        <input
          type="hidden"
          name="id"
          value={settings?.id ?? ""}
        />

        <input
          type="hidden"
          name="hero_url"
          value={heroUrl}
        />

        <CatalogImageUploader
          value={heroUrl}
          onChange={setHeroUrl}
          folder="tendencias/series-banner"
          aspect="wide"
          label="Subir banner de Series"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="eyebrow"
            defaultValue={settings?.eyebrow ?? "TENDENCIAS IMPORT"}
            className="ti-input"
            placeholder="Texto pequeño"
          />

          <input
            name="title"
            defaultValue={settings?.title ?? "Series Kids"}
            className="ti-input"
            placeholder="Título principal"
          />

          <input
            name="highlight_text"
            defaultValue={
              settings?.highlight_text ??
              "modelos listos para tu negocio"
            }
            className="ti-input"
            placeholder="Frase resaltada"
          />

          <input
            name="subtitle"
            defaultValue={
              settings?.subtitle ??
              "Elige un modelo y arma tu surtido."
            }
            className="ti-input"
            placeholder="Descripción"
          />
        </div>

        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[15px] bg-[#5a8b86] px-5 text-xs font-black !text-white">
          <Save size={15} />
          Guardar portada de Series
        </button>
      </form>
    </section>
  );
}
