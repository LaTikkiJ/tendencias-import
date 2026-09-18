"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Minus, Plus, Save, Trash2 } from "lucide-react";
import { createManualOrderV4 } from "@/app/admin/pedidos/actions";

type SaleMode = "STOCK" | "PREORDER";
type MixMode = "AUTO" | "CUSTOM";
type MixChoice = { size: string; color: string; qty: number };

type Product = {
  id: string;
  code: string;
  name: string;
  sizes: string[];
  price_preorder: number | null;
  price_stock: number | null;
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

type Line = {
  key: string;
  product_id: string;
  sale_mode: SaleMode;
  mix_mode: MixMode;
  qty_series: number;
  requested_mix: MixChoice[];
};

function makeLine(product?: Product): Line {
  return {
    key: crypto.randomUUID(),
    product_id: product?.id ?? "",
    sale_mode: Number(product?.stock_series_available ?? 0) > 0 ? "STOCK" : "PREORDER",
    mix_mode: "AUTO",
    qty_series: 1,
    requested_mix: [],
  };
}

export function ManualOrderForm({
  products,
  availability,
}: {
  products: Product[];
  availability: AvailabilityRow[];
}) {
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
  const [lines, setLines] = useState<Line[]>([makeLine(products[0])]);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function rowsFor(productId: string, saleMode: SaleMode, size: string) {
    return availability.filter(
      (row) =>
        row.product_id === productId &&
        row.sale_mode === saleMode &&
        row.size === size &&
        Number(row.available) > 0
    );
  }

  function selectedForSize(line: Line, size: string) {
    return line.requested_mix
      .filter((m) => m.size === size)
      .reduce((sum, m) => sum + m.qty, 0);
  }

  function setMix(lineKey: string, size: string, color: string, qty: number) {
    setLines((current) =>
      current.map((line) => {
        if (line.key !== lineKey) return line;
        const next = line.requested_mix.filter((m) => !(m.size === size && m.color === color));
        if (qty > 0) next.push({ size, color, qty });
        return { ...line, requested_mix: next };
      })
    );
  }

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
    const customValid =
      line.mix_mode === "AUTO" ||
      !!product?.sizes.every((size) => selectedForSize(line, size) === line.qty_series);

    return {
      ...line,
      product,
      available,
      unitPrice,
      customValid,
      subtotal: unitPrice * line.qty_series,
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
      qty_series: line.qty_series,
      sale_mode: line.sale_mode,
      mix_mode: line.mix_mode,
      requested_mix: line.mix_mode === "CUSTOM" ? line.requested_mix : [],
    })),
  };

  const step1Valid = clientName.trim().length > 1 && clientPhone.replace(/\D/g, "").length >= 7;
  const step3Valid = computed.every(
    (line) =>
      !!line.product_id &&
      line.qty_series > 0 &&
      line.qty_series <= line.available &&
      line.unitPrice > 0 &&
      line.customValid
  );

  return (
    <form action={createManualOrderV4} className="space-y-6">
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />

      <div className="grid grid-cols-3 gap-2">
        {[[1, "Cliente"], [2, "Envío"], [3, "Productos"]].map(([n, label]) => (
          <div key={n} className={`rounded-[18px] p-3 ${step >= Number(n) ? "bg-[#8f3a2e] text-white" : "bg-white text-[#8b8078]"}`}>
            <p className="text-[9px] font-black uppercase">Paso {n}</p>
            <p className="mt-1 text-sm font-black">{label}</p>
          </div>
        ))}
      </div>

      {step === 1 && (
        <section className="rounded-[28px] border border-[#eaded3] bg-white p-5 shadow-sm">
          <p className="font-black">Primero identifica a la clienta</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="ti-input" placeholder="Nombre *" />
            <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="ti-input" placeholder="WhatsApp *" />
            <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="ti-input" placeholder="Correo opcional" />
            <select value={source} onChange={(e) => setSource(e.target.value as "MANUAL" | "WHATSAPP")} className="ti-input">
              <option value="MANUAL">Venta manual</option>
              <option value="WHATSAPP">Llegó por WhatsApp</option>
            </select>
          </div>
          <button type="button" disabled={!step1Valid} onClick={() => setStep(2)} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-[17px] bg-[#b63a2c] text-sm font-black text-white disabled:opacity-40">
            Continuar <ArrowRight size={16} />
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="rounded-[28px] border border-[#eaded3] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div><p className="font-black">Datos de envío</p><p className="mt-1 text-xs text-[#7f746c]">{clientName} · {clientPhone}</p></div>
            <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-2 text-xs font-black text-[#8f3a2e]"><ArrowLeft size={14} /> Atrás</button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} className="ti-input">
              <option value="AGENCIA">Agencia</option><option value="DELIVERY">Delivery</option><option value="RECOJO">Recojo</option>
            </select>
            <input value={deliveryCity} onChange={(e) => setDeliveryCity(e.target.value)} className="ti-input" placeholder="Ciudad" />
            {deliveryType === "AGENCIA" && <input value={deliveryAgency} onChange={(e) => setDeliveryAgency(e.target.value)} className="ti-input sm:col-span-2" placeholder="Agencia" />}
            {deliveryType === "DELIVERY" && <input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} className="ti-input sm:col-span-2" placeholder="Dirección" />}
            <input value={deliveryReference} onChange={(e) => setDeliveryReference(e.target.value)} className="ti-input sm:col-span-2" placeholder="Referencia" />
          </div>
          <button type="button" onClick={() => setStep(3)} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-[17px] bg-[#b63a2c] text-sm font-black text-white">
            Agregar productos <ArrowRight size={16} />
          </button>
        </section>
      )}

      {step === 3 && (
        <>
          <section className="rounded-[28px] border border-[#eaded3] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-black">Productos</p>
                <p className="mt-1 text-xs text-[#7f746c]">Automático prioriza remanentes. Elegir colores respeta el surtido exacto.</p>
              </div>
              <button type="button" onClick={() => setLines((current) => [...current, makeLine(products[0])])} className="rounded-full bg-[#fff0e9] px-4 py-2 text-xs font-black text-[#9b382b]">+ Agregar código</button>
            </div>

            <div className="mt-5 space-y-4">
              {computed.map((line) => (
                <div key={line.key} className="rounded-[22px] border border-[#eaded3] p-4">
                  <div className="grid gap-3 md:grid-cols-[1fr_160px_120px_auto]">
                    <select
                      value={line.product_id}
                      onChange={(e) => {
                        const p = productMap.get(e.target.value);
                        updateLine(line.key, {
                          product_id: e.target.value,
                          sale_mode: Number(p?.stock_series_available ?? 0) > 0 ? "STOCK" : "PREORDER",
                          qty_series: 1,
                          requested_mix: [],
                        });
                      }}
                      className="ti-input"
                    >
                      {products.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
                    </select>

                    <select value={line.sale_mode} onChange={(e) => updateLine(line.key, { sale_mode: e.target.value as SaleMode, qty_series: 1, requested_mix: [] })} className="ti-input">
                      {Number(line.product?.stock_series_available ?? 0) > 0 && <option value="STOCK">Stock ({line.product?.stock_series_available})</option>}
                      {Number(line.product?.preorder_series_available ?? 0) > 0 && <option value="PREORDER">Preventa ({line.product?.preorder_series_available})</option>}
                    </select>

                    <div className="flex items-center justify-between rounded-[16px] border border-[#eaded3] px-2">
                      <button type="button" onClick={() => updateLine(line.key, { qty_series: Math.max(1, line.qty_series - 1), requested_mix: [] })}><Minus size={13} /></button>
                      <b>{line.qty_series}</b>
                      <button type="button" disabled={line.qty_series >= line.available} onClick={() => updateLine(line.key, { qty_series: Math.min(line.available, line.qty_series + 1), requested_mix: [] })} className="disabled:opacity-30"><Plus size={13} /></button>
                    </div>

                    <button type="button" onClick={() => setLines((current) => current.length === 1 ? current : current.filter((x) => x.key !== line.key))} className="grid size-11 place-items-center rounded-full bg-[#fff0eb] text-[#b63a2c]"><Trash2 size={14} /></button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => updateLine(line.key, { mix_mode: "AUTO", requested_mix: [] })} className={`rounded-[15px] border p-3 text-left text-[10px] font-black ${line.mix_mode === "AUTO" ? "border-[#d39218] bg-[#fff8e9] text-[#9b6510]" : "border-[#eaded3]"}`}>
                      Automático
                      <span className="mt-1 block text-[8px] font-normal">Usa primero colores con menos stock.</span>
                    </button>
                    <button type="button" onClick={() => updateLine(line.key, { mix_mode: "CUSTOM", requested_mix: [] })} className={`rounded-[15px] border p-3 text-left text-[10px] font-black ${line.mix_mode === "CUSTOM" ? "border-[#5a8b86] bg-[#edf7f5] text-[#42746e]" : "border-[#eaded3]"}`}>
                      Elegir colores
                      <span className="mt-1 block text-[8px] font-normal">Define color por talla.</span>
                    </button>
                  </div>

                  {line.mix_mode === "CUSTOM" && line.product && (
                    <div className="mt-4 space-y-3">
                      {line.product.sizes.map((size) => {
                        const selected = selectedForSize(line, size);
                        return (
                          <div key={size} className="rounded-[16px] bg-[#f8f4f0] p-3">
                            <div className="flex justify-between"><b className="text-xs">Talla {size}</b><span className="text-[9px] font-black">{selected}/{line.qty_series}</span></div>
                            <div className="mt-2 space-y-2">
                              {rowsFor(line.product_id, line.sale_mode, size).map((row) => {
                                const current = line.requested_mix.find((m) => m.size === size && m.color === row.color)?.qty ?? 0;
                                const max = Math.min(Number(row.available), line.qty_series - selected + current);
                                return (
                                  <div key={`${size}-${row.color}`} className="flex items-center justify-between rounded-[12px] bg-white px-3 py-2">
                                    <div><p className="text-[10px] font-black">{row.color}</p><p className="text-[8px] text-[#8b8078]">{row.available} disp.</p></div>
                                    <div className="flex items-center">
                                      <button type="button" onClick={() => setMix(line.key, size, row.color, Math.max(0, current - 1))} className="grid size-8 place-items-center"><Minus size={11} /></button>
                                      <b className="min-w-7 text-center text-xs">{current}</b>
                                      <button type="button" disabled={current >= max || selected >= line.qty_series} onClick={() => setMix(line.key, size, row.color, current + 1)} className="grid size-8 place-items-center disabled:opacity-25"><Plus size={11} /></button>
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

                  <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs">
                    <span className="font-bold text-[#7f746c]">Disponible: {line.available}</span>
                    <b className="text-[#b63a2c]">S/ {line.subtotal.toFixed(2)}</b>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 rounded-[28px] border border-[#eaded3] bg-white p-5 shadow-sm sm:grid-cols-3">
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="ti-input">
              <option value="YAPE">Yape</option><option value="PLIN">Plin</option><option value="BCP">BCP</option><option value="INTERBANK">Interbank</option><option value="TRANSFERENCIA">Transferencia</option><option value="EFECTIVO">Efectivo</option>
            </select>
            <input type="number" min="0" step="0.01" value={shippingCost} onChange={(e) => setShippingCost(Number(e.target.value))} className="ti-input" placeholder="Envío" />
            <div className="rounded-[18px] bg-[#fff0e9] p-4"><p className="text-[9px] font-black uppercase text-[#9b382b]">Total</p><p className="mt-1 text-2xl font-black text-[#9b382b]">S/ {total.toFixed(2)}</p></div>
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
