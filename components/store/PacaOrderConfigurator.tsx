"use client";

import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ImagePlus,
  Loader2,
  MessageCircle,
  PackageOpen,
  Pencil,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type PriceOption = {
  quantity: number;
  price_pen: number;
};

type UploadedReference = {
  url: string;
  path: string;
  name: string;
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
  references: UploadedReference[];
  priceOptions: PriceOption[];
  sizeOptions: string[];
};

const CART_KEY = "tendencias-pacas-cart-v15";
const CLIENT_KEY = "tendencias-pacas-client-v15";

function money(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function optimizeReferenceImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const maxSide = 1400;
    const scale = Math.min(
      1,
      maxSide / Math.max(bitmap.width, bitmap.height),
    );

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.8),
    );

    if (!blob) return file;

    const base =
      file.name.replace(/\.[^/.]+$/, "") || "referencia";

    return new File(
      [blob],
      `${base}.webp`,
      {
        type: "image/webp",
        lastModified: Date.now(),
      },
    );
  } catch {
    return file;
  }
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
  const supabase = createClient();

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

  const [orderOpen, setOrderOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const [quantity, setQuantity] = useState<number | null>(
    validPrices[0]?.quantity ?? null,
  );
  const [sizeRange, setSizeRange] = useState("");
  const [preference, setPreference] = useState(
    audience === "kids" ? "" : "Damas",
  );
  const [note, setNote] = useState("");

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [referencePreviews, setReferencePreviews] = useState<string[]>([]);
  const [uploadingReferences, setUploadingReferences] = useState(false);
  const [sending, setSending] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    try {
      const raw =
        window.localStorage.getItem(CART_KEY) ??
        window.localStorage.getItem("tendencias-pacas-cart-v14") ??
        window.localStorage.getItem("tendencias-pacas-cart-v13");

      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];

        setCart(
          parsed.map((item) => ({
            ...item,
            references: item.references ?? [],
            priceOptions: item.priceOptions ?? [],
            sizeOptions: item.sizeOptions ?? [],
          })),
        );
      }

      const clientRaw =
        window.localStorage.getItem(CLIENT_KEY);

      if (clientRaw) {
        const client = JSON.parse(clientRaw);
        setClientName(client.name ?? "");
        setClientPhone(client.phone ?? "");
      }
    } catch {
      setCart([]);
    }
  }, []);

  function saveClient() {
    window.localStorage.setItem(
      CLIENT_KEY,
      JSON.stringify({
        name: clientName.trim(),
        phone: clientPhone.trim(),
      }),
    );
  }

  function saveCart(next: CartItem[]) {
    setCart(next);
    window.localStorage.setItem(
      CART_KEY,
      JSON.stringify(next),
    );
  }

  const selectedPrice =
    validPrices.find(
      (item) =>
        Number(item.quantity) === Number(quantity),
    ) ?? null;

  const preferences =
    audience === "kids"
      ? ["Niña", "Niño", "Ambos"]
      : ["Damas"];

  const canAdd =
    Boolean(selectedPrice) &&
    Boolean(sizeRange) &&
    Boolean(preference);

  function resetReferenceFiles(files: File[]) {
    referencePreviews.forEach((url) => URL.revokeObjectURL(url));
    setReferenceFiles(files);
    setReferencePreviews(
      files.map((file) => URL.createObjectURL(file)),
    );
  }

  function handleReferenceSelection(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const picked = Array.from(
      event.target.files ?? [],
    ).filter((file) => file.type.startsWith("image/"));

    resetReferenceFiles(
      [...referenceFiles, ...picked].slice(0, 5),
    );

    event.target.value = "";
  }

  function removeReference(index: number) {
    resetReferenceFiles(
      referenceFiles.filter(
        (_, currentIndex) => currentIndex !== index,
      ),
    );
  }

  async function uploadReferences(): Promise<UploadedReference[]> {
    if (referenceFiles.length === 0) return [];

    setUploadingReferences(true);

    try {
      const uploaded: UploadedReference[] = [];

      for (
        let index = 0;
        index < referenceFiles.length;
        index += 1
      ) {
        const optimized =
          await optimizeReferenceImage(referenceFiles[index]);

        const ext =
          optimized.name.split(".").pop() ?? "webp";

        const path = [
          categoryId,
          new Date().toISOString().slice(0, 10),
          `${crypto.randomUUID()}.${ext}`,
        ].join("/");

        const { error } =
          await supabase.storage
            .from("paca-references")
            .upload(
              path,
              optimized,
              {
                cacheControl: "31536000",
                upsert: false,
                contentType: optimized.type,
              },
            );

        if (error) {
          throw new Error(
            `No pudimos subir la referencia ${index + 1}: ${error.message}`,
          );
        }

        const { data } =
          supabase.storage
            .from("paca-references")
            .getPublicUrl(path);

        uploaded.push({
          url: data.publicUrl,
          path,
          name: `Modelo referencial ${index + 1}`,
        });
      }

      return uploaded;
    } finally {
      setUploadingReferences(false);
    }
  }

  async function makeCurrentItem(): Promise<CartItem | null> {
    if (!canAdd || !selectedPrice || !quantity) return null;

    const references = await uploadReferences();

    return {
      id: newId(),
      categoryId,
      categoryName,
      audience,
      quantity,
      price: Number(selectedPrice.price_pen),
      sizeRange,
      preference,
      note: note.trim(),
      references,
      priceOptions: validPrices,
      sizeOptions: sizeRanges,
    };
  }

  function resetForm() {
    setNote("");
    setSizeRange("");
    setPreference(
      audience === "kids" ? "" : "Damas",
    );
    resetReferenceFiles([]);
  }

  async function addToCart() {
    try {
      const item = await makeCurrentItem();
      if (!item) return;

      saveCart([...cart, item]);
      setAdded(true);
      resetForm();

      setTimeout(() => {
        setAdded(false);
        setOrderOpen(false);
      }, 700);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "No pudimos agregar la Paca.",
      );
    }
  }

  function updateCartItem(
    id: string,
    patch: Partial<CartItem>,
  ) {
    saveCart(
      cart.map((item) =>
        item.id === id
          ? { ...item, ...patch }
          : item,
      ),
    );
  }

  function updateCartQuantity(
    item: CartItem,
    nextQuantity: number,
  ) {
    const price =
      item.priceOptions.find(
        (option) =>
          Number(option.quantity) === nextQuantity,
      );

    if (!price) return;

    updateCartItem(
      item.id,
      {
        quantity: nextQuantity,
        price: Number(price.price_pen),
      },
    );
  }

  function removeItem(id: string) {
    saveCart(
      cart.filter((item) => item.id !== id),
    );
  }

  const cartTotal =
    cart.reduce(
      (sum, item) =>
        sum + Number(item.price),
      0,
    );

  const cartPieces =
    cart.reduce(
      (sum, item) =>
        sum + Number(item.quantity),
      0,
    );

  function validateContact() {
    if (!clientName.trim()) {
      alert("Ingresa tu nombre para registrar la solicitud.");
      return false;
    }

    const phone =
      clientPhone.replace(/\D/g, "");

    if (phone.length < 8) {
      alert("Ingresa un número de WhatsApp válido.");
      return false;
    }

    saveClient();
    return true;
  }

  async function registerRequest(
    items: CartItem[],
  ): Promise<{
    code: string;
    total: number;
    total_pieces: number;
  }> {
    const { data, error } =
      await supabase.rpc(
        "create_paca_request_v15",
        {
          p_payload: {
            client_name:
              clientName.trim(),
            client_phone:
              clientPhone.trim(),
            items,
          },
        },
      );

    if (error) {
      throw new Error(error.message);
    }

    return data as {
      code: string;
      total: number;
      total_pieces: number;
    };
  }

  function buildWhatsAppMessage(
    items: CartItem[],
    requestCode: string,
  ) {
    const lines = [
      "Hola Tendencias Import 💛",
      `Registré mi solicitud ${requestCode} desde la web.`,
      `Nombre: ${clientName.trim()}`,
      `WhatsApp: ${clientPhone.trim()}`,
      "",
      "PACAS A PEDIDO:",
      "",
    ];

    items.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.categoryName}`);
      lines.push(`• Cantidad: ${item.quantity} prendas`);
      lines.push(`• Rango de tallas: ${item.sizeRange}`);
      lines.push(`• Preferencia: ${item.preference}`);
      lines.push(`• Precio: ${money(item.price)}`);

      if (item.note) {
        lines.push(`• Observación: ${item.note}`);
      }

      if (item.references.length > 0) {
        lines.push(
          "• Modelos referenciales para que Tendencias Import entienda mejor el estilo:",
        );

        item.references.forEach((reference, refIndex) => {
          lines.push(
            `  ${refIndex + 1}. ${reference.url}`,
          );
        });
      }

      lines.push("");
    });

    const pieces = items.reduce(
      (sum, item) => sum + Number(item.quantity),
      0,
    );

    const total = items.reduce(
      (sum, item) => sum + Number(item.price),
      0,
    );

    lines.push(`TOTAL PRENDAS: ${pieces}`);
    lines.push(`TOTAL REFERENCIAL: ${money(total)}`);
    lines.push("");
    lines.push(
      "Entiendo que las Pacas son a pedido y quedan sujetas a confirmación de Tendencias Import.",
    );

    return lines.join("\n");
  }

  function openWhatsApp(
    items: CartItem[],
    requestCode: string,
  ) {
    const number =
      whatsappNumber.replace(/\D/g, "");

    const message =
      buildWhatsAppMessage(
        items,
        requestCode,
      );

    window.open(
      `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function sendItemsToWhatsApp(
    items: CartItem[],
    clearCartAfter: boolean,
  ) {
    if (!validateContact()) return;

    setSending(true);

    try {
      const request =
        await registerRequest(items);

      openWhatsApp(
        items,
        request.code,
      );

      if (clearCartAfter) {
        saveCart([]);
        setCartOpen(false);
      }

      setOrderOpen(false);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "No pudimos registrar la solicitud.",
      );
    } finally {
      setSending(false);
    }
  }

  async function sendCurrentToWhatsApp() {
    try {
      if (!validateContact()) return;

      setSending(true);

      const item =
        await makeCurrentItem();

      if (!item) return;

      const request =
        await registerRequest([item]);

      openWhatsApp(
        [item],
        request.code,
      );

      resetForm();
      setOrderOpen(false);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "No pudimos registrar la solicitud.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <section className="mt-7 rounded-[24px] border border-[#eaded3] bg-white p-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-5">
        <div>
          <div className="flex items-center gap-2 text-[#9b382b]">
            <PackageOpen size={14} />
            <p className="text-[9px] font-black uppercase tracking-[.12em]">
              En preventa
            </p>
          </div>

          <h2 className="mt-1 text-xl font-black">
            ¿Deseas hacer tu pedido?
          </h2>

          <p className="mt-1 max-w-2xl text-[10px] leading-5 text-[#7f746c]">
            ¿Ya viste los modelos de esta categoría? Configura tu paca,
            agrega hasta 5 referencias y envía tu solicitud a Tendencias Import.
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:mt-0 sm:min-w-[220px]">
          <button
            type="button"
            onClick={() => setOrderOpen(true)}
            className="flex min-h-12 items-center justify-center gap-2 rounded-[17px] bg-[#b63a2c] px-5 text-sm font-black !text-white"
          >
            <ShoppingBag size={16} />
            Hacer mi pedido
          </button>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="flex min-h-11 items-center justify-center gap-2 rounded-[17px] bg-[#5a8b86] px-5 text-xs font-black !text-white"
            >
              Ver carrito · {cart.length}
            </button>
          )}
        </div>
      </section>

      {cart.length > 0 && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed bottom-4 right-4 z-40 flex min-h-12 items-center gap-2 rounded-full bg-[#5a8b86] px-5 text-xs font-black !text-white shadow-2xl"
        >
          <ShoppingBag size={16} />
          {cart.length} {cart.length === 1 ? "paca" : "pacas"} · {money(cartTotal)}
          <ChevronRight size={14} />
        </button>
      )}

      {orderOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setOrderOpen(false)}
            className="absolute inset-0"
          />

          <div className="relative max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-[28px] bg-[#fffaf6] shadow-2xl sm:rounded-[28px]">
            <div className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-[#eaded3] bg-[#fffaf6]/95 p-4 backdrop-blur sm:p-5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.14em] text-[#9b382b]">
                  Paca en preventa
                </p>
                <h3 className="mt-1 text-xl font-black sm:text-2xl">
                  {categoryName}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setOrderOpen(false)}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-6 p-4 sm:p-5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#7f746c]">
                  1. Cantidad
                </p>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[25, 50, 100].map((amount) => {
                    const price =
                      validPrices.find(
                        (item) =>
                          Number(item.quantity) === amount,
                      );

                    const selected =
                      quantity === amount;

                    return (
                      <button
                        key={amount}
                        type="button"
                        disabled={!price}
                        onClick={() => setQuantity(amount)}
                        className={`rounded-[17px] border px-2 py-3 text-center disabled:opacity-35 ${
                          selected
                            ? "border-[#b63a2c] bg-[#b63a2c] !text-white"
                            : "border-[#eaded3] bg-white text-[#2c2825]"
                        }`}
                      >
                        <span className="block text-xs font-black">
                          {amount} prendas
                        </span>

                        <span
                          className={`mt-1 block text-[10px] font-black ${
                            selected
                              ? "text-white"
                              : "text-[#9b382b]"
                          }`}
                        >
                          {price
                            ? money(Number(price.price_pen))
                            : "Sin precio"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <ChoiceBlock
                step="2"
                title="Rango de tallas"
                options={sizeRanges}
                selected={sizeRange}
                onSelect={setSizeRange}
                tone="teal"
              />

              <ChoiceBlock
                step="3"
                title="Preferencia"
                options={preferences}
                selected={preference}
                onSelect={setPreference}
                tone="gold"
              />

              <div className="rounded-[20px] border border-[#eaded3] bg-white p-4">
                <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#5a8b86]">
                  4. Modelos referenciales
                </p>

                <h4 className="mt-1 text-sm font-black">
                  Ayuda a Tendencias Import a entender mejor el estilo que buscas
                </h4>

                <p className="mt-1 text-[9px] leading-4 text-[#7f746c]">
                  Puedes subir hasta 5 imágenes. Son referencias de estilo,
                  no modelos exactos garantizados.
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {referencePreviews.map((preview, index) => (
                    <div
                      key={preview}
                      className="relative aspect-square overflow-hidden rounded-[14px] bg-[#f1e9e1]"
                    >
                      <img
                        src={preview}
                        alt={`Referencia ${index + 1}`}
                        className="h-full w-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => removeReference(index)}
                        className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/65 !text-white"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {referenceFiles.length < 5 && (
                    <label className="grid aspect-square cursor-pointer place-items-center rounded-[14px] border border-dashed border-[#d8c7b9] bg-[#fffaf6] text-center">
                      <span className="px-2 text-[#5a8b86]">
                        <ImagePlus size={20} className="mx-auto" />
                        <span className="mt-1 block text-[8px] font-black">
                          Subir imágenes
                        </span>
                      </span>

                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleReferenceSelection}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-[.1em] text-[#7f746c]">
                  5. Observación opcional
                </label>

                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Ej. Prefiero tonos neutros, más conjuntos, menos vestidos..."
                  className="ti-input mt-2 min-h-20 py-3"
                />
              </div>

              <div className="rounded-[20px] bg-[#f4faf8] p-4">
                <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#5a8b86]">
                  6. Datos de contacto
                </p>

                <p className="mt-1 text-[9px] leading-4 text-[#7f746c]">
                  Así la solicitud queda registrada para que el equipo de Tendencias Import pueda atenderla.
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    value={clientName}
                    onChange={(event) => setClientName(event.target.value)}
                    placeholder="Nombre"
                    className="ti-input"
                  />

                  <input
                    value={clientPhone}
                    onChange={(event) => setClientPhone(event.target.value)}
                    placeholder="WhatsApp"
                    inputMode="tel"
                    className="ti-input"
                  />
                </div>
              </div>

              {selectedPrice && (
                <div className="rounded-[18px] bg-[#fff7f1] p-4">
                  <p className="text-[8px] font-black uppercase tracking-[.1em] text-[#9b382b]">
                    Total referencial
                  </p>
                  <p className="mt-1 text-2xl font-black">
                    {money(Number(selectedPrice.price_pen))}
                  </p>
                  <p className="mt-1 text-[9px] text-[#7f746c]">
                    {quantity} prendas · En preventa
                  </p>
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={!canAdd || uploadingReferences || sending}
                  onClick={addToCart}
                  className="flex min-h-13 items-center justify-center gap-2 rounded-[18px] bg-[#5a8b86] px-5 text-sm font-black !text-white disabled:opacity-35"
                >
                  {uploadingReferences ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : added ? (
                    <Check size={17} />
                  ) : (
                    <ShoppingBag size={17} />
                  )}
                  Agregar al carrito
                </button>

                <button
                  type="button"
                  disabled={!canAdd || uploadingReferences || sending}
                  onClick={sendCurrentToWhatsApp}
                  className="flex min-h-13 items-center justify-center gap-2 rounded-[18px] bg-[#25D366] px-5 text-sm font-black !text-white disabled:opacity-35"
                >
                  {sending ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <MessageCircle size={18} />
                  )}
                  Enviar directo a WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-[120] bg-black/45">
          <button
            type="button"
            aria-label="Cerrar carrito"
            onClick={() => setCartOpen(false)}
            className="absolute inset-0"
          />

          <aside className="absolute bottom-0 right-0 top-0 flex w-full max-w-lg flex-col bg-[#fffaf6] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#eaded3] p-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.12em] text-[#5a8b86]">
                  Pacas en preventa
                </p>
                <h3 className="mt-1 text-xl font-black">
                  Tu carrito
                </h3>
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
              {cart.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[18px] border border-[#eaded3] bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black">
                        {item.categoryName}
                      </p>
                      <p className="mt-1 text-[9px] text-[#7f746c]">
                        Puedes ajustar esta Paca sin borrarla.
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

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <SmallSelect
                      label="Cantidad"
                      value={String(item.quantity)}
                      options={item.priceOptions.map((option) => ({
                        value: String(option.quantity),
                        label: `${option.quantity} prendas`,
                      }))}
                      onChange={(value) =>
                        updateCartQuantity(
                          item,
                          Number(value),
                        )
                      }
                    />

                    <SmallSelect
                      label="Rango"
                      value={item.sizeRange}
                      options={item.sizeOptions.map((option) => ({
                        value: option,
                        label: option,
                      }))}
                      onChange={(value) =>
                        updateCartItem(
                          item.id,
                          { sizeRange: value },
                        )
                      }
                    />

                    <SmallSelect
                      label="Preferencia"
                      value={item.preference}
                      options={
                        item.audience === "kids"
                          ? ["Niña", "Niño", "Ambos"].map((option) => ({
                              value: option,
                              label: option,
                            }))
                          : [{ value: "Damas", label: "Damas" }]
                      }
                      onChange={(value) =>
                        updateCartItem(
                          item.id,
                          { preference: value },
                        )
                      }
                    />
                  </div>

                  {item.references.length > 0 && (
                    <div className="mt-3 flex gap-1.5">
                      {item.references.map((reference, index) => (
                        <img
                          key={reference.url}
                          src={reference.url}
                          alt={`Referencia ${index + 1}`}
                          loading="lazy"
                          className="size-10 rounded-[9px] object-cover"
                        />
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-[#5a8b86]">
                      <Pencil size={11} />
                      Editable
                    </span>

                    <p className="text-sm font-black text-[#9b382b]">
                      {money(item.price)}
                    </p>
                  </div>
                </article>
              ))}

              {cart.length === 0 && (
                <p className="py-20 text-center text-sm text-[#8b8078]">
                  Tu carrito está vacío.
                </p>
              )}
            </div>

            <div className="border-t border-[#eaded3] bg-white p-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={clientName}
                  onChange={(event) => setClientName(event.target.value)}
                  placeholder="Nombre"
                  className="ti-input"
                />
                <input
                  value={clientPhone}
                  onChange={(event) => setClientPhone(event.target.value)}
                  placeholder="WhatsApp"
                  inputMode="tel"
                  className="ti-input"
                />
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[8px] font-black uppercase text-[#8b8078]">
                    Total referencial
                  </p>
                  <p className="mt-1 text-2xl font-black">
                    {money(cartTotal)}
                  </p>
                  <p className="mt-1 text-[8px] text-[#8b8078]">
                    {cartPieces} prendas · En preventa
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={cart.length === 0 || sending}
                onClick={() => sendItemsToWhatsApp(cart, true)}
                className="mt-4 flex min-h-13 w-full items-center justify-center gap-2 rounded-[18px] bg-[#25D366] px-5 text-sm font-black !text-white disabled:opacity-35"
              >
                {sending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <MessageCircle size={18} />
                )}
                Registrar y enviar a WhatsApp
              </button>

              <p className="mt-2 text-center text-[8px] leading-4 text-[#8b8078]">
                Primero guardamos la solicitud en Tendencias Import y luego abrimos WhatsApp.
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function ChoiceBlock({
  step,
  title,
  options,
  selected,
  onSelect,
  tone,
}: {
  step: string;
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  tone: "teal" | "gold";
}) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#7f746c]">
        {step}. {title}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((item) => {
          const active = selected === item;
          const activeClass =
            tone === "teal"
              ? "border-[#5a8b86] bg-[#5a8b86] !text-white"
              : "border-[#d39218] bg-[#d39218] !text-white";

          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className={`rounded-full border px-4 py-2.5 text-[10px] font-black ${
                active
                  ? activeClass
                  : "border-[#eaded3] bg-white text-[#5f5650]"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SmallSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{
    value: string;
    label: string;
  }>;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-1 block text-[8px] font-black uppercase text-[#8b8078]">
        {label}
      </span>

      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full appearance-none rounded-[12px] border border-[#eaded3] bg-[#fffaf6] px-3 pr-8 text-[9px] font-black outline-none"
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          size={12}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b8078]"
        />
      </div>
    </label>
  );
}
