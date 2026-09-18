import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  markAllNotificationsReadV15,
  markNotificationReadV15,
} from "@/app/admin/pacas/solicitudes/actions-v15";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("admin_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const unread = (notifications ?? []).filter(
    (item: any) => !item.read_at,
  ).length;

  return (
    <div className="space-y-5">
      <section className="rounded-[30px] border border-[#eaded3] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#5a8b86]">
              Actividad
            </p>
            <h1 className="mt-1 text-3xl font-black">
              Notificaciones
            </h1>
            <p className="mt-2 text-xs text-[#7f746c]">
              {unread} pendiente{unread === 1 ? "" : "s"} de revisar.
            </p>
          </div>

          {unread > 0 && (
            <form action={markAllNotificationsReadV15}>
              <button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#5a8b86] px-4 text-xs font-black !text-white">
                <CheckCheck size={15} />
                Marcar todo leído
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="space-y-2">
        {(notifications ?? []).map((item: any) => (
          <article
            key={item.id}
            className={`rounded-[20px] border p-4 shadow-sm ${
              item.read_at
                ? "border-[#eaded3] bg-white"
                : "border-[#d8e9e6] bg-[#f4faf8]"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#5a8b86]">
                <Bell size={15} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black">
                      {item.title}
                    </p>
                    {item.body && (
                      <p className="mt-1 text-[10px] leading-5 text-[#7f746c]">
                        {item.body}
                      </p>
                    )}
                  </div>

                  <p className="text-[8px] text-[#8b8078]">
                    {new Date(item.created_at).toLocaleString("es-PE")}
                  </p>
                </div>

                <div className="mt-3 flex gap-2">
                  {item.href && (
                    <Link
                      href={item.href}
                      className="inline-flex min-h-9 items-center rounded-full bg-[#fff0e9] px-3 text-[9px] font-black text-[#9b382b]"
                    >
                      Abrir
                    </Link>
                  )}

                  {!item.read_at && (
                    <form action={markNotificationReadV15}>
                      <input type="hidden" name="id" value={item.id} />
                      <button className="min-h-9 rounded-full border border-[#eaded3] bg-white px-3 text-[9px] font-black text-[#6f655e]">
                        Marcar leído
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}

        {(notifications ?? []).length === 0 && (
          <div className="grid min-h-72 place-items-center rounded-[24px] border border-[#eaded3] bg-white">
            <div className="text-center">
              <Bell size={30} className="mx-auto text-[#bda99b]" />
              <p className="mt-3 font-black">
                No hay notificaciones todavía
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
