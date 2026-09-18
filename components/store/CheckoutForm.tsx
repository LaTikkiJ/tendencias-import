"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, MapPin, MessageCircle, ShoppingBag, Upload, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const CART_KEY = "tendencias-series-cart-v7";

type MixChoice = { size: string; color: string; qty: number };
type CartLine = {
  cart_key: string;
  product_id: string;
  code: string;
  name: string;
  cover_url: string | null;
  sizes: string[];
  sale_mode: "STOCK" | "PREORDER";
  mix_mode: "AUTO" | "CUSTOM";
  qty_series: number;
  unit_price: number;
  requested_mix: MixChoice[];
};

type Product = {
  id: string;
  name: string;
  cover_url: string | null;
  price_preorder: number | null;
  price_stock: number | null;
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

function mixText(mix: MixChoice[]) {
  return mix.map((m) => `${m.size}: ${m.color}${m.qty > 1 ? ` x${m.qty}` : ""}`).join(" · ");
}

export function CheckoutForm({
  products,
  paymentAccounts,
  whatsappNumber,
}: {
  products: Product[];
  paymentAccounts: PaymentAccount[];
  whatsappNumber: string;
}) {
  const supabase = createClient();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    code: string;
    total: number;
    whatsappUrl: string;
  } | null>(null);

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

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      const valid = (parsed as CartLine[]).filter((line) => {
        const product = productMap.get(line.product_id);
        if (!product) return false;
        const available =
          line.sale_mode === "STOCK"
            ? Number(product.stock_series_available ?? 0)
            : Number(product.preorder_series_available ?? 0);
        return line.qty_series > 0 && available >= line.qty_series;
      });

      setCart(valid);
    } catch {
      setCart([]);
    } finally {
      setLoading(false);
    }
  }, [productMap]);

  const normalizedCart = useMemo(
    () =>
      cart.map((line) => {
        const product = productMap.get(line.product_id);
        const price =
          line.sale_mode === "STOCK"
            ? Number(product?.price_stock ?? line.unit_price)
            : Number(product?.price_preorder ?? line.unit_price);
        return {
          ...line,
          name: product?.name ?? line.name,
          cover_url: product?.cover_url ?? line.cover_url,
          unit_price: price,
        };
      }),
    [cart, productMap]
  );

  const subtotal = normalizedCart.reduce(
    (sum, line) => sum + line.unit_price * line.qty_series,
    0
  );

  const selectedAccount = paymentAccounts.find((a) => a.method === paymentMethod);

  async function uploadProof() {
    if (!proof) return "";
    const ext = proof.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `checkout/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(path, proof, { cacheControl: "3600", upsert: false });
    if (uploadError) throw new Error("No pudimos subir el comprobante.");
    return path;
  }

  async function submitOrder(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!clientName.trim()) return setError("Ingresa tu nombre.");
    if (clientPhone.replace(/\D/g, "").length < 7) return setError("Ingresa un WhatsApp válido.");
    if (!normalizedCart.length) return setError("Tu carrito está vacío.");
    if (deliveryType === "AGENCIA" && !deliveryAgency.trim()) return setError("Indica la agencia.");
    if (deliveryType === "DELIVERY" && !deliveryAddress.trim()) return setError("Indica la dirección.");

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
        items: normalizedCart.map((line) => ({
          product_id: line.product_id,
          qty_series: line.qty_series,
          sale_mode: line.sale_mode,
          mix_mode: line.mix_mode,
          requested_mix: line.requested_mix,
        })),
      };

      const { data, error: rpcError } = await supabase.rpc(
        "create_public_customer_order_v4",
        { p_payload: payload }
      );

      if (rpcError) throw new Error(rpcError.message);

      localStorage.removeItem(CART_KEY);

      const finalTotal = Number(data.total ?? subtotal);
      const number = whatsappNumber.replace(/\D/g, "");
      const message = [
        "Hola Tendencias Import 💛",
        `Acabo de registrar mi pedido ${data.code} en la web.`,
        `Nombre: ${clientName.trim()}`,
        `WhatsApp: ${clientPhone.trim()}`,
        `Total: S/ ${finalTotal.toFixed(2)}`,
        "Quedo atenta a la confirmación de mi pedido.",
      ].join("\n");

      const whatsappUrl = number
        ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
        : "";

      setCart([]);
      setSuccess({
        code: data.code,
        total: finalTotal,
        whatsappUrl,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos registrar el pedido.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="rounded-[28px] border border-[#eaded3] bg-white p-8 text-center">Cargando carrito...</div>;
  }

  if (success) {
    return (
      <div className="mx-auto max-w-xl rounded-[30px] border border-[#dbe9e5] bg-white p-7 text-center shadow-sm">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#edf7f5] text-[#5a8b86]">
          <CheckCircle2 size={30} />
        </span>
        <p className="mt-5 text-xs font-black uppercase tracking-[.16em] text-[#5a8b86]">Pedido registrado</p>
        <h2 className="mt-2 text-3xl font-black">{success.code}</h2>
        <p className="mt-3 text-sm leading-6 text-[#7f746c]">
          El surtido elegido ya quedó guardado y reservado en el sistema.
        </p>
        <div className="mt-5 rounded-[20px] bg-[#fff7f0] p-4">
          <p className="text-xs font-bold text-[#7f746c]">Total</p>
          <p className="mt-1 text-2xl font-black text-[#b63a2c]">S/ {success.total.toFixed(2)}</p>
        </div>
        {success.whatsappUrl && (
          <a
            href={success.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 flex min-h-13 w-full items-center justify-center gap-2 rounded-[18px] bg-[#25D366] px-6 text-sm font-black !text-white"
          >
            <MessageCircle size={18} />
            Continuar por WhatsApp
          </a>
        )}

        <Link
          href="/series"
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-[17px] border border-[#eaded3] bg-white px-6 text-xs font-black text-[#6f655e]"
        >
          Seguir viendo Series
        </Link>
      </div>
    );
  }

  if (!normalizedCart.length) {
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
            <div><p className="font-black">Tus datos</p><p className="text-xs text-[#7f746c]">Nombre + WhatsApp.</p></div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="ti-input" placeholder="Nombre *" />
            <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="ti-input" placeholder="WhatsApp *" />
            <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="ti-input sm:col-span-2" placeholder="Correo opcional" />
          </div>
        </section>

        <section className="rounded-[26px] border border-[#eaded3] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3"><MapPin size={17} className="text-[#d39218]" /><p className="font-black">Datos de envío</p></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} className="ti-input">
              <option value="AGENCIA">Agencia</option><option value="DELIVERY">Delivery</option><option value="RECOJO">Recojo</option>
            </select>
            <input value={deliveryCity} onChange={(e) => setDeliveryCity(e.target.value)} className="ti-input" placeholder="Ciudad / destino" />
            {deliveryType === "AGENCIA" && <input value={deliveryAgency} onChange={(e) => setDeliveryAgency(e.target.value)} className="ti-input sm:col-span-2" placeholder="Agencia *" />}
            {deliveryType === "DELIVERY" && <input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} className="ti-input sm:col-span-2" placeholder="Dirección *" />}
            <input value={deliveryReference} onChange={(e) => setDeliveryReference(e.target.value)} className="ti-input sm:col-span-2" placeholder="Referencia" />
          </div>
        </section>

        <section className="rounded-[26px] border border-[#eaded3] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3"><CreditCard size={17} className="text-[#b63a2c]" /><p className="font-black">Pago</p></div>
          <div className="mt-4 flex flex-wrap gap-2">
            {paymentAccounts.map((account) => (
              <button key={account.id} type="button" onClick={() => setPaymentMethod(account.method)} className={`rounded-full px-4 py-2 text-xs font-black ${paymentMethod === account.method ? "bg-[#b63a2c] text-white" : "border border-[#eaded3] bg-white"}`}>
                {account.label}
              </button>
            ))}
          </div>
          {selectedAccount && (
            <div className="mt-4 rounded-[18px] bg-[#fff8f2] p-4 text-sm">
              <b>{selectedAccount.label}</b>
              {selectedAccount.holder && <p className="mt-2">Titular: {selectedAccount.holder}</p>}
              {selectedAccount.account_number && <p>Cuenta: {selectedAccount.account_number}</p>}
              {selectedAccount.cci && <p>CCI: {selectedAccount.cci}</p>}
              {selectedAccount.qr_url && <img src={selectedAccount.qr_url} alt="QR" className="mt-3 size-32 rounded-[14px] object-contain" />}
            </div>
          )}
          <label className="mt-4 block cursor-pointer rounded-[18px] border border-dashed border-[#d7c7bb] p-4">
            <div className="flex items-center gap-2"><Upload size={15} /><b className="text-sm">Comprobante opcional</b></div>
            <input type="file" accept="image/*" onChange={(e) => setProof(e.target.files?.[0] ?? null)} className="mt-3 block w-full text-xs" />
          </label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="ti-input mt-4 min-h-20 py-3" placeholder="Nota opcional..." />
        </section>

        {error && <div className="rounded-[18px] bg-[#fff0eb] p-4 text-sm font-bold text-[#a33d31]">{error}</div>}
      </div>

      <aside className="h-fit rounded-[26px] border border-[#eaded3] bg-white p-5 shadow-sm lg:sticky lg:top-24">
        <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#5a8b86]">Resumen</p>
        <div className="mt-4 space-y-3">
          {normalizedCart.map((line) => (
            <div key={line.cart_key} className="border-b border-[#f0e7df] pb-3">
              <div className="flex gap-3">
                <div className="size-16 shrink-0 overflow-hidden rounded-[14px] bg-[#efe5dc]">
                  {line.cover_url && <img src={line.cover_url} alt={line.name} className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black text-[#5a8b86]">{line.code}</p>
                  <p className="truncate text-xs font-black">{line.name}</p>
                  <p className="mt-1 text-[9px] text-[#8b8078]">{line.sale_mode === "STOCK" ? "Stock" : "Preventa"} · {line.qty_series} serie(s)</p>
                  <p className="mt-1 text-xs font-black text-[#b63a2c]">S/ {(line.unit_price * line.qty_series).toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-2 rounded-[12px] bg-[#f8f4f0] p-2.5">
                <p className="text-[8px] font-black uppercase text-[#8b8078]">Surtido</p>
                <p className="mt-1 text-[8px] font-bold leading-4">{line.mix_mode === "AUTO" ? "Automático · prioriza remanentes" : mixText(line.requested_mix)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between"><span className="text-sm font-bold text-[#7f746c]">Total</span><b className="text-2xl text-[#b63a2c]">S/ {subtotal.toFixed(2)}</b></div>
        <button disabled={submitting} className="mt-5 flex min-h-13 w-full items-center justify-center rounded-[18px] bg-[#b63a2c] px-5 text-sm font-black text-white disabled:opacity-50">
          {submitting ? "Registrando pedido..." : "Finalizar pedido"}
        </button>
      </aside>
    </form>
  );
}
