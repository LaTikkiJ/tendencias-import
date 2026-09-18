import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  PackageOpen,
  Plus,
  Ship,
  WalletCards,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function pen(value: unknown) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0) || 0);
}

function original(value: unknown, currency: string) {
  if (currency === "PEN") return pen(value);

  return `${currency} ${new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0) || 0)}`;
}

function statusName(status: string) {
  if (status === "PEDIDO") return "Pedido";
  if (status === "EN_TRANSITO") return "En tránsito";
  if (status === "RECIBIDO") return "Recibido";
  if (status === "CANCELADO") return "Cancelado";
  return status;
}

function statusClass(status: string) {
  if (status === "RECIBIDO") return "bg-[#edf7f5] text-[#42746e]";
  if (status === "EN_TRANSITO") return "bg-[#fff8e9] text-[#9b6510]";
  if (status === "CANCELADO") return "bg-[#fff0eb] text-[#a33d31]";
  return "bg-[#f7f2ec] text-[#6f655e]";
}

export default async function ChinaPurchasesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("series_china_purchases")
    .select(`
      id,
      code,
      purchase_date,
      supplier,
      currency,
      supplier_total_original,
      supplier_total_pen,
      garments_paid_original,
      payments_total_pen,
      distributable_costs_pen,
      total_paid,
      total_series,
      total_pieces,
      effective_exchange_rate,
      status,
      created_at
    `)
    .order("created_at", { ascending: false });

  const purchases = data ?? [];

  const active = purchases.filter((item) => item.status !== "CANCELADO");
  const totalInvestment = active.reduce(
    (sum, item) => sum + Number(item.total_paid ?? 0),
    0,
  );
  const inTransit = active.filter((item) => item.status === "EN_TRANSITO").length;
  const totalPieces = active.reduce(
    (sum, item) => sum + Number(item.total_pieces ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-[#eaded3] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#5a8b86]">
              Series · Compras China
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">
              Cargas de China
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-[#7f746c] sm:text-sm sm:leading-6">
              Lleva el mismo control que en MAKEK: pagos por etapas, tipo de cambio por pago,
              gastos reales y costo final por modelo.
            </p>
          </div>

          <Link
            href="/admin/series/compras/nueva"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[17px] bg-[#b63a2c] px-5 text-sm font-black text-white"
          >
            <Plus size={17} />
            Nueva carga
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <TopCard icon={<PackageOpen size={16} />} label="Compras" value={String(active.length)} />
          <TopCard icon={<Ship size={16} />} label="En tránsito" value={String(inTransit)} />
          <TopCard icon={<WalletCards size={16} />} label="Inversión" value={pen(totalInvestment)} />
          <TopCard icon={<PackageOpen size={16} />} label="Prendas" value={String(totalPieces)} />
        </div>
      </section>

      {purchases.length === 0 ? (
        <section className="rounded-[28px] border border-dashed border-[#d9c8bb] bg-white p-10 text-center">
          <PackageOpen size={30} className="mx-auto text-[#5a8b86]" />
          <p className="mt-4 font-black">Todavía no hay cargas registradas</p>
          <p className="mt-1 text-xs text-[#7f746c]">
            Registra la primera compra para empezar el inventario de Series.
          </p>
          <Link
            href="/admin/series/compras/nueva"
            className="mt-5 inline-flex rounded-full bg-[#b63a2c] px-5 py-3 text-xs font-black text-white"
          >
            Crear primera carga
          </Link>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {purchases.map((purchase) => {
            const supplierTotal = Number(purchase.supplier_total_original ?? 0);
            const paidGarments = Number(purchase.garments_paid_original ?? 0);
            const balance = Math.max(supplierTotal - paidGarments, 0);

            return (
              <Link
                key={purchase.id}
                href={`/admin/series/compras/${purchase.id}`}
                className="group rounded-[26px] border border-[#eaded3] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[.13em] text-[#5a8b86]">
                      {purchase.code}
                    </p>
                    <h2 className="mt-1 text-lg font-black">
                      {purchase.supplier || "Proveedor China"}
                    </h2>
                    <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#7f746c]">
                      <CalendarDays size={11} />
                      {purchase.purchase_date}
                    </p>
                  </div>

                  <span className={`rounded-full px-3 py-1.5 text-[9px] font-black ${statusClass(purchase.status)}`}>
                    {statusName(purchase.status)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Metric label="Series" value={String(purchase.total_series ?? 0)} />
                  <Metric label="Prendas" value={String(purchase.total_pieces ?? 0)} />
                  <Metric
                    label="Mercadería"
                    value={original(purchase.supplier_total_original, purchase.currency)}
                    detail={pen(purchase.supplier_total_pen)}
                  />
                  <Metric
                    label="Gastos"
                    value={pen(purchase.distributable_costs_pen)}
                    detail={`TC ${Number(purchase.effective_exchange_rate ?? 1).toFixed(4)}`}
                  />
                </div>

                <div className="mt-3 rounded-[16px] bg-[#fff7f1] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[8px] font-black uppercase text-[#8f3a2e]">Saldo prendas</p>
                      <p className="mt-1 text-xs font-black text-[#8f3a2e]">
                        {original(balance, purchase.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black uppercase text-[#7f746c]">Costo total</p>
                      <p className="mt-1 text-xs font-black">{pen(purchase.total_paid)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-1 text-[10px] font-black text-[#8f3a2e]">
                  Abrir compra
                  <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TopCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] bg-[#f8f4f0] p-3 sm:p-4">
      <div className="flex items-center gap-2 text-[#5a8b86]">
        {icon}
        <p className="text-[8px] font-black uppercase tracking-[.08em]">{label}</p>
      </div>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-[14px] bg-[#f8f4f0] p-3">
      <p className="text-[7px] font-black uppercase text-[#8b8078]">{label}</p>
      <p className="mt-1 text-xs font-black">{value}</p>
      {detail && <p className="mt-1 text-[8px] text-[#7f746c]">{detail}</p>}
    </div>
  );
}
