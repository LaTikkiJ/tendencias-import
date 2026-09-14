import Link from "next/link";

import {
  Plus,
  Settings2,
} from "lucide-react";

import {
  createSeriesProduct,
} from "@/app/admin/actions";

import {
  createClient,
} from "@/lib/supabase/server";

export const dynamic =
  "force-dynamic";

export default async function AdminSeriesPage() {
  const supabase =
    await createClient();

  const { data } =
    await supabase
      .from("series_products")
      .select(
        `
        id,
        code,
        name,
        slug,
        price,
        cover_url,
        series_available,
        status,
        active,
        sizes
        `
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

  return (
    <div>
      <p className="text-sm font-black tracking-[.16em] text-[#5a8b86]">
        SERIES KIDS
      </p>

      <h1 className="mt-2 text-4xl font-black tracking-[-.04em]">
        Modelos de Series
      </h1>

      <p className="mt-2 text-[#7f746c]">
        Sofía solo registra los datos
        principales. El código y el
        enlace se generan
        automáticamente.
      </p>

      <details className="ti-card mt-7 overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 p-5 font-black">
          <Plus size={18} />

          Nuevo modelo
        </summary>

        <form
          action={
            createSeriesProduct
          }
          className="grid gap-4 border-t border-[#eaded3] p-5 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-black">
              Nombre del conjunto
            </label>

            <input
              name="name"
              className="ti-input"
              placeholder="Ej: Conjunto Floral"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black">
              Rango de tallas
            </label>

            <input
              name="sizes"
              className="ti-input"
              placeholder="Ej: 1,2,3,4,5"
              required
            />

            <p className="mt-2 text-xs text-[#7f746c]">
              Sepáralas con comas.
            </p>
          </div>

          <div>
            <div>
            <label className="mb-2 block text-sm font-black">
              Precio de venta
            </label>

            <div className="flex overflow-hidden rounded-[18px] border border-[#d8c6b8] bg-white shadow-sm transition focus-within:border-[#5a8b86] focus-within:ring-4 focus-within:ring-[#5a8b86]/10">
              <div className="flex h-14 min-w-[78px] items-center justify-center border-r border-[#eaded3] bg-[#f7f2ec] text-lg font-black text-[#8f2b21]">
                S/
              </div>

              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                className="h-14 w-full border-0 bg-transparent px-4 text-lg font-black text-[#2c2825] outline-none"
                placeholder="58.00"
                required
              />
            </div>

            <p className="mt-2 text-xs text-[#7f746c]">
              Precio por cada serie.
            </p>
          </div>

            
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-black">
              Tipo de venta
            </label>

            <select
              name="status"
              className="ti-input"
              defaultValue="stock"
            >
              <option value="stock">
                Entrega inmediata
              </option>

              <option value="preorder">
                Preventa
              </option>
            </select>
          </div>

          <div className="rounded-[20px] bg-[#f7f2ec] p-4 md:col-span-2">
            <p className="text-xs font-black uppercase tracking-[.12em] text-[#5a8b86]">
              AUTOMÁTICO
            </p>

            <p className="mt-2 text-sm leading-6 text-[#7f746c]">
              Tendencias Import
              generará automáticamente
              el código del modelo y su
              enlace web.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="ti-pill">
                TI0001
              </span>

              <span className="ti-pill">
                Slug automático
              </span>
            </div>
          </div>

          <button
            className="ti-button ti-button-primary md:col-span-2"
          >
            Crear modelo y continuar
          </button>
        </form>
      </details>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(data ?? []).map(
          (item) => (
            <article
              key={item.id}
              className="ti-card overflow-hidden"
            >
              <div
                className="aspect-[4/5] bg-[#efe5dc] bg-cover bg-center"
                style={
                  item.cover_url
                    ? {
                        backgroundImage:
                          `url(${item.cover_url})`,
                      }
                    : undefined
                }
              />

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black tracking-[.16em] text-[#5a8b86]">
                      {item.code}
                    </p>

                    <h2 className="mt-1 text-xl font-black">
                      {item.name}
                    </h2>
                  </div>

                  <span className="ti-pill">
                    {
                      item.series_available
                    }{" "}
                    disp.
                  </span>
                </div>

                <p className="mt-3 text-xl font-black text-[#b63a2c]">
                  S/{" "}
                  {Number(
                    item.price
                  ).toFixed(2)}
                </p>

                <div className="mt-3 flex flex-wrap gap-1">
                  {(
                    item.sizes ?? []
                  ).map(
                    (
                      size: string
                    ) => (
                      <span
                        key={size}
                        className="rounded-full bg-[#f7f2ec] px-3 py-1 text-xs font-bold"
                      >
                        {size}
                      </span>
                    )
                  )}
                </div>

                <div className="mt-3">
                  <span
                    className={
                      item.status ===
                      "preorder"
                        ? "rounded-full bg-[#fff5e8] px-3 py-1 text-xs font-black text-[#9b6510]"
                        : "rounded-full bg-[#edf7f5] px-3 py-1 text-xs font-black text-[#42746e]"
                    }
                  >
                    {item.status ===
                    "preorder"
                      ? "Preventa"
                      : "Entrega inmediata"}
                  </span>
                </div>

                <Link
                  href={`/admin/series/${item.id}`}
                  className="ti-button ti-button-soft mt-5 w-full"
                >
                  <Settings2
                    size={17}
                  />

                  Administrar
                </Link>
              </div>
            </article>
          )
        )}
      </div>
    </div>
  );
}