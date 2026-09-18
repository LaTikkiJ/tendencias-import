"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Minus, Plus, Save, Trash2 } from "lucide-react";
import { createManualOrderV4 } from "@/app/admin/pedidos/actions";

type Product = {
  id: string;
  code: string;
  name: string;
  sizes: string[];
  cover_url: string | null;
  price_preorder: number | null;
  price_stock: number | null;
  preorder_series_available: number;
  stock_series_available: number;
};

type Line = {
  key: string;
  product_id: string;
  sale_mode: "STOCK" | "PREORDER";
  qty_series: number;
};

function newLine(product?: Product): Line {
  return {
    key: crypto.randomUUID(),
    product_id: product?.id ?? "",
    sale_mode: Number(product?.stock_series_available ?? 0) > 0 ? "STOCK" : "PREORDER",
    qty_series: 1,
  };
}

export function ManualOrderForm({ products }: { products: Product[] }) {
  const [step, setStep] = useState(1);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [source, setSource] = useState<"MANUAL" | "WHATSAPP">("MANUAL");
  const [deliveryType, setDeliveryType] = useState("AGENCIA");
  const [deliveryAgency, setDeliveryAgency] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryReference, setDeliveryReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("YAPE");
  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([newLine(products[0])]);

  const productMap = useMemo(
    () => new Map(products.map((item) => [item.id, item])),
    [products]
  );

  const computed = lines.map((line) => {
    const product = productMap.get(line.product_id);
    const available =
      line.sale_mode === "STOCK"
        ? Number(product?.stock_series_available ?? 0)
        : Number(product?.preorder_series_available ?? 0);
    const unitPrice =
      line.sale_mode === "STOCK"
        ? Number(product?.price_stock ?? 0)
        : Number(product?.price_preorder ?? 0);

    return {
      ...line,
      product,
      available,
      unitPrice,
      subtotal: unitPrice * Number(line.qty_series || 0),
    };
  });

  const subtotal = computed.reduce((sum, line) => sum + line.subtotal, 0);
  const total = subtotal + Number(shippingCost || 0);

  const payload = {
    client_name: clientName.trim(),
    client_phone: clientPhone.trim(),
    client_email: clientEmail.trim(),
    source,
    delivery_type: deliveryType,
    delivery_agency: deliveryAgency.trim(),
    delivery_city: deliveryCity.trim(),
    delivery_address: deliveryAddress.trim(),
    delivery_reference: deliveryReference.trim(),
    payment_method: paymentMethod,
    shipping_cost: Number(shippingCost || 0),
    notes: notes.trim(),
    items: computed.map((line) => ({
      product_id: line.product_id,
      qty_series: Number(line.qty_series || 0),
      sale_mode: line.sale_mode,
      requested_mix: [],
    })),
  };

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line))
    );
  }

  function selectProduct(key: string, productId: string) {
    const product = productMap.get(productId);
    updateLine(key, {
      product_id: productId,
      sale_mode: Number(product?.stock_series_available ?? 0) > 0 ? "STOCK" : "PREORDER",
      qty_series: 1,
    });
  }

  function removeLine(key: string) {
    setLines((current) =>
      current.length === 1 ? current : current.filter((line) => line.key !== key)
    );
  }

  const step1Valid =
    clientName.trim().length > 1 && clientPhone.replace(/\D/g, "").length >= 7;

  const step3Valid =
    computed.length > 0 &&
    computed.every(
      (line) =>
        line.product_id &&
        line.qty_series > 0 &&
        line.qty_series <= line.available &&
        line.unitPrice > 0
    );

  return (
    <form action={createManualOrderV4} className="space-y-6">
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />

      <div className="grid grid-cols-3 gap-2">
        {[
          [1, "Cliente"],
          [2, "Envío"],
          [3, "Productos"],
        ].map(([number, label]) => (
          <div
            key={number}
            className={`rounded-[18px] p-3 ${step >= Number(number) ? "bg-[#8f3a2e] text-white" : "bg-white text-[#8b8078]"}`}
          >
            <p className="text-[9px] font-black uppercase">Paso {number}</p>
            <p className="mt-1 text-sm font-black">{label}</p>
          </div>
        ))}
      </div>

      {step === 1 && (
        <section className="rounded-[28px] border border-[#eaded3] bg-white p-5 shadow-sm">
          <p className="font-black">Primero identifica a la clienta</p>
          <p className="mt-1 text-xs text-[#7f746c]">Nombre y WhatsApp son obligatorios antes de continuar.</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-black">Nombre *</label>
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="ti-input" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black">WhatsApp *</label>
              <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="ti-input" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black">Correo opcional</label>
              <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="ti-input" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black">Origen</label>
              <select value={source} onChange={(e) => setSource(e.target.value as "MANUAL" | "WHATSAPP")} className="ti-input">
                <option value="MANUAL">Venta manual</option>
                <option value="WHATSAPP">Llegó por WhatsApp</option>
              </select>
            </div>
          </div>

          <button type="button" disabled={!step1Valid} onClick={() => setStep(2)} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-[17px] bg-[#b63a2c] text-sm font-black text-white disabled:opacity-40">
            Continuar <ArrowRight size={16} />
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="rounded-[28px] border border-[#eaded3] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-black">Datos de envío</p>
              <p className="mt-1 text-xs text-[#7f746c]">{clientName} · {clientPhone}</p>
            </div>
            <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-2 text-xs font-black text-[#8f3a2e]"><ArrowLeft size={14} /> Atrás</button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-black">Entrega</label>
              <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} className="ti-input">
                <option value="AGENCIA">Agencia</option>
                <option value="DELIVERY">Delivery</option>
                <option value="RECOJO">Recojo</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-black">Ciudad</label>
              <input value={deliveryCity} onChange={(e) => setDeliveryCity(e.target.value)} className="ti-input" />
            </div>
            {deliveryType === "AGENCIA" && (
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-black">Agencia</label>
                <input value={deliveryAgency} onChange={(e) => setDeliveryAgency(e.target.value)} className="ti-input" placeholder="Shalom, Marvisur..." />
              </div>
            )}
            {deliveryType === "DELIVERY" && (
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-black">Dirección</label>
                <input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} className="ti-input" />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-black">Referencia</label>
              <input value={deliveryReference} onChange={(e) => setDeliveryReference(e.target.value)} className="ti-input" />
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[17px] border border-[#eaded3] bg-white text-sm font-black"><ArrowLeft size={15} /> Atrás</button>
            <button type="button" onClick={() => setStep(3)} className="flex min-h-12 flex-[2] items-center justify-center gap-2 rounded-[17px] bg-[#b63a2c] text-sm font-black text-white">Agregar productos <ArrowRight size={15} /></button>
          </div>
        </section>
      )}

      {step === 3 && (
        <>
          <section className="rounded-[28px] border border-[#eaded3] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-black">Productos</p>
                <p className="mt-1 text-xs text-[#7f746c]">Usa disponibilidad real de stock o preventa.</p>
              </div>
              <button type="button" onClick={() => setLines((current) => [...current, newLine(products[0])])} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#fff0e9] px-4 text-xs font-black text-[#9b382b]"><Plus size={14} /> Agregar código</button>
            </div>

            <div className="mt-5 space-y-3">
              {computed.map((line) => (
                <div key={line.key} className="grid gap-3 rounded-[20px] border border-[#eaded3] p-4 md:grid-cols-[1fr_150px_120px_auto]">
                  <select value={line.product_id} onChange={(e) => selectProduct(line.key, e.target.value)} className="ti-input">
                    {products.map((product) => <option key={product.id} value={product.id}>{product.code} · {product.name}</option>)}
                  </select>

                  <select value={line.sale_mode} onChange={(e) => updateLine(line.key, { sale_mode: e.target.value as "STOCK" | "PREORDER", qty_series: 1 })} className="ti-input">
                    {Number(line.product?.stock_series_available ?? 0) > 0 && <option value="STOCK">Stock ({line.product?.stock_series_available})</option>}
                    {Number(line.product?.preorder_series_available ?? 0) > 0 && <option value="PREORDER">Preventa ({line.product?.preorder_series_available})</option>}
                  </select>

                  <div className="flex items-center justify-between rounded-[16px] border border-[#eaded3] px-2">
                    <button type="button" onClick={() => updateLine(line.key, { qty_series: Math.max(1, line.qty_series - 1) })} className="grid size-8 place-items-center"><Minus size={13} /></button>
                    <b>{line.qty_series}</b>
                    <button type="button" disabled={line.qty_series >= line.available} onClick={() => updateLine(line.key, { qty_series: Math.min(line.available, line.qty_series + 1) })} className="grid size-8 place-items-center disabled:opacity-30"><Plus size={13} /></button>
                  </div>

                  <button type="button" onClick={() => removeLine(line.key)} className="grid size-11 place-items-center rounded-full bg-[#fff0eb] text-[#b63a2c]"><Trash2 size={14} /></button>

                  <div className="md:col-span-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#7f746c]">Disponible: {line.available}</span>
                    <span className="font-black text-[#b63a2c]">S/ {line.unitPrice.toFixed(2)} × {line.qty_series} = S/ {line.subtotal.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 rounded-[28px] border border-[#eaded3] bg-white p-5 shadow-sm sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-black">Método de pago</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="ti-input">
                <option value="YAPE">Yape</option><option value="PLIN">Plin</option><option value="BCP">BCP</option><option value="INTERBANK">Interbank</option><option value="TRANSFERENCIA">Transferencia</option><option value="EFECTIVO">Efectivo</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-black">Envío</label>
              <input type="number" min="0" step="0.01" value={shippingCost} onChange={(e) => setShippingCost(Number(e.target.value))} className="ti-input" />
            </div>
            <div className="rounded-[18px] bg-[#fff0e9] p-4">
              <p className="text-[9px] font-black uppercase text-[#9b382b]">Total</p>
              <p className="mt-1 text-2xl font-black text-[#9b382b]">S/ {total.toFixed(2)}</p>
            </div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="ti-input min-h-20 py-3 sm:col-span-3" placeholder="Notas..." />
          </section>

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(2)} className="flex min-h-13 flex-1 items-center justify-center gap-2 rounded-[18px] border border-[#eaded3] bg-white text-sm font-black"><ArrowLeft size={15} /> Atrás</button>
            <button disabled={!step3Valid} className="flex min-h-13 flex-[2] items-center justify-center gap-2 rounded-[18px] bg-[#b63a2c] text-sm font-black text-white disabled:opacity-40"><Save size={16} /> Registrar venta y descontar inventario</button>
          </div>
        </>
      )}
    </form>
  );
}
