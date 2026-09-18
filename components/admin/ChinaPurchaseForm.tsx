"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Calculator, Plus, Save, Trash2 } from "lucide-react";
import { createChinaPurchase } from "@/app/admin/actions";

type ProductOption = {
  id: string;
  code: string;
  name: string;
  sizes: string[];
  pieces_per_series: number;
  price_preorder: number | null;
  price_stock: number | null;
  preorder_markup_pct: number | null;
  stock_markup_pct: number | null;
};

type PurchaseRow = {
  key: string;
  product_id: string;
  color: string;
  series_qty: number;
  supplier_cost_series: number;
  preorder_price: number;
  stock_price: number;
};

type Currency = "PEN" | "USD" | "CNY";

function money(value: number) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

function createRow(firstProduct?: ProductOption): PurchaseRow {
  return {
    key: crypto.randomUUID(),
    product_id: firstProduct?.id ?? "",
    color: "",
    series_qty: 1,
    supplier_cost_series: 0,
    preorder_price: Number(firstProduct?.price_preorder ?? 0),
    stock_price: Number(firstProduct?.price_stock ?? 0),
  };
}

export function ChinaPurchaseForm({ products }: { products: ProductOption[] }) {
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [supplier, setSupplier] = useState("");
  const [status, setStatus] = useState("EN_TRANSITO");
  const [currency, setCurrency] = useState<Currency>("PEN");
  const [exchangeRate, setExchangeRate] = useState(1);

  const [freight, setFreight] = useState(0);
  const [taxes, setTaxes] = useState(0);
  const [commissions, setCommissions] = useState(0);
  const [localTransport, setLocalTransport] = useState(0);
  const [otherCosts, setOtherCosts] = useState(0);
  const [notes, setNotes] = useState("");

  const [rows, setRows] = useState<PurchaseRow[]>([createRow(products[0])]);

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const extraTotal =
    Number(freight || 0) +
    Number(taxes || 0) +
    Number(commissions || 0) +
    Number(localTransport || 0) +
    Number(otherCosts || 0);

  const computedRows = useMemo(() => {
    const merchandiseTotal = rows.reduce((sum, row) => {
      return (
        sum +
        Number(row.series_qty || 0) *
          Number(row.supplier_cost_series || 0) *
          Number(exchangeRate || 1)
      );
    }, 0);

    return rows.map((row) => {
      const product = productMap.get(row.product_id);
      const pieces = Math.max(
        Number(product?.pieces_per_series || product?.sizes?.length || 1),
        1
      );

      const supplierSubtotal =
        Number(row.series_qty || 0) *
        Number(row.supplier_cost_series || 0) *
        Number(exchangeRate || 1);

      const allocated =
        merchandiseTotal > 0
          ? extraTotal * (supplierSubtotal / merchandiseTotal)
          : 0;

      const landedTotal = supplierSubtotal + allocated;
      const landedSeries =
        Number(row.series_qty || 0) > 0
          ? landedTotal / Number(row.series_qty)
          : 0;
      const landedPiece = pieces > 0 ? landedSeries / pieces : 0;

      const preorderMarkup = Number(product?.preorder_markup_pct ?? 30);
      const stockMarkup = Number(product?.stock_markup_pct ?? 40);

      return {
        ...row,
        product,
        pieces,
        supplierSubtotal,
        allocated,
        landedSeries,
        landedPiece,
        suggestedPreorder: landedSeries * (1 + preorderMarkup / 100),
        suggestedStock: landedSeries * (1 + stockMarkup / 100),
      };
    });
  }, [rows, productMap, exchangeRate, extraTotal]);

  const merchandiseTotal = computedRows.reduce(
    (sum, row) => sum + row.supplierSubtotal,
    0
  );
  const totalPaid = merchandiseTotal + extraTotal;
  const totalSeries = rows.reduce(
    (sum, row) => sum + Number(row.series_qty || 0),
    0
  );
  const totalPieces = computedRows.reduce(
    (sum, row) => sum + Number(row.series_qty || 0) * row.pieces,
    0
  );

  const payload = {
    purchase_date: purchaseDate,
    supplier,
    status,
    currency,
    exchange_rate: currency === "PEN" ? 1 : Number(exchangeRate || 1),
    freight: Number(freight || 0),
    taxes: Number(taxes || 0),
    commissions: Number(commissions || 0),
    local_transport: Number(localTransport || 0),
    other_costs: Number(otherCosts || 0),
    notes,
    items: rows.map((row) => ({
      product_id: row.product_id,
      color: row.color.trim() || "Único",
      series_qty: Number(row.series_qty || 0),
      supplier_cost_series: Number(row.supplier_cost_series || 0),
      preorder_price: Number(row.preorder_price || 0),
      stock_price: Number(row.stock_price || 0),
    })),
  };

  function updateRow(key: string, patch: Partial<PurchaseRow>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  }

  function selectProduct(key: string, productId: string) {
    const product = productMap.get(productId);
    updateRow(key, {
      product_id: productId,
      preorder_price: Number(product?.price_preorder ?? 0),
      stock_price: Number(product?.price_stock ?? 0),
    });
  }

  function addRow() {
    setRows((current) => [...current, createRow(products[0])]);
  }

  function duplicateColor(row: PurchaseRow) {
    setRows((current) => [
      ...current,
      { ...row, key: crypto.randomUUID(), color: "", series_qty: 1 },
    ]);
  }

  function removeRow(key: string) {
    setRows((current) =>
      current.length === 1 ? current : current.filter((row) => row.key !== key)
    );
  }

  function useSuggested(key: string, preorder: number, stock: number) {
    updateRow(key, {
      preorder_price: Math.ceil(preorder),
      stock_price: Math.ceil(stock),
    });
  }

  const canSubmit =
    rows.length > 0 &&
    rows.every(
      (row) =>
        row.product_id &&
        row.color.trim() &&
        Number(row.series_qty) > 0 &&
        Number(row.supplier_cost_series) > 0 &&
        Number(row.preorder_price) > 0 &&
        Number(row.stock_price) > 0
    );

  return (
    <form action={createChinaPurchase} className="space-y-6">
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />

      <section className="rounded-[28px] border border-[#eaded3] bg-white p-5 shadow-[0_8px_28px_rgba(100,70,40,.05)]">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-[#f4faf8] text-[#5a8b86]">
            <Calculator size={18} />
          </span>
          <div>
            <p className="font-black text-[#2c2825]">Datos de la compra</p>
            <p className="mt-1 text-xs text-[#7f746c]">
              Flete, impuestos y demás gastos se reparten proporcionalmente al valor de cada código.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[.08em] text-[#756a62]">
              Fecha
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="ti-input"
            />
          </div>

          <div className="xl:col-span-2">
            <label className="mb-2 block text-xs font-black uppercase tracking-[.08em] text-[#756a62]">
              Proveedor
            </label>
            <input
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="ti-input"
              placeholder="Ej: Proveedor China 01"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[.08em] text-[#756a62]">
              Estado
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="ti-input"
            >
              <option value="EN_TRANSITO">En tránsito</option>
              <option value="PEDIDO">Pedido</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[.08em] text-[#756a62]">
              Moneda proveedor
            </label>
            <select
              value={currency}
              onChange={(e) => {
                const value = e.target.value as Currency;
                setCurrency(value);
                if (value === "PEN") setExchangeRate(1);
              }}
              className="ti-input"
            >
              <option value="PEN">Soles - PEN</option>
              <option value="USD">Dólares - USD</option>
              <option value="CNY">Yuanes - CNY</option>
            </select>
          </div>
        </div>

        {currency !== "PEN" && (
          <div className="mt-4 max-w-xs">
            <label className="mb-2 block text-xs font-black uppercase tracking-[.08em] text-[#756a62]">
              Tipo de cambio a soles
            </label>
            <input
              type="number"
              min="0"
              step="0.000001"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(Number(e.target.value))}
              className="ti-input"
            />
            <p className="mt-2 text-[11px] text-[#8b8078]">
              Cuántos soles representa 1 {currency}.
            </p>
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Flete", freight, setFreight],
            ["Impuestos", taxes, setTaxes],
            ["Comisiones", commissions, setCommissions],
            ["Transporte", localTransport, setLocalTransport],
            ["Otros", otherCosts, setOtherCosts],
          ].map(([label, value, setter]) => (
            <div key={String(label)}>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[.08em] text-[#8b8078]">
                {String(label)}
              </label>
              <div className="flex overflow-hidden rounded-[16px] border border-[#eaded3] bg-white">
                <span className="grid min-w-11 place-items-center border-r border-[#eaded3] bg-[#f8f4f0] text-xs font-black text-[#8f3a2e]">
                  S/
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={Number(value)}
                  onChange={(e) =>
                    (setter as Dispatch<SetStateAction<number>>)(
                      Number(e.target.value)
                    )
                  }
                  className="h-11 min-w-0 flex-1 border-0 px-3 text-sm font-black outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#eaded3] bg-white shadow-[0_8px_28px_rgba(100,70,40,.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eaded3] px-5 py-4">
          <div>
            <p className="font-black text-[#2c2825]">Códigos comprados</p>
            <p className="mt-1 text-xs text-[#7f746c]">
              Una fila por color. Si el mismo código vino en 2 colores, usa “+ color”.
            </p>
          </div>

          <button
            type="button"
            onClick={addRow}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#fff0e9] px-4 text-xs font-black text-[#9b382b]"
          >
            <Plus size={15} />
            Agregar fila
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1720px] w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#f8f4f0] text-[10px] font-black uppercase tracking-[.08em] text-[#786d65]">
                <th className="px-3 py-3">Código / modelo</th>
                <th className="px-3 py-3">Color</th>
                <th className="px-3 py-3 text-center">Series</th>
                <th className="px-3 py-3 text-center">Pzs/serie</th>
                <th className="px-3 py-3">Costo prov./serie</th>
                <th className="px-3 py-3">Costo prov./prenda</th>
                <th className="px-3 py-3">Gastos asignados</th>
                <th className="px-3 py-3">Costo real/serie</th>
                <th className="px-3 py-3">Costo real/prenda</th>
                <th className="px-3 py-3">Preventa</th>
                <th className="px-3 py-3">Stock</th>
                <th className="px-3 py-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {computedRows.map((row, index) => (
                <tr key={row.key} className="border-t border-[#f0e7df] align-top">
                  <td className="w-[250px] px-3 py-3">
                    <select
                      value={row.product_id}
                      onChange={(e) => selectProduct(row.key, e.target.value)}
                      className="h-10 w-full rounded-[12px] border border-[#e4d7cc] bg-white px-3 text-xs font-black outline-none"
                    >
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.code} · {product.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1.5 truncate text-[9px] font-bold text-[#8b8078]">
                      {(row.product?.sizes ?? []).join(" · ")}
                    </p>
                  </td>

                  <td className="w-[130px] px-3 py-3">
                    <input
                      value={row.color}
                      onChange={(e) => updateRow(row.key, { color: e.target.value })}
                      className="h-10 w-full rounded-[12px] border border-[#e4d7cc] px-3 text-xs font-bold outline-none"
                      placeholder="Rosado"
                    />
                  </td>

                  <td className="w-[85px] px-3 py-3">
                    <input
                      type="number"
                      min="1"
                      value={row.series_qty}
                      onChange={(e) =>
                        updateRow(row.key, { series_qty: Number(e.target.value) })
                      }
                      className="h-10 w-full rounded-[12px] border border-[#e4d7cc] px-2 text-center text-xs font-black outline-none"
                    />
                  </td>

                  <td className="w-[80px] px-3 py-3 text-center">
                    <div className="grid h-10 place-items-center rounded-[12px] bg-[#f8f4f0] text-xs font-black">
                      {row.pieces}
                    </div>
                  </td>

                  <td className="w-[150px] px-3 py-3">
                    <div className="flex h-10 overflow-hidden rounded-[12px] border border-[#e4d7cc]">
                      <span className="grid min-w-10 place-items-center bg-[#f8f4f0] text-[10px] font-black text-[#8f3a2e]">
                        {currency}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.supplier_cost_series}
                        onChange={(e) =>
                          updateRow(row.key, {
                            supplier_cost_series: Number(e.target.value),
                          })
                        }
                        className="min-w-0 flex-1 border-0 px-2 text-xs font-black outline-none"
                      />
                    </div>
                  </td>

                  <td className="w-[130px] px-3 py-3">
                    <div className="rounded-[12px] bg-[#f8f4f0] px-3 py-2.5 text-xs font-black">
                      {money(
                        (Number(row.supplier_cost_series || 0) *
                          Number(exchangeRate || 1)) /
                          row.pieces
                      )}
                    </div>
                  </td>

                  <td className="w-[130px] px-3 py-3">
                    <div className="rounded-[12px] bg-[#fff8e9] px-3 py-2.5 text-xs font-black text-[#9a6615]">
                      {money(row.allocated)}
                    </div>
                  </td>

                  <td className="w-[135px] px-3 py-3">
                    <div className="rounded-[12px] bg-[#f4faf8] px-3 py-2.5 text-xs font-black text-[#42746e]">
                      {money(row.landedSeries)}
                    </div>
                  </td>

                  <td className="w-[135px] px-3 py-3">
                    <div className="rounded-[12px] bg-[#f4faf8] px-3 py-2.5 text-xs font-black text-[#42746e]">
                      {money(row.landedPiece)}
                    </div>
                  </td>

                  <td className="w-[150px] px-3 py-3">
                    <div className="flex h-10 overflow-hidden rounded-[12px] border border-[#e4d7cc]">
                      <span className="grid min-w-9 place-items-center bg-[#fff6e9] text-[10px] font-black text-[#b57816]">
                        S/
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.preorder_price}
                        onChange={(e) =>
                          updateRow(row.key, { preorder_price: Number(e.target.value) })
                        }
                        className="min-w-0 flex-1 border-0 px-2 text-xs font-black outline-none"
                      />
                    </div>
                    <p className="mt-1 text-[9px] font-bold text-[#9a6615]">
                      Sug. {money(row.suggestedPreorder)}
                    </p>
                  </td>

                  <td className="w-[150px] px-3 py-3">
                    <div className="flex h-10 overflow-hidden rounded-[12px] border border-[#e4d7cc]">
                      <span className="grid min-w-9 place-items-center bg-[#fff0e9] text-[10px] font-black text-[#9b382b]">
                        S/
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.stock_price}
                        onChange={(e) =>
                          updateRow(row.key, { stock_price: Number(e.target.value) })
                        }
                        className="min-w-0 flex-1 border-0 px-2 text-xs font-black outline-none"
                      />
                    </div>
                    <p className="mt-1 text-[9px] font-bold text-[#9b382b]">
                      Sug. {money(row.suggestedStock)}
                    </p>
                  </td>

                  <td className="w-[145px] px-3 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          useSuggested(row.key, row.suggestedPreorder, row.suggestedStock)
                        }
                        className="rounded-full bg-[#edf7f5] px-2.5 py-2 text-[9px] font-black text-[#42746e]"
                        title="Usar precios sugeridos"
                      >
                        Usar sug.
                      </button>

                      <button
                        type="button"
                        onClick={() => duplicateColor(row)}
                        className="grid size-8 place-items-center rounded-full bg-[#fff6e9] text-[#b57816]"
                        title="Agregar otro color del mismo código"
                      >
                        <Plus size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeRow(row.key)}
                        className="grid size-8 place-items-center rounded-full bg-[#fff0eb] text-[#b63a2c]"
                        title="Eliminar fila"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <p className="mt-1 text-center text-[8px] font-bold text-[#9a8e85]">
                      Fila {index + 1}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-[20px] bg-white p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#8b8078]">Mercadería</p>
          <p className="mt-2 text-lg font-black">{money(merchandiseTotal)}</p>
        </div>
        <div className="rounded-[20px] bg-white p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#8b8078]">Gastos extra</p>
          <p className="mt-2 text-lg font-black text-[#d39218]">{money(extraTotal)}</p>
        </div>
        <div className="rounded-[20px] bg-[#8f3a2e] p-4 text-white shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[.1em] text-white/70">Total pagado</p>
          <p className="mt-2 text-lg font-black">{money(totalPaid)}</p>
        </div>
        <div className="rounded-[20px] bg-white p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#8b8078]">Series</p>
          <p className="mt-2 text-lg font-black text-[#5a8b86]">{totalSeries}</p>
        </div>
        <div className="rounded-[20px] bg-white p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#8b8078]">Prendas</p>
          <p className="mt-2 text-lg font-black text-[#5a8b86]">{totalPieces}</p>
        </div>
        <div className="rounded-[20px] bg-[#f4faf8] p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#42746e]">Filas</p>
          <p className="mt-2 text-lg font-black text-[#42746e]">{rows.length}</p>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#eaded3] bg-white p-5">
        <label className="mb-2 block text-xs font-black uppercase tracking-[.08em] text-[#756a62]">
          Notas
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="ti-input min-h-24 py-3"
          placeholder="Algún detalle del proveedor o de la carga..."
        />
      </section>

      <button
        disabled={!canSubmit}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-[#b63a2c] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(182,58,44,.20)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Save size={18} />
        Guardar compra China
      </button>
    </form>
  );
}
