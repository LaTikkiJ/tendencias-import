import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  ImageIcon,
  PackageCheck,
  Sparkles,
  TriangleAlert,
  WandSparkles,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();

  const [
    { count: pacaCount },
    { count: seriesCount },
    { count: lowStockCount },
  ] = await Promise.all([
    supabase
      .from("paca_categories")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("active", true),

    supabase
      .from("series_products")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("active", true),

    supabase
      .from("series_products")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("active", true)
      .gt("series_available", 0)
      .lte("series_available", 2),
  ]);

  const cards = [
    {
      label: "Categorías de pacas",
      value: pacaCount ?? 0,
      helper: "Pacas visibles para clientas",
      icon: Boxes,
      tone:
        "from-[#fff7ef] to-[#fff3e6] border-[#f1dfcd] text-[#8f3a2e]",
    },
    {
      label: "Modelos en series",
      value: seriesCount ?? 0,
      helper: "Códigos activos registrados",
      icon: PackageCheck,
      tone:
        "from-[#eef8f6] to-[#f6fbfa] border-[#d6ebe7] text-[#42746e]",
    },
    {
      label: "Series con poco stock",
      value: lowStockCount ?? 0,
      helper: "Modelos con 1 o 2 series",
      icon: TriangleAlert,
      tone:
        "from-[#fff5ee] to-[#fff7f4] border-[#f2d7cf] text-[#b63a2c]",
    },
  ];

  return (
    <div className="space-y-7">
      {/* CABECERA PREMIUM */}
      <section className="overflow-hidden rounded-[32px] border border-[#eaded3] bg-white shadow-[0_10px_35px_rgba(110,80,50,0.06)]">
        <div className="relative px-6 py-7 md:px-8 md:py-8">
          <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-[#d39218]/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-[#5a8b86]/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#5a8b86]">
                Administración
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#2b2725] md:text-5xl">
                Hola, Sofía 👋
              </h1>

              <p className="mt-3 max-w-xl text-[15px] leading-7 text-[#736860]">
                Aquí administras pacas, series, fotos y videos de Tendencias
                Import de una forma más rápida, ordenada y visual.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:w-[520px]">
              <Link
                href="/admin/pacas"
                className="rounded-[22px] border border-[#efddd0] bg-[#fff7f1] px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-full bg-[#b63a2c] text-white">
                    <Boxes size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#2c2825]">
                      Ver pacas
                    </p>
                    <p className="text-xs text-[#8d8179]">
                      Administrar categorías
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/series"
                className="rounded-[22px] border border-[#e3ece9] bg-[#f3faf8] px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-full bg-[#5a8b86] text-white">
                    <PackageCheck size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#2c2825]">
                      Ver series
                    </p>
                    <p className="text-xs text-[#8d8179]">
                      Stock por código
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/"
                className="rounded-[22px] border border-[#f1e5cf] bg-[#fffaf1] px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-full bg-[#d39218] text-white">
                    <Sparkles size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#2c2825]">
                      Ver web
                    </p>
                    <p className="text-xs text-[#8d8179]">
                      Revisar la tienda pública
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TARJETAS DE RESUMEN */}
      <section className="grid gap-4 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className={`rounded-[28px] border bg-gradient-to-br p-5 shadow-[0_8px_26px_rgba(110,80,50,0.05)] ${card.tone}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[#6e635c]">
                    {card.label}
                  </p>

                  <p className="mt-4 text-5xl font-black tracking-[-0.04em] text-[#2c2825]">
                    {card.value}
                  </p>

                  <p className="mt-3 text-sm text-[#7f746c]">
                    {card.helper}
                  </p>
                </div>

                <div className="grid size-14 place-items-center rounded-full bg-white/80 shadow-sm">
                  <Icon size={24} />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* BLOQUES ABAJO */}
      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.9fr]">

        {/* PANEL RÁPIDO */}
        <article className="overflow-hidden rounded-[32px] border border-[#eaded3] bg-white shadow-[0_10px_30px_rgba(110,80,50,0.06)]">
          <div className="px-6 py-6 md:px-7 md:py-7">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d39218]">
              Acciones rápidas
            </p>

            <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[#2c2825]">
              ¿Qué deseas hacer ahora?
            </h2>

            <div className="mt-6 space-y-3">
              <Link
                href="/admin/pacas"
                className="flex items-center justify-between rounded-[22px] border border-[#efddd0] bg-[#fff8f3] px-4 py-4 font-black text-[#2c2825] transition hover:bg-[#fff3eb]"
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-[#b63a2c] text-white">
                    <Boxes size={18} />
                  </span>
                  Subir collages y videos de pacas
                </span>

                <ArrowRight size={18} className="text-[#8f3a2e]" />
              </Link>

              <Link
                href="/admin/series"
                className="flex items-center justify-between rounded-[22px] border border-[#dfecea] bg-[#f3faf8] px-4 py-4 font-black text-[#2c2825] transition hover:bg-[#eef7f5]"
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-[#5a8b86] text-white">
                    <PackageCheck size={18} />
                  </span>
                  Crear o actualizar un modelo en series
                </span>

                <ArrowRight size={18} className="text-[#42746e]" />
              </Link>

              <Link
                href="/admin/series"
                className="flex items-center justify-between rounded-[22px] border border-[#f1e5cf] bg-[#fffaf2] px-4 py-4 font-black text-[#2c2825] transition hover:bg-[#fff5e7]"
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-[#d39218] text-white">
                    <ImageIcon size={18} />
                  </span>
                  Revisar portada, fotos y videos
                </span>

                <ArrowRight size={18} className="text-[#b07a12]" />
              </Link>
            </div>

            <div className="mt-6 rounded-[24px] border border-[#ece2d7] bg-[#f9f6f2] p-4">
              <div className="flex items-start gap-3">
                <div className="grid size-11 place-items-center rounded-full bg-[#fff] text-[#b63a2c] shadow-sm">
                  <WandSparkles size={18} />
                </div>

                <div>
                  <p className="font-black text-[#2c2825]">
                    Recomendación
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#7d736b]">
                    Empieza subiendo primero los modelos de series con mejor
                    rotación para que la tienda se vea más completa desde el inicio.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}