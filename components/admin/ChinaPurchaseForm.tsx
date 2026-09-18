"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Camera,
  ChevronDown,
  CopyPlus,
  ImagePlus,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import {
  createChinaPurchaseV5,
} from "@/app/admin/actions";

import {
  createClient,
} from "@/lib/supabase/client";

type ExistingProduct = {
  id: string;
  code: string;
  name: string;
  sizes: string[];
  pieces_per_series: number;
  price_preorder: number | null;
  price_stock: number | null;
  cover_url?: string | null;
};

type ColorRow = {
  key: string;
  name: string;
  qty: number;
};

type PurchaseRow = {
  key: string;

  mode:
    | "NEW"
    | "EXISTING";

  product_id: string;

  name: string;
  sizes: string[];

  colors: ColorRow[];

  supplier_cost_series: number;

  preorder_price: number;
  stock_price: number;

  cover_url: string;
};

type Currency =
  | "PEN"
  | "USD"
  | "CNY";

const AGE_SIZES = [
  "1-2",
  "2-3",
  "3-4",
  "4-5",
  "5-6",
  "6-7",
  "7-8",
  "8-9",
  "9-10",
  "10-11",
  "11-12",
  "12-13",
  "13-14",
  "14-15",
  "15-16",
];

const BABY_SIZES = [
  "0-3m",
  "3-6m",
  "6-9m",
  "9-12m",
  "12-18m",
  "18-24m",
];

function newColor(): ColorRow {
  return {
    key:
      crypto.randomUUID(),
    name: "",
    qty: 1,
  };
}

function newRow(): PurchaseRow {
  return {
    key:
      crypto.randomUUID(),

    mode: "NEW",

    product_id: "",

    name: "",

    // Por defecto una serie de 5 tallas consecutivas.
    sizes: [
      "1-2",
      "2-3",
      "3-4",
      "4-5",
      "5-6",
    ],

    colors: [
      newColor(),
    ],

    supplier_cost_series:
      0,

    preorder_price:
      0,

    stock_price:
      0,

    cover_url: "",
  };
}

function money(
  value: number
) {
  return `S/ ${Number(
    value || 0
  ).toFixed(2)}`;
}

function sortSizes(
  sizes: string[]
) {
  const order = [
    ...BABY_SIZES,
    ...AGE_SIZES,
  ];

  return [
    ...sizes,
  ].sort(
    (a, b) => {
      const ai =
        order.indexOf(a);

      const bi =
        order.indexOf(b);

      if (
        ai === -1 &&
        bi === -1
      ) {
        return a.localeCompare(
          b,
          undefined,
          {
            numeric: true,
          }
        );
      }

      if (
        ai === -1
      ) {
        return 1;
      }

      if (
        bi === -1
      ) {
        return -1;
      }

      return ai - bi;
    }
  );
}

export function ChinaPurchaseForm({
  products,
}: {
  products: ExistingProduct[];
}) {
  const supabase =
    createClient();

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

  const [
    uploadingKey,
    setUploadingKey,
  ] = useState<
    string | null
  >(null);

  const [
    customSizes,
    setCustomSizes,
  ] = useState<
    Record<
      string,
      string
    >
  >({});

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
              sortSizes(
                Array.from(
                  new Set(
                    row.sizes
                      .map(
                        (
                          size
                        ) =>
                          size.trim()
                      )
                      .filter(
                        Boolean
                      )
                  )
                )
              );

            const pieces =
              Math.max(
                sizes.length,
                1
              );

            const validColors =
              row.colors
                .map(
                  (
                    color
                  ) => ({
                    name:
                      color.name.trim(),
                    qty:
                      Math.max(
                        Number(
                          color.qty ||
                            0
                        ),
                        0
                      ),
                  })
                )
                .filter(
                  (color) =>
                    color.name &&
                    color.qty >
                      0
                );

            // TOTAL SERIES = suma de las series compradas de cada color.
            // Ejemplo: Rosado 5 + Negro 5 = 10 series.
            const totalSeries =
              validColors.reduce(
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
              pieces,
              validColors,
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
            row.mode ===
              "EXISTING"
              ? row.product_id
              : null,

          name:
            row.mode ===
              "EXISTING"
              ? row.existing
                  ?.name
              : row.name.trim(),

          sizes:
            row.sizes,

          colors:
            row.validColors,

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

          cover_url:
            row.cover_url ||
            null,
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

  function toggleSize(
    rowKey: string,
    size: string
  ) {
    setRows(
      (current) =>
        current.map(
          (row) => {
            if (
              row.key !==
              rowKey
            ) {
              return row;
            }

            const exists =
              row.sizes.includes(
                size
              );

            const next =
              exists
                ? row.sizes.filter(
                    (
                      item
                    ) =>
                      item !==
                      size
                  )
                : [
                    ...row.sizes,
                    size,
                  ];

            return {
              ...row,
              sizes:
                sortSizes(
                  next
                ),
            };
          }
        )
    );
  }

  function addCustomSize(
    rowKey: string
  ) {
    const value =
      (
        customSizes[
          rowKey
        ] ?? ""
      ).trim();

    if (!value) {
      return;
    }

    setRows(
      (current) =>
        current.map(
          (row) =>
            row.key ===
            rowKey
              ? {
                  ...row,
                  sizes:
                    sortSizes(
                      Array.from(
                        new Set(
                          [
                            ...row.sizes,
                            value,
                          ]
                        )
                      )
                    ),
                }
              : row
        )
    );

    setCustomSizes(
      (current) => ({
        ...current,
        [rowKey]:
          "",
      })
    );
  }

  function setQuickRange(
    rowKey: string,
    start:
      | 1
      | 2
      | 3
      | 4
      | 5
  ) {
    const quick =
      Array.from(
        {
          length: 5,
        },
        (
          _,
          index
        ) => {
          const from =
            start +
            index;

          return `${from}-${from + 1}`;
        }
      );

    updateRow(
      rowKey,
      {
        sizes:
          quick,
      }
    );
  }

  function setMode(
    key: string,
    mode:
      | "NEW"
      | "EXISTING"
  ) {
    if (
      mode ===
      "NEW"
    ) {
      updateRow(
        key,
        {
          mode,
          product_id:
            "",
          name: "",
          sizes: [
            "1-2",
            "2-3",
            "3-4",
            "4-5",
            "5-6",
          ],
          preorder_price:
            0,
          stock_price:
            0,
          cover_url:
            "",
        }
      );

      return;
    }

    const first =
      products[0];

    updateRow(
      key,
      {
        mode,
        product_id:
          first?.id ??
          "",
        name:
          first?.name ??
          "",
        sizes:
          first?.sizes ??
          [],
        preorder_price:
          Number(
            first
              ?.price_preorder ??
              0
          ),
        stock_price:
          Number(
            first
              ?.price_stock ??
              0
          ),
        cover_url:
          first
            ?.cover_url ??
          "",
      }
    );
  }

  function selectExistingProduct(
    key: string,
    productId: string
  ) {
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

        sizes:
          product?.sizes ??
          [],

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

        cover_url:
          product
            ?.cover_url ??
          "",
      }
    );
  }

  function updateColor(
    rowKey: string,
    colorKey: string,
    patch: Partial<ColorRow>
  ) {
    setRows(
      (current) =>
        current.map(
          (row) => {
            if (
              row.key !==
              rowKey
            ) {
              return row;
            }

            return {
              ...row,
              colors:
                row.colors.map(
                  (
                    color
                  ) =>
                    color.key ===
                    colorKey
                      ? {
                          ...color,
                          ...patch,
                        }
                      : color
                ),
            };
          }
        )
    );
  }

  function addColor(
    rowKey: string
  ) {
    setRows(
      (current) =>
        current.map(
          (row) =>
            row.key ===
            rowKey
              ? {
                  ...row,
                  colors: [
                    ...row.colors,
                    newColor(),
                  ],
                }
              : row
        )
    );
  }

  function removeColor(
    rowKey: string,
    colorKey: string
  ) {
    setRows(
      (current) =>
        current.map(
          (row) => {
            if (
              row.key !==
              rowKey
            ) {
              return row;
            }

            if (
              row.colors
                .length ===
              1
            ) {
              return row;
            }

            return {
              ...row,
              colors:
                row.colors.filter(
                  (
                    color
                  ) =>
                    color.key !==
                    colorKey
                ),
            };
          }
        )
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

  async function uploadCover(
    rowKey: string,
    file: File
  ) {
    setUploadingKey(
      rowKey
    );

    try {
      const ext =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "jpg";

      const path =
        `series/covers/${crypto.randomUUID()}.${ext}`;

      const {
        error,
      } =
        await supabase.storage
          .from(
            "catalog-media"
          )
          .upload(
            path,
            file,
            {
              upsert:
                false,
              cacheControl:
                "3600",
            }
          );

      if (error) {
        throw error;
      }

      const { data } =
        supabase.storage
          .from(
            "catalog-media"
          )
          .getPublicUrl(
            path
          );

      updateRow(
        rowKey,
        {
          cover_url:
            data.publicUrl,
        }
      );
    } catch (
      error
    ) {
      alert(
        error instanceof
          Error
          ? error.message
          : "No se pudo subir la foto."
      );
    } finally {
      setUploadingKey(
        null
      );
    }
  }

  const canSubmit =
    computed.length >
      0 &&
    computed.every(
      (row) =>
        (
          row.mode ===
            "EXISTING"
            ? !!row.product_id
            : row.name.trim()
                .length >
              1
        ) &&
        row.sizes.length >
          0 &&
        row.validColors
          .length >
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
        createChinaPurchaseV5
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

      <section className="rounded-[28px] border border-[#eaded3] bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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

          <div className="sm:col-span-1 xl:col-span-2">
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
              Tipo de cambio a soles
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

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
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
                <label className="mb-2 block text-[9px] font-black uppercase tracking-[.08em] text-[#8b8078]">
                  {label}
                </label>

                <div className="flex overflow-hidden rounded-[14px] border border-[#eaded3]">
                  <span className="grid min-w-9 place-items-center bg-[#f8f4f0] text-[10px] font-black text-[#8f3a2e]">
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

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-[#5a8b86]">
              Modelos de esta compra
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Registra cada modelo
            </h2>

            <p className="mt-1 text-xs leading-5 text-[#7f746c]">
              El código se crea solo.
              Para cada modelo eliges
              sus tallas y agregas uno
              o varios colores.
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
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#fff0e9] px-4 text-xs font-black text-[#9b382b]"
          >
            <CopyPlus
              size={15}
            />

            Agregar otro modelo
          </button>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {computed.map(
            (
              row,
              index
            ) => {
              const colorFormula =
                row.validColors
                  .map(
                    (
                      color
                    ) =>
                      `${color.name} ${color.qty}`
                  )
                  .join(
                    " + "
                  );

              return (
                <article
                  key={
                    row.key
                  }
                  className="overflow-hidden rounded-[28px] border border-[#eaded3] bg-white shadow-[0_8px_24px_rgba(100,70,40,.05)]"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-[#eaded3] bg-[#fffdfb] px-4 py-4 sm:px-5">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[.12em] text-[#5a8b86]">
                        Modelo{" "}
                        {index + 1}
                      </p>

                      <p className="mt-1 text-sm font-black">
                        {row.mode ===
                        "NEW"
                          ? "Código automático al guardar"
                          : row.existing
                              ?.code ??
                            "Código existente"}
                      </p>
                    </div>

                    {rows.length >
                      1 && (
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
                    )}
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="grid grid-cols-2 gap-2 rounded-[18px] bg-[#f8f4f0] p-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setMode(
                            row.key,
                            "NEW"
                          )
                        }
                        className={`min-h-10 rounded-[14px] text-[11px] font-black ${
                          row.mode ===
                          "NEW"
                            ? "bg-white text-[#8f3a2e] shadow-sm"
                            : "text-[#8b8078]"
                        }`}
                      >
                        Nuevo modelo
                      </button>

                      <button
                        type="button"
                        disabled={
                          products.length ===
                          0
                        }
                        onClick={() =>
                          setMode(
                            row.key,
                            "EXISTING"
                          )
                        }
                        className={`min-h-10 rounded-[14px] text-[11px] font-black disabled:opacity-40 ${
                          row.mode ===
                          "EXISTING"
                            ? "bg-white text-[#5a8b86] shadow-sm"
                            : "text-[#8b8078]"
                        }`}
                      >
                        Ya existe
                      </button>
                    </div>

                    {row.mode ===
                    "EXISTING" ? (
                      <div className="mt-4">
                        <label className="mb-2 block text-xs font-black">
                          Elegir código
                        </label>

                        <div className="relative">
                          <select
                            value={
                              row.product_id
                            }
                            onChange={(
                              e
                            ) =>
                              selectExistingProduct(
                                row.key,
                                e
                                  .target
                                  .value
                              )
                            }
                            className="ti-input appearance-none pr-10"
                          >
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

                          <ChevronDown
                            size={
                              16
                            }
                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8b8078]"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-[18px] border border-[#f0dacf] bg-[#fff7f1] p-4">
                        <p className="text-[9px] font-black uppercase tracking-[.12em] text-[#b63a2c]">
                          Código
                        </p>

                        <p className="mt-1 text-lg font-black text-[#8f3a2e]">
                          AUTOMÁTICO
                        </p>

                        <p className="mt-1 text-[10px] leading-4 text-[#8b8078]">
                          Al guardar se
                          generará TI0001,
                          TI0002, etc.
                        </p>
                      </div>
                    )}

                    <div className="mt-4">
                      <label className="mb-2 block text-xs font-black">
                        Nombre visible
                      </label>

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
                          row.mode ===
                          "EXISTING"
                        }
                        className="ti-input disabled:bg-[#f5f1ed]"
                        placeholder="Ej: Conjunto Conejito"
                      />

                      <p className="mt-1 text-[9px] text-[#8b8078]">
                        Este nombre se
                        verá en la web.
                      </p>
                    </div>

                    {/* SELECTOR DE TALLAS */}
                    <div className="mt-5 rounded-[20px] border border-[#eaded3] bg-[#fffdfb] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black">
                            Tallas de la serie
                          </p>

                          <p className="mt-1 text-[9px] leading-4 text-[#8b8078]">
                            Toca todas las
                            tallas que vienen
                            dentro de UNA serie.
                          </p>
                        </div>

                        <span className="rounded-full bg-[#edf7f5] px-3 py-1.5 text-[9px] font-black text-[#42746e]">
                          {row.pieces} prendas / serie
                        </span>
                      </div>

                      <div className="mt-3">
                        <p className="text-[8px] font-black uppercase tracking-[.1em] text-[#8b8078]">
                          Selección rápida
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5].map(
                            (
                              start
                            ) => (
                              <button
                                key={
                                  start
                                }
                                type="button"
                                onClick={() =>
                                  setQuickRange(
                                    row.key,
                                    start as
                                      | 1
                                      | 2
                                      | 3
                                      | 4
                                      | 5
                                  )
                                }
                                className="rounded-full bg-[#fff0e9] px-3 py-2 text-[9px] font-black text-[#9b382b]"
                              >
                                {start}-{start + 1} a{" "}
                                {start + 4}-{start + 5}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-[8px] font-black uppercase tracking-[.1em] text-[#8b8078]">
                          Tallas por edad
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {AGE_SIZES.map(
                            (
                              size
                            ) => {
                              const selected =
                                row.sizes.includes(
                                  size
                                );

                              return (
                                <button
                                  key={
                                    size
                                  }
                                  type="button"
                                  onClick={() =>
                                    toggleSize(
                                      row.key,
                                      size
                                    )
                                  }
                                  className={`min-w-12 rounded-full border px-3 py-2 text-[10px] font-black ${
                                    selected
                                      ? "border-[#8f3a2e] bg-[#8f3a2e] text-white"
                                      : "border-[#eaded3] bg-white text-[#6f655e]"
                                  }`}
                                >
                                  {
                                    size
                                  }
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>

                      <details className="mt-4">
                        <summary className="cursor-pointer text-[9px] font-black text-[#5a8b86]">
                          Ver tallas bebé
                        </summary>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {BABY_SIZES.map(
                            (
                              size
                            ) => {
                              const selected =
                                row.sizes.includes(
                                  size
                                );

                              return (
                                <button
                                  key={
                                    size
                                  }
                                  type="button"
                                  onClick={() =>
                                    toggleSize(
                                      row.key,
                                      size
                                    )
                                  }
                                  className={`rounded-full border px-3 py-2 text-[10px] font-black ${
                                    selected
                                      ? "border-[#5a8b86] bg-[#5a8b86] text-white"
                                      : "border-[#eaded3] bg-white text-[#6f655e]"
                                  }`}
                                >
                                  {
                                    size
                                  }
                                </button>
                              );
                            }
                          )}
                        </div>
                      </details>

                      <div className="mt-4">
                        <p className="text-[8px] font-black uppercase tracking-[.1em] text-[#8b8078]">
                          Otra talla
                        </p>

                        <div className="mt-2 flex gap-2">
                          <input
                            value={
                              customSizes[
                                row.key
                              ] ??
                              ""
                            }
                            onChange={(
                              e
                            ) =>
                              setCustomSizes(
                                (
                                  current
                                ) => ({
                                  ...current,
                                  [row.key]:
                                    e
                                      .target
                                      .value,
                                })
                              )
                            }
                            onKeyDown={(
                              e
                            ) => {
                              if (
                                e.key ===
                                "Enter"
                              ) {
                                e.preventDefault();

                                addCustomSize(
                                  row.key
                                );
                              }
                            }}
                            className="ti-input"
                            placeholder="Ej: 90 o 16-17"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              addCustomSize(
                                row.key
                              )
                            }
                            className="grid min-w-12 place-items-center rounded-[16px] bg-[#f4faf8] text-[#42746e]"
                          >
                            <Plus
                              size={
                                16
                              }
                            />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {row.sizes.map(
                          (
                            size
                          ) => (
                            <span
                              key={
                                size
                              }
                              className="inline-flex items-center gap-1 rounded-full bg-[#f7f2ec] px-3 py-1.5 text-[9px] font-black text-[#5e554f]"
                            >
                              {
                                size
                              }

                              <button
                                type="button"
                                onClick={() =>
                                  toggleSize(
                                    row.key,
                                    size
                                  )
                                }
                              >
                                <X
                                  size={
                                    11
                                  }
                                />
                              </button>
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    {/* FOTO */}
                    <div className="mt-4 rounded-[20px] border border-[#eaded3] bg-[#fffdfb] p-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f4faf8] text-[#5a8b86]">
                          <Camera
                            size={
                              16
                            }
                          />
                        </span>

                        <div>
                          <p className="text-xs font-black">
                            Foto portada
                          </p>

                          <p className="mt-0.5 text-[9px] leading-4 text-[#8b8078]">
                            Será la primera
                            imagen que verá
                            la clienta.
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-[16px] bg-[#f1e9e1]">
                          {row.cover_url ? (
                            <img
                              src={
                                row.cover_url
                              }
                              alt="Portada"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImagePlus
                              size={
                                22
                              }
                              className="text-[#bda99b]"
                            />
                          )}
                        </div>

                        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full bg-[#edf7f5] px-4 text-[10px] font-black text-[#42746e]">
                          <ImagePlus
                            size={
                              14
                            }
                          />

                          {uploadingKey ===
                          row.key
                            ? "Subiendo..."
                            : row.cover_url
                              ? "Cambiar foto"
                              : "Subir foto"}

                          <input
                            type="file"
                            accept="image/*"
                            disabled={
                              uploadingKey ===
                              row.key
                            }
                            className="hidden"
                            onChange={(
                              e
                            ) => {
                              const file =
                                e
                                  .target
                                  .files?.[0];

                              if (
                                file
                              ) {
                                uploadCover(
                                  row.key,
                                  file
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* COLORES */}
                    <div className="mt-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-black">
                            Colores comprados
                          </p>

                          <p className="mt-1 text-[9px] text-[#8b8078]">
                            La cantidad indica
                            cuántas SERIES
                            completas compró
                            de ese color.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            addColor(
                              row.key
                            )
                          }
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#fff6e9] px-3 text-[9px] font-black text-[#9b6510]"
                        >
                          <Plus
                            size={
                              12
                            }
                          />
                          Otro color
                        </button>
                      </div>

                      <div className="mt-3 space-y-2">
                        {row.colors.map(
                          (
                            color,
                            colorIndex
                          ) => (
                            <div
                              key={
                                color.key
                              }
                              className="grid grid-cols-[1fr_105px_auto] gap-2 rounded-[16px] border border-[#eaded3] bg-[#fffdfb] p-2.5"
                            >
                              <div>
                                <label className="mb-1 block text-[8px] font-black uppercase text-[#8b8078]">
                                  Color{" "}
                                  {colorIndex +
                                    1}
                                </label>

                                <input
                                  value={
                                    color.name
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    updateColor(
                                      row.key,
                                      color.key,
                                      {
                                        name:
                                          e
                                            .target
                                            .value,
                                      }
                                    )
                                  }
                                  className="h-10 w-full rounded-[12px] border border-[#eaded3] px-3 text-xs font-black outline-none"
                                  placeholder="Rosado"
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-[8px] font-black uppercase text-[#8b8078]">
                                  Series
                                </label>

                                <input
                                  type="number"
                                  min="1"
                                  value={
                                    color.qty
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    updateColor(
                                      row.key,
                                      color.key,
                                      {
                                        qty:
                                          Number(
                                            e
                                              .target
                                              .value
                                          ),
                                      }
                                    )
                                  }
                                  className="h-10 w-full rounded-[12px] border border-[#eaded3] px-3 text-center text-xs font-black outline-none"
                                />
                              </div>

                              <div className="flex items-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeColor(
                                      row.key,
                                      color.key
                                    )
                                  }
                                  disabled={
                                    row.colors
                                      .length ===
                                    1
                                  }
                                  className="grid size-10 place-items-center rounded-full bg-[#fff0eb] text-[#b63a2c] disabled:opacity-25"
                                >
                                  <Trash2
                                    size={
                                      13
                                    }
                                  />
                                </button>
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      <div className="mt-3 rounded-[18px] bg-[#f4faf8] px-4 py-3">
                        <p className="text-[9px] font-bold leading-5 text-[#64847f]">
                          {colorFormula ||
                            "Agrega color y cantidad"}
                        </p>

                        <p className="mt-1 text-sm font-black text-[#42746e]">
                          ={" "}
                          {
                            row.totalSeries
                          }{" "}
                          series
                        </p>

                        <p className="mt-1 text-[10px] font-black text-[#42746e]">
                          {
                            row.totalSeries
                          }{" "}
                          series ×{" "}
                          {
                            row.pieces
                          }{" "}
                          tallas ={" "}
                          {row.totalSeries *
                            row.pieces}{" "}
                          prendas
                        </p>
                      </div>
                    </div>

                    {/* COSTOS */}
                    <div className="mt-5">
                      <p className="text-xs font-black">
                        Costos y precios
                      </p>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="mb-2 block text-[9px] font-black uppercase text-[#8b8078]">
                            Proveedor / serie
                          </label>

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
                            className="ti-input"
                            placeholder="200"
                          />
                        </div>

                        <div>
                          <p className="text-[9px] font-black uppercase text-[#8b8078]">
                            Prov. / prenda
                          </p>

                          <p className="mt-2 text-sm font-black">
                            {money(
                              row.supplierCostPen /
                                row.pieces
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[9px] font-black uppercase text-[#9b6510]">
                            Gastos asignados
                          </p>

                          <p className="mt-2 text-sm font-black text-[#9b6510]">
                            {money(
                              row.allocated
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[9px] font-black uppercase text-[#42746e]">
                            Real / serie
                          </p>

                          <p className="mt-2 text-sm font-black text-[#42746e]">
                            {money(
                              row.landedSeries
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[9px] font-black uppercase text-[#42746e]">
                            Real / prenda
                          </p>

                          <p className="mt-2 text-sm font-black text-[#42746e]">
                            {money(
                              row.landedPiece
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-2 block text-[9px] font-black uppercase text-[#9b6510]">
                          Precio preventa
                        </label>

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
                          className="ti-input bg-[#fffaf0]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[9px] font-black uppercase text-[#9b382b]">
                          Precio stock
                        </label>

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
                          className="ti-input bg-[#fff4ef]"
                        />
                      </div>
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
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

        <div className="col-span-2 rounded-[20px] bg-[#8f3a2e] p-4 text-white shadow-sm lg:col-span-1">
          <p className="text-[9px] font-black uppercase text-white/70">
            Total pagado
          </p>

          <p className="mt-2 text-xl font-black">
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
          !canSubmit ||
          uploadingKey !==
            null
        }
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-[#b63a2c] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(182,58,44,.18)] disabled:opacity-40"
      >
        <Save
          size={18}
        />

        Guardar compra y crear códigos
      </button>
    </form>
  );
}
