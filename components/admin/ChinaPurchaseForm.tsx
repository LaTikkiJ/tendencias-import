"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import {
  createChinaPurchaseV2,
} from "@/app/admin/actions";

type ExistingProduct = {
  id: string;
  code: string;
  name: string;
  sizes: string[];
  pieces_per_series: number;
  price_preorder: number | null;
  price_stock: number | null;
};

type PurchaseRow = {
  key: string;

  product_id: string;

  name: string;
  sizes_text: string;

  colors_text: string;

  supplier_cost_series: number;

  preorder_price: number;
  stock_price: number;
};

type Currency =
  | "PEN"
  | "USD"
  | "CNY";

function money(
  value: number
) {
  return `S/ ${Number(
    value || 0
  ).toFixed(2)}`;
}

function parseSizes(
  value: string
) {
  return value
    .split(",")
    .map((item) =>
      item.trim()
    )
    .filter(Boolean);
}

function parseColors(
  value: string
) {
  return value
    .split(",")
    .map((chunk) =>
      chunk.trim()
    )
    .filter(Boolean)
    .map((chunk) => {
      const [
        nameRaw,
        qtyRaw,
      ] = chunk.split(":");

      return {
        name:
          String(
            nameRaw ?? ""
          ).trim(),

        qty:
          Math.max(
            Number(
              String(
                qtyRaw ?? "0"
              ).trim()
            ) || 0,
            0
          ),
      };
    })
    .filter(
      (item) =>
        item.name &&
        item.qty > 0
    );
}

function newRow(): PurchaseRow {
  return {
    key:
      crypto.randomUUID(),

    product_id: "",

    name: "",
    sizes_text:
      "1,2,3,4,5",

    colors_text: "",

    supplier_cost_series:
      0,

    preorder_price:
      0,

    stock_price:
      0,
  };
}

export function ChinaPurchaseForm({
  products,
}: {
  products: ExistingProduct[];
}) {
  const [
    purchaseDate,
    setPurchaseDate,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10)
  );

  const [
    supplier,
    setSupplier,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState(
    "EN_TRANSITO"
  );

  const [
    currency,
    setCurrency,
  ] =
    useState<Currency>(
      "PEN"
    );

  const [
    exchangeRate,
    setExchangeRate,
  ] = useState(1);

  const [
    freight,
    setFreight,
  ] = useState(0);

  const [
    taxes,
    setTaxes,
  ] = useState(0);

  const [
    commissions,
    setCommissions,
  ] = useState(0);

  const [
    localTransport,
    setLocalTransport,
  ] = useState(0);

  const [
    otherCosts,
    setOtherCosts,
  ] = useState(0);

  const [
    notes,
    setNotes,
  ] = useState("");

  const [
    rows,
    setRows,
  ] = useState<
    PurchaseRow[]
  >([newRow()]);

  const productMap =
    useMemo(
      () =>
        new Map(
          products.map(
            (product) => [
              product.id,
              product,
            ]
          )
        ),
      [products]
    );

  const extraTotal =
    Number(
      freight || 0
    ) +
    Number(
      taxes || 0
    ) +
    Number(
      commissions || 0
    ) +
    Number(
      localTransport ||
        0
    ) +
    Number(
      otherCosts || 0
    );

  const computed =
    useMemo(() => {
      const base =
        rows.map(
          (row) => {
            const existing =
              row.product_id
                ? productMap.get(
                    row.product_id
                  )
                : undefined;

            const sizes =
              parseSizes(
                row.sizes_text
              );

            const colors =
              parseColors(
                row.colors_text
              );

            const pieces =
              Math.max(
                sizes.length,
                Number(
                  existing
                    ?.pieces_per_series ??
                    0
                ),
                1
              );

            const totalSeries =
              colors.reduce(
                (
                  sum,
                  color
                ) =>
                  sum +
                  color.qty,
                0
              );

            const supplierCostPen =
              Number(
                row.supplier_cost_series ||
                  0
              ) *
              Number(
                exchangeRate ||
                  1
              );

            const subtotal =
              totalSeries *
              supplierCostPen;

            return {
              ...row,
              existing,
              sizes,
              colors,
              pieces,
              totalSeries,
              supplierCostPen,
              subtotal,
            };
          }
        );

      const merchandise =
        base.reduce(
          (
            sum,
            row
          ) =>
            sum +
            row.subtotal,
          0
        );

      return base.map(
        (row) => {
          const allocated =
            merchandise >
            0
              ? extraTotal *
                (
                  row.subtotal /
                  merchandise
                )
              : 0;

          const landedTotal =
            row.subtotal +
            allocated;

          const landedSeries =
            row.totalSeries >
            0
              ? landedTotal /
                row.totalSeries
              : 0;

          const landedPiece =
            row.pieces > 0
              ? landedSeries /
                row.pieces
              : 0;

          return {
            ...row,
            allocated,
            landedSeries,
            landedPiece,
          };
        }
      );
    }, [
      rows,
      productMap,
      exchangeRate,
      extraTotal,
    ]);

  const merchandiseTotal =
    computed.reduce(
      (sum, row) =>
        sum +
        row.subtotal,
      0
    );

  const totalSeries =
    computed.reduce(
      (sum, row) =>
        sum +
        row.totalSeries,
      0
    );

  const totalPieces =
    computed.reduce(
      (sum, row) =>
        sum +
        row.totalSeries *
          row.pieces,
      0
    );

  const totalPaid =
    merchandiseTotal +
    extraTotal;

  const payload = {
    purchase_date:
      purchaseDate,

    supplier,

    status,

    currency,

    exchange_rate:
      currency ===
      "PEN"
        ? 1
        : Number(
            exchangeRate ||
              1
          ),

    freight:
      Number(
        freight || 0
      ),

    taxes:
      Number(
        taxes || 0
      ),

    commissions:
      Number(
        commissions ||
          0
      ),

    local_transport:
      Number(
        localTransport ||
          0
      ),

    other_costs:
      Number(
        otherCosts || 0
      ),

    notes,

    items:
      computed.map(
        (row) => ({
          product_id:
            row.product_id ||
            null,

          name:
            row.product_id
              ? row.existing
                  ?.name
              : row.name,

          sizes:
            row.sizes,

          colors:
            row.colors,

          supplier_cost_series:
            Number(
              row.supplier_cost_series ||
                0
            ),

          preorder_price:
            Number(
              row.preorder_price ||
                0
            ),

          stock_price:
            Number(
              row.stock_price ||
                0
            ),
        })
      ),
  };

  function updateRow(
    key: string,
    patch: Partial<PurchaseRow>
  ) {
    setRows(
      (current) =>
        current.map(
          (row) =>
            row.key ===
            key
              ? {
                  ...row,
                  ...patch,
                }
              : row
        )
    );
  }

  function selectProduct(
    key: string,
    productId: string
  ) {
    if (!productId) {
      updateRow(
        key,
        {
          product_id: "",
          name: "",
          sizes_text:
            "1,2,3,4,5",
          preorder_price:
            0,
          stock_price: 0,
        }
      );

      return;
    }

    const product =
      productMap.get(
        productId
      );

    updateRow(
      key,
      {
        product_id:
          productId,

        name:
          product?.name ??
          "",

        sizes_text:
          (
            product?.sizes ??
            []
          ).join(","),

        preorder_price:
          Number(
            product
              ?.price_preorder ??
              0
          ),

        stock_price:
          Number(
            product
              ?.price_stock ??
              0
          ),
      }
    );
  }

  function removeRow(
    key: string
  ) {
    setRows(
      (current) =>
        current.length ===
        1
          ? current
          : current.filter(
              (row) =>
                row.key !==
                key
            )
    );
  }

  const canSubmit =
    computed.length >
      0 &&
    computed.every(
      (row) =>
        (
          row.product_id ||
          row.name.trim()
        ) &&
        row.sizes.length >
          0 &&
        row.colors.length >
          0 &&
        row.totalSeries >
          0 &&
        Number(
          row.supplier_cost_series
        ) > 0 &&
        Number(
          row.preorder_price
        ) > 0 &&
        Number(
          row.stock_price
        ) > 0
    );

  return (
    <form
      action={
        createChinaPurchaseV2
      }
      className="space-y-6"
    >
      <input
        type="hidden"
        name="payload"
        value={JSON.stringify(
          payload
        )}
      />

      <section className="rounded-[28px] border border-[#eaded3] bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className="mb-2 block text-xs font-black">
              Fecha
            </label>

            <input
              type="date"
              value={
                purchaseDate
              }
              onChange={(e) =>
                setPurchaseDate(
                  e.target
                    .value
                )
              }
              className="ti-input"
            />
          </div>

          <div className="xl:col-span-2">
            <label className="mb-2 block text-xs font-black">
              Proveedor
            </label>

            <input
              value={
                supplier
              }
              onChange={(e) =>
                setSupplier(
                  e.target
                    .value
                )
              }
              className="ti-input"
              placeholder="Proveedor China"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black">
              Estado
            </label>

            <select
              value={
                status
              }
              onChange={(e) =>
                setStatus(
                  e.target
                    .value
                )
              }
              className="ti-input"
            >
              <option value="EN_TRANSITO">
                En tránsito
              </option>

              <option value="PEDIDO">
                Pedido
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black">
              Moneda
            </label>

            <select
              value={
                currency
              }
              onChange={(e) => {
                const value =
                  e.target
                    .value as Currency;

                setCurrency(
                  value
                );

                if (
                  value ===
                  "PEN"
                ) {
                  setExchangeRate(
                    1
                  );
                }
              }}
              className="ti-input"
            >
              <option value="PEN">
                PEN
              </option>

              <option value="USD">
                USD
              </option>

              <option value="CNY">
                CNY
              </option>
            </select>
          </div>
        </div>

        {currency !==
          "PEN" && (
          <div className="mt-4 max-w-xs">
            <label className="mb-2 block text-xs font-black">
              Tipo de cambio a
              soles
            </label>

            <input
              type="number"
              min="0"
              step="0.000001"
              value={
                exchangeRate
              }
              onChange={(e) =>
                setExchangeRate(
                  Number(
                    e.target
                      .value
                  )
                )
              }
              className="ti-input"
            />
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            [
              "Flete",
              freight,
              setFreight,
            ],
            [
              "Impuestos",
              taxes,
              setTaxes,
            ],
            [
              "Comisiones",
              commissions,
              setCommissions,
            ],
            [
              "Transporte",
              localTransport,
              setLocalTransport,
            ],
            [
              "Otros",
              otherCosts,
              setOtherCosts,
            ],
          ].map(
            (
              [
                label,
                value,
                setter,
              ]: any
            ) => (
              <div
                key={label}
              >
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[.08em] text-[#8b8078]">
                  {label}
                </label>

                <div className="flex overflow-hidden rounded-[14px] border border-[#eaded3]">
                  <span className="grid min-w-10 place-items-center bg-[#f8f4f0] text-xs font-black text-[#8f3a2e]">
                    S/
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      value
                    }
                    onChange={(
                      e
                    ) =>
                      setter(
                        Number(
                          e
                            .target
                            .value
                        )
                      )
                    }
                    className="h-11 min-w-0 flex-1 border-0 px-2 text-sm font-black outline-none"
                  />
                </div>
              </div>
            )
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#eaded3] bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-[#eaded3] px-5 py-4">
          <div>
            <p className="font-black">
              Códigos de esta
              compra
            </p>

            <p className="mt-1 text-xs text-[#7f746c]">
              Una fila = un
              código. Ejemplo
              colores:
              Rosado:3,
              Beige:2
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setRows(
                (
                  current
                ) => [
                  ...current,
                  newRow(),
                ]
              )
            }
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#fff0e9] px-4 text-xs font-black text-[#9b382b]"
          >
            <Plus
              size={14}
            />

            Agregar código
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1840px] w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#f8f4f0] text-[9px] font-black uppercase tracking-[.07em] text-[#786d65]">
                <th className="px-3 py-3">
                  Código
                </th>

                <th className="px-3 py-3">
                  Modelo
                </th>

                <th className="px-3 py-3">
                  Tallas
                </th>

                <th className="px-3 py-3">
                  Colores / series
                </th>

                <th className="px-3 py-3 text-center">
                  Series
                </th>

                <th className="px-3 py-3 text-center">
                  Pzs
                </th>

                <th className="px-3 py-3">
                  Proveedor/serie
                </th>

                <th className="px-3 py-3">
                  Prov./prenda
                </th>

                <th className="px-3 py-3">
                  Gastos
                </th>

                <th className="px-3 py-3">
                  Real/serie
                </th>

                <th className="px-3 py-3">
                  Real/prenda
                </th>

                <th className="px-3 py-3">
                  Preventa
                </th>

                <th className="px-3 py-3">
                  Stock
                </th>

                <th className="px-3 py-3" />
              </tr>
            </thead>

            <tbody>
              {computed.map(
                (row) => (
                  <tr
                    key={
                      row.key
                    }
                    className="border-t border-[#f0e7df] align-top"
                  >
                    <td className="w-[190px] px-3 py-3">
                      <select
                        value={
                          row.product_id
                        }
                        onChange={(
                          e
                        ) =>
                          selectProduct(
                            row.key,
                            e
                              .target
                              .value
                          )
                        }
                        className="h-10 w-full rounded-[12px] border border-[#e4d7cc] bg-white px-2 text-[10px] font-black"
                      >
                        <option value="">
                          + Nuevo
                          código
                        </option>

                        {products.map(
                          (
                            product
                          ) => (
                            <option
                              key={
                                product.id
                              }
                              value={
                                product.id
                              }
                            >
                              {
                                product.code
                              }{" "}
                              ·{" "}
                              {
                                product.name
                              }
                            </option>
                          )
                        )}
                      </select>
                    </td>

                    <td className="w-[180px] px-3 py-3">
                      <input
                        value={
                          row.name
                        }
                        onChange={(
                          e
                        ) =>
                          updateRow(
                            row.key,
                            {
                              name:
                                e
                                  .target
                                  .value,
                            }
                          )
                        }
                        disabled={
                          !!row.product_id
                        }
                        className="h-10 w-full rounded-[12px] border border-[#e4d7cc] px-2 text-[10px] font-black disabled:bg-[#f5f1ed]"
                        placeholder="Conjunto..."
                      />
                    </td>

                    <td className="w-[135px] px-3 py-3">
                      <input
                        value={
                          row.sizes_text
                        }
                        onChange={(
                          e
                        ) =>
                          updateRow(
                            row.key,
                            {
                              sizes_text:
                                e
                                  .target
                                  .value,
                            }
                          )
                        }
                        className="h-10 w-full rounded-[12px] border border-[#e4d7cc] px-2 text-[10px] font-bold"
                        placeholder="1,2,3,4,5"
                      />
                    </td>

                    <td className="w-[210px] px-3 py-3">
                      <input
                        value={
                          row.colors_text
                        }
                        onChange={(
                          e
                        ) =>
                          updateRow(
                            row.key,
                            {
                              colors_text:
                                e
                                  .target
                                  .value,
                            }
                          )
                        }
                        className="h-10 w-full rounded-[12px] border border-[#e4d7cc] px-2 text-[10px] font-bold"
                        placeholder="Rosado:3, Beige:2"
                      />
                    </td>

                    <td className="w-[75px] px-3 py-3 text-center">
                      <div className="grid h-10 place-items-center rounded-[12px] bg-[#f8f4f0] text-xs font-black">
                        {
                          row.totalSeries
                        }
                      </div>
                    </td>

                    <td className="w-[65px] px-3 py-3 text-center">
                      <div className="grid h-10 place-items-center rounded-[12px] bg-[#f8f4f0] text-xs font-black">
                        {
                          row.pieces
                        }
                      </div>
                    </td>

                    <td className="w-[135px] px-3 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          row.supplier_cost_series
                        }
                        onChange={(
                          e
                        ) =>
                          updateRow(
                            row.key,
                            {
                              supplier_cost_series:
                                Number(
                                  e
                                    .target
                                    .value
                                ),
                            }
                          )
                        }
                        className="h-10 w-full rounded-[12px] border border-[#e4d7cc] px-2 text-xs font-black"
                      />
                    </td>

                    <td className="w-[110px] px-3 py-3">
                      <div className="rounded-[12px] bg-[#f8f4f0] px-2 py-3 text-[10px] font-black">
                        {money(
                          row.supplierCostPen /
                            row.pieces
                        )}
                      </div>
                    </td>

                    <td className="w-[105px] px-3 py-3">
                      <div className="rounded-[12px] bg-[#fff8e9] px-2 py-3 text-[10px] font-black text-[#9b6510]">
                        {money(
                          row.allocated
                        )}
                      </div>
                    </td>

                    <td className="w-[110px] px-3 py-3">
                      <div className="rounded-[12px] bg-[#f4faf8] px-2 py-3 text-[10px] font-black text-[#42746e]">
                        {money(
                          row.landedSeries
                        )}
                      </div>
                    </td>

                    <td className="w-[110px] px-3 py-3">
                      <div className="rounded-[12px] bg-[#f4faf8] px-2 py-3 text-[10px] font-black text-[#42746e]">
                        {money(
                          row.landedPiece
                        )}
                      </div>
                    </td>

                    <td className="w-[120px] px-3 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          row.preorder_price
                        }
                        onChange={(
                          e
                        ) =>
                          updateRow(
                            row.key,
                            {
                              preorder_price:
                                Number(
                                  e
                                    .target
                                    .value
                                ),
                            }
                          )
                        }
                        className="h-10 w-full rounded-[12px] border border-[#e4d7cc] bg-[#fffaf0] px-2 text-xs font-black text-[#9b6510]"
                      />
                    </td>

                    <td className="w-[120px] px-3 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          row.stock_price
                        }
                        onChange={(
                          e
                        ) =>
                          updateRow(
                            row.key,
                            {
                              stock_price:
                                Number(
                                  e
                                    .target
                                    .value
                                ),
                            }
                          )
                        }
                        className="h-10 w-full rounded-[12px] border border-[#e4d7cc] bg-[#fff0e9] px-2 text-xs font-black text-[#9b382b]"
                      />
                    </td>

                    <td className="w-[60px] px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          removeRow(
                            row.key
                          )
                        }
                        className="grid size-9 place-items-center rounded-full bg-[#fff0eb] text-[#b63a2c]"
                      >
                        <Trash2
                          size={
                            14
                          }
                        />
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-[20px] bg-white p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase text-[#8b8078]">
            Mercadería
          </p>

          <p className="mt-2 text-lg font-black">
            {money(
              merchandiseTotal
            )}
          </p>
        </div>

        <div className="rounded-[20px] bg-white p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase text-[#8b8078]">
            Gastos extra
          </p>

          <p className="mt-2 text-lg font-black text-[#d39218]">
            {money(
              extraTotal
            )}
          </p>
        </div>

        <div className="rounded-[20px] bg-[#8f3a2e] p-4 text-white shadow-sm">
          <p className="text-[9px] font-black uppercase text-white/70">
            Total pagado
          </p>

          <p className="mt-2 text-lg font-black">
            {money(
              totalPaid
            )}
          </p>
        </div>

        <div className="rounded-[20px] bg-white p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase text-[#8b8078]">
            Series
          </p>

          <p className="mt-2 text-lg font-black text-[#5a8b86]">
            {
              totalSeries
            }
          </p>
        </div>

        <div className="rounded-[20px] bg-white p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase text-[#8b8078]">
            Prendas
          </p>

          <p className="mt-2 text-lg font-black text-[#5a8b86]">
            {
              totalPieces
            }
          </p>
        </div>
      </section>

      <section className="rounded-[22px] border border-[#eaded3] bg-white p-4">
        <textarea
          value={
            notes
          }
          onChange={(e) =>
            setNotes(
              e.target.value
            )
          }
          className="ti-input min-h-20 py-3"
          placeholder="Notas de la compra..."
        />
      </section>

      <button
        disabled={
          !canSubmit
        }
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-[#b63a2c] text-sm font-black text-white disabled:opacity-40"
      >
        <Save
          size={18}
        />

        Guardar compra y
        crear códigos
      </button>
    </form>
  );
}
