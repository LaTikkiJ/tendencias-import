import Link from "next/link";
import {
  ArrowRight,
  ImageIcon,
  Plus,
  Sparkles,
} from "lucide-react";

import { createPacaCategory } from "@/app/admin/actions";
import PacaSectionsManager from "@/components/admin/PacaSectionsManager";
import PacaHomeBannerManager from "@/components/admin/PacaHomeBannerManager";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPacasPage() {
  const supabase = await createClient();

  const [
    { data: sections },
    { data: categories },
    { data: banners },
  ] = await Promise.all([
    supabase
      .from("paca_sections")
      .select(`
        id,
        name,
        slug,
        description,
        preference_options,
        accent_color,
        cover_url,
        active,
        show_on_home,
        sort_order
      `)
      .order("sort_order")
      .order("name"),

    supabase
      .from("paca_categories")
      .select(`
        id,
        section_id,
        audience,
        name,
        slug,
        description,
        cover_url,
        active,
        size_ranges,
        box_quantities,
        sort_order
      `)
      .order("sort_order")
      .order("created_at", { ascending: false }),

    supabase
      .from("paca_home_banners")
      .select("id,image_url,title,subtitle,sort_order,active")
      .order("sort_order")
      .order("created_at"),
  ]);

  const sectionMap = new Map(
    (sections ?? []).map((section) => [
      section.id,
      section,
    ]),
  );

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-[32px] border border-[#eaded3] bg-white shadow-[0_10px_35px_rgba(100,70,40,0.06)]">
        <div className="relative px-6 py-7 md:px-8">
          <div className="pointer-events-none absolute -right-8 top-0 h-36 w-36 rounded-full bg-[#d39218]/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#5a8b86]">
                Catálogo
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#2c2825] md:text-5xl">
                Pacas
              </h1>

              <p className="mt-3 max-w-xl text-[15px] leading-7 text-[#736860]">
                Controla las secciones que vende Tendencias Import y las categorías que pertenecen a cada una.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(sections ?? []).map((section) => {
                const count = (categories ?? []).filter(
                  (category) => category.section_id === section.id,
                ).length;

                return (
                  <div
                    key={section.id}
                    className="min-w-[110px] rounded-[18px] bg-[#f8f4f0] px-4 py-3"
                  >
                    <p className="text-[8px] font-black uppercase tracking-[.12em] text-[#7f746c]">
                      {section.name}
                    </p>
                    <p className="mt-1 text-xl font-black">
                      {count}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <PacaHomeBannerManager
        banners={(banners ?? []) as any}
      />

      <PacaSectionsManager
        sections={(sections ?? []) as any}
      />

      <details className="group overflow-hidden rounded-[30px] border border-[#eaded3] bg-white shadow-[0_10px_30px_rgba(100,70,40,0.05)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-full bg-[#b63a2c] text-white shadow-sm">
              <Plus size={20} />
            </span>

            <div>
              <p className="font-black text-[#2c2825]">
                Crear nueva categoría
              </p>

              <p className="mt-1 text-sm text-[#7f746c]">
                Primero eliges a qué sección pertenece.
              </p>
            </div>
          </div>

          <span className="rounded-full bg-[#f8f2ec] px-4 py-2 text-xs font-black text-[#8f3a2e]">
            + Nueva
          </span>
        </summary>

        <form
          action={createPacaCategory}
          className="grid gap-5 border-t border-[#eaded3] bg-[#fffdfb] p-6 md:grid-cols-2"
        >
          <div>
            <label className="mb-2 block text-sm font-black">
              Sección
            </label>

            <select
              name="section_id"
              className="ti-input"
              required
            >
              <option value="">
                Selecciona...
              </option>

              {(sections ?? [])
                .filter((section) => section.active)
                .map((section) => (
                  <option
                    key={section.id}
                    value={section.id}
                  >
                    {section.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black">
              Nombre de la categoría
            </label>

            <input
              name="name"
              className="ti-input"
              placeholder="Ej: Verano, Polos, Jeans..."
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black">
              Rango de tallas
            </label>

            <input
              name="size_ranges"
              className="ti-input"
              placeholder="Ej: 0-7, 1-7, 2-7"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black">
              Cantidades disponibles
            </label>

            <input
              type="hidden"
              name="box_quantities"
              value="25, 50, 100"
            />

            <div className="flex min-h-14 flex-wrap items-center gap-2 rounded-[16px] border border-[#eaded3] bg-[#fffaf6] px-3">
              {[25, 50, 100].map((quantity) => (
                <span
                  key={quantity}
                  className="rounded-full bg-white px-3 py-2 text-[10px] font-black shadow-sm"
                >
                  {quantity} prendas
                </span>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-black">
              Descripción
            </label>

            <textarea
              name="description"
              className="ti-input min-h-28 py-3"
              placeholder="Descripción para la clienta..."
            />
          </div>

          <div className="rounded-[22px] border border-[#e3ece9] bg-[#f4faf8] p-4 md:col-span-2">
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-[#5a8b86] text-white">
                <Sparkles size={17} />
              </span>

              <div>
                <p className="font-black text-[#2c2825]">
                  Se organiza automáticamente
                </p>

                <p className="mt-1 text-sm leading-6 text-[#736860]">
                  La categoría aparecerá dentro de la sección elegida en el ERP y en la web.
                </p>
              </div>
            </div>
          </div>

          <button className="ti-button ti-button-primary md:col-span-2">
            Crear categoría y subir contenido
          </button>
        </form>
      </details>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#5a8b86]">
              Categorías
            </p>

            <h2 className="mt-2 text-2xl font-black text-[#2c2825]">
              Contenido publicado
            </h2>
          </div>

          <Link
            href="/pacas"
            className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#8f3a2e] shadow-sm sm:flex"
          >
            Ver en la web
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {(categories ?? []).map((item) => {
            const section = item.section_id
              ? sectionMap.get(item.section_id)
              : null;

            return (
              <Link
                href={`/admin/pacas/${item.id}`}
                key={item.id}
                className="group overflow-hidden rounded-[22px] border border-[#eaded3] bg-white shadow-[0_6px_20px_rgba(100,70,40,0.05)] transition hover:-translate-y-0.5"
              >
                <div className="relative aspect-square overflow-hidden bg-[#f5e7dc]">
                  {item.cover_url ? (
                    <img
                      src={item.cover_url}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <ImageIcon
                        size={24}
                        className="text-[#b63a2c]"
                      />
                    </div>
                  )}

                  <span
                    className="absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[.08em] text-white"
                    style={{
                      backgroundColor:
                        section?.accent_color ?? "#b63a2c",
                    }}
                  >
                    {section?.name ?? item.audience}
                  </span>
                </div>

                <div className="p-3.5">
                  <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#5a8b86]">
                    {item.active ? "Visible" : "Oculta"}
                  </p>

                  <h3 className="mt-1 text-base font-black">
                    {item.name}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-[#7f746c]">
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
