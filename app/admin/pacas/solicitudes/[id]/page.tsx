import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MessageCircle } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { updatePacaRequestStatusV15 } from "../actions-v15";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(value || 0);
}

const statuses = [
  ["NUEVA", "Nueva"],
  ["CONTACTADA", "Contactada"],
  ["CONFIRMADA", "Confirmada"],
  ["EN_ARMADO", "En armado"],
  ["ENVIADA", "Enviada"],
  ["CANCELADA", "Cancelada"],
];

export default async function PacaRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("paca_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (!request) notFound();

  const [{ data: items }, { data: refs }] = await Promise.all([
    supabase
      .from("paca_request_items")
      .select("*")
      .eq("request_id", id)
      .order("created_at"),

    supabase
      .from("paca_request_references")
      .select("*")
      .eq("request_id", id)
      .is("deleted_at", null)
      .order("created_at"),
  ]);

  return (
    <div className="space-y-5">
      <section className="rounded-[30px] border border-[#eaded3] bg-white p-5 shadow-sm sm:p-6">
        <Link
          href="/admin/pacas/solicitudes"
          className="inline-flex items-center gap-2 text-xs font-black text-[#7f746c]"
        >
          <ArrowLeft size={14} />
          Volver
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#5a8b86]">
              Solicitud de Pacas
            </p>
            <h1 className="mt-1 text-3xl font-black">
              {request.code}
            </h1>
            <p className="mt-2 text-sm font-black">
              {request.client_name}
            </p>
            <p className="mt-1 text-xs text-[#7f746c]">
              {request.client_phone}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <form action={updatePacaRequestStatusV15}>
              <input type="hidden" name="id" value={request.id} />
              <select
                name="status"
                defaultValue={request.status}
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
                className="h-11 rounded-full border border-[#eaded3] bg-white px-4 text-xs font-black outline-none"
              >
                {statuses.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </form>

            <a
              href={`https://wa.me/${String(request.client_phone).replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#25D366] px-4 text-xs font-black !text-white"
            >
              <MessageCircle size={15} />
              WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Pacas" value={String((items ?? []).length)} />
          <Metric label="Prendas" value={String(request.total_pieces)} />
          <Metric
            label="Total referencial"
            value={money(Number(request.total_reference_price ?? 0))}
          />
          <Metric
            label="Fecha"
            value={new Date(request.created_at).toLocaleDateString("es-PE")}
          />
        </div>
      </section>

      <section className="space-y-3">
        {(items ?? []).map((item: any, index: number) => {
          const itemRefs = (refs ?? []).filter(
            (ref: any) => ref.item_id === item.id,
          );

          return (
            <article
              key={item.id}
              className="rounded-[24px] border border-[#eaded3] bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase text-[#5a8b86]">
                    Paca {index + 1}
                  </p>
                  <h2 className="mt-1 text-xl font-black">
                    {item.category_name}
                  </h2>
                  <p className="mt-1 text-xs text-[#7f746c]">
                    {item.quantity} prendas · {item.size_range} · {item.preference}
                  </p>
                </div>

                <p className="text-lg font-black text-[#9b382b]">
                  {money(Number(item.price_pen ?? 0))}
                </p>
              </div>

              {item.note && (
                <div className="mt-4 rounded-[15px] bg-[#f8f4f0] p-3">
                  <p className="text-[8px] font-black uppercase text-[#8b8078]">
                    Observación
                  </p>
                  <p className="mt-1 text-xs leading-5">
                    {item.note}
                  </p>
                </div>
              )}

              {itemRefs.length > 0 && (
                <div className="mt-4">
                  <p className="text-[9px] font-black uppercase tracking-[.08em] text-[#8b8078]">
                    Modelos referenciales
                  </p>

                  <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {itemRefs.map((ref: any, refIndex: number) => (
                      <a
                        key={ref.id}
                        href={ref.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative aspect-square overflow-hidden rounded-[14px] bg-[#f1e9e1]"
                      >
                        <img
                          src={ref.url}
                          alt={`Referencia ${refIndex + 1}`}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/55 !text-white">
                          <ExternalLink size={11} />
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[16px] bg-[#f8f4f0] p-3">
      <p className="text-[8px] font-black uppercase text-[#8b8078]">
        {label}
      </p>
      <p className="mt-1 text-sm font-black">
        {value}
      </p>
    </div>
  );
}
