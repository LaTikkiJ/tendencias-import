"use client";

import { useMemo, useState } from "react";
import {
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";

type SeriesItem = {
  id: string;
  code: string;
  name: string;
  slug: string;
  price: number;
  cover_url: string | null;
  series_available: number;
  status: "stock" | "preorder";
  sizes: string[];
};

type CartLine = SeriesItem & {
  qty: number;
};

export function SeriesShop({
  items,
  whatsappNumber,
}: {
  items: SeriesItem[];
  whatsappNumber: string;
}) {
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [open, setOpen] = useState(false);

  const lines = Object.values(cart);

  const total = useMemo(
    () =>
      lines.reduce(
        (sum, line) => sum + Number(line.price) * line.qty,
        0
      ),
    [lines]
  );

  function change(item: SeriesItem, delta: number) {
    setCart((old) => {
      const current = old[item.id]?.qty ?? 0;

      const next = Math.max(
        0,
        Math.min(item.series_available, current + delta)
      );

      const copy = { ...old };

      if (next === 0) {
        delete copy[item.id];
      } else {
        copy[item.id] = {
          ...item,
          qty: next,
        };
      }

      return copy;
    });
  }

  function remove(id: string) {
    setCart((old) => {
      const copy = { ...old };
      delete copy[id];
      return copy;
    });
  }

  function sendToWhatsApp() {
    if (!lines.length) {
      return;
    }

    const detail = lines
      .map((line, index) => {
        const sizes = (line.sizes ?? []).join(", ");

        return `${index + 1}. *${line.code} - ${line.name}*
Cantidad: ${line.qty} ${line.qty === 1 ? "serie" : "series"}
Tallas: ${sizes || "Consultar"}
Precio: S/ ${Number(line.price).toFixed(2)} c/u
Subtotal: S/ ${(Number(line.price) * line.qty).toFixed(2)}`;
      })
      .join("\n\n");

    const message = `Hola Tendencias Import 💛
Vengo de su página web y armé este carrito de *Series Kids*:

${detail}

*Total referencial: S/ ${total.toFixed(2)}*

¿Me confirman disponibilidad y cómo continúo con mi pedido?`;

    const number = whatsappNumber.replace(/\D/g, "");

    window.open(
      `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => {
          const qty = cart[item.id]?.qty ?? 0;

          return (
            <article
              key={item.id}
              className="overflow-hidden rounded-[22px] border border-[#eaded3] bg-white shadow-[0_8px_24px_rgba(100,70,40,.05)]"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#efe5dc]">
                {item.cover_url ? (
                  <img
                    src={item.cover_url}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center">
                    <ShoppingBag size={26} className="text-[#5a8b86]" />
                  </div>
                )}

                <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[8px] font-black tracking-[.1em] text-[#5a8b86]">
                  {item.code}
                </span>

                <span className="absolute right-2 top-2 rounded-full bg-[#edf8f5] px-2 py-1 text-[8px] font-black text-[#42746e]">
                  {item.series_available} disp.
                </span>
              </div>

              <div className="p-3 sm:p-4">
                <h2 className="line-clamp-2 text-[14px] font-black leading-5 sm:text-[16px]">
                  {item.name}
                </h2>

                <p className="mt-1.5 text-[16px] font-black text-[#b63a2c]">
                  S/ {Number(item.price).toFixed(2)}
                </p>

                <p className="mt-1 truncate text-[9px] font-bold text-[#8b8078]">
                  {(item.sizes ?? []).join(" · ")}
                </p>

                <p className="mt-2 text-[8px] font-black uppercase tracking-[.1em] text-[#5a8b86]">
                  {item.status === "preorder"
                    ? "Preventa"
                    : "Entrega inmediata"}
                </p>

                {qty === 0 ? (
                  <button
                    onClick={() => change(item, 1)}
                    className="mt-3 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-[14px] bg-[#fff0e9] text-[10px] font-black text-[#9b382b] transition hover:bg-[#b63a2c] hover:text-white"
                  >
                    <ShoppingBag size={13} />
                    Agregar
                  </button>
                ) : (
                  <div className="mt-3 flex items-center justify-between rounded-[14px] border border-[#eaded3] bg-[#fffaf6] p-1">
                    <button
                      onClick={() => change(item, -1)}
                      className="grid size-8 place-items-center"
                      aria-label="Quitar una serie"
                    >
                      <Minus size={13} />
                    </button>

                    <span className="text-sm font-black">
                      {qty}
                    </span>

                    <button
                      onClick={() => change(item, 1)}
                      disabled={qty >= item.series_available}
                      className="grid size-8 place-items-center disabled:opacity-30"
                      aria-label="Agregar una serie"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {lines.length > 0 && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 left-1/2 z-40 flex min-h-12 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[#b63a2c] px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(182,58,44,.28)]"
        >
          <ShoppingBag size={17} />
          Mi carrito · {lines.reduce((sum, item) => sum + item.qty, 0)}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/35 sm:place-items-center sm:p-4">
          <div className="w-full max-w-xl rounded-t-[28px] bg-[#fffaf6] p-5 shadow-2xl sm:rounded-[28px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.16em] text-[#5a8b86]">
                  Tu carrito
                </p>

                <h3 className="mt-1 text-2xl font-black">
                  Series seleccionadas
                </h3>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="grid size-10 place-items-center rounded-full bg-white"
                aria-label="Cerrar carrito"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 max-h-[45vh] space-y-2 overflow-auto">
              {lines.map((line) => (
                <div
                  key={line.id}
                  className="rounded-[18px] border border-[#eaded3] bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black text-[#5a8b86]">
                        {line.code}
                      </p>

                      <p className="mt-1 text-sm font-black">
                        {line.name}
                      </p>

                      <p className="mt-1 text-[10px] font-bold text-[#8b8078]">
                        {(line.sizes ?? []).join(" · ")}
                      </p>
                    </div>

                    <button
                      onClick={() => remove(line.id)}
                      className="grid size-9 place-items-center rounded-full bg-[#fff0eb] text-[#b63a2c]"
                      aria-label="Eliminar del carrito"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-[#eaded3] p-1">
                      <button
                        onClick={() => change(line, -1)}
                        className="grid size-8 place-items-center"
                        aria-label="Quitar una serie"
                      >
                        <Minus size={13} />
                      </button>

                      <span className="min-w-8 text-center font-black">
                        {line.qty}
                      </span>

                      <button
                        onClick={() => change(line, 1)}
                        disabled={line.qty >= line.series_available}
                        className="grid size-8 place-items-center disabled:opacity-30"
                        aria-label="Agregar una serie"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <b className="text-[#b63a2c]">
                      S/ {(Number(line.price) * line.qty).toFixed(2)}
                    </b>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[18px] bg-white p-4">
              <div className="flex justify-between">
                <span className="text-sm font-bold text-[#7f746c]">
                  Total referencial
                </span>

                <b className="text-xl">
                  S/ {total.toFixed(2)}
                </b>
              </div>

              <p className="mt-2 text-[11px] leading-5 text-[#7f746c]">
                El carrito no reserva stock. Tendencias Import confirmará la
                disponibilidad final por WhatsApp.
              </p>
            </div>

            <button
              onClick={sendToWhatsApp}
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-[17px] bg-[#b63a2c] text-sm font-black text-white"
            >
              <MessageCircle size={18} />
              Enviar carrito por WhatsApp
            </button>
          </div>
        </div>
      )}
    </>
  );
}
