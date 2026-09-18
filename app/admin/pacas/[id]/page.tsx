import Link from "next/link";

import {
  ArrowLeft,
  Eye,
  Link2,
  Save,
} from "lucide-react";

import {
  notFound,
} from "next/navigation";

import {
  updatePacaCategory,
} from "@/app/admin/actions";

import {
  MediaManager,
} from "@/components/admin/MediaManager";

import PacaPriceEditor from "@/components/admin/PacaPriceEditor";

import {
  createClient,
} from "@/lib/supabase/server";

export const dynamic =
  "force-dynamic";

export default async function AdminPacaDetailPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const supabase =
    await createClient();

  const [
    { data: category },
    { data: media },
    { data: prices },
  ] = await Promise.all([
    supabase
      .from("paca_categories")
      .select("*")
      .eq("id", id)
      .single(),

    supabase
      .from("paca_media")
      .select(
        "id,media_type,url,title,sort_order"
      )
      .eq("category_id", id)
      .order("sort_order"),

    supabase
      .from("paca_category_prices")
      .select("quantity,price_pen")
      .eq("category_id", id)
      .order("quantity"),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <div className="space-y-6">

      {/* VOLVER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/pacas"
          className="inline-flex items-center gap-2 text-sm font-black text-[#8f3a2e]"
        >
          <ArrowLeft size={16} />

          Volver a pacas
        </Link>

        <Link
          href={`/pacas/${category.slug}`}
          target="_blank"
          className="inline-flex items-center gap-2 rounded-full border border-[#eaded3] bg-white px-4 py-2 text-sm font-black text-[#5a8b86] shadow-sm"
        >
          <Eye size={16} />

          Ver en la web
        </Link>
      </div>

      {/* CABECERA */}
      <section className="overflow-hidden rounded-[32px] border border-[#eaded3] bg-white shadow-[0_10px_30px_rgba(100,70,40,0.05)]">
        <div className="relative p-6 md:p-7">
          <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-[#d39218]/10 blur-3xl" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[.14em] text-white ${
                  category.audience ===
                  "kids"
                    ? "bg-[#b63a2c]"
                    : "bg-[#d39218]"
                }`}
              >
                {
                  category.audience
                }
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  category.active
                    ? "bg-[#edf8f5] text-[#42746e]"
                    : "bg-[#eee9e5] text-[#8d8178]"
                }`}
              >
                {category.active
                  ? "Visible"
                  : "Oculta"}
              </span>
            </div>

            <h1 className="mt-4 text-4xl font-black tracking-[-.04em] text-[#2c2825] md:text-5xl">
              {category.name}
            </h1>

            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#736860]">
              Edita la información y
              administra sus collages,
              fotografías y videos.
            </p>
          </div>
        </div>
      </section>

      {/* ENLACE AUTOMÁTICO */}
      <section className="rounded-[26px] border border-[#e2ece9] bg-[#f4faf8] p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#5a8b86] text-white">
            <Link2 size={18} />
          </span>

          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-[#42746e]">
              Enlace automático
            </p>

            <p className="mt-2 font-black text-[#2c2825]">
              /pacas/{category.slug}
            </p>

            <p className="mt-1 text-sm text-[#736860]">
              Este enlace lo genera el
              sistema. Sofía no necesita
              modificarlo.
            </p>
          </div>
        </div>
      </section>

      <PacaPriceEditor
        categoryId={category.id}
        slug={category.slug}
        initialPrices={(prices ?? []) as any}
      />

      {/* FORMULARIO */}
      <form
        action={updatePacaCategory}
        className="rounded-[30px] border border-[#eaded3] bg-white p-6 shadow-[0_10px_30px_rgba(100,70,40,0.05)]"
      >
        <input
          type="hidden"
          name="id"
          value={category.id}
        />

        <div className="grid gap-5 md:grid-cols-2">

          {/* TIPO */}
          <div>
            <label className="mb-2 block text-sm font-black">
              Tipo de paca
            </label>

            <select
              name="audience"
              className="ti-input"
              defaultValue={
                category.audience
              }
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
              defaultValue={
                category.name
              }
              required
            />
          </div>

          {/* TALLAS */}
          <div>
            <label className="mb-2 block text-sm font-black">
              Rangos de tallas
            </label>

            <input
              name="size_ranges"
              className="ti-input"
              defaultValue={(
                category.size_ranges ??
                []
              ).join(", ")}
            />

            <p className="mt-2 text-xs text-[#8b8078]">
              Ejemplo: 0-7, 1-7, 2-7
            </p>
          </div>

          {/* CANTIDADES FIJAS */}
          <div>
            <label className="mb-2 block text-sm font-black">
              Cantidades de venta
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

            <p className="mt-2 text-xs text-[#8b8078]">
              Estas cantidades son fijas para Tendencias.
            </p>
          </div>

          {/* VISIBILIDAD */}
          <label className="flex min-h-16 items-center gap-3 rounded-[20px] border border-[#e3ece9] bg-[#f5faf9] px-4 md:col-span-2">
            <input
              type="checkbox"
              name="active"
              defaultChecked={
                category.active
              }
              className="size-4"
            />

            <div>
              <p className="font-black text-[#2c2825]">
                Visible en la web
              </p>

              <p className="mt-1 text-xs text-[#736860]">
                Si lo desactivas, las
                clientas dejarán de ver
                esta categoría.
              </p>
            </div>
          </label>

          {/* DESCRIPCIÓN */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-black">
              Descripción
            </label>

            <textarea
              name="description"
              className="ti-input min-h-32 py-3"
              defaultValue={
                category.description ??
                ""
              }
              placeholder="Información para las clientas..."
            />
          </div>

          <button className="ti-button ti-button-primary md:col-span-2">
            <Save size={17} />

            Guardar cambios
          </button>
        </div>
      </form>

      {/* MULTIMEDIA */}
      <MediaManager
        ownerType="paca"
        ownerId={category.id}
        initialMedia={
          (media ?? []) as any
        }
        currentCover={
          category.cover_url
        }
      />
    </div>
  );
}