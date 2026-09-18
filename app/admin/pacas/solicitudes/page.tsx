import Link from "next/link";
import { MessageCircle, PackageOpen, RefreshCw } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  cleanupOldPacaReferencesV15,
  updatePacaRequestStatusV15,
} from "./actions-v15";

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

export default async function PacaRequestsPage() {
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("paca_requests")
    .select(`
      id,
      code,
      client_name,
      client_phone,
      status,
      total_pieces,
      total_reference_price,
      created_at,
      paca_request_items ( id )
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-5">
      <section className="rounded-[30px] border border-[#eaded3] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#5a8b86]">
              Pacas a pedido
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-[-.04em]">
              Solicitudes de Pacas
            </h1>
            <p className="mt-2 text-xs leading-5 text-[#7f746c]">
              Todo pedido que la clienta envía desde la web queda registrado aquí antes de pasar a WhatsApp.
            </p>
          </div>

          <form action={cleanupOldPacaReferencesV15}>
            <button className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#eaded3] bg-white px-4 text-xs font-black text-[#6f655e]">
              <RefreshCw size={14} />
              Limpiar referencias +60 días
            </button>
          </form>
        </div>
      </section>

      <section className="overflow-hidden rounded-[26px] border border-[#eaded3] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full text-left">
            <thead className="bg-[#f8f4f0] text-[8px] font-black uppercase tracking-[.08em] text-[#7f746c]">
              <tr>
                <th className="px-4 py-3">Solicitud</th>
                <th className="px-4 py-3">Clienta</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3 text-center">Pacas</th>
                <th className="px-4 py-3 text-center">Prendas</th>
                <th className="px-4 py-3 text-right">Referencial</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {(requests ?? []).map((request: any) => (
                <tr
                  key={request.id}
                  className="border-t border-[#f0e7df]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/pacas/solicitudes/${request.id}`}
                      className="text-[10px] font-black text-[#9b382b]"
                    >
                      {request.code}
                    </Link>
                    <p className="mt-1 text-[8px] text-[#8b8078]">
                      {new Date(request.created_at).toLocaleString("es-PE")}
                    </p>
                  </td>

                  <td className="px-4 py-3 text-[10px] font-black">
                    {request.client_name}
                  </td>

                  <td className="px-4 py-3 text-[10px]">
                    {request.client_phone}
                  </td>

                  <td className="px-4 py-3 text-center text-[10px] font-black">
                    {request.paca_request_items?.length ?? 0}
                  </td>

                  <td className="px-4 py-3 text-center text-[10px] font-black">
                    {request.total_pieces}
                  </td>

                  <td className="px-4 py-3 text-right text-[10px] font-black">
                    {money(Number(request.total_reference_price ?? 0))}
                  </td>

                  <td className="px-4 py-3">
                    <form action={updatePacaRequestStatusV15}>
                      <input type="hidden" name="id" value={request.id} />
                      <select
                        name="status"
                        defaultValue={request.status}
                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                        className="h-10 rounded-[12px] border border-[#eaded3] bg-white px-3 text-[9px] font-black outline-none"
                      >
                        {statuses.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </form>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/pacas/solicitudes/${request.id}`}
                        className="inline-flex min-h-9 items-center rounded-full bg-[#fff0e9] px-3 text-[9px] font-black text-[#9b382b]"
                      >
                        Ver
                      </Link>

                      <a
                        href={`https://wa.me/${String(request.client_phone).replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="grid size-9 place-items-center rounded-full bg-[#25D366] !text-white"
                        title="WhatsApp"
                      >
                        <MessageCircle size={14} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(requests ?? []).length === 0 && (
          <div className="grid min-h-72 place-items-center text-center">
            <div>
              <PackageOpen size={30} className="mx-auto text-[#bda99b]" />
              <p className="mt-3 font-black">
                Todavía no hay solicitudes de Pacas
              </p>
              <p className="mt-1 text-xs text-[#8b8078]">
                Las nuevas solicitudes web aparecerán aquí.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
