"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, MapPin, ShoppingBag, Upload, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const CART_KEY = "tendencias-series-cart";

type Product = {
  id: string;
  code: string;
  name: string;
  cover_url: string | null;
  sizes: string[];
  status: "stock" | "preorder";
  price: number;
  price_preorder: number | null;
  price_stock: number | null;
  series_available: number;
  preorder_series_available: number;
  stock_series_available: number;
};

type PaymentAccount = {
  id: string;
  method: string;
  label: string;
  holder: string | null;
  account_number: string | null;
  cci: string | null;
  qr_url: string | null;
  instructions: string | null;
};

type CartLine = Product & {
  qty: number;
  sale_mode: "STOCK" | "PREORDER";
  unit_price: number;
};

export function CheckoutForm({
  products,
  paymentAccounts,
}: {
  products: Product[];
  paymentAccounts: PaymentAccount[];
}) {
  const supabase = createClient();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [deliveryType, setDeliveryType] = useState("AGENCIA");
  const [deliveryAgency, setDeliveryAgency] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryReference, setDeliveryReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(paymentAccounts[0]?.method ?? "");
  const [proof, setProof] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ code: string; total: number; status: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) {
        setCart([]);
        return;
      }

      const saved = JSON.parse(raw) as Record<string, { qty: number }>;
      const lines: CartLine[] = [];

      for (const product of products) {
        const qty = Number(saved[product.id]?.qty ?? 0);
        if (qty <= 0) continue;

        const saleMode: "STOCK" | "PREORDER" =
          Number(product.stock_series_available ?? 0) > 0 ? "STOCK" : "PREORDER";

        const available =
          saleMode === "STOCK"
            ? Number(product.stock_series_available ?? 0)
            : Number(product.preorder_series_available ?? 0);

        const unitPrice =
          saleMode === "STOCK"
            ? Number(product.price_stock ?? product.price ?? 0)
            : Number(product.price_preorder ?? product.price ?? 0);

        const finalQty = Math.min(qty, available);
        if (finalQty > 0) {
          lines.push({
            ...product,
            qty: finalQty,
            sale_mode: saleMode,
            unit_price: unitPrice,
          });
        }
      }

      setCart(lines);
    } catch {
      setCart([]);
    } finally {
      setLoading(false);
    }
  }, [products]);

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.unit_price * line.qty, 0),
    [cart]
  );

  const selectedAccount = paymentAccounts.find((item) => item.method === paymentMethod);

  async function uploadProof() {
    if (!proof) return "";

    const ext = proof.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `checkout/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(path, proof, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      throw new Error("No pudimos subir el comprobante. Intenta nuevamente.");
    }

    return path;
  }

  async function submitOrder(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!clientName.trim()) return setError("Ingresa tu nombre.");
    if (clientPhone.replace(/\D/g, "").length < 7) return setError("Ingresa un WhatsApp válido.");
    if (!cart.length) return setError("Tu carrito está vacío.");
    if (deliveryType === "AGENCIA" && !deliveryAgency.trim()) return setError("Indica la agencia de envío.");
    if (deliveryType === "DELIVERY" && !deliveryAddress.trim()) return setError("Indica la dirección de entrega.");

    setSubmitting(true);

    try {
      const paymentProofPath = await uploadProof();

      const payload = {
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        client_email: clientEmail.trim(),
        delivery_type: deliveryType,
        delivery_agency: deliveryAgency.trim(),
        delivery_city: deliveryCity.trim(),
        delivery_address: deliveryAddress.trim(),
        delivery_reference: deliveryReference.trim(),
        payment_method: paymentMethod,
        payment_proof_path: paymentProofPath,
        shipping_cost: 0,
        notes: notes.trim(),
        items: cart.map((line) => ({
          product_id: line.id,
          qty_series: line.qty,
          sale_mode: line.sale_mode,
          requested_mix: [],
        })),
      };

      const { data, error: rpcError } = await supabase.rpc("create_public_customer_order_v4", {
        p_payload: payload,
      });

      if (rpcError) throw new Error(rpcError.message);

      localStorage.removeItem(CART_KEY);
      setSuccess({
        code: data.code,
        total: Number(data.total ?? subtotal),
        status: data.status,
      });
      setCart([]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos registrar el pedido.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="rounded-[28px] border border-[#eaded3] bg-white p-8 text-center text-sm text-[#7f746c]">Cargando carrito...</div>;
  }

  if (success) {
    return (
      <div className="mx-auto max-w-xl rounded-[30px] border border-[#dbe9e5] bg-white p-7 text-center shadow-sm">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#edf7f5] text-[#5a8b86]"><CheckCircle2 size={30} /></span>
        <p className="mt-5 text-xs font-black uppercase tracking-[.16em] text-[#5a8b86]">Pedido registrado</p>
        <h2 className="mt-2 text-3xl font-black">{success.code}</h2>
        <p className="mt-3 text-sm leading-6 text-[#7f746c]">Tendencias Import ya puede ver tu pedido en su sistema.</p>
        <div className="mt-5 rounded-[20px] bg-[#fff7f0] p-4">
          <p className="text-xs font-bold text-[#7f746c]">Total</p>
          <p className="mt-1 text-2xl font-black text-[#b63a2c]">S/ {success.total.toFixed(2)}</p>
        </div>
        <Link href="/series" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-[17px] bg-[#b63a2c] px-6 text-sm font-black text-white">Volver a Series</Link>
      </div>
    );
  }

  if (!cart.length) {
    return (
      <div className="rounded-[28px] border border-[#eaded3] bg-white p-8 text-center">
        <ShoppingBag size={28} className="mx-auto text-[#5a8b86]" />
        <p className="mt-4 font-black">Tu carrito está vacío</p>
        <Link href="/series" className="mt-4 inline-flex rounded-full bg-[#b63a2c] px-5 py-3 text-sm font-black text-white">Ver Series</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submitOrder} className="grid gap-6 lg:grid-cols-[1fr_390px]">
      <div className="space-y-5">
        <section className="rounded-[26px] border border-[#eaded3] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-[#f4faf8] text-[#5a8b86]"><UserRound size={16} /></span>
            <div>
              <p className="font-black">Tus datos</p>
              <p className="text-xs text-[#7f746c]">Con tu WhatsApp quedas registrada como clienta para esta compra.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-black">Nombre *</label>
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="ti-input" placeholder="Tu nombre" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black">WhatsApp *</label>
              <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="ti-input" placeholder="999 999 999" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-black">Correo opcional</label>
              <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="ti-input" />
            </div>
          </div>
        </section>

        <section className="rounded-[26px] border border-[#eaded3] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-[#fff6e9] text-[#d39218]"><MapPin size={16} /></span>
            <p className="font-black">Datos de envío</p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-black">Tipo de entrega</label>
              <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} className="ti-input">
                <option value="AGENCIA">Envío por agencia</option>
                <option value="DELIVERY">Delivery</option>
                <option value="RECOJO">Recojo</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-black">Ciudad / destino</label>
              <input value={deliveryCity} onChange={(e) => setDeliveryCity(e.target.value)} className="ti-input" />
            </div>

            {deliveryType === "AGENCIA" && (
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-black">Agencia *</label>
                <input value={deliveryAgency} onChange={(e) => setDeliveryAgency(e.target.value)} className="ti-input" placeholder="Shalom, Marvisur, Olva..." />
              </div>
            )}

            {deliveryType === "DELIVERY" && (
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-black">Dirección *</label>
                <input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} className="ti-input" />
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-black">Referencia</label>
              <input value={deliveryReference} onChange={(e) => setDeliveryReference(e.target.value)} className="ti-input" />
            </div>
          </div>
        </section>

        <section className="rounded-[26px] border border-[#eaded3] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-[#fff0e9] text-[#b63a2c]"><CreditCard size={16} /></span>
            <p className="font-black">Pago</p>
          </div>

          {paymentAccounts.length === 0 ? (
            <p className="mt-4 rounded-[18px] bg-[#fff8e9] p-4 text-sm text-[#8a651f]">Las cuentas aún no están configuradas. Puedes registrar el pedido y Tendencias Import te enviará los datos de pago.</p>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {paymentAccounts.map((account) => (
                  <button
                    type="button"
                    key={account.id}
                    onClick={() => setPaymentMethod(account.method)}
                    className={`rounded-full px-4 py-2 text-xs font-black ${paymentMethod === account.method ? "bg-[#b63a2c] text-white" : "border border-[#eaded3] bg-white text-[#6f655e]"}`}
                  >
                    {account.label}
                  </button>
                ))}
              </div>

              {selectedAccount && (
                <div className="mt-4 grid gap-4 rounded-[20px] bg-[#fff8f2] p-4 sm:grid-cols-[1fr_auto]">
                  <div className="text-sm">
                    <p className="font-black">{selectedAccount.label}</p>
                    {selectedAccount.holder && <p className="mt-2 text-[#6f655e]">Titular: <b>{selectedAccount.holder}</b></p>}
                    {selectedAccount.account_number && <p className="mt-1 text-[#6f655e]">Número / cuenta: <b>{selectedAccount.account_number}</b></p>}
                    {selectedAccount.cci && <p className="mt-1 text-[#6f655e]">CCI: <b>{selectedAccount.cci}</b></p>}
                    {selectedAccount.instructions && <p className="mt-2 text-xs leading-5 text-[#7f746c]">{selectedAccount.instructions}</p>}
                  </div>
                  {selectedAccount.qr_url && <img src={selectedAccount.qr_url} alt={`QR ${selectedAccount.label}`} className="size-32 rounded-[16px] object-contain" />}
                </div>
              )}
            </>
          )}

          <label className="mt-5 block cursor-pointer rounded-[18px] border border-dashed border-[#d7c7bb] bg-[#fffdfb] p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-[#f4faf8] text-[#5a8b86]"><Upload size={15} /></span>
              <div>
                <p className="text-sm font-black">Comprobante de pago</p>
                <p className="text-[10px] text-[#7f746c]">Opcional. Si lo subes, pasa a “Pago en revisión”.</p>
              </div>
            </div>
            <input type="file" accept="image/*" onChange={(e) => setProof(e.target.files?.[0] ?? null)} className="mt-3 block w-full text-xs" />
          </label>

          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="ti-input mt-4 min-h-20 py-3" placeholder="Nota opcional..." />
        </section>

        {error && <div className="rounded-[18px] bg-[#fff0eb] p-4 text-sm font-bold text-[#a33d31]">{error}</div>}
      </div>

      <aside className="h-fit rounded-[26px] border border-[#eaded3] bg-white p-5 shadow-sm lg:sticky lg:top-24">
        <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#5a8b86]">Resumen</p>
        <div className="mt-4 space-y-3">
          {cart.map((line) => (
            <div key={line.id} className="flex gap-3 border-b border-[#f0e7df] pb-3">
              <div className="size-16 shrink-0 overflow-hidden rounded-[14px] bg-[#efe5dc]">
                {line.cover_url && <img src={line.cover_url} alt={line.name} className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black text-[#5a8b86]">{line.code}</p>
                <p className="truncate text-xs font-black">{line.name}</p>
                <p className="mt-1 text-[9px] font-bold text-[#8b8078]">{line.sale_mode === "STOCK" ? "Entrega inmediata" : "Preventa"} · {line.qty} serie(s)</p>
                <p className="mt-1 text-xs font-black text-[#b63a2c]">S/ {(line.unit_price * line.qty).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-bold text-[#7f746c]">Total</span>
          <b className="text-2xl text-[#b63a2c]">S/ {subtotal.toFixed(2)}</b>
        </div>

        <button disabled={submitting} className="mt-5 flex min-h-13 w-full items-center justify-center rounded-[18px] bg-[#b63a2c] px-5 text-sm font-black text-white disabled:opacity-50">
          {submitting ? "Registrando pedido..." : "Finalizar pedido"}
        </button>
      </aside>
    </form>
  );
}
