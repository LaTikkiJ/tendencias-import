"use client";

import { useState } from "react";
import { LockKeyhole, Pencil, RotateCcw, X } from "lucide-react";
import {
  setChinaPurchaseCostStatusV12,
  updateChinaPurchaseHeaderV12,
} from "@/app/admin/series/compras/actions-v10";

export default function PurchaseCostControls({
  purchase,
}: {
  purchase: {
    id: string;
    purchase_date: string;
    supplier: string | null;
    notes: string | null;
    cost_status: "OPEN" | "CLOSED" | string;
  };
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);

  const closed = purchase.cost_status === "CLOSED";

  return (
    <>
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#eaded3] bg-white px-4 text-xs font-black text-[#6f655e]"
      >
        <Pencil size={14} />
        Editar compra
      </button>

      {closed ? (
        <button
          type="button"
          onClick={() => setReopenOpen(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#d39218] px-4 text-xs font-black !text-white"
        >
          <RotateCcw size={14} />
          Reabrir costos
        </button>
      ) : (
        <form action={setChinaPurchaseCostStatusV12}>
          <input type="hidden" name="purchase_id" value={purchase.id} />
          <input type="hidden" name="cost_status" value="CLOSED" />
          <button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#5a8b86] px-4 text-xs font-black !text-white">
            <LockKeyhole size={14} />
            Cerrar costos
          </button>
        </form>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-xl rounded-t-[28px] bg-[#fffaf6] p-5 shadow-2xl sm:rounded-[28px]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.12em] text-[#5a8b86]">
                  Editar compra
                </p>
                <h2 className="mt-1 text-xl font-black">Datos generales</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="grid size-10 place-items-center rounded-full bg-white"
              >
                <X size={16} />
              </button>
            </div>

            <form action={updateChinaPurchaseHeaderV12} className="mt-5 space-y-4">
              <input type="hidden" name="purchase_id" value={purchase.id} />

              <label className="block">
                <span className="mb-2 block text-[9px] font-black uppercase text-[#7f746c]">
                  Fecha
                </span>
                <input
                  type="date"
                  name="purchase_date"
                  defaultValue={purchase.purchase_date}
                  className="ti-input"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[9px] font-black uppercase text-[#7f746c]">
                  Proveedor
                </span>
                <input
                  name="supplier"
                  defaultValue={purchase.supplier ?? ""}
                  className="ti-input"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[9px] font-black uppercase text-[#7f746c]">
                  Observaciones
                </span>
                <textarea
                  name="notes"
                  defaultValue={purchase.notes ?? ""}
                  className="ti-input min-h-24 py-3"
                />
              </label>

              <button className="min-h-12 w-full rounded-[16px] bg-[#b63a2c] px-4 text-sm font-black !text-white">
                Guardar cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {reopenOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-lg rounded-t-[28px] bg-[#fffaf6] p-5 shadow-2xl sm:rounded-[28px]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.12em] text-[#d39218]">
                  Reajustar costos
                </p>
                <h2 className="mt-1 text-xl font-black">Reabrir esta compra</h2>
              </div>
              <button
                type="button"
                onClick={() => setReopenOpen(false)}
                className="grid size-10 place-items-center rounded-full bg-white"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-3 text-xs leading-5 text-[#7f746c]">
              Úsalo si apareció un nuevo transporte, almacenaje, etiqueta, comisión
              u otro gasto. Luego agregas el gasto y el sistema vuelve a prorratear
              el costo de todas las prendas.
            </p>

            <form action={setChinaPurchaseCostStatusV12} className="mt-5 space-y-4">
              <input type="hidden" name="purchase_id" value={purchase.id} />
              <input type="hidden" name="cost_status" value="OPEN" />

              <textarea
                name="note"
                placeholder="Motivo del reajuste (opcional)"
                className="ti-input min-h-20 py-3"
              />

              <button className="min-h-12 w-full rounded-[16px] bg-[#d39218] px-4 text-sm font-black !text-white">
                Reabrir costos
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
