import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { updateSeriesProduct } from "@/app/admin/actions";
import { MediaManager } from "@/components/admin/MediaManager";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminSeriesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const [
    { data: product },
    { data: media },
  ] = await Promise.all([
    supabase
      .from("series_products")
      .select("*")
      .eq("id", id)
      .single(),

    supabase
      .from("series_media")
      .select(
        "id,media_type,url,title,sort_order"
      )
      .eq("product_id", id)
      .order("sort_order"),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">

      {/* VOLVER */}
      <div>
        <Link
          href="/admin/series"
          className="inline-flex items-center gap-2 text-sm font-black text-[#8f2b21]"
        >
          <ArrowLeft size={16} />

          Volver a series
        </Link>

        <p className="mt-5 text-sm font-black tracking-[.16em] text-[#5a8b86]">
          {product.code}
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-[-.04em]">
          {product.name}
        </h1>
      </div>

      {/* IDENTIFICACIÓN AUTOMÁTICA */}
      <div className="ti-card p-5">
        <p className="text-xs font-black uppercase tracking-[.16em] text-[#5a8b86]">
          IDENTIFICACIÓN AUTOMÁTICA
        </p>

        <p className="mt-2 text-sm text-[#7f746c]">
          Estos datos los genera Tendencias Import automáticamente.
          Sofía no necesita modificarlos.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">

          <div className="rounded-[20px] bg-[#f7f2ec] p-4">
            <p className="text-xs font-bold text-[#7f746c]">
              Código de inventario
            </p>

            <p className="mt-1 text-xl font-black text-[#2c2825]">
              {product.code}
            </p>
          </div>

          <div className="rounded-[20px] bg-[#f7f2ec] p-4">
            <p className="text-xs font-bold text-[#7f746c]">
              Enlace automático
            </p>

            <p className="mt-1 break-all text-sm font-black text-[#2c2825]">
              {product.slug}
            </p>
          </div>

        </div>
      </div>

      {/* DATOS DEL MODELO */}
      <form
        action={updateSeriesProduct}
        className="ti-card grid gap-4 p-5 md:grid-cols-2"
      >
        <input
          type="hidden"
          name="id"
          value={product.id}
        />

        {/* NOMBRE */}
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-black">
            Nombre del conjunto
          </label>

          <input
            name="name"
            className="ti-input"
            defaultValue={product.name}
            required
          />
        </div>

        {/* TALLAS */}
        <div>
          <label className="mb-2 block text-sm font-black">
            Rango de tallas
          </label>

          <input
            name="sizes"
            className="ti-input"
            defaultValue={
              (product.sizes ?? []).join(", ")
            }
            placeholder="Ej: 1,2,3,4,5"
            required
          />

          <p className="mt-2 text-xs text-[#7f746c]">
            Separa las tallas con comas.
          </p>
        </div>

        {/* PRECIO */}
        <div>
          <label className="mb-2 block text-sm font-black">
            Precio de venta por serie
          </label>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#7f746c]">
              S/
            </span>

            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              className="ti-input pl-12"
              defaultValue={product.price}
              required
            />
          </div>
        </div>

        {/* TIPO DE VENTA */}
        <div>
          <label className="mb-2 block text-sm font-black">
            Tipo de venta
          </label>

          <select
            name="status"
            className="ti-input"
            defaultValue={product.status}
          >
            <option value="stock">
              Entrega inmediata
            </option>

            <option value="preorder">
              Preventa
            </option>
          </select>
        </div>

        {/* STOCK */}
        <div>
          <label className="mb-2 block text-sm font-black">
            Series disponibles
          </label>

          <input
            name="series_available"
            type="number"
            min="0"
            className="ti-input"
            defaultValue={
              product.series_available
            }
          />

          <p className="mt-2 text-xs text-[#7f746c]">
            Aquí Sofía indica cuántas series tiene disponibles.
          </p>
        </div>

        {/* VISIBLE */}
        <label className="flex min-h-14 items-center gap-3 rounded-[18px] border border-[#eaded3] bg-white px-4">
          <input
            type="checkbox"
            name="active"
            defaultChecked={product.active}
            className="size-4"
          />

          <div>
            <p className="font-black">
              Visible en la web
            </p>

            <p className="text-xs text-[#7f746c]">
              Mostrar este modelo a las clientas.
            </p>
          </div>
        </label>

        {/* DESTACADO */}
        <label className="flex min-h-14 items-center gap-3 rounded-[18px] border border-[#eaded3] bg-white px-4">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={
              product.featured
            }
            className="size-4"
          />

          <div>
            <p className="font-black">
              Modelo destacado
            </p>

            <p className="text-xs text-[#7f746c]">
              Podemos mostrarlo primero en la tienda.
            </p>
          </div>
        </label>

        {/* DESCRIPCIÓN */}
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-black">
            Descripción
            <span className="ml-2 font-normal text-[#9b8e84]">
              Opcional
            </span>
          </label>

          <textarea
            name="description"
            className="ti-input min-h-28 py-3"
            defaultValue={
              product.description ?? ""
            }
            placeholder="Puedes agregar algún detalle especial del modelo..."
          />
        </div>

        <button className="ti-button ti-button-primary md:col-span-2">
          Guardar cambios
        </button>
      </form>

      {/* FOTOS Y VIDEOS */}
      <MediaManager
        ownerType="series"
        ownerId={product.id}
        initialMedia={
          (media ?? []) as any
        }
        currentCover={
          product.cover_url
        }
      />

    </div>
  );
}