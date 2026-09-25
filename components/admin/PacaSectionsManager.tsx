import {
  Eye,
  EyeOff,
  Layers3,
  Plus,
  Save,
  SlidersHorizontal,
} from "lucide-react";

import {
  createPacaSectionV16,
  updatePacaSectionV16,
} from "@/app/admin/pacas/sections/actions-v16";

type Section = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  preference_options: string[] | null;
  accent_color: string | null;
  active: boolean;
  show_on_home: boolean;
  sort_order: number | null;
};

export default function PacaSectionsManager({
  sections,
}: {
  sections: Section[];
}) {
  return (
    <section className="rounded-[30px] border border-[#eaded3] bg-white p-5 shadow-[0_10px_30px_rgba(100,70,40,0.05)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#5a8b86]">
            <Layers3 size={16} />
            <p className="text-[10px] font-black uppercase tracking-[.16em]">
              Secciones de Pacas
            </p>
          </div>

          <h2 className="mt-2 text-2xl font-black tracking-[-.03em]">
            Sofía controla qué líneas vende
          </h2>

          <p className="mt-2 max-w-2xl text-xs leading-5 text-[#7f746c]">
            Puedes tener Kids, Damas, Varón o crear nuevas secciones.
            Al ocultar una sección deja de aparecer en la web, sin borrar sus categorías.
          </p>
        </div>
      </div>

      <details className="mt-5 overflow-hidden rounded-[20px] border border-[#eaded3] bg-[#fffaf6]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-[#b63a2c] text-white">
              <Plus size={15} />
            </span>

            <div>
              <p className="text-sm font-black">Crear nueva sección</p>
              <p className="mt-0.5 text-[9px] text-[#8b8078]">
                Ej. Bebés, Teens, Premium, etc.
              </p>
            </div>
          </div>
        </summary>

        <form
          action={createPacaSectionV16}
          className="grid gap-3 border-t border-[#eaded3] bg-white p-4 sm:grid-cols-2"
        >
          <input
            name="name"
            required
            placeholder="Nombre de la sección"
            className="ti-input"
          />

          <input
            name="preference_options"
            placeholder="Preferencias: Varón, Ambos..."
            className="ti-input"
          />

          <input
            name="description"
            placeholder="Descripción corta"
            className="ti-input"
          />

          <div className="grid grid-cols-[1fr_100px] gap-2">
            <input
              name="accent_color"
              defaultValue="#b63a2c"
              placeholder="#b63a2c"
              className="ti-input"
            />

            <input
              type="number"
              name="sort_order"
              defaultValue="50"
              className="ti-input text-center"
              title="Orden"
            />
          </div>

          <button className="ti-button ti-button-primary sm:col-span-2">
            <Plus size={16} />
            Crear sección
          </button>
        </form>
      </details>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {sections.map((section) => (
          <form
            key={section.id}
            action={updatePacaSectionV16}
            className="rounded-[20px] border border-[#eaded3] bg-[#fffdfb] p-4"
          >
            <input type="hidden" name="id" value={section.id} />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="size-4 rounded-full border border-black/5"
                  style={{
                    backgroundColor:
                      section.accent_color ?? "#b63a2c",
                  }}
                />

                <div>
                  <p className="text-sm font-black">
                    {section.name}
                  </p>
                  <p className="text-[8px] uppercase tracking-[.12em] text-[#8b8078]">
                    {section.slug}
                  </p>
                </div>
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

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <label>
                <span className="mb-1 block text-[8px] font-black uppercase text-[#8b8078]">
                  Nombre
                </span>
                <input
                  name="name"
                  defaultValue={section.name}
                  className="ti-input"
                />
              </label>

              <label>
                <span className="mb-1 block text-[8px] font-black uppercase text-[#8b8078]">
                  Orden
                </span>
                <input
                  type="number"
                  name="sort_order"
                  defaultValue={section.sort_order ?? 0}
                  className="ti-input"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="mb-1 block text-[8px] font-black uppercase text-[#8b8078]">
                  Preferencias del pedido
                </span>
                <input
                  name="preference_options"
                  defaultValue={(section.preference_options ?? []).join(", ")}
                  placeholder="Ej. Varón"
                  className="ti-input"
                />
              </label>

              <label>
                <span className="mb-1 block text-[8px] font-black uppercase text-[#8b8078]">
                  Color
                </span>
                <input
                  name="accent_color"
                  defaultValue={section.accent_color ?? "#b63a2c"}
                  className="ti-input"
                />
              </label>

              <label>
                <span className="mb-1 block text-[8px] font-black uppercase text-[#8b8078]">
                  Descripción
                </span>
                <input
                  name="description"
                  defaultValue={section.description ?? ""}
                  className="ti-input"
                />
              </label>
            </div>

            <div className="mt-3 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-[9px] font-black">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={section.active}
                />
                Visible en web
              </label>

              <label className="flex items-center gap-2 text-[9px] font-black">
                <input
                  type="checkbox"
                  name="show_on_home"
                  defaultChecked={section.show_on_home}
                />
                Mostrar en inicio
              </label>
            </div>

            <button className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[14px] bg-[#5a8b86] px-4 text-[10px] font-black !text-white">
              <Save size={13} />
              Guardar sección
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}
