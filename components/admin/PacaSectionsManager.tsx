"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Layers3,
  Plus,
  Save,
} from "lucide-react";

import {
  createPacaSectionV16,
  updatePacaSectionV16,
} from "@/app/admin/pacas/sections/actions-v16";
import CatalogImageUploader from "@/components/admin/CatalogImageUploader";

type Section = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  preference_options: string[] | null;
  accent_color: string | null;
  cover_url: string | null;
  hero_url: string | null;
  hero_eyebrow: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  active: boolean;
  show_on_home: boolean;
  sort_order: number | null;
};

export default function PacaSectionsManager({
  sections,
}: {
  sections: Section[];
}) {
  const [newCover, setNewCover] = useState("");
  const [newHero, setNewHero] = useState("");

  return (
    <section className="rounded-[30px] border border-[#eaded3] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2 text-[#5a8b86]">
        <Layers3 size={16} />
        <p className="text-[10px] font-black uppercase tracking-[.16em]">
          Secciones de Pacas
        </p>
      </div>

      <h2 className="mt-2 text-2xl font-black">
        Kids, Damas, Varón y futuras líneas
      </h2>

      <p className="mt-2 max-w-2xl text-xs leading-5 text-[#7f746c]">
        Cada sección tiene una portada para el inicio y un banner horizontal
        propio para su página de categorías.
      </p>

      <details className="mt-5 overflow-hidden rounded-[20px] border border-[#eaded3] bg-[#fffaf6]">
        <summary className="cursor-pointer list-none px-4 py-4 text-sm font-black">
          + Crear nueva sección
        </summary>

        <form
          action={createPacaSectionV16}
          className="grid gap-4 border-t border-[#eaded3] bg-white p-4"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-[9px] font-black uppercase text-[#7f746c]">
                Portada de la sección
              </p>
              <CatalogImageUploader
                value={newCover}
                onChange={setNewCover}
                folder="tendencias/section-covers"
                aspect="square"
                label="Subir portada"
              />
            </div>

            <div>
              <p className="mb-2 text-[9px] font-black uppercase text-[#7f746c]">
                Banner de la sección
              </p>
              <CatalogImageUploader
                value={newHero}
                onChange={setNewHero}
                folder="tendencias/section-banners"
                aspect="wide"
                label="Subir banner"
              />
            </div>
          </div>

          <input type="hidden" name="cover_url" value={newCover} />
          <input type="hidden" name="hero_url" value={newHero} />

          <div className="grid gap-3 sm:grid-cols-2">
            <input name="name" required placeholder="Nombre de la sección" className="ti-input" />
            <input name="preference_options" placeholder="Preferencias: Varón, Ambos..." className="ti-input" />
            <input name="description" placeholder="Descripción corta" className="ti-input" />
            <input name="hero_eyebrow" placeholder="Texto pequeño: TENDENCIAS · PACAS KIDS" className="ti-input" />
            <input name="hero_title" placeholder="Título del banner: Pacas Kids" className="ti-input" />
            <input name="hero_subtitle" placeholder="Frase: Revisa categorías..." className="ti-input" />

            <div className="grid grid-cols-[1fr_100px] gap-2 sm:col-span-2">
              <input name="accent_color" defaultValue="#b63a2c" className="ti-input" />
              <input type="number" name="sort_order" defaultValue="50" className="ti-input text-center" />
            </div>
          </div>

          <button className="ti-button ti-button-primary">
            <Plus size={16} />
            Crear sección
          </button>
        </form>
      </details>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {sections.map((section) => (
          <SectionEditor key={section.id} section={section} />
        ))}
      </div>
    </section>
  );
}

function SectionEditor({
  section,
}: {
  section: Section;
}) {
  const [coverUrl, setCoverUrl] = useState(section.cover_url ?? "");
  const [heroUrl, setHeroUrl] = useState(section.hero_url ?? "");

  return (
    <form
      action={updatePacaSectionV16}
      className="overflow-hidden rounded-[22px] border border-[#eaded3] bg-[#fffdfb] p-4"
    >
      <input type="hidden" name="id" value={section.id} />
      <input type="hidden" name="cover_url" value={coverUrl} />
      <input type="hidden" name="hero_url" value={heroUrl} />

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-base font-black">{section.name}</p>
          <p className="text-[8px] uppercase tracking-[.12em] text-[#8b8078]">
            {section.slug}
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[8px] font-black ${
            section.active
              ? "bg-[#edf7f5] text-[#42746e]"
              : "bg-[#f1ece8] text-[#8b8078]"
          }`}
        >
          {section.active ? <Eye size={10} /> : <EyeOff size={10} />}
          {section.active ? "Visible" : "Oculta"}
        </span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[8px] font-black uppercase text-[#8b8078]">
            Portada del inicio
          </p>
          <CatalogImageUploader
            value={coverUrl}
            onChange={setCoverUrl}
            folder="tendencias/section-covers"
            aspect="square"
            label="Cambiar portada"
          />
        </div>

        <div>
          <p className="mb-2 text-[8px] font-black uppercase text-[#8b8078]">
            Banner de la sección
          </p>
          <CatalogImageUploader
            value={heroUrl}
            onChange={setHeroUrl}
            folder="tendencias/section-banners"
            aspect="wide"
            label="Cambiar banner"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <input name="name" defaultValue={section.name} className="ti-input" placeholder="Nombre" />
        <input name="description" defaultValue={section.description ?? ""} className="ti-input" placeholder="Descripción" />
        <input name="preference_options" defaultValue={(section.preference_options ?? []).join(", ")} className="ti-input" placeholder="Preferencias" />
        <input name="hero_eyebrow" defaultValue={section.hero_eyebrow ?? ""} className="ti-input" placeholder="Texto pequeño del banner" />
        <input name="hero_title" defaultValue={section.hero_title ?? ""} className="ti-input" placeholder="Título del banner" />
        <input name="hero_subtitle" defaultValue={section.hero_subtitle ?? ""} className="ti-input" placeholder="Frase del banner" />

        <div className="grid grid-cols-[1fr_90px] gap-2 sm:col-span-2">
          <input name="accent_color" defaultValue={section.accent_color ?? "#b63a2c"} className="ti-input" />
          <input type="number" name="sort_order" defaultValue={section.sort_order ?? 0} className="ti-input" />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-[9px] font-black">
          <input type="checkbox" name="active" defaultChecked={section.active} />
          Visible
        </label>

        <label className="flex items-center gap-2 text-[9px] font-black">
          <input type="checkbox" name="show_on_home" defaultChecked={section.show_on_home} />
          Mostrar en inicio
        </label>
      </div>

      <button className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[14px] bg-[#5a8b86] px-4 text-[10px] font-black !text-white">
        <Save size={13} />
        Guardar sección
      </button>
    </form>
  );
}
