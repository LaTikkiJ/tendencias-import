import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  PackageCheck,
  Plus,
  ReceiptText,
  Ship,
} from "lucide-react";

import {
  addChinaPurchaseExpenseV10,
  addChinaPurchasePaymentV10,
  markChinaPurchaseReceivedV10,
  setChinaPurchaseStatusV10,
} from "@/app/admin/series/compras/actions-v10";
import DeleteChinaPurchaseButton from "@/components/admin/DeleteChinaPurchaseButton";
import PurchaseCostControls from "@/components/admin/PurchaseCostControls";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function pen(value: unknown) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0) || 0);
}

function original(value: unknown, currency: string) {
  if (currency === "PEN") return pen(value);

  return `${currency} ${new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0) || 0)}`;
}

function stageName(stage: string) {
  if (stage === "pago_inicial") return "Pago inicial";
  if (stage === "liquidacion_peru") return "Liquidación al llegar a Perú";
  if (stage === "devolucion") return "Devolución";
  return "Pago adicional";
}

function statusName(status: string) {
  if (status === "PEDIDO") return "Pedido";
  if (status === "EN_TRANSITO") return "En tránsito";
  if (status === "RECIBIDO") return "Recibido";
  if (status === "CANCELADO") return "Cancelado";
  return status;
}

export default async function ChinaPurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: purchase },
    { data: items },
    { data: payments },
    { data: expenses },
    { data: audit },
  ] = await Promise.all([
    supabase.from("series_china_purchases").select("*").eq("id", id).single(),
    supabase
      .from("series_china_purchase_items")
      .select(`
        *,
        series_products (
          id,
          code,
          name,
          cover_url
        ),
        series_china_purchase_item_colors (
          color,
          series_qty
        )
      `)
      .eq("purchase_id", id)
      .order("line_no"),
    supabase
      .from("series_china_purchase_payments")
      .select("*")
      .eq("purchase_id", id)
      .order("line_no"),
    supabase
      .from("series_china_purchase_expenses")
      .select("*")
      .eq("purchase_id", id)
      .order("line_no"),
    supabase
      .from("series_china_purchase_audit")
      .select("id,event_type,description,metadata,created_at")
      .eq("purchase_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  if (!purchase) notFound();

  const currency = String(purchase.currency ?? "USD");
  const supplierTotal = Number(purchase.supplier_total_original ?? 0);
  const garmentsPaid = Number(purchase.garments_paid_original ?? 0);
  const supplierBalance = Math.max(supplierTotal - garmentsPaid, 0);
  const itemRows = (items ?? []) as any[];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/series/compras"
        className="inline-flex items-center gap-2 text-sm font-black text-[#8f3a2e]"
      >
        <ArrowLeft size={16} />
        Volver a compras
      </Link>

      <section className="rounded-[30px] border border-[#eaded3] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#5a8b86]">
                {purchase.code}
              </p>
              <span className="rounded-full bg-[#f7f2ec] px-3 py-1 text-[9px] font-black text-[#6f655e]">
                {statusName(purchase.status)}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-[9px] font-black ${
                  purchase.cost_status === "CLOSED"
                    ? "bg-[#edf7f5] text-[#42746e]"
                    : "bg-[#fff8e9] text-[#9b6510]"
                }`}
              >
                {purchase.cost_status === "CLOSED" ? "Costos cerrados" : "Costos abiertos"}
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Compra China</h1>
            <p className="mt-2 text-sm text-[#7f746c]">
              {purchase.purchase_date}
              {purchase.supplier ? ` · ${purchase.supplier}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {purchase.status === "PEDIDO" && (
              <form action={setChinaPurchaseStatusV10}>
                <input type="hidden" name="id" value={purchase.id} />
                <input type="hidden" name="status" value="EN_TRANSITO" />
                <button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#fff6e9] px-4 text-xs font-black text-[#9b6510]">
                  <Ship size={14} />
                  Pasar a tránsito
                </button>
              </form>
            )}

            {purchase.status === "EN_TRANSITO" && (
              <form action={markChinaPurchaseReceivedV10}>
                <input type="hidden" name="id" value={purchase.id} />
                <button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#5a8b86] px-4 text-xs font-black text-white">
                  <PackageCheck size={14} />
                  Mercadería recibida
                </button>
              </form>
            )}

            <PurchaseCostControls
              purchase={{
                id: purchase.id,
                purchase_date: purchase.purchase_date,
                supplier: purchase.supplier,
                notes: purchase.notes,
                cost_status: purchase.cost_status ?? "OPEN",
              }}
            />

            <DeleteChinaPurchaseButton
              purchaseId={purchase.id}
              purchaseCode={purchase.code}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
          <HeaderCard label="Series" value={String(purchase.total_series ?? 0)} />
          <HeaderCard label="Prendas" value={String(purchase.total_pieces ?? 0)} />
          <HeaderCard
            label="Mercadería"
            value={original(purchase.supplier_total_original, currency)}
            detail={pen(purchase.supplier_total_pen)}
          />
          <HeaderCard
            label="Gastos importación"
            value={pen(purchase.distributable_costs_pen)}
            detail={`${pen(purchase.extra_cost_piece_pen)} / prenda`}
          />
          <HeaderCard
            label="Pagado hasta hoy"
            value={pen(purchase.payments_total_pen)}
            detail={`TC prendas ${Number(purchase.effective_exchange_rate ?? 1).toFixed(4)}`}
          />
          <HeaderCard label="Costo total" value={pen(purchase.total_paid)} strong />
        </div>

        <div className="mt-3 rounded-[17px] bg-[#fff7f1] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[.08em] text-[#8f3a2e]">
                Saldo de prendas con proveedor
              </p>
              <p className="mt-1 text-lg font-black text-[#8f3a2e]">
                {original(supplierBalance, currency)}
              </p>
            </div>
            <p className="max-w-lg text-[9px] leading-4 text-[#7f746c]">
              El saldo se calcula solo con la parte de prendas. Flete y otros cobros del agente se consideran gastos de importación.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[26px] border border-[#eaded3] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-[#edf7f5] text-[#5a8b86]">
            <Banknote size={16} />
          </span>
          <div>
            <p className="font-black">Pagos registrados</p>
            <p className="mt-1 text-[9px] text-[#7f746c]">
              Cada pago conserva su fecha y su tipo de cambio real.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {(payments ?? []).map((payment: any) => (
            <div key={payment.id} className="rounded-[18px] bg-[#f8f4f0] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase text-[#8f3a2e]">
                    {stageName(payment.stage)}
                  </p>
                  <p className="mt-1 text-[10px] font-bold text-[#7f746c]">
                    {payment.payment_date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black">{pen(payment.amount_pen)}</p>
                  <p className="mt-1 text-[9px] text-[#7f746c]">
                    TC {Number(payment.exchange_rate ?? 1).toFixed(4)}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <MiniBox
                  label="Prendas"
                  value={original(payment.garments_amount_original, currency)}
                />
                <MiniBox
                  label="Flete"
                  value={original(payment.freight_amount_original, currency)}
                />
                <MiniBox
                  label="Otros"
                  value={original(payment.other_amount_original, currency)}
                />
              </div>

              {(payment.payment_method || payment.reference) && (
                <p className="mt-3 text-[9px] leading-4 text-[#7f746c]">
                  {payment.payment_method || ""}
                  {payment.payment_method && payment.reference ? " · " : ""}
                  {payment.reference || ""}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {purchase.status !== "CANCELADO" && purchase.cost_status !== "CLOSED" && (
        <section className="rounded-[26px] border border-[#dbe9e5] bg-[#f7fcfb] p-4 shadow-sm sm:p-5">
          <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#5a8b86]">
            Pago posterior / saldo
          </p>
          <h2 className="mt-1 text-xl font-black">Registrar otro pago</h2>
          <p className="mt-1 max-w-3xl text-[10px] leading-5 text-[#7f746c]">
            Si al llegar la mercadería el dólar bajó o subió, registra aquí el saldo con el tipo de cambio de ese día. También puedes registrar saldo de flete u otros cobros.
          </p>

          <form
            action={addChinaPurchasePaymentV10}
            className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            <input type="hidden" name="purchase_id" value={purchase.id} />

            <FormField label="Fecha">
              <input type="date" name="payment_date" required className="ti-input" />
            </FormField>

            <FormField label="Etapa">
              <select name="stage" defaultValue="liquidacion_peru" className="ti-input">
                <option value="liquidacion_peru">Liquidación al llegar a Perú</option>
                <option value="pago_adicional">Pago adicional</option>
                <option value="devolucion">Devolución</option>
              </select>
            </FormField>

            <FormField label={`Prendas ${currency}`}>
              <input
                type="text"
                inputMode="decimal"
                name="garments_amount_original"
                placeholder="Saldo de prendas"
                className="ti-input"
              />
            </FormField>

            <FormField label={`Flete ${currency}`}>
              <input
                type="text"
                inputMode="decimal"
                name="freight_amount_original"
                placeholder="Saldo de flete"
                className="ti-input"
              />
            </FormField>

            <FormField label={`Otros cobros ${currency}`}>
              <input
                type="text"
                inputMode="decimal"
                name="other_amount_original"
                placeholder="Otros"
                className="ti-input"
              />
            </FormField>

            {currency !== "PEN" && (
              <FormField label="Pagado realmente en S/">
                <input
                  type="text"
                  inputMode="decimal"
                  name="actual_pen"
                  placeholder="Monto debitado"
                  className="ti-input"
                />
              </FormField>
            )}

            {currency !== "PEN" && (
              <FormField label="Tipo de cambio">
                <input
                  type="text"
                  inputMode="decimal"
                  name="exchange_rate"
                  placeholder="Opcional si pusiste S/"
                  className="ti-input"
                />
              </FormField>
            )}

            <FormField label="Medio de pago">
              <input name="payment_method" placeholder="BCP, Interbank..." className="ti-input" />
            </FormField>

            <div className="sm:col-span-2 xl:col-span-3">
              <FormField label="Referencia">
                <input name="reference" placeholder="Operación, detalle..." className="ti-input" />
              </FormField>
            </div>

            <button className="min-h-12 rounded-[16px] bg-[#5a8b86] px-4 text-xs font-black text-white xl:self-end">
              Guardar pago y recalcular
            </button>
          </form>
        </section>
      )}

      <section className="rounded-[26px] border border-[#eaded3] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-[#fff8e9] text-[#d39218]">
            <ReceiptText size={16} />
          </span>
          <div>
            <p className="font-black">Gastos adicionales</p>
            <p className="mt-1 text-[9px] text-[#7f746c]">
              Canal rojo, etiquetas, aduanas, almacenaje, transporte y más.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(expenses ?? []).map((expense: any) => (
            <div key={expense.id} className="rounded-[17px] bg-[#fff8e9] p-4">
              <p className="text-[9px] font-black uppercase text-[#9b6510]">
                {expense.concept}
              </p>
              <p className="mt-2 text-sm font-black">
                {original(expense.amount, expense.currency)}
              </p>
              <p className="mt-1 text-[9px] text-[#7f746c]">{pen(expense.amount_pen)}</p>
              {expense.reference && (
                <p className="mt-2 text-[9px] text-[#8b8078]">{expense.reference}</p>
              )}
            </div>
          ))}

          {(expenses ?? []).length === 0 && (
            <p className="text-xs text-[#8b8078]">Todavía no hay gastos adicionales.</p>
          )}
        </div>
      </section>

      {purchase.status !== "CANCELADO" && purchase.cost_status !== "CLOSED" && (
        <section className="rounded-[26px] border border-[#f0d9a8] bg-[#fffaf0] p-4 shadow-sm sm:p-5">
          <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#9b6510]">
            Nuevo gasto
          </p>
          <h2 className="mt-1 text-xl font-black">Agregar un gasto que apareció después</h2>

          <form
            action={addChinaPurchaseExpenseV10}
            className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            <input type="hidden" name="purchase_id" value={purchase.id} />

            <FormField label="Fecha">
              <input type="date" name="expense_date" required className="ti-input" />
            </FormField>

            <FormField label="Categoría">
              <select name="category" defaultValue="otro" className="ti-input">
                <option value="canal_rojo">Canal rojo</option>
                <option value="etiquetas">Etiquetas</option>
                <option value="flete_lima_san_ramon">Flete Lima - San Ramón</option>
                <option value="aduanas">Aduanas</option>
                <option value="almacenaje">Almacenaje</option>
                <option value="estibadores">Estibadores</option>
                <option value="embolsado">Embolsado</option>
                <option value="transporte_local">Transporte local</option>
                <option value="comision">Comisión</option>
                <option value="otro">Otro</option>
              </select>
            </FormField>

            <FormField label="Concepto">
              <input name="concept" required placeholder="Descripción" className="ti-input" />
            </FormField>

            <FormField label="Moneda">
              <select name="currency" defaultValue="PEN" className="ti-input">
                <option value="PEN">PEN</option>
                <option value="USD">USD</option>
                <option value="CNY">CNY</option>
              </select>
            </FormField>

            <FormField label="Monto">
              <input
                type="text"
                inputMode="decimal"
                name="amount"
                required
                placeholder="Monto"
                className="ti-input"
              />
            </FormField>

            <FormField label="Tipo de cambio">
              <input
                type="text"
                inputMode="decimal"
                name="exchange_rate"
                placeholder="Solo si es USD/CNY"
                className="ti-input"
              />
            </FormField>

            <FormField label="Referencia">
              <input name="reference" placeholder="Opcional" className="ti-input" />
            </FormField>

            <button className="min-h-12 rounded-[16px] bg-[#d39218] px-4 text-xs font-black text-white xl:self-end">
              <Plus size={14} className="mr-1 inline" />
              Agregar y recalcular
            </button>
          </form>
        </section>
      )}

      {purchase.cost_status === "CLOSED" && (
        <section className="rounded-[22px] border border-[#dbe9e5] bg-[#f4faf8] p-4">
          <p className="text-[10px] font-black uppercase tracking-[.12em] text-[#42746e]">
            Costos cerrados
          </p>
          <p className="mt-1 text-sm font-black">
            Este es el costo final puesto en almacén.
          </p>
          <p className="mt-1 text-[10px] leading-5 text-[#7f746c]">
            Si aparece un gasto posterior, usa “Reabrir costos”. Al registrar el nuevo gasto
            se recalcularán automáticamente los costos por prenda, serie y precios sugeridos.
          </p>
        </section>
      )}

      <section>
        <div className="mb-3">
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#5a8b86]">
            Modelos de esta compra
          </p>
          <h2 className="mt-1 text-2xl font-black">Costo real por código</h2>
          <p className="mt-1 text-[10px] leading-5 text-[#7f746c]">
            Los gastos de importación ya están repartidos entre todas las prendas.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {itemRows.map((row) => {
            const pieces = Number(row.pieces_per_series ?? 0);
            const preorderPrice = Number(row.preorder_price_snapshot ?? 0);
            const stockPrice = Number(row.stock_price_snapshot ?? 0);
            const finalPiece = Number(row.landed_cost_piece ?? 0);
            const preorderProfit = pieces > 0 ? preorderPrice / pieces - finalPiece : 0;
            const stockProfit = pieces > 0 ? stockPrice / pieces - finalPiece : 0;
            const preorderMargin = finalPiece > 0 ? (preorderProfit / finalPiece) * 100 : 0;
            const stockMargin = finalPiece > 0 ? (stockProfit / finalPiece) * 100 : 0;

            return (
              <article
                key={row.id}
                className="rounded-[24px] border border-[#eaded3] bg-white p-4 shadow-sm"
              >
                <div className="flex gap-3">
                  <div className="size-20 shrink-0 overflow-hidden rounded-[15px] bg-[#f1e9e1]">
                    {row.series_products?.cover_url ? (
                      <img
                        src={row.series_products.cover_url}
                        alt={row.series_products?.name ?? ""}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black uppercase text-[#5a8b86]">
                      {row.series_products?.code}
                    </p>
                    <h3 className="mt-1 truncate font-black">{row.series_products?.name}</h3>
                    <p className="mt-1 text-[9px] text-[#8b8078]">
                      {row.total_series} series · {Number(row.total_series) * pieces} prendas
                    </p>
                    <p className="mt-2 text-[9px] leading-4 text-[#7f746c]">
                      {(row.series_china_purchase_item_colors ?? [])
                        .map((color: any) => `${color.color} ${color.series_qty}`)
                        .join(" · ")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <CostCard
                    label="Proveedor / prenda"
                    value={original(row.supplier_cost_piece_original, currency)}
                    detail={pen(row.supplier_cost_piece_pen)}
                  />
                  <CostCard
                    label="Gasto / prenda"
                    value={pen(row.extra_cost_piece_pen)}
                    tone="gold"
                  />
                  <CostCard
                    label="Final / prenda"
                    value={pen(row.landed_cost_piece)}
                    detail={original(row.landed_cost_piece_original, currency)}
                    tone="teal"
                  />
                  <CostCard
                    label="Final / serie"
                    value={pen(row.landed_cost_series)}
                    tone="teal"
                  />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <PriceCard
                    title="Preventa"
                    price={preorderPrice}
                    profit={preorderProfit}
                    margin={preorderMargin}
                    target={Number(row.preorder_margin_pct ?? 20)}
                    tone="gold"
                  />
                  <PriceCard
                    title="Stock"
                    price={stockPrice}
                    profit={stockProfit}
                    margin={stockMargin}
                    target={Number(row.stock_margin_pct ?? 20)}
                    tone="red"
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-[24px] border border-[#eaded3] bg-white p-4 shadow-sm sm:p-5">
        <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#5a8b86]">
          Historial de cambios
        </p>
        <h2 className="mt-1 text-xl font-black">Auditoría de la compra</h2>

        <div className="mt-4 space-y-2">
          {(audit ?? []).map((event: any) => (
            <div
              key={event.id}
              className="flex items-start justify-between gap-3 rounded-[14px] bg-[#f8f4f0] p-3"
            >
              <div>
                <p className="text-[9px] font-black">{event.description}</p>
                <p className="mt-1 text-[8px] text-[#8b8078]">{event.event_type}</p>
              </div>
              <p className="shrink-0 text-[8px] text-[#8b8078]">
                {new Date(event.created_at).toLocaleString("es-PE")}
              </p>
            </div>
          ))}

          {(audit ?? []).length === 0 && (
            <p className="text-xs text-[#8b8078]">
              Los próximos pagos, gastos, cambios y cierres quedarán registrados aquí.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function HeaderCard({
  label,
  value,
  detail,
  strong,
}: {
  label: string;
  value: string;
  detail?: string;
  strong?: boolean;
}) {
  return (
    <div className={`rounded-[17px] p-3 ${strong ? "bg-[#8f3a2e] text-white" : "bg-[#f8f4f0]"}`}>
      <p className={`text-[8px] font-black uppercase ${strong ? "text-white/70" : "text-[#8b8078]"}`}>
        {label}
      </p>
      <p className="mt-1 text-sm font-black">{value}</p>
      {detail && <p className="mt-1 text-[9px] opacity-75">{detail}</p>}
    </div>
  );
}

function MiniBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-white p-2.5">
      <p className="text-[7px] font-black uppercase text-[#8b8078]">{label}</p>
      <p className="mt-1 text-[10px] font-black">{value}</p>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[9px] font-black uppercase tracking-[.08em] text-[#7f746c]">
        {label}
      </span>
      {children}
    </label>
  );
}

function CostCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "gold" | "teal";
}) {
  const className =
    tone === "gold"
      ? "bg-[#fff8e9] text-[#9b6510]"
      : tone === "teal"
        ? "bg-[#edf7f5] text-[#42746e]"
        : "bg-[#f8f4f0] text-[#4f4742]";

  return (
    <div className={`rounded-[14px] p-3 ${className}`}>
      <p className="text-[7px] font-black uppercase opacity-75">{label}</p>
      <p className="mt-1 text-xs font-black">{value}</p>
      {detail && <p className="mt-1 text-[9px] opacity-75">{detail}</p>}
    </div>
  );
}

function PriceCard({
  title,
  price,
  profit,
  margin,
  target,
  tone,
}: {
  title: string;
  price: number;
  profit: number;
  margin: number;
  target: number;
  tone: "gold" | "red";
}) {
  const className =
    tone === "gold"
      ? "border-[#f0d9a8] bg-[#fffaf0] text-[#9b6510]"
      : "border-[#f2cfc4] bg-[#fff4ef] text-[#9b382b]";

  return (
    <div className={`rounded-[14px] border p-3 ${className}`}>
      <p className="text-[7px] font-black uppercase">{title}</p>
      <p className="mt-1 text-sm font-black">{pen(price)}</p>
      <p className={`mt-1 text-[8px] ${margin + 0.01 < target ? "font-black text-red-600" : "text-[#7f746c]"}`}>
        Utilidad/prenda {pen(profit)} · {margin.toFixed(1)}% · objetivo {target.toFixed(0)}%
      </p>
    </div>
  );
}
