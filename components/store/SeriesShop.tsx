"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

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
const CART_KEY = "tendencias-series-cart";

export function SeriesShop({
  items,
  whatsappNumber,
}: {
  items: SeriesItem[];
  whatsappNumber: string;
}) {
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, { qty: number }>;
        const rebuilt: Record<string, CartLine> = {};
        for (const item of items) {
          const qty = Math.min(Number(saved[item.id]?.qty ?? 0), Number(item.series_available ?? 0));
          if (qty > 0) rebuilt[item.id] = { ...item, qty };
        }
        setCart(rebuilt);
      }
    } catch {
      // carrito vacío
    } finally {
      setHydrated(true);
    }
  }, [items]);

  useEffect(() => {
    if (!hydrated) return;
    const compact = Object.fromEntries(
      Object.entries(cart).map(([id, line]) => [id, { qty: line.qty }])
    );
    localStorage.setItem(CART_KEY, JSON.stringify(compact));
  }, [cart, hydrated]);

  const lines = Object.values(cart);
  const total = useMemo(
    () => lines.reduce((sum, line) => sum + Number(line.price) * line.qty, 0),
    [lines]
  );

  function change(item: SeriesItem, delta: number) {
    setCart((old) => {
      const current = old[item.id]?.qty ?? 0;
      const next = Math.max(0, Math.min(Number(item.series_available ?? 0), current + delta));
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
        return `${index + 1}. *${line.code} - ${line.name}*\nTipo: ${line.status === "stock" ? "Entrega inmediata" : "Preventa"}\nCantidad: ${line.qty} ${line.qty === 1 ? "serie" : "series"}\nTallas: ${sizes || "Consultar"}\nPrecio: S/ ${Number(line.price).toFixed(2)} c/u\nSubtotal: S/ ${(Number(line.price) * line.qty).toFixed(2)}`;
      })
      .join("\n\n");

    const message = `Hola Tendencias Import 💛\nArmé este carrito desde su página:\n\n${detail}\n\n*Total referencial: S/ ${total.toFixed(2)}*\n\nQuiero confirmar disponibilidad y coordinar mi pedido por WhatsApp.`;
    const number = whatsappNumber.replace(/\D/g, "");
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => {
          const qty = cart[item.id]?.qty ?? 0;
          return (
            <article key={item.id} className="overflow-hidden rounded-[22px] border border-[#eaded3] bg-white shadow-[0_8px_24px_rgba(100,70,40,.05)]">
              <div className="relative aspect-[4/5] overflow-hidden bg-[#efe5dc]">
                {item.cover_url ? (
                  <img src={item.cover_url} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center">
                    <ShoppingBag size={26} className="text-[#5a8b86]" />
                  </div>
                )}

                <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[8px] font-black tracking-[.1em] text-[#5a8b86]">
                  {item.code}
                </span>

                <span className={`absolute right-2 top-2 rounded-full px-2 py-1 text-[8px] font-black ${item.status === "stock" ? "bg-[#edf8f5] text-[#42746e]" : "bg-[#fff8e9] text-[#9b6510]"}`}>
                  {item.series_available} disp.
                </span>
              </div>

              <div className="p-3 sm:p-4">
                <h2 className="line-clamp-2 text-[14px] font-black leading-5 sm:text-[16px]">{item.name}</h2>
                <p className="mt-1.5 text-[16px] font-black text-[#b63a2c]">S/ {Number(item.price).toFixed(2)}</p>
                <p className="mt-1 truncate text-[9px] font-bold text-[#8b8078]">{(item.sizes ?? []).join(" · ")}</p>
                <p className={`mt-2 text-[8px] font-black uppercase tracking-[.1em] ${item.status === "stock" ? "text-[#5a8b86]" : "text-[#d39218]"}`}>
                  {item.status === "stock" ? "Entrega inmediata" : "Preventa"}
                </p>

                {qty === 0 ? (
                  <button onClick={() => change(item, 1)} className="mt-3 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-[14px] bg-[#fff0e9] text-[10px] font-black text-[#9b382b]">
                    <ShoppingBag size={13} /> Agregar
                  </button>
                ) : (
                  <div className="mt-3 flex items-center justify-between rounded-[14px] border border-[#eaded3] bg-[#fffaf6] p-1">
                    <button onClick={() => change(item, -1)} className="grid size-8 place-items-center"><Minus size={13} /></button>
                    <span className="text-sm font-black">{qty}</span>
                    <button onClick={() => change(item, 1)} disabled={qty >= item.series_available} className="grid size-8 place-items-center disabled:opacity-30"><Plus size={13} /></button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {lines.length > 0 && (
        <button onClick={() => setOpen(true)} className="fixed bottom-5 left-1/2 z-40 flex min-h-12 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[#b63a2c] px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(182,58,44,.28)]">
          <ShoppingBag size={17} /> Mi carrito · {lines.reduce((sum, item) => sum + item.qty, 0)}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/35 sm:place-items-center sm:p-4">
          <div className="w-full max-w-xl rounded-t-[28px] bg-[#fffaf6] p-5 shadow-2xl sm:rounded-[28px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.16em] text-[#5a8b86]">Tu carrito</p>
                <h3 className="mt-1 text-2xl font-black">¿Cómo deseas comprar?</h3>
              </div>
              <button onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-full bg-white"><X size={18} /></button>
            </div>

            <div className="mt-5 max-h-[38vh] space-y-2 overflow-auto">
              {lines.map((line) => (
                <div key={line.id} className="rounded-[18px] border border-[#eaded3] bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black text-[#5a8b86]">{line.code}</p>
                      <p className="mt-1 text-sm font-black">{line.name}</p>
                      <p className="mt-1 text-[9px] font-bold text-[#8b8078]">{line.status === "stock" ? "Entrega inmediata" : "Preventa"}</p>
                    </div>
                    <button onClick={() => remove(line.id)} className="grid size-9 place-items-center rounded-full bg-[#fff0eb] text-[#b63a2c]"><Trash2 size={14} /></button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-[#eaded3] p-1">
                      <button onClick={() => change(line, -1)} className="grid size-8 place-items-center"><Minus size={13} /></button>
                      <span className="min-w-8 text-center font-black">{line.qty}</span>
                      <button onClick={() => change(line, 1)} disabled={line.qty >= line.series_available} className="grid size-8 place-items-center disabled:opacity-30"><Plus size={13} /></button>
                    </div>
                    <b className="text-[#b63a2c]">S/ {(Number(line.price) * line.qty).toFixed(2)}</b>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[18px] bg-white p-4">
              <div className="flex justify-between">
                <span className="text-sm font-bold text-[#7f746c]">Total referencial</span>
                <b className="text-xl">S/ {total.toFixed(2)}</b>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link href="/checkout" className="flex min-h-12 items-center justify-center gap-2 rounded-[17px] bg-[#b63a2c] px-4 text-center text-sm font-black text-white">
                <ShoppingBag size={17} /> Comprar por la web
              </Link>
              <button onClick={sendToWhatsApp} className="flex min-h-12 items-center justify-center gap-2 rounded-[17px] border border-[#d9c8bb] bg-white px-4 text-sm font-black text-[#5a8b86]">
                <MessageCircle size={17} /> Solo WhatsApp
              </button>
            </div>

            <p className="mt-3 text-center text-[10px] leading-5 text-[#8b8078]">
              Compra web: registras tus datos y generas un pedido. WhatsApp: solo enviamos tu carrito para coordinar.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
