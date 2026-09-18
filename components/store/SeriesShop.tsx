"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  MessageCircle,
  Minus,
  Palette,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

type SaleMode = "STOCK" | "PREORDER";
type MixMode = "AUTO" | "CUSTOM";

type MixChoice = {
  size: string;
  color: string;
  qty: number;
};

type SeriesItem = {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string;
  cover_url: string | null;
  sizes: string[];
  price_preorder: number;
  price_stock: number;
  preorder_series_available: number;
  stock_series_available: number;
};

type AvailabilityRow = {
  product_id: string;
  sale_mode: SaleMode;
  color: string;
  size: string;
  available: number;
};

export type StoredCartLine = {
  cart_key: string;
  product_id: string;
  code: string;
  name: string;
  slug: string;
  cover_url: string | null;
  sizes: string[];
  sale_mode: SaleMode;
  mix_mode: MixMode;
  qty_series: number;
  unit_price: number;
  requested_mix: MixChoice[];
};

const CART_KEY = "tendencias-series-cart-v7";

function money(value: number) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

function mixText(mix: MixChoice[]) {
  return mix
    .map((item) => `${item.size}: ${item.color}${item.qty > 1 ? ` x${item.qty}` : ""}`)
    .join(" · ");
}

export function SeriesShop({
  items,
  availability,
  whatsappNumber,
}: {
  items: SeriesItem[];
  availability: AvailabilityRow[];
  whatsappNumber: string;
}) {
  const [cart, setCart] = useState<StoredCartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [product, setProduct] = useState<SeriesItem | null>(null);
  const [saleMode, setSaleMode] = useState<SaleMode>("STOCK");
  const [mixMode, setMixMode] = useState<MixMode>("AUTO");
  const [qty, setQty] = useState(1);
  const [mixCounts, setMixCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setCart(parsed);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + line.unit_price * line.qty_series, 0),
    [cart]
  );

  function rowsFor(item: SeriesItem, mode: SaleMode, size?: string) {
    return availability.filter(
      (row) =>
        row.product_id === item.id &&
        row.sale_mode === mode &&
        (!size || row.size === size) &&
        Number(row.available) > 0
    );
  }

  function colorsForSize(item: SeriesItem, mode: SaleMode, size: string) {
    return rowsFor(item, mode, size).sort((a, b) => a.color.localeCompare(b.color));
  }

  function maxForMode(item: SeriesItem, mode: SaleMode) {
    return mode === "STOCK"
      ? item.stock_series_available
      : item.preorder_series_available;
  }

  function openProduct(item: SeriesItem) {
    const mode: SaleMode = item.stock_series_available > 0 ? "STOCK" : "PREORDER";
    setProduct(item);
    setSaleMode(mode);
    setMixMode("AUTO");
    setQty(1);
    setMixCounts({});
  }

  function mixKey(size: string, color: string) {
    return `${size}|||${color}`;
  }

  function selectedForSize(size: string) {
    if (!product) return 0;
    return colorsForSize(product, saleMode, size).reduce(
      (sum, row) => sum + Number(mixCounts[mixKey(size, row.color)] ?? 0),
      0
    );
  }

  function setMixQty(size: string, color: string, next: number, max: number) {
    setMixCounts((current) => ({
      ...current,
      [mixKey(size, color)]: Math.max(0, Math.min(next, max)),
    }));
  }

  function completeColors(item: SeriesItem) {
    const colors = Array.from(new Set(rowsFor(item, saleMode).map((row) => row.color)));
    return colors.filter((color) =>
      item.sizes.every((size) => {
        const row = availability.find(
          (entry) =>
            entry.product_id === item.id &&
            entry.sale_mode === saleMode &&
            entry.size === size &&
            entry.color === color
        );
        return Number(row?.available ?? 0) >= qty;
      })
    );
  }

  function applyCompleteColor(color: string) {
    if (!product) return;
    const next: Record<string, number> = {};
    for (const size of product.sizes) next[mixKey(size, color)] = qty;
    setMixCounts(next);
  }

  const requestedMix = useMemo<MixChoice[]>(() => {
    if (!product || mixMode !== "CUSTOM") return [];
    const result: MixChoice[] = [];

    for (const size of product.sizes) {
      for (const row of colorsForSize(product, saleMode, size)) {
        const selected = Number(mixCounts[mixKey(size, row.color)] ?? 0);
        if (selected > 0) result.push({ size, color: row.color, qty: selected });
      }
    }

    return result;
  }, [product, saleMode, mixMode, mixCounts, availability]);

  const customValid =
    !!product && product.sizes.every((size) => selectedForSize(size) === qty);

  function addToCart() {
    if (!product) return;
    if (mixMode === "CUSTOM" && !customValid) return;

    const unitPrice = saleMode === "STOCK" ? product.price_stock : product.price_preorder;

    setCart((current) => [
      ...current,
      {
        cart_key: crypto.randomUUID(),
        product_id: product.id,
        code: product.code,
        name: product.name,
        slug: product.slug,
        cover_url: product.cover_url,
        sizes: product.sizes,
        sale_mode: saleMode,
        mix_mode: mixMode,
        qty_series: qty,
        unit_price: unitPrice,
        requested_mix: mixMode === "CUSTOM" ? requestedMix : [],
      },
    ]);

    setProduct(null);
    setCartOpen(true);
  }

  function sendWhatsApp() {
    if (!cart.length) return;

    const detail = cart
      .map((line, index) => {
        const mix =
          line.mix_mode === "AUTO"
            ? "Surtido automático"
            : mixText(line.requested_mix);

        return `${index + 1}. *${line.code} - ${line.name}*\nTipo: ${
          line.sale_mode === "STOCK" ? "Entrega inmediata" : "Preventa"
        }\nCantidad: ${line.qty_series} serie(s)\nSurtido: ${mix}\nPrecio: ${money(
          line.unit_price
        )} c/u\nSubtotal: ${money(line.unit_price * line.qty_series)}`;
      })
      .join("\n\n");

    const message = `Hola Tendencias Import 💛\nArmé este carrito desde su página:\n\n${detail}\n\n*Total referencial: ${money(
      total
    )}*\n\nQuiero confirmar disponibilidad y coordinar mi pedido.`;

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
        {items.map((item) => (
          <article
            key={item.id}
            className="overflow-hidden rounded-[22px] border border-[#eaded3] bg-white shadow-[0_8px_24px_rgba(100,70,40,.05)]"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-[#efe5dc]">
              {item.cover_url ? (
                <img src={item.cover_url} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center">
                  <ShoppingBag size={26} className="text-[#5a8b86]" />
                </div>
              )}

              <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[8px] font-black text-[#5a8b86]">
                {item.code}
              </span>
            </div>

            <div className="p-3 sm:p-4">
              <h2 className="line-clamp-2 text-[14px] font-black leading-5 sm:text-[16px]">
                {item.name}
              </h2>

              <p className="mt-1 truncate text-[9px] font-bold text-[#8b8078]">
                {item.sizes.join(" · ")}
              </p>

              <div className="mt-3 space-y-1">
                {item.stock_series_available > 0 && (
                  <div className="flex items-center justify-between text-[10px]">
                    <b className="text-[#5a8b86]">Stock {item.stock_series_available}</b>
                    <b className="text-[#b63a2c]">{money(item.price_stock)}</b>
                  </div>
                )}

                {item.preorder_series_available > 0 && (
                  <div className="flex items-center justify-between text-[10px]">
                    <b className="text-[#d39218]">Preventa {item.preorder_series_available}</b>
                    <b className="text-[#9b6510]">{money(item.price_preorder)}</b>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => openProduct(item)}
                className="mt-3 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-[14px] bg-[#fff0e9] px-2 text-[10px] font-black text-[#9b382b]"
              >
                <Palette size={13} />
                Elegir serie
              </button>
            </div>
          </article>
        ))}
      </div>

      {cart.length > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-5 left-1/2 z-40 flex min-h-12 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[#b63a2c] px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(182,58,44,.28)]"
        >
          <ShoppingBag size={17} />
          Mi carrito · {cart.reduce((sum, line) => sum + line.qty_series, 0)}
        </button>
      )}

      {product && (
        <div className="fixed inset-0 z-[70] grid place-items-end bg-black/40 sm:place-items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[30px] bg-[#fffaf6] p-5 shadow-2xl sm:rounded-[30px] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.16em] text-[#5a8b86]">
                  {product.code}
                </p>
                <h3 className="mt-1 text-2xl font-black">{product.name}</h3>
              </div>

              <button
                type="button"
                onClick={() => setProduct(null)}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={product.stock_series_available <= 0}
                onClick={() => {
                  setSaleMode("STOCK");
                  setQty(1);
                  setMixCounts({});
                }}
                className={`rounded-[16px] border p-3 text-left disabled:opacity-30 ${
                  saleMode === "STOCK"
                    ? "border-[#5a8b86] bg-[#edf7f5]"
                    : "border-[#eaded3] bg-white"
                }`}
              >
                <p className="text-xs font-black text-[#42746e]">Entrega inmediata</p>
                <p className="mt-1 text-[9px] text-[#64847f]">
                  {product.stock_series_available} series
                </p>
                <p className="mt-1 text-sm font-black text-[#b63a2c]">
                  {money(product.price_stock)}
                </p>
              </button>

              <button
                type="button"
                disabled={product.preorder_series_available <= 0}
                onClick={() => {
                  setSaleMode("PREORDER");
                  setQty(1);
                  setMixCounts({});
                }}
                className={`rounded-[16px] border p-3 text-left disabled:opacity-30 ${
                  saleMode === "PREORDER"
                    ? "border-[#d39218] bg-[#fff8e9]"
                    : "border-[#eaded3] bg-white"
                }`}
              >
                <p className="text-xs font-black text-[#9b6510]">Preventa</p>
                <p className="mt-1 text-[9px] text-[#9b7b48]">
                  {product.preorder_series_available} series
                </p>
                <p className="mt-1 text-sm font-black text-[#9b6510]">
                  {money(product.price_preorder)}
                </p>
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-[18px] border border-[#eaded3] bg-white p-3">
              <div>
                <p className="text-xs font-black">Cantidad de series</p>
                <p className="mt-1 text-[9px] text-[#8b8078]">
                  Máximo {maxForMode(product, saleMode)}
                </p>
              </div>

              <div className="flex items-center rounded-full bg-[#f8f4f0] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setQty((value) => Math.max(1, value - 1));
                    setMixCounts({});
                  }}
                  className="grid size-9 place-items-center"
                >
                  <Minus size={14} />
                </button>
                <b className="min-w-9 text-center">{qty}</b>
                <button
                  type="button"
                  disabled={qty >= maxForMode(product, saleMode)}
                  onClick={() => {
                    setQty((value) => Math.min(maxForMode(product, saleMode), value + 1));
                    setMixCounts({});
                  }}
                  className="grid size-9 place-items-center disabled:opacity-30"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMixMode("AUTO");
                  setMixCounts({});
                }}
                className={`rounded-[18px] border p-4 text-left ${
                  mixMode === "AUTO"
                    ? "border-[#d39218] bg-[#fff8e9]"
                    : "border-[#eaded3] bg-white"
                }`}
              >
                <Sparkles size={17} className="text-[#d39218]" />
                <p className="mt-2 text-xs font-black">Surtido automático</p>
                <p className="mt-1 text-[9px] leading-4 text-[#7f746c]">
                  Combina colores disponibles y prioriza remanentes.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMixMode("CUSTOM");
                  setMixCounts({});
                }}
                className={`rounded-[18px] border p-4 text-left ${
                  mixMode === "CUSTOM"
                    ? "border-[#5a8b86] bg-[#edf7f5]"
                    : "border-[#eaded3] bg-white"
                }`}
              >
                <Palette size={17} className="text-[#5a8b86]" />
                <p className="mt-2 text-xs font-black">Elegir mi surtido</p>
                <p className="mt-1 text-[9px] leading-4 text-[#7f746c]">
                  Escoge el color de cada talla.
                </p>
              </button>
            </div>

            {mixMode === "CUSTOM" && (
              <div className="mt-5 space-y-3">
                {completeColors(product).length > 0 && (
                  <div className="rounded-[18px] bg-[#fff7f1] p-4">
                    <p className="text-[9px] font-black uppercase text-[#8f3a2e]">
                      Atajo: color completo
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {completeColors(product).map((color) => (
                        <button
                          type="button"
                          key={color}
                          onClick={() => applyCompleteColor(color)}
                          className="rounded-full bg-white px-3 py-2 text-[9px] font-black text-[#8f3a2e] shadow-sm"
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {product.sizes.map((size) => {
                  const selected = selectedForSize(size);

                  return (
                    <div
                      key={size}
                      className="rounded-[18px] border border-[#eaded3] bg-white p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-black">Talla {size}</p>
                          <p className="mt-1 text-[9px] text-[#8b8078]">
                            Selecciona {qty} prenda(s)
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-[9px] font-black ${
                            selected === qty
                              ? "bg-[#edf7f5] text-[#42746e]"
                              : "bg-[#fff0eb] text-[#a33d31]"
                          }`}
                        >
                          {selected}/{qty}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2">
                        {colorsForSize(product, saleMode, size).map((row) => {
                          const key = mixKey(size, row.color);
                          const current = Number(mixCounts[key] ?? 0);
                          const room = Math.max(qty - selected + current, 0);
                          const max = Math.min(Number(row.available), room);

                          return (
                            <div
                              key={key}
                              className="flex items-center justify-between gap-3 rounded-[14px] bg-[#f8f4f0] px-3 py-2"
                            >
                              <div>
                                <p className="text-xs font-black">{row.color}</p>
                                <p className="mt-0.5 text-[8px] text-[#8b8078]">
                                  {row.available} disponible(s)
                                </p>
                              </div>

                              <div className="flex items-center rounded-full bg-white p-1">
                                <button
                                  type="button"
                                  onClick={() => setMixQty(size, row.color, current - 1, Number(row.available))}
                                  className="grid size-8 place-items-center"
                                >
                                  <Minus size={12} />
                                </button>
                                <b className="min-w-7 text-center text-xs">{current}</b>
                                <button
                                  type="button"
                                  disabled={current >= max || selected >= qty}
                                  onClick={() => setMixQty(size, row.color, current + 1, Number(row.available))}
                                  className="grid size-8 place-items-center disabled:opacity-25"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              disabled={mixMode === "CUSTOM" && !customValid}
              onClick={addToCart}
              className="mt-5 flex min-h-13 w-full items-center justify-center gap-2 rounded-[18px] bg-[#b63a2c] px-5 text-sm font-black text-white disabled:opacity-40"
            >
              <ShoppingBag size={16} />
              Agregar al carrito · {money(
                (saleMode === "STOCK" ? product.price_stock : product.price_preorder) * qty
              )}
            </button>
          </div>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-end bg-black/35 sm:place-items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-[28px] bg-[#fffaf6] p-5 shadow-2xl sm:rounded-[28px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.16em] text-[#5a8b86]">
                  Tu carrito
                </p>
                <h3 className="mt-1 text-2xl font-black">¿Cómo deseas comprar?</h3>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="grid size-10 place-items-center rounded-full bg-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {cart.map((line) => (
                <div
                  key={line.cart_key}
                  className="rounded-[18px] border border-[#eaded3] bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black text-[#5a8b86]">{line.code}</p>
                      <p className="mt-1 text-sm font-black">{line.name}</p>
                      <p className="mt-1 text-[9px] font-bold text-[#8b8078]">
                        {line.sale_mode === "STOCK" ? "Entrega inmediata" : "Preventa"} · {line.qty_series} serie(s)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCart((current) => current.filter((item) => item.cart_key !== line.cart_key))
                      }
                      className="grid size-9 place-items-center rounded-full bg-[#fff0eb] text-[#b63a2c]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="mt-3 rounded-[14px] bg-[#f8f4f0] p-3">
                    <p className="text-[8px] font-black uppercase text-[#8b8078]">Surtido</p>
                    <p className="mt-1 text-[9px] font-bold leading-5">
                      {line.mix_mode === "AUTO"
                        ? "Automático · prioriza remanentes"
                        : mixText(line.requested_mix)}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-[#7f746c]">{money(line.unit_price)} c/u</span>
                    <b className="text-[#b63a2c]">{money(line.unit_price * line.qty_series)}</b>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[18px] bg-white p-4">
              <div className="flex justify-between">
                <span className="text-sm font-bold text-[#7f746c]">Total referencial</span>
                <b className="text-xl">{money(total)}</b>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link
                href="/checkout"
                className="flex min-h-12 items-center justify-center gap-2 rounded-[17px] bg-[#b63a2c] px-4 text-center text-sm font-black text-white"
              >
                <ShoppingBag size={17} />
                Comprar por la web
              </Link>

              <button
                type="button"
                onClick={sendWhatsApp}
                className="flex min-h-12 items-center justify-center gap-2 rounded-[17px] border border-[#d9c8bb] bg-white px-4 text-sm font-black text-[#5a8b86]"
              >
                <MessageCircle size={17} />
                Solo WhatsApp
              </button>
            </div>

            <p className="mt-3 text-center text-[10px] leading-5 text-[#8b8078]">
              WhatsApp solo envía el carrito. La reserva real ocurre al registrar el pedido web o una venta manual.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
