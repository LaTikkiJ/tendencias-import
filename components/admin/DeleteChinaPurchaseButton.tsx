"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

import {
  deleteChinaPurchaseV11,
  type DeleteChinaPurchaseState,
} from "@/app/admin/series/compras/actions-v10";

const initialState: DeleteChinaPurchaseState = {};

export default function DeleteChinaPurchaseButton({
  purchaseId,
  purchaseCode,
}: {
  purchaseId: string;
  purchaseCode: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [state, formAction, pending] = useActionState(
    deleteChinaPurchaseV11,
    initialState,
  );

  const canDelete = confirmation.trim().toUpperCase() === "ELIMINAR";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setConfirmation("");
          setOpen(true);
        }}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#fff0eb] px-4 text-xs font-black text-[#b63a2c]"
      >
        <Trash2 size={14} />
        Eliminar compra
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-lg rounded-t-[28px] bg-[#fffaf6] p-5 shadow-2xl sm:rounded-[28px] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#fff0eb] text-[#b63a2c]">
                  <AlertTriangle size={18} />
                </span>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.12em] text-[#b63a2c]">
                    Eliminar compra
                  </p>
                  <h2 className="mt-1 text-xl font-black">
                    ¿Eliminar {purchaseCode}?
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[#6f655e]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 rounded-[18px] border border-[#f0d2c8] bg-white p-4">
              <p className="text-[10px] font-black text-[#2c2825]">
                Esta acción elimina la prueba completa:
              </p>

              <ul className="mt-2 space-y-1.5 text-[10px] leading-5 text-[#7f746c]">
                <li>• pagos de esta compra</li>
                <li>• gastos adicionales</li>
                <li>• códigos/items y colores de esta carga</li>
                <li>• lotes de inventario generados por esta compra</li>
              </ul>

              <p className="mt-3 text-[9px] font-bold leading-4 text-[#9b382b]">
                Si ya hubo una reserva, una venta o un movimiento real,
                el sistema bloqueará el borrado para no romper el historial.
              </p>
            </div>

            <form action={formAction} className="mt-5 space-y-4">
              <input type="hidden" name="purchase_id" value={purchaseId} />

              <label className="flex items-start gap-3 rounded-[16px] bg-[#f8f4f0] p-3">
                <input
                  type="checkbox"
                  name="delete_created_products"
                  defaultChecked
                  className="mt-0.5 size-4 accent-[#b63a2c]"
                />
                <span>
                  <span className="block text-[10px] font-black">
                    Eliminar también los códigos creados por esta compra
                  </span>
                  <span className="mt-1 block text-[9px] leading-4 text-[#7f746c]">
                    Solo se eliminan códigos que el sistema marcó como creados
                    específicamente en esta carga y que no tengan pedidos ni otros movimientos.
                  </span>
                </span>
              </label>

              <div>
                <label className="mb-2 block text-[9px] font-black uppercase tracking-[.08em] text-[#8b8078]">
                  Escribe ELIMINAR para confirmar
                </label>

                <input
                  name="confirmation"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="off"
                  placeholder="ELIMINAR"
                  className="ti-input uppercase"
                />
              </div>

              {state?.error && (
                <div className="rounded-[14px] bg-[#fff0eb] px-3 py-2.5 text-[10px] font-black leading-4 text-[#b63a2c]">
                  {state.error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="min-h-12 rounded-[16px] border border-[#eaded3] bg-white px-4 text-xs font-black text-[#6f655e]"
                >
                  No, conservar
                </button>

                <button
                  type="submit"
                  disabled={!canDelete || pending}
                  className="min-h-12 rounded-[16px] bg-[#b63a2c] px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {pending ? "Eliminando..." : "Sí, eliminar compra"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
