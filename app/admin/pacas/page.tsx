import Link from "next/link";

import {
  ArrowRight,
  Boxes,
  ImageIcon,
  Plus,
  Settings2,
  Sparkles,
} from "lucide-react";

import {
  createPacaCategory,
} from "@/app/admin/actions";

import {
  createClient,
} from "@/lib/supabase/server";

export const dynamic =
  "force-dynamic";

export default async function AdminPacasPage() {
  const supabase =
    await createClient();

  const { data } =
    await supabase
      .from("paca_categories")
      .select(
        `
        id,
        audience,
        name,
        slug,
        description,
        cover_url,
        active,
        size_ranges,
        box_quantities
        `
      )
      .order("created_at", {
        ascending: false,
      });

  const kids =
    data?.filter(
      (item) =>
        item.audience === "kids"
    ).length ?? 0;

  const damas =
    data?.filter(
      (item) =>
        item.audience === "damas"
    ).length ?? 0;

  return (
    <div className="space-y-7">

      {/* CABECERA */}
      <section className="overflow-hidden rounded-[32px] border border-[#eaded3] bg-white shadow-[0_10px_35px_rgba(100,70,40,0.06)]">
        <div className="relative px-6 py-7 md:px-8">
          <div className="pointer-events-none absolute -right-8 top-0 h-36 w-36 rounded-full bg-[#d39218]/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#5a8b86]">
                Catálogo
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#2c2825] md:text-5xl">
                Pacas
              </h1>

              <p className="mt-3 max-w-xl text-[15px] leading-7 text-[#736860]">
                Administra las categorías de
                Kids y Damas, sus tallas,
                cantidades, collages y videos.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[310px]">
              <div className="rounded-[22px] bg-[#fff5ef] p-4">
                <p className="text-xs font-black uppercase tracking-[.14em] text-[#b63a2c]">
                  Kids
                </p>

                <p className="mt-2 text-3xl font-black text-[#2c2825]">
                  {kids}
                </p>

                <p className="mt-1 text-xs text-[#8b8078]">
                  categorías
                </p>
              </div>

              <div className="rounded-[22px] bg-[#fff9ed] p-4">
                <p className="text-xs font-black uppercase tracking-[.14em] text-[#c08318]">
                  Damas
                </p>

                <p className="mt-2 text-3xl font-black text-[#2c2825]">
                  {damas}
                </p>

                <p className="mt-1 text-xs text-[#8b8078]">
                  categorías
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NUEVA CATEGORÍA */}
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
                Sofía solo completa los datos
                principales.
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
          {/* TIPO */}
          <div>
            <label className="mb-2 block text-sm font-black">
              Tipo de paca
            </label>

            <select
              name="audience"
              className="ti-input"
              required
            >
              <option value="kids">
                Pacas Kids
              </option>

              <option value="damas">
                Pacas Damas
              </option>
            </select>
          </div>

          {/* NOMBRE */}
          <div>
            <label className="mb-2 block text-sm font-black">
              Nombre de la categoría
            </label>

            <input
              name="name"
              className="ti-input"
              placeholder="Ej: Verano"
              required
            />
          </div>

          {/* TALLAS */}
          <div>
            <label className="mb-2 block text-sm font-black">
              Rango de tallas
            </label>

            <input
              name="size_ranges"
              className="ti-input"
              placeholder="Ej: 0-7, 1-7, 2-7"
            />

            <p className="mt-2 text-xs text-[#8b8078]">
              Puedes colocar uno o varios
              rangos separados por comas.
            </p>
          </div>

          {/* CANTIDADES */}
          <div>
            <label className="mb-2 block text-sm font-black">
              Cantidades disponibles
            </label>

            <input
              name="box_quantities"
              className="ti-input"
              placeholder="Ej: 15, 25, 50, 100"
            />

            <p className="mt-2 text-xs text-[#8b8078]">
              Cantidades en las que se ofrece
              esta paca.
            </p>
          </div>

          {/* DESCRIPCIÓN */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-black">
              Descripción
            </label>

            <textarea
              name="description"
              className="ti-input min-h-28 py-3"
              placeholder="Ej: Paca surtida de prendas de verano para niña y niño..."
            />
          </div>

          {/* AUTOMÁTICO */}
          <div className="rounded-[22px] border border-[#e3ece9] bg-[#f4faf8] p-4 md:col-span-2">
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-[#5a8b86] text-white">
                <Sparkles size={17} />
              </span>

              <div>
                <p className="font-black text-[#2c2825]">
                  El sistema hace lo demás
                </p>

                <p className="mt-1 text-sm leading-6 text-[#736860]">
                  El enlace interno de la
                  categoría se genera
                  automáticamente. Sofía no
                  necesita escribir ningún
                  código técnico.
                </p>
              </div>
            </div>
          </div>

          <button className="ti-button ti-button-primary md:col-span-2">
            Crear categoría y subir contenido
          </button>
        </form>
      </details>

      {/* LISTADO */}
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
          {(data ?? []).map((item) => (
            <article
              key={item.id}
              className="group overflow-hidden rounded-[22px] border border-[#eaded3] bg-white shadow-[0_6px_20px_rgba(100,70,40,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(100,70,40,0.08)]"
            >
              {/* FOTO */}
              <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#f5e7dc] via-[#fff5ec] to-[#f2e1d6]">
                {item.cover_url ? (
                  <img
                    src={item.cover_url}
                    alt={item.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="grid h-full place-items-center">
                    <div className="text-center">
                      <span className="mx-auto grid size-10 place-items-center rounded-full bg-white/80 text-[#b63a2c] shadow-sm">
                        <ImageIcon size={18} />
                      </span>

                      <p className="mt-2 text-[10px] font-black uppercase tracking-[.14em] text-[#9a8578]">
                        Sin portada
                      </p>
                    </div>
                  </div>
                )}

                {/* TIPO */}
                <div className="absolute left-2.5 top-2.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[.1em] text-white shadow-sm ${
                      item.audience === "kids"
                        ? "bg-[#b63a2c]"
                        : "bg-[#d39218]"
                    }`}
                  >
                    {item.audience}
                  </span>
                </div>

                {/* ESTADO */}
                <div className="absolute right-2.5 top-2.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[9px] font-black ${
                      item.active
                        ? "bg-[#edf8f5] text-[#42746e]"
                        : "bg-[#eee9e5] text-[#8d8178]"
                    }`}
                  >
                    {item.active ? "Visible" : "Oculta"}
                  </span>
                </div>
              </div>

              {/* INFORMACIÓN */}
              <div className="p-3.5">
                <h3 className="truncate text-[16px] font-black leading-5 text-[#2c2825]">
                  {item.name}
                </h3>

                {item.description && (
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-[17px] text-[#7f746c]">
                    {item.description}
                  </p>
                )}

                {/* DATOS COMPACTOS */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="min-w-0 rounded-[13px] bg-[#f8f4f0] px-2.5 py-2">
                    <p className="text-[8px] font-black uppercase tracking-[.12em] text-[#9a8d83]">
                      Tallas
                    </p>

                    <p className="mt-0.5 truncate text-[11px] font-black text-[#2c2825]">
                      {(item.size_ranges ?? []).join(" · ") || "Por definir"}
                    </p>
                  </div>

                  <div className="min-w-0 rounded-[13px] bg-[#f8f4f0] px-2.5 py-2">
                    <p className="text-[8px] font-black uppercase tracking-[.12em] text-[#9a8d83]">
                      Cantidad
                    </p>

                    <p className="mt-0.5 truncate text-[11px] font-black text-[#2c2825]">
                      {(item.box_quantities ?? []).join(" · ") || "Por definir"}
                    </p>
                  </div>
                </div>

                {/* BOTÓN */}
                <Link
                  href={`/admin/pacas/${item.id}`}
                  className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-[14px] bg-[#fff0e9] text-[12px] font-black text-[#9b382b] transition hover:bg-[#b63a2c] hover:text-white"
                >
                  <Settings2 size={14} />
                  Administrar
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}