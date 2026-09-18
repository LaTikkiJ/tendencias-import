"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  MessageCircle,
  Minus,
  PackageOpen,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";

type PriceOption = {
  quantity: number;
  price_pen: number;
};

type CartItem = {
  id: string;
  categoryId: string;
  categoryName: string;
  audience: string;
  quantity: number;
  price: number;
  sizeRange: string;
  preference: string;
  note: string;
};

const CART_KEY = "tendencias-pacas-cart-v13";

function money(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function PacaOrderConfigurator({
  categoryId,
  categoryName,
  audience,
  sizeRanges,
  prices,
  whatsappNumber,
}: {
  categoryId: string;
  categoryName: string;
  audience: string;
  sizeRanges: string[];
  prices: PriceOption[];
  whatsappNumber: string;
}) {
  const validPrices = useMemo(
    () =>
      prices
        .filter(
          (item) =>
            [25, 50, 100].includes(Number(item.quantity)) &&
            Number(item.price_pen) > 0,
        )
        .sort((a, b) => Number(a.quantity) - Number(b.quantity)),
    [prices],
  );

  const [quantity, setQuantity] = useState<number | null>(
    validPrices[0]?.quantity ?? null,
  );
  const [sizeRange, setSizeRange] = useState("");
  const [preference, setPreference] = useState(
    audience === "kids" ? "" : "Damas",
  );
  const [note, setNote] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_KEY);
      if (raw) {
        setCart(JSON.parse(raw));
      }
    } catch {
      setCart([]);
    }
  }, []);

  function saveCart(next: CartItem[]) {
    setCart(next);
    window.localStorage.setItem(CART_KEY, JSON.stringify(next));
  }

  const selectedPrice =
    validPrices.find((item) => Number(item.quantity) === Number(quantity)) ??
    null;

  const preferences =
    audience === "kids"
      ? ["Niña", "Niño", "Ambos"]
      : ["Damas"];

  const canAdd =
    Boolean(selectedPrice) &&
    Boolean(sizeRange) &&
    Boolean(preference);

  function addToCart() {
    if (!canAdd || !selectedPrice || !quantity) return;

    const item: CartItem = {
      id: newId(),
      categoryId,
      categoryName,
      audience,
      quantity,
      price: Number(selectedPrice.price_pen),
      sizeRange,
      preference,
      note: note.trim(),
    };

    saveCart([...cart, item]);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  function removeItem(id: string) {
    saveCart(cart.filter((item) => item.id !== id));
  }

  const total = cart.reduce((sum, item) => sum + Number(item.price), 0);
  const totalPieces = cart.reduce(
    (sum, item) => sum + Number(item.quantity),
    0,
  );

  function sendWhatsApp() {
    if (cart.length === 0) return;

    const number = whatsappNumber.replace(/\D/g, "");

    const lines = [
      "Hola Tendencias Import 💛",
      "Quiero solicitar estas pacas A PEDIDO:",
      "",
    ];

    cart.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.categoryName}`);
      lines.push(`• Cantidad: ${item.quantity} prendas`);
      lines.push(`• Rango de tallas: ${item.sizeRange}`);
      lines.push(`• Preferencia: ${item.preference}`);
      lines.push(`• Precio: ${money(item.price)}`);

      if (item.note) {
        lines.push(`• Observación: ${item.note}`);
      }

      lines.push("");
    });

    lines.push(`TOTAL PRENDAS: ${totalPieces}`);
    lines.push(`TOTAL REFERENCIAL: ${money(total)}`);
    lines.push("");
    lines.push(
      "Entiendo que las pacas son a pedido y quedan sujetas a confirmación de Tendencias Import.",
    );

    const url = `https://wa.me/${number}?text=${encodeURIComponent(
      lines.join("\n"),
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <section className="mt-8 overflow-hidden rounded-[26px] border border-[#eaded3] bg-white shadow-sm">
        <div className="border-b border-[#f0e6dd] bg-[#fff7f1] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[#9b382b]">
                <PackageOpen size={15} />
                <p className="text-[9px] font-black uppercase tracking-[.14em]">
                  Todo es a pedido
                </p>
              </div>

              <h2 className="mt-1 text-xl font-black sm:text-2xl">
                Arma tu paca
              </h2>

              <p className="mt-1 text-[10px] leading-5 text-[#7f746c]">
                Elige cantidad, rango de tallas y preferencia. Puedes agregar
                más de una categoría al carrito y enviar todo junto a WhatsApp.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative inline-flex min-h-11 items-center gap-2 rounded-full bg-[#5a8b86] px-4 text-xs font-black !text-white"
            >
              <ShoppingBag size={15} />
              Carrito
              {cart.length > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-white text-[9px] font-black text-[#42746e]">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#7f746c]">
              1. ¿Cuántas prendas deseas?
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[25, 50, 100].map((amount) => {
                const price = validPrices.find(
                  (item) => Number(item.quantity) === amount,
                );
                const selected = quantity === amount;

                return (
                  <button
                    key={amount}
                    type="button"
                    disabled={!price}
                    onClick={() => setQuantity(amount)}
                    className={`rounded-[17px] border px-2 py-3 text-center transition disabled:cursor-not-allowed disabled:opacity-35 ${
                      selected
                        ? "border-[#b63a2c] bg-[#b63a2c] !text-white"
                        : "border-[#eaded3] bg-[#fffaf6] text-[#2c2825]"
                    }`}
                  >
                    <span className="block text-xs font-black">
                      {amount} prendas
                    </span>
                    <span
                      className={`mt-1 block text-[10px] font-black ${
                        selected ? "text-white" : "text-[#9b382b]"
                      }`}
                    >
                      {price ? money(Number(price.price_pen)) : "Sin precio"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedPrice && (
            <div className="rounded-[18px] bg-[#f4faf8] p-4">
              <p className="text-[8px] font-black uppercase tracking-[.1em] text-[#5a8b86]">
                Precio de la opción seleccionada
              </p>
              <p className="mt-1 text-2xl font-black text-[#2c2825]">
                {money(Number(selectedPrice.price_pen))}
              </p>
              <p className="mt-1 text-[9px] text-[#7f746c]">
                Precio total por {quantity} prendas · A pedido
              </p>
            </div>
          )}

          <div>
            <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#7f746c]">
              2. Rango de tallas
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {sizeRanges.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSizeRange(size)}
                  className={`rounded-full border px-4 py-2.5 text-[10px] font-black ${
                    sizeRange === size
                      ? "border-[#5a8b86] bg-[#5a8b86] !text-white"
                      : "border-[#eaded3] bg-white text-[#5f5650]"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            {sizeRanges.length === 0 && (
              <p className="mt-2 text-xs text-[#8b8078]">
                Sofía todavía no configuró rangos para esta categoría.
              </p>
            )}
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#7f746c]">
              3. Preferencia
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {preferences.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPreference(item)}
                  className={`rounded-full border px-4 py-2.5 text-[10px] font-black ${
                    preference === item
                      ? "border-[#d39218] bg-[#d39218] !text-white"
                      : "border-[#eaded3] bg-white text-[#5f5650]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-[.1em] text-[#7f746c]">
              Observación opcional
            </label>

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ej. Prefiero más conjuntos, colores neutros, etc."
              className="ti-input mt-2 min-h-20 py-3"
            />
          </div>

          <button
            type="button"
            disabled={!canAdd}
            onClick={addToCart}
            className="flex min-h-13 w-full items-center justify-center gap-2 rounded-[18px] bg-[#b63a2c] px-5 text-sm font-black !text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            {added ? <Check size={17} /> : <ShoppingBag size={17} />}
            {added ? "Agregado al carrito" : "Agregar esta paca al carrito"}
          </button>

          {!canAdd && (
            <p className="text-center text-[9px] text-[#8b8078]">
              Selecciona cantidad, rango de tallas y preferencia.
            </p>
          )}
        </div>
      </section>

      {cart.length > 0 && !cartOpen && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed bottom-4 right-4 z-40 flex min-h-12 items-center gap-2 rounded-full bg-[#5a8b86] px-5 text-xs font-black !text-white shadow-2xl"
        >
          <ShoppingBag size={16} />
          {cart.length} {cart.length === 1 ? "paca" : "pacas"} · {money(total)}
          <ChevronRight size={14} />
        </button>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-[100] bg-black/45">
          <button
            type="button"
            aria-label="Cerrar carrito"
            onClick={() => setCartOpen(false)}
            className="absolute inset-0"
          />

          <aside className="absolute bottom-0 right-0 top-0 flex w-full max-w-md flex-col bg-[#fffaf6] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#eaded3] p-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.12em] text-[#5a8b86]">
                  Pacas a pedido
                </p>
                <h3 className="mt-1 text-xl font-black">Tu carrito</h3>
              </div>

              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="grid size-10 place-items-center rounded-full bg-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="grid min-h-64 place-items-center text-center">
                  <div>
                    <ShoppingBag
                      size={28}
                      className="mx-auto text-[#bda99b]"
                    />
                    <p className="mt-3 font-black">Tu carrito está vacío</p>
                  </div>
                </div>
              ) : (
                cart.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[18px] border border-[#eaded3] bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black">
                          {item.categoryName}
                        </p>
                        <p className="mt-1 text-[9px] leading-5 text-[#7f746c]">
                          {item.quantity} prendas · {item.sizeRange} ·{" "}
                          {item.preference}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="grid size-9 shrink-0 place-items-center rounded-full bg-[#fff0eb] text-[#b63a2c]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {item.note && (
                      <p className="mt-2 rounded-[12px] bg-[#f8f4f0] px-3 py-2 text-[9px] text-[#6f655e]">
                        {item.note}
                      </p>
                    )}

                    <p className="mt-3 text-right text-sm font-black text-[#9b382b]">
                      {money(item.price)}
                    </p>
                  </article>
                ))
              )}
            </div>

            <div className="border-t border-[#eaded3] bg-white p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[.08em] text-[#8b8078]">
                    Total referencial
                  </p>
                  <p className="mt-1 text-2xl font-black">
                    {money(total)}
                  </p>
                  <p className="mt-1 text-[8px] text-[#8b8078]">
                    {totalPieces} prendas · Todo es a pedido
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={cart.length === 0}
                onClick={sendWhatsApp}
                className="mt-4 flex min-h-13 w-full items-center justify-center gap-2 rounded-[18px] bg-[#25D366] px-5 text-sm font-black !text-white disabled:opacity-35"
              >
                <MessageCircle size={18} />
                Enviar pedido a WhatsApp
              </button>

              <p className="mt-2 text-center text-[8px] leading-4 text-[#8b8078]">
                El envío por WhatsApp es una solicitud de pedido. Sofía
                confirmará disponibilidad, condiciones y datos finales.
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
