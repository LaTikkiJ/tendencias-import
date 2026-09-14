"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X, MessageCircle } from "lucide-react";

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

type CartLine = SeriesItem & { qty: number };

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
    () => lines.reduce((sum, line) => sum + Number(line.price) * line.qty, 0),
    [lines]
  );

  function change(item: SeriesItem, delta: number) {
    setCart((old) => {
      const current = old[item.id]?.qty ?? 0;
      const next = Math.max(0, Math.min(item.series_available, current + delta));
      const copy = { ...old };

      if (next === 0) delete copy[item.id];
      else copy[item.id] = { ...item, qty: next };

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
    if (!lines.length) return;

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

    const cleanNumber = whatsappNumber.replace(/\D/g, "");
    window.open(
      `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {items.map((item) => {
          const qty = cart[item.id]?.qty ?? 0;

          return (
            <article key={item.id} className="ti-card overflow-hidden">
              <div
                className="aspect-[4/5] bg-[#efe5dc] bg-cover bg-center"
                style={
                  item.cover_url
                    ? { backgroundImage: `url(${item.cover_url})` }
                    : {}
                }
              />

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-black tracking-[.16em] text-[#5a8b86]">
                      {item.code}
                    </p>
                    <h2 className="mt-1 font-black">{item.name}</h2>
                  </div>

                  <span className="rounded-full bg-[#eef7f5] px-2 py-1 text-[10px] font-black text-[#42746e]">
                    {item.series_available} disp.
                  </span>
                </div>

                <p className="mt-3 text-lg font-black text-[#b63a2c]">
                  S/ {Number(item.price).toFixed(2)}
                </p>

                <p className="mt-1 text-xs text-[#7f746c]">
                  {(item.sizes ?? []).join(" · ")}
                </p>

                <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-[#7f746c]">
                  {item.status === "preorder" ? "Preventa" : "Entrega inmediata"}
                </p>

                {qty === 0 ? (
                  <button
                    onClick={() => change(item, 1)}
                    className="ti-button ti-button-soft mt-4 w-full"
                  >
                    <ShoppingBag size={17} />
                    Agregar al carrito
                  </button>
                ) : (
                  <div className="mt-4 flex items-center justify-between rounded-full border border-[#eaded3] bg-white p-1">
                    <button
                      onClick={() => change(item, -1)}
                      className="grid size-9 place-items-center rounded-full"
                      aria-label="Quitar una serie"
                    >
                      <Minus size={16} />
                    </button>

                    <span className="font-black">{qty}</span>

                    <button
                      onClick={() => change(item, 1)}
                      disabled={qty >= item.series_available}
                      className="grid size-9 place-items-center rounded-full disabled:opacity-35"
                      aria-label="Agregar una serie"
                    >
                      <Plus size={16} />
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
          className="ti-button ti-button-primary fixed bottom-5 left-1/2 z-40 -translate-x-1/2 shadow-2xl"
        >
          <ShoppingBag size={18} />
          Mi carrito · {lines.reduce((sum, x) => sum + x.qty, 0)}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/35 p-0 sm:place-items-center sm:p-4">
          <div className="w-full max-w-xl rounded-t-[28px] bg-[#fffaf5] p-5 shadow-2xl sm:rounded-[28px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black tracking-[.15em] text-[#5a8b86]">
                  TU CARRITO
                </p>
                <h3 className="mt-1 text-2xl font-black">Series seleccionadas</h3>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="grid size-10 place-items-center rounded-full bg-white"
                aria-label="Cerrar carrito"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 max-h-[46vh] space-y-2 overflow-auto">
              {lines.map((line) => (
                <div
                  key={line.id}
                  className="rounded-[20px] border border-[#eaded3] bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black tracking-[.14em] text-[#5a8b86]">
                        {line.code}
                      </p>
                      <p className="mt-1 font-black">{line.name}</p>
                      <p className="mt-1 text-xs text-[#7f746c]">
                        {(line.sizes ?? []).join(" · ")}
                      </p>
                    </div>

                    <button
                      onClick={() => remove(line.id)}
                      className="grid size-9 place-items-center rounded-full bg-[#fff0eb] text-[#b63a2c]"
                      aria-label="Eliminar del carrito"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center rounded-full border border-[#eaded3] p-1">
                      <button
                        onClick={() => change(line, -1)}
                        className="grid size-8 place-items-center rounded-full"
                      >
                        <Minus size={15} />
                      </button>
                      <span className="min-w-9 text-center font-black">{line.qty}</span>
                      <button
                        onClick={() => change(line, 1)}
                        disabled={line.qty >= line.series_available}
                        className="grid size-8 place-items-center rounded-full disabled:opacity-35"
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    <b>
                      S/ {(Number(line.price) * line.qty).toFixed(2)}
                    </b>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[20px] bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#7f746c]">
                  Total referencial
                </span>
                <b className="text-xl">S/ {total.toFixed(2)}</b>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#7f746c]">
                El carrito no reserva stock. Sofía confirmará disponibilidad final por WhatsApp.
              </p>
            </div>

            <button
              onClick={sendToWhatsApp}
              className="ti-button ti-button-primary mt-4 w-full"
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
