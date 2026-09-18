"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteCustomerOrderV4 } from "@/app/admin/pedidos/actions";

export function DeleteOrderButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm("¿Eliminar este pedido? Si reservó o descontó stock, el sistema lo devolverá automáticamente.")) return;
    if (!window.confirm("Confirma nuevamente. Esta acción elimina el pedido del ERP.")) return;

    setLoading(true);
    try {
      await deleteCustomerOrderV4(orderId);
    } catch (error) {
      setLoading(false);
      alert(error instanceof Error ? error.message : "No se pudo eliminar el pedido.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#fff0eb] px-4 text-xs font-black text-[#a33d31] disabled:opacity-50"
    >
      <Trash2 size={14} />
      {loading ? "Eliminando..." : "Eliminar pedido"}
    </button>
  );
}
