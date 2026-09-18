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
  ReceiptText,
  Save,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";

import {
  createChinaPurchaseV9,
} from "@/app/admin/series/compras/actions-v9";

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

type Currency =
  | "PEN"
  | "USD"
  | "CNY";

type ColorRow = {
  key: string;
  name: string;
  qty: string;
};

type PurchaseRow = {
  key: string;

  mode:
    | "NEW"
    | "EXISTING";

  product_id: string;

  name: string;
  sizes: string[];

  colors:
    ColorRow[];

  cover_url: string;

  supplier_cost_piece_original: string;

  preorder_margin_pct: string;
  stock_margin_pct: string;

  preorder_price: string;
  stock_price: string;

  preorder_manual: boolean;
  stock_manual: boolean;
};

type PaymentRow = {
  key: string;
  payment_date: string;
  stage: string;
  amount_original: string;
  exchange_rate: string;
  payment_method: string;
  reference: string;
};

type ExpenseRow = {
  key: string;
  expense_date: string;
  concept: string;
  currency: Currency;
  amount: string;
  exchange_rate: string;
  reference: string;
};

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

const today =
  new Date()
    .toISOString()
    .slice(
      0,
      10
    );

function n(
  value:
    | string
    | number
    | null
    | undefined
) {
  const parsed =
    Number(
      value ?? 0
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}

function newColor():
  ColorRow {
  return {
    key:
      crypto.randomUUID(),
    name: "",
    qty: "",
  };
}

function newRow():
  PurchaseRow {
  return {
    key:
      crypto.randomUUID(),

    mode:
      "NEW",

    product_id:
      "",

    name:
      "",

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

    cover_url:
      "",

    supplier_cost_piece_original:
      "",

    preorder_margin_pct:
      "20",

    stock_margin_pct:
      "20",

    preorder_price:
      "",

    stock_price:
      "",

    preorder_manual:
      false,

    stock_manual:
      false,
  };
}

function newPayment(
  index: number
): PaymentRow {
  return {
    key:
      crypto.randomUUID(),

    payment_date:
      today,

    stage:
      index === 0
        ? "Pago inicial"
        : `Pago ${index + 1}`,

    amount_original:
      "",

    exchange_rate:
      "",

    payment_method:
      "",

    reference:
      "",
  };
}

function newExpense():
  ExpenseRow {
  return {
    key:
      crypto.randomUUID(),

    expense_date:
      today,

    concept:
      "Flete",

    currency:
      "USD",

    amount:
      "",

    exchange_rate:
      "",

    reference:
      "",
  };
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
    (
      a,
      b
    ) => {
      const ai =
        order.indexOf(
          a
        );

      const bi =
        order.indexOf(
          b
        );

      if (
        ai === -1 &&
        bi === -1
      ) {
        return a.localeCompare(
          b,
          undefined,
          {
            numeric:
              true,
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

function currencySymbol(
  currency: Currency
) {
  if (
    currency ===
    "USD"
  ) {
    return "USD";
  }

  if (
    currency ===
    "CNY"
  ) {
    return "CNY";
  }

  return "S/";
}

function moneyPen(
  value: number
) {
  return `S/ ${Number(
    value || 0
  ).toFixed(
    2
  )}`;
}

function moneyOriginal(
  value: number,
  currency: Currency
) {
  return `${currencySymbol(
    currency
  )} ${Number(
    value || 0
  ).toFixed(
    2
  )}`;
}

function NumberInput({
  value,
  onChange,
  placeholder,
  min,
  step = "0.01",
  className = "",
}: {
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  min?: number;
  step?: string;
  className?: string;
}) {
  return (
    <input
      type="number"
      value={
        value
      }
      onChange={(
        e
      ) =>
        onChange(
          e.target
            .value
        )
      }
      placeholder={
        placeholder
      }
      min={
        min
      }
      step={
        step
      }
      className={`ti-input ${className}`}
    />
  );
}

export function ChinaPurchaseForm({
  products,
}: {
  products:
    ExistingProduct[];
}) {
  const supabase =
    createClient();

  const [
    purchaseDate,
    setPurchaseDate,
  ] = useState(
    today
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
      "USD"
    );

  const [
    fallbackExchangeRate,
    setFallbackExchangeRate,
  ] = useState("");

  const [
    rows,
    setRows,
  ] =
    useState<
      PurchaseRow[]
    >([
      newRow(),
    ]);

  const [
    payments,
    setPayments,
  ] =
    useState<
      PaymentRow[]
    >([
      newPayment(
        0
      ),
    ]);

  const [
    expenses,
    setExpenses,
  ] =
    useState<
      ExpenseRow[]
    >([]);

  const [
    notes,
    setNotes,
  ] = useState("");

  const [
    uploadingKey,
    setUploadingKey,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    customSizes,
    setCustomSizes,
  ] =
    useState<
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
            (
              product
            ) => [
              product.id,
              product,
            ]
          )
        ),
      [
        products,
      ]
    );

  const validPayments =
    useMemo(
      () =>
        payments.filter(
          (
            payment
          ) =>
            n(
              payment.amount_original
            ) >
            0
        ),
      [
        payments,
      ]
    );

  const paymentsTotalOriginal =
    validPayments.reduce(
      (
        sum,
        payment
      ) =>
        sum +
        n(
          payment.amount_original
        ),
      0
    );

  const paymentsTotalPen =
    validPayments.reduce(
      (
        sum,
        payment
      ) => {
        const rate =
          currency ===
          "PEN"
            ? 1
            : n(
                payment.exchange_rate
              ) ||
              n(
                fallbackExchangeRate
              );

        return (
          sum +
          n(
            payment.amount_original
          ) *
            rate
        );
      },
      0
    );

  const effectiveRate =
    currency ===
    "PEN"
      ? 1
      : paymentsTotalOriginal >
          0
        ? paymentsTotalPen /
          paymentsTotalOriginal
        : n(
            fallbackExchangeRate
          );

  const validExpenses =
    useMemo(
      () =>
        expenses.filter(
          (
            expense
          ) =>
            n(
              expense.amount
            ) >
            0
        ),
      [
        expenses,
      ]
    );

  const expensesTotalPen =
    validExpenses.reduce(
      (
        sum,
        expense
      ) => {
        const rate =
          expense.currency ===
          "PEN"
            ? 1
            : n(
                expense.exchange_rate
              ) ||
              effectiveRate;

        return (
          sum +
          n(
            expense.amount
          ) *
            rate
        );
      },
      0
    );

  const computed =
    useMemo(
      () =>
        rows.map(
          (
            row,
            index
          ) => {
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
                  )
                )
              );

            const pieces =
              sizes.length;

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
                        0,
                        Math.floor(
                          n(
                            color.qty
                          )
                        )
                      ),
                  })
                )
                .filter(
                  (
                    color
                  ) =>
                    color.name &&
                    color.qty >
                      0
                );

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

            const totalPieces =
              totalSeries *
              pieces;

            return {
              ...row,
              index,
              existing,
              sizes,
              pieces,
              validColors,
              totalSeries,
              totalPieces,
            };
          }
        ),
      [
        rows,
        productMap,
      ]
    );

  const allPieces =
    computed.reduce(
      (
        sum,
        row
      ) =>
        sum +
        row.totalPieces,
      0
    );

  const allSeries =
    computed.reduce(
      (
        sum,
        row
      ) =>
        sum +
        row.totalSeries,
      0
    );

  const extraPerPiecePen =
    allPieces >
    0
      ? expensesTotalPen /
        allPieces
      : 0;

  const detailed =
    computed.map(
      (
        row
      ) => {
        const providerPieceOriginal =
          n(
            row.supplier_cost_piece_original
          );

        const providerPiecePen =
          providerPieceOriginal *
          effectiveRate;

        const finalPiecePen =
          providerPiecePen +
          extraPerPiecePen;

        const finalPieceOriginal =
          effectiveRate >
          0
            ? finalPiecePen /
              effectiveRate
            : 0;

        const finalSeriesPen =
          finalPiecePen *
          row.pieces;

        const providerSubtotalOriginal =
          providerPieceOriginal *
          row.totalPieces;

        const providerSubtotalPen =
          providerSubtotalOriginal *
          effectiveRate;

        const preorderMargin =
          Math.max(
            20,
            n(
              row.preorder_margin_pct
            ) ||
              20
          );

        const stockMargin =
          Math.max(
            20,
            n(
              row.stock_margin_pct
            ) ||
              20
          );

        const suggestedPreorder =
          finalSeriesPen *
          (
            1 +
            preorderMargin /
              100
          );

        const suggestedStock =
          finalSeriesPen *
          (
            1 +
            stockMargin /
              100
          );

        const preorderFinal =
          row.preorder_manual
            ? n(
                row.preorder_price
              )
            : suggestedPreorder;

        const stockFinal =
          row.stock_manual
            ? n(
                row.stock_price
              )
            : suggestedStock;

        const preorderPieceSale =
          row.pieces >
          0
            ? preorderFinal /
              row.pieces
            : 0;

        const stockPieceSale =
          row.pieces >
          0
            ? stockFinal /
              row.pieces
            : 0;

        const preorderProfitPiece =
          preorderPieceSale -
          finalPiecePen;

        const stockProfitPiece =
          stockPieceSale -
          finalPiecePen;

        const preorderActualMargin =
          finalPiecePen >
          0
            ? (
                preorderProfitPiece /
                finalPiecePen
              ) *
              100
            : 0;

        const stockActualMargin =
          finalPiecePen >
          0
            ? (
                stockProfitPiece /
                finalPiecePen
              ) *
              100
            : 0;

        return {
          ...row,

          providerPieceOriginal,
          providerPiecePen,

          providerSubtotalOriginal,
          providerSubtotalPen,

          finalPiecePen,
          finalPieceOriginal,
          finalSeriesPen,

          preorderMargin,
          stockMargin,

          suggestedPreorder,
          suggestedStock,

          preorderFinal,
          stockFinal,

          preorderProfitPiece,
          stockProfitPiece,

          preorderActualMargin,
          stockActualMargin,
        };
      }
    );

  const supplierValueOriginal =
    detailed.reduce(
      (
        sum,
        row
      ) =>
        sum +
        row.providerSubtotalOriginal,
      0
    );

  const supplierValuePen =
    supplierValueOriginal *
    effectiveRate;

  const supplierBalanceOriginal =
    supplierValueOriginal -
    paymentsTotalOriginal;

  function updateRow(
    key: string,
    patch:
      Partial<PurchaseRow>
  ) {
    setRows(
      (
        current
      ) =>
        current.map(
          (
            row
          ) =>
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

  function updatePayment(
    key: string,
    patch:
      Partial<PaymentRow>
  ) {
    setPayments(
      (
        current
      ) =>
        current.map(
          (
            payment
          ) =>
            payment.key ===
            key
              ? {
                  ...payment,
                  ...patch,
                }
              : payment
        )
    );
  }

  function updateExpense(
    key: string,
    patch:
      Partial<ExpenseRow>
  ) {
    setExpenses(
      (
        current
      ) =>
        current.map(
          (
            expense
          ) =>
            expense.key ===
            key
              ? {
                  ...expense,
                  ...patch,
                }
              : expense
        )
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
          name:
            "",
          sizes: [
            "1-2",
            "2-3",
            "3-4",
            "4-5",
            "5-6",
          ],
          cover_url:
            "",
          supplier_cost_piece_original:
            "",
          preorder_margin_pct:
            "20",
          stock_margin_pct:
            "20",
          preorder_price:
            "",
          stock_price:
            "",
          preorder_manual:
            false,
          stock_manual:
            false,
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
        cover_url:
          first
            ?.cover_url ??
          "",
        preorder_price:
          first
            ?.price_preorder
            ? String(
                first.price_preorder
              )
            : "",
        stock_price:
          first
            ?.price_stock
            ? String(
                first.price_stock
              )
            : "",
        preorder_manual:
          Boolean(
            first
              ?.price_preorder
          ),
        stock_manual:
          Boolean(
            first
              ?.price_stock
          ),
      }
    );
  }

  function selectExisting(
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

        cover_url:
          product
            ?.cover_url ??
          "",

        preorder_price:
          product
            ?.price_preorder
            ? String(
                product.price_preorder
              )
            : "",

        stock_price:
          product
            ?.price_stock
            ? String(
                product.price_stock
              )
            : "",

        preorder_manual:
          Boolean(
            product
              ?.price_preorder
          ),

        stock_manual:
          Boolean(
            product
              ?.price_stock
          ),
      }
    );
  }

  function toggleSize(
    rowKey: string,
    size: string
  ) {
    setRows(
      (
        current
      ) =>
        current.map(
          (
            row
          ) => {
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

            return {
              ...row,

              sizes:
                sortSizes(
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
                      ]
                ),
            };
          }
        )
    );
  }

  function quickRange(
    rowKey: string,
    start: number
  ) {
    updateRow(
      rowKey,
      {
        sizes:
          Array.from(
            {
              length:
                5,
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
          ),
      }
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
      (
        current
      ) =>
        current.map(
          (
            row
          ) =>
            row.key ===
            rowKey
              ? {
                  ...row,

                  sizes:
                    sortSizes(
                      Array.from(
                        new Set([
                          ...row.sizes,
                          value,
                        ])
                      )
                    ),
                }
              : row
        )
    );

    setCustomSizes(
      (
        current
      ) => ({
        ...current,
        [rowKey]:
          "",
      })
    );
  }

  function updateColor(
    rowKey: string,
    colorKey: string,
    patch:
      Partial<ColorRow>
  ) {
    setRows(
      (
        current
      ) =>
        current.map(
          (
            row
          ) => {
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
      (
        current
      ) =>
        current.map(
          (
            row
          ) =>
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
      (
        current
      ) =>
        current.map(
          (
            row
          ) => {
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
          .split(
            "."
          )
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

      const {
        data,
      } =
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

  const pricesValid =
    detailed.every(
      (
        row
      ) =>
        row.preorderActualMargin +
          0.01 >=
          row.preorderMargin &&
        row.stockActualMargin +
          0.01 >=
          row.stockMargin
    );

  const modelsValid =
    detailed.every(
      (
        row
      ) =>
        (
          row.mode ===
            "EXISTING"
            ? Boolean(
                row.product_id
              )
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
        row.providerPieceOriginal >
          0
    );

  const paymentsValid =
    validPayments.length >
      0 &&
    (
      currency ===
        "PEN" ||
      validPayments.every(
        (
          payment
        ) =>
          (
            n(
              payment.exchange_rate
            ) ||
            n(
              fallbackExchangeRate
            )
          ) >
          0
      )
    );

  const expensesValid =
    validExpenses.every(
      (
        expense
      ) =>
        expense.currency ===
          "PEN" ||
        (
          n(
            expense.exchange_rate
          ) ||
          effectiveRate
        ) >
          0
    );

  const canSubmit =
    modelsValid &&
    paymentsValid &&
    expensesValid &&
    pricesValid &&
    effectiveRate >
      0 &&
    uploadingKey ===
      null;

  const payload = {
    purchase_date:
      purchaseDate,

    supplier:
      supplier.trim(),

    status,

    currency,

    fallback_exchange_rate:
      effectiveRate ||
      n(
        fallbackExchangeRate
      ),

    notes:
      notes.trim(),

    payments:
      validPayments.map(
        (
          payment
        ) => ({
          payment_date:
            payment.payment_date,

          stage:
            payment.stage.trim(),

          amount_original:
            n(
              payment.amount_original
            ),

          exchange_rate:
            currency ===
            "PEN"
              ? 1
              : n(
                  payment.exchange_rate
                ) ||
                n(
                  fallbackExchangeRate
                ),

          payment_method:
            payment.payment_method.trim(),

          reference:
            payment.reference.trim(),
        })
      ),

    expenses:
      validExpenses.map(
        (
          expense
        ) => ({
          expense_date:
            expense.expense_date,

          concept:
            expense.concept,

          currency:
            expense.currency,

          amount:
            n(
              expense.amount
            ),

          exchange_rate:
            expense.currency ===
            "PEN"
              ? 1
              : n(
                  expense.exchange_rate
                ) ||
                effectiveRate,

          reference:
            expense.reference.trim(),
        })
      ),

    items:
      detailed.map(
        (
          row
        ) => ({
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

          cover_url:
            row.cover_url ||
            null,

          supplier_cost_piece_original:
            row.providerPieceOriginal,

          preorder_margin_pct:
            row.preorderMargin,

          stock_margin_pct:
            row.stockMargin,

          preorder_price:
            row.preorderFinal,

          stock_price:
            row.stockFinal,
        })
      ),
  };

  return (
    <form
      action={
        createChinaPurchaseV9
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-xs font-black">
              Fecha
            </label>

            <input
              type="date"
              value={
                purchaseDate
              }
              onChange={(
                e
              ) =>
                setPurchaseDate(
                  e.target
                    .value
                )
              }
              className="ti-input"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black">
              Proveedor
            </label>

            <input
              value={
                supplier
              }
              onChange={(
                e
              ) =>
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
              onChange={(
                e
              ) =>
                setStatus(
                  e.target
                    .value
                )
              }
              className="ti-input"
            >
              <option value="PEDIDO">
                Pedido
              </option>

              <option value="EN_TRANSITO">
                En tránsito
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black">
              Moneda proveedor
            </label>

            <select
              value={
                currency
              }
              onChange={(
                e
              ) =>
                setCurrency(
                  e.target
                    .value as Currency
                )
              }
              className="ti-input"
            >
              <option value="USD">
                USD
              </option>

              <option value="PEN">
                PEN
              </option>

              <option value="CNY">
                CNY
              </option>
            </select>
          </div>
        </div>

        {currency !==
          "PEN" && (
          <div className="mt-4 max-w-sm">
            <label className="mb-2 block text-xs font-black">
              Tipo de cambio base
              <span className="ml-1 font-normal text-[#8b8078]">
                (solo respaldo)
              </span>
            </label>

            <NumberInput
              value={
                fallbackExchangeRate
              }
              onChange={
                setFallbackExchangeRate
              }
              placeholder="Ej. 3.80"
              min={0}
              step="0.0001"
            />

            <p className="mt-1 text-[9px] leading-4 text-[#8b8078]">
              Si registras pagos con
              distintos tipos de cambio,
              el sistema usa el promedio
              ponderado real.
            </p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#5a8b86]">
              Pagos al proveedor
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Lo que realmente depositaste
            </h2>

            <p className="mt-1 text-xs leading-5 text-[#7f746c]">
              Registra pago inicial,
              segundo pago, saldo, etc.
              Puede quedar saldo pendiente.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setPayments(
                (
                  current
                ) => [
                  ...current,
                  newPayment(
                    current.length
                  ),
                ]
              )
            }
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#edf7f5] px-4 text-xs font-black text-[#42746e]"
          >
            <Plus
              size={14}
            />
            Agregar pago
          </button>
        </div>

        <div className="space-y-3">
          {payments.map(
            (
              payment,
              index
            ) => {
              const rate =
                currency ===
                "PEN"
                  ? 1
                  : n(
                      payment.exchange_rate
                    ) ||
                    n(
                      fallbackExchangeRate
                    );

              const converted =
                n(
                  payment.amount_original
                ) *
                rate;

              return (
                <article
                  key={
                    payment.key
                  }
                  className="rounded-[24px] border border-[#eaded3] bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[.12em] text-[#b63a2c]">
                        Pago {index + 1}
                      </p>

                      <h3 className="mt-1 text-lg font-black">
                        {payment.stage ||
                          "Pago al proveedor"}
                      </h3>
                    </div>

                    {payments.length >
                      1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setPayments(
                            (
                              current
                            ) =>
                              current.filter(
                                (
                                  item
                                ) =>
                                  item.key !==
                                  payment.key
                              )
                          )
                        }
                        className="grid size-9 place-items-center rounded-full bg-[#fff0eb] text-[#b63a2c]"
                      >
                        <Trash2
                          size={14}
                        />
                      </button>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <div>
                      <label className="mb-2 block text-[9px] font-black uppercase text-[#8b8078]">
                        Fecha
                      </label>

                      <input
                        type="date"
                        value={
                          payment.payment_date
                        }
                        onChange={(
                          e
                        ) =>
                          updatePayment(
                            payment.key,
                            {
                              payment_date:
                                e.target
                                  .value,
                            }
                          )
                        }
                        className="ti-input"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-[9px] font-black uppercase text-[#8b8078]">
                        Etapa
                      </label>

                      <select
                        value={
                          payment.stage
                        }
                        onChange={(
                          e
                        ) =>
                          updatePayment(
                            payment.key,
                            {
                              stage:
                                e.target
                                  .value,
                            }
                          )
                        }
                        className="ti-input"
                      >
                        <option>
                          Pago inicial
                        </option>
                        <option>
                          Segundo pago
                        </option>
                        <option>
                          Saldo
                        </option>
                        <option>
                          Otro pago
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-[9px] font-black uppercase text-[#8b8078]">
                        Monto proveedor {currency}
                      </label>

                      <NumberInput
                        value={
                          payment.amount_original
                        }
                        onChange={(
                          value
                        ) =>
                          updatePayment(
                            payment.key,
                            {
                              amount_original:
                                value,
                            }
                          )
                        }
                        placeholder={
                          currency ===
                          "USD"
                            ? "Ej. 4442"
                            : "Monto"
                        }
                        min={0}
                      />
                    </div>

                    {currency !==
                      "PEN" && (
                      <div>
                        <label className="mb-2 block text-[9px] font-black uppercase text-[#8b8078]">
                          Tipo de cambio
                        </label>

                        <NumberInput
                          value={
                            payment.exchange_rate
                          }
                          onChange={(
                            value
                          ) =>
                            updatePayment(
                              payment.key,
                              {
                                exchange_rate:
                                  value,
                              }
                            )
                          }
                          placeholder="Ej. 3.80"
                          min={0}
                          step="0.0001"
                        />
                      </div>
                    )}

                    <div>
                      <label className="mb-2 block text-[9px] font-black uppercase text-[#8b8078]">
                        Medio de pago
                      </label>

                      <input
                        value={
                          payment.payment_method
                        }
                        onChange={(
                          e
                        ) =>
                          updatePayment(
                            payment.key,
                            {
                              payment_method:
                                e.target
                                  .value,
                            }
                          )
                        }
                        className="ti-input"
                        placeholder="BCP, Interbank..."
                      />
                    </div>

                    <div className="sm:col-span-2 xl:col-span-4">
                      <label className="mb-2 block text-[9px] font-black uppercase text-[#8b8078]">
                        Referencia
                      </label>

                      <input
                        value={
                          payment.reference
                        }
                        onChange={(
                          e
                        ) =>
                          updatePayment(
                            payment.key,
                            {
                              reference:
                                e.target
                                  .value,
                            }
                          )
                        }
                        className="ti-input"
                        placeholder="Operación, detalle..."
                      />
                    </div>

                    {n(
                      payment.amount_original
                    ) >
                      0 &&
                      rate >
                        0 && (
                      <div className="rounded-[16px] bg-[#fff0e9] p-3">
                        <p className="text-[8px] font-black uppercase text-[#9b382b]">
                          Equivale
                        </p>

                        <p className="mt-1 text-sm font-black text-[#9b382b]">
                          {moneyPen(
                            converted
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </article>
              );
            }
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#5a8b86]">
              Modelos / códigos
            </p>

            <h2 className="mt-1 text-2xl font-black">
              ¿Qué compraste?
            </h2>

            <p className="mt-1 text-xs leading-5 text-[#7f746c]">
              Cada modelo genera un
              código TI automático.
              Los colores pertenecen
              al mismo código.
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
            Agregar modelo
          </button>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {detailed.map(
            (
              row,
              index
            ) => (
              <article
                key={
                  row.key
                }
                className="overflow-hidden rounded-[28px] border border-[#eaded3] bg-white shadow-sm"
              >
                <div className="flex items-center justify-between gap-3 border-b border-[#eaded3] bg-[#fffdfb] px-4 py-4 sm:px-5">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[.12em] text-[#5a8b86]">
                      Código {index + 1}
                    </p>

                    <p className="mt-1 text-sm font-black">
                      {row.mode ===
                      "NEW"
                        ? "Código TI automático"
                        : row.existing
                            ?.code ??
                          "Código existente"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {row.totalSeries >
                      0 &&
                      row.totalPieces >
                        0 && (
                      <span className="rounded-full bg-[#edf7f5] px-3 py-2 text-[10px] font-black text-[#42746e]">
                        {row.totalSeries} series · {row.totalPieces} prendas
                      </span>
                    )}

                    {rows.length >
                      1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setRows(
                            (
                              current
                            ) =>
                              current.filter(
                                (
                                  item
                                ) =>
                                  item.key !==
                                  row.key
                              )
                          )
                        }
                        className="grid size-9 place-items-center rounded-full bg-[#fff0eb] text-[#b63a2c]"
                      >
                        <Trash2
                          size={14}
                        />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="grid grid-cols-2 gap-2 rounded-[17px] bg-[#f8f4f0] p-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setMode(
                          row.key,
                          "NEW"
                        )
                      }
                      className={`min-h-10 rounded-[13px] text-[10px] font-black ${
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
                      className={`min-h-10 rounded-[13px] text-[10px] font-black disabled:opacity-30 ${
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
                    <div className="relative mt-4">
                      <select
                        value={
                          row.product_id
                        }
                        onChange={(
                          e
                        ) =>
                          selectExisting(
                            row.key,
                            e.target
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
                              {product.code} · {product.name}
                            </option>
                          )
                        )}
                      </select>

                      <ChevronDown
                        size={15}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8b8078]"
                      />
                    </div>
                  ) : (
                    <div className="mt-4 rounded-[16px] bg-[#fff7f1] px-4 py-3">
                      <p className="text-[8px] font-black uppercase tracking-[.1em] text-[#b63a2c]">
                        Código TI
                      </p>

                      <p className="mt-1 text-sm font-black text-[#8f3a2e]">
                        Se generará automáticamente
                      </p>
                    </div>
                  )}

                  <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_118px]">
                    <div>
                      <label className="mb-2 block text-xs font-black">
                        Nombre del modelo
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
                                e.target
                                  .value,
                            }
                          )
                        }
                        disabled={
                          row.mode ===
                          "EXISTING"
                        }
                        className="ti-input disabled:bg-[#f5f1ed]"
                        placeholder="Ej. Conjunto Conejito"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black">
                        Foto
                      </label>

                      <label className="grid aspect-square cursor-pointer place-items-center overflow-hidden rounded-[16px] border border-dashed border-[#d9c8bb] bg-[#fffaf6]">
                        {row.cover_url ? (
                          <img
                            src={
                              row.cover_url
                            }
                            alt="Portada"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex flex-col items-center gap-1 text-[#5a8b86]">
                            <Camera
                              size={20}
                            />
                            <span className="text-[8px] font-black">
                              Subir
                            </span>
                          </span>
                        )}

                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={
                            uploadingKey ===
                            row.key
                          }
                          onChange={(
                            e
                          ) => {
                            const file =
                              e.target
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

                  <div className="mt-5 rounded-[20px] border border-[#eaded3] bg-[#fffdfb] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black">
                          Tallas de una serie
                        </p>

                        <p className="mt-1 text-[9px] text-[#8b8078]">
                          Selecciona todas las tallas que trae una serie.
                        </p>
                      </div>

                      {row.pieces >
                        0 && (
                        <span className="rounded-full bg-[#f4faf8] px-3 py-1.5 text-[9px] font-black text-[#42746e]">
                          {row.pieces} prendas / serie
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
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
                              quickRange(
                                row.key,
                                start
                              )
                            }
                            className="rounded-full bg-[#fff0e9] px-3 py-2 text-[9px] font-black text-[#9b382b]"
                          >
                            {start}-{start + 1} a {start + 4}-{start + 5}
                          </button>
                        )
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {AGE_SIZES.map(
                        (
                          size
                        ) => {
                          const active =
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
                                active
                                  ? "border-[#8f3a2e] bg-[#8f3a2e] text-white"
                                  : "border-[#eaded3] bg-white text-[#6f655e]"
                              }`}
                            >
                              {size}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <details className="mt-4">
                      <summary className="cursor-pointer text-[9px] font-black text-[#5a8b86]">
                        Tallas bebé
                      </summary>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {BABY_SIZES.map(
                          (
                            size
                          ) => {
                            const active =
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
                                  active
                                    ? "border-[#5a8b86] bg-[#5a8b86] text-white"
                                    : "border-[#eaded3] bg-white text-[#6f655e]"
                                }`}
                              >
                                {size}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </details>

                    <div className="mt-4 flex gap-2">
                      <input
                        value={
                          customSizes[
                            row.key
                          ] ?? ""
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
                                e.target
                                  .value,
                            })
                          )
                        }
                        className="ti-input"
                        placeholder="Otra talla"
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
                          size={16}
                        />
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {row.sizes.map(
                        (
                          size
                        ) => (
                          <span
                            key={
                              size
                            }
                            className="inline-flex items-center gap-1 rounded-full bg-[#f7f2ec] px-3 py-1.5 text-[9px] font-black"
                          >
                            {size}

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
                                size={10}
                              />
                            </button>
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black">
                          Colores
                        </p>

                        <p className="mt-1 text-[9px] text-[#8b8078]">
                          Indica cuántas series completas compró de cada color.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          addColor(
                            row.key
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-full bg-[#fff6e9] px-3 py-2 text-[9px] font-black text-[#9b6510]"
                      >
                        <Plus
                          size={12}
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
                            className="grid grid-cols-[1fr_105px_auto] gap-2 rounded-[15px] border border-[#eaded3] p-2.5"
                          >
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
                                      e.target
                                        .value,
                                  }
                                )
                              }
                              className="h-10 min-w-0 rounded-[12px] border border-[#eaded3] px-3 text-xs font-black outline-none"
                              placeholder={`Color ${colorIndex + 1}`}
                            />

                            <input
                              type="number"
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
                                      e.target
                                        .value,
                                  }
                                )
                              }
                              min="1"
                              step="1"
                              className="h-10 w-full rounded-[12px] border border-[#eaded3] px-3 text-center text-xs font-black outline-none"
                              placeholder="Series"
                            />

                            <button
                              type="button"
                              disabled={
                                row.colors
                                  .length ===
                                1
                              }
                              onClick={() =>
                                removeColor(
                                  row.key,
                                  color.key
                                )
                              }
                              className="grid size-10 place-items-center rounded-full bg-[#fff0eb] text-[#b63a2c] disabled:opacity-25"
                            >
                              <Trash2
                                size={13}
                              />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="mt-5 rounded-[20px] bg-[#fff7f1] p-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-[9px] font-black uppercase text-[#8b8078]">
                          Costo proveedor / prenda {currency}
                        </label>

                        <NumberInput
                          value={
                            row.supplier_cost_piece_original
                          }
                          onChange={(
                            value
                          ) =>
                            updateRow(
                              row.key,
                              {
                                supplier_cost_piece_original:
                                  value,
                              }
                            )
                          }
                          placeholder={
                            currency ===
                            "USD"
                              ? "Ej. 8.00"
                              : "Costo"
                          }
                          min={0}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[9px] font-black uppercase text-[#9b6510]">
                          Utilidad preventa %
                        </label>

                        <NumberInput
                          value={
                            row.preorder_margin_pct
                          }
                          onChange={(
                            value
                          ) =>
                            updateRow(
                              row.key,
                              {
                                preorder_margin_pct:
                                  value,
                                preorder_manual:
                                  false,
                              }
                            )
                          }
                          min={20}
                          step="1"
                        />

                        <p className="mt-1 text-[8px] text-[#8b8078]">
                          Mínimo 20%
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-[9px] font-black uppercase text-[#9b382b]">
                          Utilidad stock %
                        </label>

                        <NumberInput
                          value={
                            row.stock_margin_pct
                          }
                          onChange={(
                            value
                          ) =>
                            updateRow(
                              row.key,
                              {
                                stock_margin_pct:
                                  value,
                                stock_manual:
                                  false,
                              }
                            )
                          }
                          min={20}
                          step="1"
                        />

                        <p className="mt-1 text-[8px] text-[#8b8078]">
                          Mínimo 20%
                        </p>
                      </div>
                    </div>

                    {effectiveRate >
                      0 &&
                      row.providerPieceOriginal >
                        0 &&
                      row.pieces >
                        0 && (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-2 block text-[9px] font-black uppercase text-[#9b6510]">
                            Precio preventa / serie
                          </label>

                          <NumberInput
                            value={
                              row.preorder_manual
                                ? row.preorder_price
                                : row.suggestedPreorder.toFixed(
                                    2
                                  )
                            }
                            onChange={(
                              value
                            ) =>
                              updateRow(
                                row.key,
                                {
                                  preorder_price:
                                    value,
                                  preorder_manual:
                                    true,
                                }
                              )
                            }
                            min={0}
                            className={
                              row.preorderActualMargin +
                                0.01 <
                              row.preorderMargin
                                ? "border-red-300 bg-red-50"
                                : "bg-[#fffaf0]"
                            }
                          />

                          <p className="mt-1 text-[8px] text-[#8b8078]">
                            Sugerido con {row.preorderMargin.toFixed(0)}%
                          </p>
                        </div>

                        <div>
                          <label className="mb-2 block text-[9px] font-black uppercase text-[#9b382b]">
                            Precio stock / serie
                          </label>

                          <NumberInput
                            value={
                              row.stock_manual
                                ? row.stock_price
                                : row.suggestedStock.toFixed(
                                    2
                                  )
                            }
                            onChange={(
                              value
                            ) =>
                              updateRow(
                                row.key,
                                {
                                  stock_price:
                                    value,
                                  stock_manual:
                                    true,
                                }
                              )
                            }
                            min={0}
                            className={
                              row.stockActualMargin +
                                0.01 <
                              row.stockMargin
                                ? "border-red-300 bg-red-50"
                                : "bg-[#fff4ef]"
                            }
                          />

                          <p className="mt-1 text-[8px] text-[#8b8078]">
                            Sugerido con {row.stockMargin.toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#5a8b86]">
              Gastos de la carga
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Flete, impuestos y otros
            </h2>

            <p className="mt-1 text-xs leading-5 text-[#7f746c]">
              Puedes mezclar gastos en
              dólares y soles. Todos se
              reparten entre las prendas.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setExpenses(
                (
                  current
                ) => [
                  ...current,
                  newExpense(),
                ]
              )
            }
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#fff6e9] px-4 text-xs font-black text-[#9b6510]"
          >
            <Plus
              size={14}
            />
            Agregar gasto
          </button>
        </div>

        {expenses.length ===
          0 ? (
          <button
            type="button"
            onClick={() =>
              setExpenses([
                newExpense(),
              ])
            }
            className="flex min-h-24 w-full items-center justify-center gap-2 rounded-[22px] border border-dashed border-[#d9c8bb] bg-white text-xs font-black text-[#8b8078]"
          >
            <ReceiptText
              size={16}
            />
            Agregar primer gasto
          </button>
        ) : (
          <div className="space-y-3">
            {expenses.map(
              (
                expense,
                index
              ) => {
                const rate =
                  expense.currency ===
                  "PEN"
                    ? 1
                    : n(
                        expense.exchange_rate
                      ) ||
                      effectiveRate;

                const converted =
                  n(
                    expense.amount
                  ) *
                  rate;

                return (
                  <article
                    key={
                      expense.key
                    }
                    className="rounded-[22px] border border-[#eaded3] bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black">
                        Gasto {index + 1}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setExpenses(
                            (
                              current
                            ) =>
                              current.filter(
                                (
                                  item
                                ) =>
                                  item.key !==
                                  expense.key
                              )
                          )
                        }
                        className="grid size-9 place-items-center rounded-full bg-[#fff0eb] text-[#b63a2c]"
                      >
                        <Trash2
                          size={13}
                        />
                      </button>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                      <input
                        type="date"
                        value={
                          expense.expense_date
                        }
                        onChange={(
                          e
                        ) =>
                          updateExpense(
                            expense.key,
                            {
                              expense_date:
                                e.target
                                  .value,
                            }
                          )
                        }
                        className="ti-input"
                      />

                      <select
                        value={
                          expense.concept
                        }
                        onChange={(
                          e
                        ) =>
                          updateExpense(
                            expense.key,
                            {
                              concept:
                                e.target
                                  .value,
                            }
                          )
                        }
                        className="ti-input"
                      >
                        <option>
                          Flete
                        </option>
                        <option>
                          Impuestos
                        </option>
                        <option>
                          Comisión
                        </option>
                        <option>
                          Transporte
                        </option>
                        <option>
                          Aduana
                        </option>
                        <option>
                          Otro
                        </option>
                      </select>

                      <select
                        value={
                          expense.currency
                        }
                        onChange={(
                          e
                        ) =>
                          updateExpense(
                            expense.key,
                            {
                              currency:
                                e.target
                                  .value as Currency,

                              exchange_rate:
                                e.target
                                  .value ===
                                "PEN"
                                  ? ""
                                  : expense.exchange_rate,
                            }
                          )
                        }
                        className="ti-input"
                      >
                        <option value="USD">
                          USD
                        </option>
                        <option value="PEN">
                          PEN
                        </option>
                        <option value="CNY">
                          CNY
                        </option>
                      </select>

                      <NumberInput
                        value={
                          expense.amount
                        }
                        onChange={(
                          value
                        ) =>
                          updateExpense(
                            expense.key,
                            {
                              amount:
                                value,
                            }
                          )
                        }
                        placeholder="Monto"
                        min={0}
                      />

                      {expense.currency !==
                      "PEN" ? (
                        <NumberInput
                          value={
                            expense.exchange_rate
                          }
                          onChange={(
                            value
                          ) =>
                            updateExpense(
                              expense.key,
                              {
                                exchange_rate:
                                  value,
                              }
                            )
                          }
                          placeholder="T. cambio"
                          min={0}
                          step="0.0001"
                        />
                      ) : (
                        <div className="hidden xl:block" />
                      )}

                      <input
                        value={
                          expense.reference
                        }
                        onChange={(
                          e
                        ) =>
                          updateExpense(
                            expense.key,
                            {
                              reference:
                                e.target
                                  .value,
                            }
                          )
                        }
                        className="ti-input"
                        placeholder="Referencia"
                      />
                    </div>

                    {n(
                      expense.amount
                    ) >
                      0 &&
                      rate >
                        0 && (
                      <p className="mt-2 text-right text-[9px] font-black text-[#9b6510]">
                        Equivale a {moneyPen(
                          converted
                        )}
                      </p>
                    )}
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

      {allPieces >
        0 &&
        effectiveRate >
          0 && (
        <section className="space-y-4">
          <div className="rounded-[28px] bg-[#8f3a2e] p-5 text-white shadow-sm">
            <div className="flex items-start gap-3">
              <WalletCards
                size={20}
              />

              <div>
                <p className="text-[9px] font-black uppercase tracking-[.16em] text-white/70">
                  Resumen de la carga
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Costo final
                </h2>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
              <div className="rounded-[16px] bg-white/10 p-3">
                <p className="text-[8px] font-black uppercase text-white/70">
                  Series
                </p>
                <p className="mt-1 text-xl font-black">
                  {allSeries}
                </p>
              </div>

              <div className="rounded-[16px] bg-white/10 p-3">
                <p className="text-[8px] font-black uppercase text-white/70">
                  Prendas
                </p>
                <p className="mt-1 text-xl font-black">
                  {allPieces}
                </p>
              </div>

              <div className="rounded-[16px] bg-white/10 p-3">
                <p className="text-[8px] font-black uppercase text-white/70">
                  Mercadería
                </p>
                <p className="mt-1 text-sm font-black">
                  {moneyOriginal(
                    supplierValueOriginal,
                    currency
                  )}
                </p>
                <p className="mt-1 text-[9px]">
                  {moneyPen(
                    supplierValuePen
                  )}
                </p>
              </div>

              <div className="rounded-[16px] bg-white/10 p-3">
                <p className="text-[8px] font-black uppercase text-white/70">
                  Gastos
                </p>
                <p className="mt-1 text-sm font-black">
                  {moneyPen(
                    expensesTotalPen
                  )}
                </p>
                <p className="mt-1 text-[9px]">
                  {moneyPen(
                    extraPerPiecePen
                  )} / prenda
                </p>
              </div>

              <div className="col-span-2 rounded-[16px] bg-white p-3 text-[#8f3a2e] lg:col-span-1">
                <p className="text-[8px] font-black uppercase">
                  Pagado proveedor
                </p>
                <p className="mt-1 text-sm font-black">
                  {moneyOriginal(
                    paymentsTotalOriginal,
                    currency
                  )}
                </p>
                <p className="mt-1 text-[9px]">
                  Saldo: {moneyOriginal(
                    Math.max(
                      supplierBalanceOriginal,
                      0
                    ),
                    currency
                  )}
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#5a8b86]">
              Resultado por modelo
            </p>

            <p className="mt-1 text-xs text-[#7f746c]">
              Aquí recién ves todos
              los costos finales y
              los precios sugeridos.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {detailed.map(
              (
                row,
                index
              ) => (
                <article
                  key={
                    row.key
                  }
                  className="rounded-[24px] border border-[#eaded3] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-16 shrink-0 overflow-hidden rounded-[14px] bg-[#f1e9e1]">
                      {row.cover_url ? (
                        <img
                          src={
                            row.cover_url
                          }
                          alt={
                            row.name
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center">
                          <ImagePlus
                            size={18}
                            className="text-[#bda99b]"
                          />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase text-[#5a8b86]">
                        {row.mode ===
                        "EXISTING"
                          ? row.existing
                              ?.code
                          : `Código automático ${index + 1}`}
                      </p>

                      <h3 className="mt-1 truncate font-black">
                        {row.name ||
                          row.existing
                            ?.name ||
                          "Modelo"}
                      </h3>

                      <p className="mt-1 text-[9px] text-[#8b8078]">
                        {row.totalSeries} series · {row.totalPieces} prendas
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-[14px] bg-[#f8f4f0] p-3">
                      <p className="text-[7px] font-black uppercase text-[#8b8078]">
                        Proveedor / prenda
                      </p>

                      <p className="mt-1 text-xs font-black">
                        {moneyOriginal(
                          row.providerPieceOriginal,
                          currency
                        )}
                      </p>

                      <p className="mt-1 text-[9px] text-[#7f746c]">
                        {moneyPen(
                          row.providerPiecePen
                        )}
                      </p>
                    </div>

                    <div className="rounded-[14px] bg-[#fff8e9] p-3">
                      <p className="text-[7px] font-black uppercase text-[#9b6510]">
                        Gasto / prenda
                      </p>

                      <p className="mt-1 text-xs font-black text-[#9b6510]">
                        {moneyPen(
                          extraPerPiecePen
                        )}
                      </p>
                    </div>

                    <div className="rounded-[14px] bg-[#edf7f5] p-3">
                      <p className="text-[7px] font-black uppercase text-[#42746e]">
                        Costo final / prenda
                      </p>

                      <p className="mt-1 text-xs font-black text-[#42746e]">
                        {moneyPen(
                          row.finalPiecePen
                        )}
                      </p>

                      <p className="mt-1 text-[9px] text-[#64847f]">
                        {moneyOriginal(
                          row.finalPieceOriginal,
                          currency
                        )}
                      </p>
                    </div>

                    <div className="rounded-[14px] bg-[#edf7f5] p-3">
                      <p className="text-[7px] font-black uppercase text-[#42746e]">
                        Costo final / serie
                      </p>

                      <p className="mt-1 text-xs font-black text-[#42746e]">
                        {moneyPen(
                          row.finalSeriesPen
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-[14px] border border-[#f0d9a8] bg-[#fffaf0] p-3">
                      <p className="text-[7px] font-black uppercase text-[#9b6510]">
                        Preventa
                      </p>

                      <p className="mt-1 text-sm font-black text-[#9b6510]">
                        {moneyPen(
                          row.preorderFinal
                        )}
                      </p>

                      <p className="mt-1 text-[8px] text-[#8b8078]">
                        Utilidad/prenda {moneyPen(
                          row.preorderProfitPiece
                        )} · {row.preorderActualMargin.toFixed(
                          1
                        )}%
                      </p>
                    </div>

                    <div className="rounded-[14px] border border-[#f2cfc4] bg-[#fff4ef] p-3">
                      <p className="text-[7px] font-black uppercase text-[#9b382b]">
                        Stock
                      </p>

                      <p className="mt-1 text-sm font-black text-[#9b382b]">
                        {moneyPen(
                          row.stockFinal
                        )}
                      </p>

                      <p className="mt-1 text-[8px] text-[#8b8078]">
                        Utilidad/prenda {moneyPen(
                          row.stockProfitPiece
                        )} · {row.stockActualMargin.toFixed(
                          1
                        )}%
                      </p>
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        </section>
      )}

      <section className="rounded-[22px] border border-[#eaded3] bg-white p-4">
        <textarea
          value={
            notes
          }
          onChange={(
            e
          ) =>
            setNotes(
              e.target
                .value
            )
          }
          className="ti-input min-h-20 py-3"
          placeholder="Notas de la compra..."
        />
      </section>

      {!pricesValid &&
        allPieces >
          0 && (
        <div className="rounded-[18px] bg-[#fff0eb] p-4 text-xs font-bold text-[#a33d31]">
          Hay un precio por debajo
          del margen mínimo indicado.
          Ajusta el precio antes de
          guardar.
        </div>
      )}

      <button
        disabled={
          !canSubmit
        }
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-[#b63a2c] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(182,58,44,.18)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Save
          size={18}
        />
        Guardar toda la compra
      </button>
    </form>
  );
}
