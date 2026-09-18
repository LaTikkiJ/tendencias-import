"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  ImagePlus,
  Loader2,
  MessageCircle,
  PackageOpen,
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
};

const CART_KEY = "tendencias-pacas-cart-v14";

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
  if (!file.type.startsWith("image/")) {
    return file;
  }

  if (
    file.type === "image/svg+xml" ||
    file.type === "image/gif"
  ) {
    return file;
  }

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

    if (!blob) {
      return file;
    }

    const base = file.name.replace(/\.[^/.]+$/, "") || "referencia";

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
        .sort(
          (a, b) =>
            Number(a.quantity) - Number(b.quantity),
        ),
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

  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [referencePreviews, setReferencePreviews] = useState<string[]>([]);
  const [uploadingReferences, setUploadingReferences] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    try {
      const raw =
        window.localStorage.getItem(CART_KEY) ??
        window.localStorage.getItem("tendencias-pacas-cart-v13");

      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];

        setCart(
          parsed.map((item) => ({
            ...item,
            references: item.references ?? [],
          })),
        );
      }
    } catch {
      setCart([]);
    }
  }, []);

  useEffect(() => {
    return () => {
      referencePreviews.forEach((url) =>
        URL.revokeObjectURL(url),
      );
    };
  }, [referencePreviews]);

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
    referencePreviews.forEach((url) =>
      URL.revokeObjectURL(url),
    );

    setReferenceFiles(files);
    setReferencePreviews(
      files.map((file) =>
        URL.createObjectURL(file),
      ),
    );
  }

  function handleReferenceSelection(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const picked = Array.from(
      event.target.files ?? [],
    ).filter((file) =>
      file.type.startsWith("image/"),
    );

    const next = [
      ...referenceFiles,
      ...picked,
    ].slice(0, 5);

    resetReferenceFiles(next);
    event.target.value = "";
  }

  function removeReference(index: number) {
    const next = referenceFiles.filter(
      (_, currentIndex) =>
        currentIndex !== index,
    );

    resetReferenceFiles(next);
  }

  async function uploadReferences(): Promise<UploadedReference[]> {
    if (referenceFiles.length === 0) {
      return [];
    }

    setUploadingReferences(true);

    try {
      const uploaded: UploadedReference[] = [];

      for (
        let index = 0;
        index < referenceFiles.length;
        index += 1
      ) {
        const optimized =
          await optimizeReferenceImage(
            referenceFiles[index],
          );

        const safeName =
          optimized.name
            .toLowerCase()
            .replace(/[^a-z0-9._-]+/g, "-")
            .replace(/-+/g, "-")
            .slice(0, 80) || `referencia-${index + 1}.webp`;

        const ext =
          safeName.split(".").pop() ?? "webp";

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
            `No se pudo subir la referencia ${index + 1}: ${error.message}`,
          );
        }

        const { data } =
          supabase.storage
            .from("paca-references")
            .getPublicUrl(path);

        uploaded.push({
          url: data.publicUrl,
          name: `Modelo referencial ${index + 1}`,
        });
      }

      return uploaded;
    } finally {
      setUploadingReferences(false);
    }
  }

  function buildWhatsAppMessage(
    items: CartItem[],
  ) {
    const lines = [
      "Hola Tendencias Import 💛",
      "Quiero solicitar estas pacas A PEDIDO:",
      "",
    ];

    items.forEach((item, index) => {
      lines.push(
        `${index + 1}. ${item.categoryName}`,
      );
      lines.push(
        `• Cantidad: ${item.quantity} prendas`,
      );
      lines.push(
        `• Rango de tallas: ${item.sizeRange}`,
      );
      lines.push(
        `• Preferencia: ${item.preference}`,
      );
      lines.push(
        `• Precio: ${money(item.price)}`,
      );

      if (item.note) {
        lines.push(
          `• Observación: ${item.note}`,
        );
      }

      if (item.references.length > 0) {
        lines.push(
          "• Modelos referenciales para que Tendencias Import entienda mejor el estilo:",
        );

        item.references.forEach(
          (reference, referenceIndex) => {
            lines.push(
              `  ${referenceIndex + 1}. ${reference.url}`,
            );
          },
        );
      }

      lines.push("");
    });

    const totalPieces = items.reduce(
      (sum, item) =>
        sum + Number(item.quantity),
      0,
    );

    const total = items.reduce(
      (sum, item) =>
        sum + Number(item.price),
      0,
    );

    lines.push(
      `TOTAL PRENDAS: ${totalPieces}`,
    );
    lines.push(
      `TOTAL REFERENCIAL: ${money(total)}`,
    );
    lines.push("");
    lines.push(
      "Entiendo que las pacas son a pedido y quedan sujetas a confirmación de Tendencias Import.",
    );

    return lines.join("\n");
  }

  function openWhatsApp(items: CartItem[]) {
    const number =
      whatsappNumber.replace(/\D/g, "");

    const message =
      buildWhatsAppMessage(items);

    const url =
      `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function makeCurrentItem(): Promise<CartItem | null> {
    if (
      !canAdd ||
      !selectedPrice ||
      !quantity
    ) {
      return null;
    }

    const references =
      await uploadReferences();

    return {
      id: newId(),
      categoryId,
      categoryName,
      audience,
      quantity,
      price: Number(
        selectedPrice.price_pen,
      ),
      sizeRange,
      preference,
      note: note.trim(),
      references,
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
      const item =
        await makeCurrentItem();

      if (!item) {
        return;
      }

      saveCart([
        ...cart,
        item,
      ]);

      setAdded(true);
      resetForm();

      setTimeout(() => {
        setAdded(false);
        setOrderOpen(false);
      }, 900);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "No pudimos subir las imágenes.",
      );
    }
  }

  async function sendCurrentToWhatsApp() {
    try {
      const item =
        await makeCurrentItem();

      if (!item) {
        return;
      }

      openWhatsApp([item]);
      resetForm();
      setOrderOpen(false);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "No pudimos subir las imágenes.",
      );
    }
  }

  function removeItem(id: string) {
    saveCart(
      cart.filter(
        (item) => item.id !== id,
      ),
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

  return (
    <>
      <section className="mt-7 rounded-[24px] border border-[#eaded3] bg-white p-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-5">
        <div>
          <div className="flex items-center gap-2 text-[#9b382b]">
            <PackageOpen size={14} />

            <p className="text-[9px] font-black uppercase tracking-[.12em]">
              Todo es a pedido
            </p>
          </div>

          <h2 className="mt-1 text-xl font-black">
            ¿Deseas hacer tu pedido?
          </h2>

          <p className="mt-1 max-w-2xl text-[10px] leading-5 text-[#7f746c]">
            Revisa primero los modelos de esta categoría. Cuando estés lista,
            configura tu paca y envía tu solicitud a Tendencias Import.
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:mt-0 sm:min-w-[220px]">
          <button
            type="button"
            onClick={() =>
              setOrderOpen(true)
            }
            className="flex min-h-12 items-center justify-center gap-2 rounded-[17px] bg-[#b63a2c] px-5 text-sm font-black !text-white"
          >
            <ShoppingBag size={16} />
            Hacer mi pedido
          </button>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setCartOpen(true)
              }
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
          onClick={() =>
            setCartOpen(true)
          }
          className="fixed bottom-4 right-4 z-40 flex min-h-12 items-center gap-2 rounded-full bg-[#5a8b86] px-5 text-xs font-black !text-white shadow-2xl"
        >
          <ShoppingBag size={16} />
          {cart.length}{" "}
          {cart.length === 1
            ? "paca"
            : "pacas"}{" "}
          · {money(cartTotal)}
          <ChevronRight size={14} />
        </button>
      )}

      {orderOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() =>
              setOrderOpen(false)
            }
            className="absolute inset-0"
          />

          <div className="relative max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-[28px] bg-[#fffaf6] shadow-2xl sm:rounded-[28px]">
            <div className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-[#eaded3] bg-[#fffaf6]/95 p-4 backdrop-blur sm:p-5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.14em] text-[#9b382b]">
                  Paca a pedido
                </p>

                <h3 className="mt-1 text-xl font-black sm:text-2xl">
                  {categoryName}
                </h3>

                <p className="mt-1 text-[9px] text-[#7f746c]">
                  Configura tu solicitud para Tendencias Import.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOrderOpen(false)
                }
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
                  {[25, 50, 100].map(
                    (amount) => {
                      const price =
                        validPrices.find(
                          (item) =>
                            Number(
                              item.quantity,
                            ) === amount,
                        );

                      const selected =
                        quantity === amount;

                      return (
                        <button
                          key={amount}
                          type="button"
                          disabled={!price}
                          onClick={() =>
                            setQuantity(
                              amount,
                            )
                          }
                          className={`rounded-[17px] border px-2 py-3 text-center disabled:cursor-not-allowed disabled:opacity-35 ${
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
                              ? money(
                                  Number(
                                    price.price_pen,
                                  ),
                                )
                              : "Sin precio"}
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#7f746c]">
                  2. Rango de tallas
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {sizeRanges.map(
                    (size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() =>
                          setSizeRange(
                            size,
                          )
                        }
                        className={`rounded-full border px-4 py-2.5 text-[10px] font-black ${
                          sizeRange === size
                            ? "border-[#5a8b86] bg-[#5a8b86] !text-white"
                            : "border-[#eaded3] bg-white text-[#5f5650]"
                        }`}
                      >
                        {size}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#7f746c]">
                  3. Preferencia
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {preferences.map(
                    (item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          setPreference(
                            item,
                          )
                        }
                        className={`rounded-full border px-4 py-2.5 text-[10px] font-black ${
                          preference ===
                          item
                            ? "border-[#d39218] bg-[#d39218] !text-white"
                            : "border-[#eaded3] bg-white text-[#5f5650]"
                        }`}
                      >
                        {item}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="rounded-[20px] border border-[#eaded3] bg-white p-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#5a8b86]">
                    4. Modelos referenciales
                  </p>

                  <h4 className="mt-1 text-sm font-black">
                    Ayuda a Tendencias Import a entender mejor el estilo que buscas
                  </h4>

                  <p className="mt-1 text-[9px] leading-4 text-[#7f746c]">
                    Puedes subir hasta 5 imágenes. Son referencias de estilo;
                    no representan un modelo exacto garantizado.
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {referencePreviews.map(
                    (preview, index) => (
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
                          onClick={() =>
                            removeReference(
                              index,
                            )
                          }
                          className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/65 !text-white"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ),
                  )}

                  {referenceFiles.length < 5 && (
                    <label className="grid aspect-square cursor-pointer place-items-center rounded-[14px] border border-dashed border-[#d8c7b9] bg-[#fffaf6] text-center">
                      <span className="px-2 text-[#5a8b86]">
                        <ImagePlus
                          size={20}
                          className="mx-auto"
                        />
                        <span className="mt-1 block text-[8px] font-black">
                          Subir imágenes
                        </span>
                      </span>

                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={
                          handleReferenceSelection
                        }
                      />
                    </label>
                  )}
                </div>

                <p className="mt-2 text-[8px] text-[#8b8078]">
                  {referenceFiles.length}/5 imágenes
                </p>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-[.1em] text-[#7f746c]">
                  5. Observación opcional
                </label>

                <textarea
                  value={note}
                  onChange={(event) =>
                    setNote(
                      event.target.value,
                    )
                  }
                  placeholder="Ej. Prefiero tonos neutros, más conjuntos, menos vestidos..."
                  className="ti-input mt-2 min-h-20 py-3"
                />
              </div>

              {selectedPrice && (
                <div className="rounded-[18px] bg-[#f4faf8] p-4">
                  <p className="text-[8px] font-black uppercase tracking-[.1em] text-[#5a8b86]">
                    Total referencial
                  </p>

                  <p className="mt-1 text-2xl font-black">
                    {money(
                      Number(
                        selectedPrice.price_pen,
                      ),
                    )}
                  </p>

                  <p className="mt-1 text-[9px] text-[#7f746c]">
                    {quantity} prendas · Todo es a pedido
                  </p>
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={
                    !canAdd ||
                    uploadingReferences
                  }
                  onClick={addToCart}
                  className="flex min-h-13 items-center justify-center gap-2 rounded-[18px] bg-[#5a8b86] px-5 text-sm font-black !text-white disabled:opacity-35"
                >
                  {uploadingReferences ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : added ? (
                    <Check size={17} />
                  ) : (
                    <ShoppingBag
                      size={17}
                    />
                  )}

                  {uploadingReferences
                    ? "Subiendo referencias..."
                    : added
                      ? "Agregado"
                      : "Agregar al carrito"}
                </button>

                <button
                  type="button"
                  disabled={
                    !canAdd ||
                    uploadingReferences
                  }
                  onClick={
                    sendCurrentToWhatsApp
                  }
                  className="flex min-h-13 items-center justify-center gap-2 rounded-[18px] bg-[#25D366] px-5 text-sm font-black !text-white disabled:opacity-35"
                >
                  <MessageCircle
                    size={18}
                  />
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
            onClick={() =>
              setCartOpen(false)
            }
            className="absolute inset-0"
          />

          <aside className="absolute bottom-0 right-0 top-0 flex w-full max-w-md flex-col bg-[#fffaf6] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#eaded3] p-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.12em] text-[#5a8b86]">
                  Pacas a pedido
                </p>

                <h3 className="mt-1 text-xl font-black">
                  Tu carrito
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCartOpen(false)
                }
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

                    <p className="mt-3 font-black">
                      Tu carrito está vacío
                    </p>
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
                          {item.quantity} prendas ·{" "}
                          {item.sizeRange} ·{" "}
                          {item.preference}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeItem(
                            item.id,
                          )
                        }
                        className="grid size-9 shrink-0 place-items-center rounded-full bg-[#fff0eb] text-[#b63a2c]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {item.references.length >
                      0 && (
                      <div className="mt-3 flex gap-1.5">
                        {item.references.map(
                          (
                            reference,
                            index,
                          ) => (
                            <img
                              key={
                                reference.url
                              }
                              src={
                                reference.url
                              }
                              alt={`Referencia ${
                                index + 1
                              }`}
                              loading="lazy"
                              className="size-10 rounded-[9px] object-cover"
                            />
                          ),
                        )}
                      </div>
                    )}

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
              <p className="text-[8px] font-black uppercase tracking-[.08em] text-[#8b8078]">
                Total referencial
              </p>

              <p className="mt-1 text-2xl font-black">
                {money(cartTotal)}
              </p>

              <p className="mt-1 text-[8px] text-[#8b8078]">
                {cartPieces} prendas · Todo es a pedido
              </p>

              <button
                type="button"
                disabled={
                  cart.length === 0
                }
                onClick={() =>
                  openWhatsApp(cart)
                }
                className="mt-4 flex min-h-13 w-full items-center justify-center gap-2 rounded-[18px] bg-[#25D366] px-5 text-sm font-black !text-white disabled:opacity-35"
              >
                <MessageCircle
                  size={18}
                />
                Enviar pedido a WhatsApp
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
