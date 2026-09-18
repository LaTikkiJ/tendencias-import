"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Camera,
  ChevronDown,
  CopyPlus,
  Eye,
  ImagePlus,
  Pencil,
  TableProperties,
  Plus,
  ReceiptText,
  Save,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";

import { createChinaPurchaseV10 } from "@/app/admin/series/compras/actions-v10";
import { createClient } from "@/lib/supabase/client";

type Currency = "USD" | "PEN" | "CNY";
type PaymentStage =
  | "pago_inicial"
  | "liquidacion_peru"
  | "pago_adicional"
  | "devolucion";

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
  qty: string;
};

type ModelRow = {
  key: string;
  mode: "NEW" | "EXISTING";
  product_id: string;
  name: string;
  description: string;
  cover_url: string;
  sizes: string[];
  colors: ColorRow[];
  supplier_cost_piece_original: string;
  preorder_margin_pct: string;
  stock_margin_pct: string;
  preorder_price: string;
  stock_price: string;
  preorder_price_is_manual: boolean;
  stock_price_is_manual: boolean;
};

type PaymentRow = {
  key: string;
  payment_date: string;
  stage: PaymentStage;
  garments_amount_original: string;
  freight_amount_original: string;
  other_amount_original: string;
  actual_pen: string;
  exchange_rate: string;
  payment_method: string;
  reference: string;
};

type ExpenseRow = {
  key: string;
  expense_date: string;
  category: string;
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

const EXPENSE_CATEGORIES = [
  ["canal_rojo", "Canal rojo"],
  ["etiquetas", "Etiquetas"],
  ["flete_lima_san_ramon", "Flete Lima - San Ramón"],
  ["aduanas", "Aduanas"],
  ["almacenaje", "Almacenaje"],
  ["estibadores", "Estibadores"],
  ["embolsado", "Embolsado"],
  ["transporte_local", "Transporte local"],
  ["comision", "Comisión"],
  ["otro", "Otro"],
] as const;

const today = new Date().toISOString().slice(0, 10);

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function cleanNumber(value: string) {
  if (value === "") return "";

  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  const parts = normalized.split(".");
  let integer = parts[0] ?? "";
  const decimal = parts.length > 1 ? parts.slice(1).join("") : null;

  integer = integer.replace(/^0+(?=\d)/, "");
  if (integer === "") integer = "0";

  return decimal !== null ? `${integer}.${decimal}` : integer;
}

function num(value: string | number | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function pen(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

function original(value: number, currency: Currency) {
  if (currency === "PEN") return pen(value);

  return `${currency} ${new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0)}`;
}

function stageName(stage: PaymentStage) {
  if (stage === "pago_inicial") return "Pago inicial";
  if (stage === "liquidacion_peru") return "Liquidación al llegar a Perú";
  if (stage === "devolucion") return "Devolución";
  return "Pago adicional";
}

function newColor(): ColorRow {
  return {
    key: uid(),
    name: "",
    qty: "",
  };
}

function newModel(): ModelRow {
  return {
    key: uid(),
    mode: "NEW",
    product_id: "",
    name: "",
    description: "",
    cover_url: "",
    sizes: ["1-2", "2-3", "3-4", "4-5", "5-6"],
    colors: [newColor()],
    supplier_cost_piece_original: "",
    preorder_margin_pct: "20",
    stock_margin_pct: "20",
    preorder_price: "",
    stock_price: "",
    preorder_price_is_manual: false,
    stock_price_is_manual: false,
  };
}

function newPayment(index: number): PaymentRow {
  return {
    key: uid(),
    payment_date: today,
    stage: index === 0 ? "pago_inicial" : "liquidacion_peru",
    garments_amount_original: "",
    freight_amount_original: "",
    other_amount_original: "",
    actual_pen: "",
    exchange_rate: "",
    payment_method: "",
    reference: "",
  };
}

function newExpense(): ExpenseRow {
  return {
    key: uid(),
    expense_date: today,
    category: "etiquetas",
    concept: "Etiquetas",
    currency: "PEN",
    amount: "",
    exchange_rate: "",
    reference: "",
  };
}

function sortSizes(sizes: string[]) {
  const order = [...BABY_SIZES, ...AGE_SIZES];

  return [...sizes].sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);

    if (ai === -1 && bi === -1) {
      return a.localeCompare(b, undefined, { numeric: true });
    }

    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function NumberField({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(event) => onChange(cleanNumber(event.target.value))}
      placeholder={placeholder}
      className={`ti-input ${className}`}
    />
  );
}

export function ChinaPurchaseForm({
  products,
}: {
  products: ExistingProduct[];
}) {
  const supabase = createClient();

  const [purchaseDate, setPurchaseDate] = useState(today);
  const [supplier, setSupplier] = useState("");
  const [status, setStatus] = useState("EN_TRANSITO");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [notes, setNotes] = useState("");

  const [payments, setPayments] = useState<PaymentRow[]>([newPayment(0)]);
  const [models, setModels] = useState<ModelRow[]>([newModel()]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);

  const [customSizes, setCustomSizes] = useState<Record<string, string>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [modelModalKey, setModelModalKey] = useState<string | null>(null);
  const [modelModalMode, setModelModalMode] = useState<"VIEW" | "EDIT">("EDIT");

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const paymentSummary = useMemo(() => {
    return payments.map((payment) => {
      const garments = num(payment.garments_amount_original);
      const freight = num(payment.freight_amount_original);
      const other = num(payment.other_amount_original);
      const totalOriginal = garments + freight + other;
      const actualPen = num(payment.actual_pen);

      const rate =
        currency === "PEN"
          ? 1
          : totalOriginal > 0 && actualPen > 0
            ? actualPen / totalOriginal
            : num(payment.exchange_rate);

      const totalPen =
        currency === "PEN"
          ? totalOriginal
          : actualPen > 0
            ? actualPen
            : totalOriginal * rate;

      const sign = payment.stage === "devolucion" ? -1 : 1;

      return {
        ...payment,
        garments,
        freight,
        other,
        totalOriginal,
        rate,
        totalPen,
        sign,
      };
    });
  }, [payments, currency]);

  const garmentsPaidOriginal = paymentSummary.reduce(
    (sum, payment) => sum + payment.sign * payment.garments,
    0,
  );

  const garmentsPaidPen = paymentSummary.reduce(
    (sum, payment) => sum + payment.sign * payment.garments * payment.rate,
    0,
  );

  const freightPaidPen = paymentSummary.reduce(
    (sum, payment) => sum + payment.sign * payment.freight * payment.rate,
    0,
  );

  const agentOtherPen = paymentSummary.reduce(
    (sum, payment) => sum + payment.sign * payment.other * payment.rate,
    0,
  );

  const totalDepositedPen = paymentSummary.reduce(
    (sum, payment) => sum + payment.sign * payment.totalPen,
    0,
  );

  const effectiveGarmentRate =
    currency === "PEN"
      ? 1
      : garmentsPaidOriginal > 0
        ? garmentsPaidPen / garmentsPaidOriginal
        : 0;

  const modelSummary = useMemo(() => {
    return models.map((model, index) => {
      const existing = model.product_id ? productMap.get(model.product_id) : undefined;
      const sizes = sortSizes(Array.from(new Set(model.sizes)));
      const piecesPerSeries = sizes.length;

      const validColors = model.colors
        .map((color) => ({
          name: color.name.trim(),
          qty: Math.max(0, Math.floor(num(color.qty))),
        }))
        .filter((color) => color.name && color.qty > 0);

      const totalSeries = validColors.reduce((sum, color) => sum + color.qty, 0);
      const totalPieces = totalSeries * piecesPerSeries;
      const supplierPieceOriginal = num(model.supplier_cost_piece_original);
      const supplierSubtotalOriginal = supplierPieceOriginal * totalPieces;

      return {
        ...model,
        index,
        existing,
        sizes,
        validColors,
        piecesPerSeries,
        totalSeries,
        totalPieces,
        supplierPieceOriginal,
        supplierSubtotalOriginal,
      };
    });
  }, [models, productMap]);

  const totalSeries = modelSummary.reduce((sum, model) => sum + model.totalSeries, 0);
  const totalPieces = modelSummary.reduce((sum, model) => sum + model.totalPieces, 0);
  const supplierTotalOriginal = modelSummary.reduce(
    (sum, model) => sum + model.supplierSubtotalOriginal,
    0,
  );

  const expenseSummary = useMemo(() => {
    return expenses.map((expense) => {
      const amount = num(expense.amount);
      const rate =
        expense.currency === "PEN"
          ? 1
          : num(expense.exchange_rate);

      return {
        ...expense,
        amountNumber: amount,
        rate,
        amountPen: amount * rate,
      };
    });
  }, [expenses]);

  const extraExpensesPen = expenseSummary.reduce(
    (sum, expense) => sum + expense.amountPen,
    0,
  );

  const distributableCostsPen = freightPaidPen + agentOtherPen + extraExpensesPen;
  const extraPerPiecePen = totalPieces > 0 ? distributableCostsPen / totalPieces : 0;

  const detailedModels = modelSummary.map((model) => {
    const supplierPiecePen = model.supplierPieceOriginal * effectiveGarmentRate;
    const finalPiecePen = supplierPiecePen + extraPerPiecePen;
    const finalSeriesPen = finalPiecePen * model.piecesPerSeries;

    const preorderMargin = Math.max(20, num(model.preorder_margin_pct) || 20);
    const stockMargin = Math.max(20, num(model.stock_margin_pct) || 20);

    const suggestedPreorder = finalSeriesPen * (1 + preorderMargin / 100);
    const suggestedStock = finalSeriesPen * (1 + stockMargin / 100);

    const preorderPrice = model.preorder_price_is_manual
      ? num(model.preorder_price)
      : suggestedPreorder;

    const stockPrice = model.stock_price_is_manual
      ? num(model.stock_price)
      : suggestedStock;

    const preorderPiecePrice =
      model.piecesPerSeries > 0 ? preorderPrice / model.piecesPerSeries : 0;
    const stockPiecePrice =
      model.piecesPerSeries > 0 ? stockPrice / model.piecesPerSeries : 0;

    const preorderProfitPiece = preorderPiecePrice - finalPiecePen;
    const stockProfitPiece = stockPiecePrice - finalPiecePen;

    const preorderRealMargin =
      finalPiecePen > 0 ? (preorderProfitPiece / finalPiecePen) * 100 : 0;
    const stockRealMargin =
      finalPiecePen > 0 ? (stockProfitPiece / finalPiecePen) * 100 : 0;

    return {
      ...model,
      supplierPiecePen,
      finalPiecePen,
      finalSeriesPen,
      preorderMargin,
      stockMargin,
      suggestedPreorder,
      suggestedStock,
      preorderPrice,
      stockPrice,
      preorderProfitPiece,
      stockProfitPiece,
      preorderRealMargin,
      stockRealMargin,
    };
  });

  const supplierBalance = Math.max(supplierTotalOriginal - garmentsPaidOriginal, 0);
  const purchaseCostPen = supplierTotalOriginal * effectiveGarmentRate + distributableCostsPen;

  function updatePayment(key: string, patch: Partial<PaymentRow>) {
    setPayments((current) =>
      current.map((payment) => (payment.key === key ? { ...payment, ...patch } : payment)),
    );
  }

  function updateModel(key: string, patch: Partial<ModelRow>) {
    setModels((current) =>
      current.map((model) => (model.key === key ? { ...model, ...patch } : model)),
    );
  }

  function updateExpense(key: string, patch: Partial<ExpenseRow>) {
    setExpenses((current) =>
      current.map((expense) => (expense.key === key ? { ...expense, ...patch } : expense)),
    );
  }

  function updateColor(modelKey: string, colorKey: string, patch: Partial<ColorRow>) {
    setModels((current) =>
      current.map((model) => {
        if (model.key !== modelKey) return model;

        return {
          ...model,
          colors: model.colors.map((color) =>
            color.key === colorKey ? { ...color, ...patch } : color,
          ),
        };
      }),
    );
  }

  function addColor(modelKey: string) {
    setModels((current) =>
      current.map((model) =>
        model.key === modelKey
          ? { ...model, colors: [...model.colors, newColor()] }
          : model,
      ),
    );
  }

  function removeColor(modelKey: string, colorKey: string) {
    setModels((current) =>
      current.map((model) => {
        if (model.key !== modelKey || model.colors.length === 1) return model;
        return { ...model, colors: model.colors.filter((color) => color.key !== colorKey) };
      }),
    );
  }

  function toggleSize(modelKey: string, size: string) {
    setModels((current) =>
      current.map((model) => {
        if (model.key !== modelKey) return model;

        const exists = model.sizes.includes(size);
        const next = exists
          ? model.sizes.filter((item) => item !== size)
          : [...model.sizes, size];

        return { ...model, sizes: sortSizes(next) };
      }),
    );
  }

  function setQuickRange(modelKey: string, start: number) {
    updateModel(modelKey, {
      sizes: Array.from({ length: 5 }, (_, index) => {
        const from = start + index;
        return `${from}-${from + 1}`;
      }),
    });
  }

  function addCustomSize(modelKey: string) {
    const value = (customSizes[modelKey] ?? "").trim();
    if (!value) return;

    setModels((current) =>
      current.map((model) =>
        model.key === modelKey
          ? { ...model, sizes: sortSizes(Array.from(new Set([...model.sizes, value]))) }
          : model,
      ),
    );

    setCustomSizes((current) => ({ ...current, [modelKey]: "" }));
  }

  function setModelMode(key: string, mode: "NEW" | "EXISTING") {
    if (mode === "NEW") {
      updateModel(key, {
        mode,
        product_id: "",
        name: "",
        description: "",
        cover_url: "",
        sizes: ["1-2", "2-3", "3-4", "4-5", "5-6"],
        supplier_cost_piece_original: "",
        preorder_margin_pct: "20",
        stock_margin_pct: "20",
        preorder_price: "",
        stock_price: "",
        preorder_price_is_manual: false,
        stock_price_is_manual: false,
      });
      return;
    }

    const first = products[0];

    updateModel(key, {
      mode,
      product_id: first?.id ?? "",
      name: first?.name ?? "",
      cover_url: first?.cover_url ?? "",
      sizes: first?.sizes ?? [],
      preorder_price: first?.price_preorder ? String(first.price_preorder) : "",
      stock_price: first?.price_stock ? String(first.price_stock) : "",
      preorder_price_is_manual: Boolean(first?.price_preorder),
      stock_price_is_manual: Boolean(first?.price_stock),
    });
  }

  function selectExistingProduct(key: string, productId: string) {
    const product = productMap.get(productId);

    updateModel(key, {
      product_id: productId,
      name: product?.name ?? "",
      cover_url: product?.cover_url ?? "",
      sizes: product?.sizes ?? [],
      preorder_price: product?.price_preorder ? String(product.price_preorder) : "",
      stock_price: product?.price_stock ? String(product.price_stock) : "",
      preorder_price_is_manual: Boolean(product?.price_preorder),
      stock_price_is_manual: Boolean(product?.price_stock),
    });
  }

  async function uploadCover(modelKey: string, file: File) {
    setUploadingKey(modelKey);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `series/covers/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage.from("catalog-media").upload(path, file, {
        upsert: false,
        cacheControl: "3600",
      });

      if (error) throw error;

      const { data } = supabase.storage.from("catalog-media").getPublicUrl(path);
      updateModel(modelKey, { cover_url: data.publicUrl });
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo subir la foto.");
    } finally {
      setUploadingKey(null);
    }
  }


  function openNewModelModal() {
    const model = newModel();
    setModels((current) => [...current, model]);
    setModelModalMode("EDIT");
    setModelModalKey(model.key);
  }

  function openModelModal(key: string, mode: "VIEW" | "EDIT") {
    setModelModalMode(mode);
    setModelModalKey(key);
  }

  function deleteModel(key: string) {
    setModels((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((item) => item.key !== key);
    });

    if (modelModalKey === key) {
      setModelModalKey(null);
    }
  }

  const activeModalModel =
    detailedModels.find((model) => model.key === modelModalKey) ?? null;

  const modelsValid = detailedModels.every(
    (model) =>
      (model.mode === "EXISTING" ? Boolean(model.product_id) : model.name.trim().length > 1) &&
      model.sizes.length > 0 &&
      model.validColors.length > 0 &&
      model.totalSeries > 0 &&
      model.supplierPieceOriginal > 0,
  );

  const paymentsValid =
    garmentsPaidOriginal > 0 &&
    paymentSummary.some((payment) => payment.totalOriginal > 0) &&
    paymentSummary.every(
      (payment) =>
        payment.totalOriginal <= 0 ||
        currency === "PEN" ||
        num(payment.actual_pen) > 0 ||
        num(payment.exchange_rate) > 0,
    );

  const expensesValid = expenseSummary.every(
    (expense) => expense.amountNumber <= 0 || expense.currency === "PEN" || expense.rate > 0,
  );

  const pricesValid = detailedModels.every(
    (model) =>
      model.preorderRealMargin + 0.01 >= model.preorderMargin &&
      model.stockRealMargin + 0.01 >= model.stockMargin,
  );

  const canSubmit =
    supplier.trim().length > 1 &&
    modelsValid &&
    paymentsValid &&
    expensesValid &&
    pricesValid &&
    effectiveGarmentRate > 0 &&
    uploadingKey === null;

  const payload = {
    purchase_date: purchaseDate,
    supplier: supplier.trim(),
    status,
    currency,
    fallback_exchange_rate: effectiveGarmentRate || 1,
    notes: notes.trim(),

    payments: paymentSummary
      .filter((payment) => payment.totalOriginal > 0)
      .map((payment) => ({
        payment_date: payment.payment_date,
        stage: payment.stage,
        garments_amount_original: payment.garments,
        freight_amount_original: payment.freight,
        other_amount_original: payment.other,
        actual_pen: currency === "PEN" ? payment.totalOriginal : num(payment.actual_pen),
        exchange_rate: payment.rate,
        payment_method: payment.payment_method.trim(),
        reference: payment.reference.trim(),
      })),

    expenses: expenseSummary
      .filter((expense) => expense.amountNumber > 0)
      .map((expense) => ({
        expense_date: expense.expense_date,
        category: expense.category,
        concept: expense.concept.trim(),
        currency: expense.currency,
        amount: expense.amountNumber,
        exchange_rate: expense.rate,
        reference: expense.reference.trim(),
      })),

    items: detailedModels.map((model) => ({
      product_id: model.mode === "EXISTING" ? model.product_id : null,
      name: model.mode === "EXISTING" ? model.existing?.name : model.name.trim(),
      description: model.description.trim(),
      cover_url: model.cover_url || null,
      sizes: model.sizes,
      colors: model.validColors,
      supplier_cost_piece_original: model.supplierPieceOriginal,
      preorder_margin_pct: model.preorderMargin,
      stock_margin_pct: model.stockMargin,
      preorder_price: model.preorderPrice,
      stock_price: model.stockPrice,
      preorder_price_is_manual: model.preorder_price_is_manual,
      stock_price_is_manual: model.stock_price_is_manual,
    })),
  };

  return (
    <form action={createChinaPurchaseV10} className="space-y-6">
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />

      <section className="rounded-[28px] border border-[#eaded3] bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Fecha">
            <input
              type="date"
              value={purchaseDate}
              onChange={(event) => setPurchaseDate(event.target.value)}
              className="ti-input"
            />
          </Field>

          <Field label="Proveedor">
            <input
              value={supplier}
              onChange={(event) => setSupplier(event.target.value)}
              placeholder="Proveedor China"
              className="ti-input"
            />
          </Field>

          <Field label="Estado">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="ti-input"
            >
              <option value="PEDIDO">Pedido</option>
              <option value="EN_TRANSITO">En tránsito</option>
            </select>
          </Field>

          <Field label="Moneda de compra">
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value as Currency)}
              className="ti-input"
            >
              <option value="USD">USD</option>
              <option value="PEN">PEN</option>
              <option value="CNY">CNY</option>
            </select>
          </Field>
        </div>

      </section>

      <SectionTitle
        eyebrow="Pagos al proveedor / agente"
        title="Registra cada pago con su propio tipo de cambio"
        description="Igual que en MAKEK: pago inicial, liquidación al llegar a Perú, pago adicional o devolución. En cada pago puedes separar prendas, flete y otros cobros."
        action={
          <button
            type="button"
            onClick={() => setPayments((current) => [...current, newPayment(current.length)])}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#edf7f5] px-4 text-xs font-black text-[#42746e]"
          >
            <Plus size={14} />
            Agregar pago
          </button>
        }
      />

      <div className="space-y-3">
        {paymentSummary.map((payment, index) => (
          <article
            key={payment.key}
            className="rounded-[26px] border border-[#eaded3] bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.14em] text-[#b63a2c]">
                  Pago {index + 1}
                </p>
                <h3 className="mt-1 text-lg font-black">{stageName(payment.stage)}</h3>
              </div>

              {payments.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setPayments((current) => current.filter((item) => item.key !== payment.key))
                  }
                  className="grid size-9 place-items-center rounded-full bg-[#fff0eb] text-[#b63a2c]"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Field label="Fecha">
                <input
                  type="date"
                  value={payment.payment_date}
                  onChange={(event) =>
                    updatePayment(payment.key, { payment_date: event.target.value })
                  }
                  className="ti-input"
                />
              </Field>

              <Field label="Etapa">
                <select
                  value={payment.stage}
                  onChange={(event) =>
                    updatePayment(payment.key, { stage: event.target.value as PaymentStage })
                  }
                  className="ti-input"
                >
                  <option value="pago_inicial">Pago inicial</option>
                  <option value="liquidacion_peru">Liquidación al llegar a Perú</option>
                  <option value="pago_adicional">Pago adicional</option>
                  <option value="devolucion">Devolución</option>
                </select>
              </Field>

              <Field label={`Prendas ${currency}`}>
                <NumberField
                  value={payment.garments_amount_original}
                  onChange={(value) =>
                    updatePayment(payment.key, { garments_amount_original: value })
                  }
                  placeholder="Monto de prendas"
                />
              </Field>

              <Field label={`Flete marítimo ${currency}`}>
                <NumberField
                  value={payment.freight_amount_original}
                  onChange={(value) =>
                    updatePayment(payment.key, { freight_amount_original: value })
                  }
                  placeholder="Monto de flete"
                />
              </Field>

              <Field label={`Otros cobros ${currency}`}>
                <NumberField
                  value={payment.other_amount_original}
                  onChange={(value) =>
                    updatePayment(payment.key, { other_amount_original: value })
                  }
                  placeholder="Otros"
                />
              </Field>

              {currency !== "PEN" && (
                <Field label="Pagado realmente en S/">
                  <NumberField
                    value={payment.actual_pen}
                    onChange={(value) => updatePayment(payment.key, { actual_pen: value })}
                    placeholder="Ej. 16879.60"
                  />
                </Field>
              )}

              {currency !== "PEN" && (
                <Field label="Tipo de cambio">
                  <NumberField
                    value={payment.exchange_rate}
                    onChange={(value) => updatePayment(payment.key, { exchange_rate: value })}
                    placeholder="Ej. 3.80"
                  />
                </Field>
              )}

              <Field label="Medio de pago">
                <input
                  value={payment.payment_method}
                  onChange={(event) =>
                    updatePayment(payment.key, { payment_method: event.target.value })
                  }
                  placeholder="BCP, Interbank..."
                  className="ti-input"
                />
              </Field>

              <div className="sm:col-span-2 xl:col-span-3">
                <Field label="Referencia">
                  <input
                    value={payment.reference}
                    onChange={(event) =>
                      updatePayment(payment.key, { reference: event.target.value })
                    }
                    placeholder="Operación, detalle..."
                    className="ti-input"
                  />
                </Field>
              </div>

              {payment.totalOriginal > 0 && payment.rate > 0 && (
                <div className="rounded-[16px] bg-[#fff0e9] p-3">
                  <p className="text-[8px] font-black uppercase text-[#9b382b]">Este pago</p>
                  <p className="mt-1 text-sm font-black text-[#9b382b]">
                    {original(payment.totalOriginal, currency)}
                  </p>
                  <p className="mt-1 text-[9px] font-bold text-[#7f746c]">
                    {pen(payment.totalPen)} · TC {payment.rate.toFixed(4)}
                  </p>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      <SectionTitle
        eyebrow="Modelos / códigos"
        title="Códigos de esta carga"
        description="Trabaja rápido con muchos códigos: revisa todo en tabla y abre el modal solo cuando necesites registrar o editar un modelo."
        action={
          <button
            type="button"
            onClick={openNewModelModal}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#fff0e9] px-4 text-xs font-black text-[#9b382b]"
          >
            <Plus size={15} />
            Agregar código
          </button>
        }
      />

      <section className="overflow-hidden rounded-[26px] border border-[#eaded3] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eaded3] bg-[#fffdfb] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full bg-[#edf7f5] text-[#42746e]">
              <TableProperties size={15} />
            </span>
            <div>
              <p className="text-xs font-black">Tabla de códigos</p>
              <p className="mt-0.5 text-[9px] text-[#8b8078]">
                En celular desliza horizontalmente; conserva el formato tabla para comparar costos y precios.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[9px] font-black text-[#7f746c]">
            <span>{detailedModels.length} códigos</span>
            <span>·</span>
            <span>{totalSeries} series</span>
            <span>·</span>
            <span>{totalPieces} prendas</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#eaded3] bg-[#f9f6f2] text-[8px] font-black uppercase tracking-[.08em] text-[#7f746c]">
                <th className="sticky left-0 z-10 bg-[#f9f6f2] px-4 py-3">Código</th>
                <th className="px-4 py-3">Modelo</th>
                <th className="px-4 py-3 text-center">Series</th>
                <th className="px-4 py-3 text-center">Prendas</th>
                <th className="px-4 py-3">Colores</th>
                <th className="px-4 py-3 text-right">Costo final/prenda</th>
                <th className="px-4 py-3 text-right">Preventa sugerida</th>
                <th className="px-4 py-3 text-right">P. stock final</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {detailedModels.map((model, index) => {
                const modelName =
                  model.mode === "EXISTING"
                    ? model.existing?.name ?? model.name
                    : model.name;

                const modelCode =
                  model.mode === "EXISTING"
                    ? model.existing?.code ?? "—"
                    : `TI auto ${index + 1}`;

                return (
                  <tr
                    key={model.key}
                    className="border-b border-[#f0e8e1] last:border-0 hover:bg-[#fffaf6]"
                  >
                    <td className="sticky left-0 z-[5] bg-white px-4 py-3">
                      <span className="rounded-full bg-[#edf7f5] px-2.5 py-1 text-[9px] font-black text-[#42746e]">
                        {modelCode}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex min-w-[220px] items-center gap-3">
                        <div className="size-11 shrink-0 overflow-hidden rounded-[12px] bg-[#f1e9e1]">
                          {model.cover_url ? (
                            <img
                              src={model.cover_url}
                              alt={modelName || "Modelo"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full place-items-center text-[#bda99b]">
                              <ImagePlus size={15} />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="max-w-[190px] truncate text-[11px] font-black">
                            {modelName || "Sin nombre"}
                          </p>
                          <p className="mt-1 max-w-[190px] truncate text-[8px] text-[#8b8078]">
                            {model.sizes.length > 0
                              ? model.sizes.join(" · ")
                              : "Sin tallas"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center text-[11px] font-black">
                      {model.totalSeries || "—"}
                    </td>

                    <td className="px-4 py-3 text-center text-[11px] font-black">
                      {model.totalPieces || "—"}
                    </td>

                    <td className="px-4 py-3">
                      <p className="max-w-[170px] truncate text-[9px] font-bold text-[#6f655e]">
                        {model.validColors.length > 0
                          ? model.validColors
                              .map((color) => `${color.name} ${color.qty}`)
                              .join(" · ")
                          : "Sin colores"}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <p className="text-[11px] font-black text-[#42746e]">
                        {model.finalPiecePen > 0 ? pen(model.finalPiecePen) : "—"}
                      </p>
                      {model.finalPiecePen > 0 && effectiveGarmentRate > 0 && (
                        <p className="mt-1 text-[8px] text-[#8b8078]">
                          {original(model.finalPiecePen / effectiveGarmentRate, currency)}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <p className="text-[11px] font-black text-[#9b6510]">
                        {model.suggestedPreorder > 0 ? pen(model.suggestedPreorder) : "—"}
                      </p>
                      <p className="mt-1 text-[8px] text-[#8b8078]">
                        {model.preorderMargin.toFixed(0)}% utilidad
                      </p>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <p className="text-[11px] font-black text-[#9b382b]">
                        {model.stockPrice > 0 ? pen(model.stockPrice) : "—"}
                      </p>
                      <p className="mt-1 text-[8px] text-[#8b8078]">
                        {model.stockRealMargin > 0
                          ? `${model.stockRealMargin.toFixed(1)}% real`
                          : `${model.stockMargin.toFixed(0)}% objetivo`}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1.5">
                        <button
                          type="button"
                          title="Ver"
                          onClick={() => openModelModal(model.key, "VIEW")}
                          className="grid size-9 place-items-center rounded-full bg-[#edf7f5] text-[#42746e]"
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          type="button"
                          title="Editar"
                          onClick={() => openModelModal(model.key, "EDIT")}
                          className="grid size-9 place-items-center rounded-full bg-[#fff6e9] text-[#9b6510]"
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          type="button"
                          title="Eliminar"
                          disabled={models.length === 1}
                          onClick={() => deleteModel(model.key)}
                          className="grid size-9 place-items-center rounded-full bg-[#fff0eb] text-[#b63a2c] disabled:opacity-25"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {activeModalModel && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4">
          <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-t-[28px] bg-[#fffaf6] shadow-2xl sm:rounded-[28px]">
            <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[#eaded3] bg-[#fffaf6]/95 px-4 py-4 backdrop-blur sm:px-6">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.14em] text-[#5a8b86]">
                  {modelModalMode === "VIEW" ? "Detalle del código" : "Registrar / editar código"}
                </p>

                <h3 className="mt-1 text-xl font-black sm:text-2xl">
                  {activeModalModel.mode === "EXISTING"
                    ? activeModalModel.existing?.code ?? "Código existente"
                    : "Código TI automático"}
                </h3>

                {activeModalModel.totalSeries > 0 && (
                  <p className="mt-1 text-[10px] font-black text-[#42746e]">
                    {activeModalModel.totalSeries} series · {activeModalModel.totalPieces} prendas
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setModelModalKey(null)}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#6f655e] shadow-sm"
              >
                <X size={17} />
              </button>
            </div>

            {modelModalMode === "VIEW" ? (
              <div className="space-y-5 p-4 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-[150px_1fr]">
                  <div className="aspect-square overflow-hidden rounded-[18px] bg-[#f1e9e1]">
                    {activeModalModel.cover_url ? (
                      <img
                        src={activeModalModel.cover_url}
                        alt={activeModalModel.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-[#bda99b]">
                        <ImagePlus size={28} />
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoBox
                      label="Modelo"
                      value={activeModalModel.name || activeModalModel.existing?.name || "—"}
                    />
                    <InfoBox
                      label="Tallas"
                      value={activeModalModel.sizes.join(" · ") || "—"}
                    />
                    <InfoBox
                      label="Series"
                      value={String(activeModalModel.totalSeries || 0)}
                    />
                    <InfoBox
                      label="Prendas"
                      value={String(activeModalModel.totalPieces || 0)}
                    />
                    <InfoBox
                      label="Costo proveedor / prenda"
                      value={
                        activeModalModel.supplierPieceOriginal > 0
                          ? original(activeModalModel.supplierPieceOriginal, currency)
                          : "—"
                      }
                    />
                    <InfoBox
                      label="Costo final puesto en almacén / prenda"
                      value={
                        activeModalModel.finalPiecePen > 0
                          ? pen(activeModalModel.finalPiecePen)
                          : "—"
                      }
                    />
                    <InfoBox
                      label="Costo final / serie"
                      value={
                        activeModalModel.finalSeriesPen > 0
                          ? pen(activeModalModel.finalSeriesPen)
                          : "—"
                      }
                    />
                    <InfoBox
                      label="Preventa sugerida"
                      value={
                        activeModalModel.suggestedPreorder > 0
                          ? pen(activeModalModel.suggestedPreorder)
                          : "—"
                      }
                    />
                    <InfoBox
                      label="Precio stock final"
                      value={
                        activeModalModel.stockPrice > 0
                          ? pen(activeModalModel.stockPrice)
                          : "—"
                      }
                    />
                  </div>
                </div>

                <div className="rounded-[18px] border border-[#eaded3] bg-white p-4">
                  <p className="text-[9px] font-black uppercase text-[#8b8078]">Colores</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeModalModel.validColors.length > 0 ? (
                      activeModalModel.validColors.map((color) => (
                        <span
                          key={`${activeModalModel.key}-${color.name}`}
                          className="rounded-full bg-[#f8f4f0] px-3 py-2 text-[10px] font-black"
                        >
                          {color.name} · {color.qty} series
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[#8b8078]">Sin colores registrados</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModelModalMode("EDIT")}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[17px] bg-[#fff6e9] px-4 text-sm font-black text-[#9b6510]"
                >
                  <Pencil size={15} />
                  Editar este código
                </button>
              </div>
            ) : (
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-2 rounded-[17px] bg-[#f8f4f0] p-1.5">
                  <button
                    type="button"
                    onClick={() => setModelMode(activeModalModel.key, "NEW")}
                    className={`min-h-10 rounded-[13px] text-[10px] font-black ${
                      activeModalModel.mode === "NEW"
                        ? "bg-white text-[#8f3a2e] shadow-sm"
                        : "text-[#8b8078]"
                    }`}
                  >
                    Nuevo modelo
                  </button>

                  <button
                    type="button"
                    disabled={products.length === 0}
                    onClick={() => setModelMode(activeModalModel.key, "EXISTING")}
                    className={`min-h-10 rounded-[13px] text-[10px] font-black disabled:opacity-30 ${
                      activeModalModel.mode === "EXISTING"
                        ? "bg-white text-[#5a8b86] shadow-sm"
                        : "text-[#8b8078]"
                    }`}
                  >
                    Ya existe
                  </button>
                </div>

                {activeModalModel.mode === "EXISTING" ? (
                  <div className="relative mt-4">
                    <select
                      value={activeModalModel.product_id}
                      onChange={(event) =>
                        selectExistingProduct(activeModalModel.key, event.target.value)
                      }
                      className="ti-input appearance-none pr-10"
                    >
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.code} · {product.name}
                        </option>
                      ))}
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
                      Se genera automáticamente al guardar la carga
                    </p>
                  </div>
                )}

                <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_140px]">
                  <div className="space-y-3">
                    <Field label="Nombre que verá la clienta">
                      <input
                        value={activeModalModel.name}
                        onChange={(event) =>
                          updateModel(activeModalModel.key, { name: event.target.value })
                        }
                        disabled={activeModalModel.mode === "EXISTING"}
                        placeholder="Ej. Conjunto Conejito"
                        className="ti-input disabled:bg-[#f5f1ed]"
                      />
                    </Field>

                    <Field label="Descripción breve">
                      <input
                        value={activeModalModel.description}
                        onChange={(event) =>
                          updateModel(activeModalModel.key, {
                            description: event.target.value,
                          })
                        }
                        placeholder="Opcional para la web"
                        className="ti-input"
                      />
                    </Field>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-black">Foto portada</p>
                    <label className="grid aspect-square cursor-pointer place-items-center overflow-hidden rounded-[16px] border border-dashed border-[#d9c8bb] bg-[#fffaf6]">
                      {activeModalModel.cover_url ? (
                        <img
                          src={activeModalModel.cover_url}
                          alt="Portada"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex flex-col items-center gap-1 text-[#5a8b86]">
                          <Camera size={20} />
                          <span className="text-[8px] font-black">Subir</span>
                        </span>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingKey === activeModalModel.key}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadCover(activeModalModel.key, file);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-5 rounded-[20px] border border-[#eaded3] bg-[#fffdfb] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black">Tallas de una serie</p>
                      <p className="mt-1 text-[9px] text-[#8b8078]">
                        Selecciona todas las tallas que trae una serie completa.
                      </p>
                    </div>
                    <span className="rounded-full bg-[#f4faf8] px-3 py-1.5 text-[9px] font-black text-[#42746e]">
                      {activeModalModel.piecesPerSeries} prendas / serie
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((start) => (
                      <button
                        key={start}
                        type="button"
                        onClick={() => setQuickRange(activeModalModel.key, start)}
                        className="rounded-full bg-[#fff0e9] px-3 py-2 text-[9px] font-black text-[#9b382b]"
                      >
                        {start}-{start + 1} a {start + 4}-{start + 5}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {AGE_SIZES.map((size) => {
                      const selected = activeModalModel.sizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(activeModalModel.key, size)}
                          className={`rounded-full border px-3 py-2 text-[10px] font-black ${
                            selected
                              ? "border-[#8f3a2e] bg-[#8f3a2e] text-white"
                              : "border-[#eaded3] bg-white text-[#6f655e]"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>

                  <details className="mt-4">
                    <summary className="cursor-pointer text-[9px] font-black text-[#5a8b86]">
                      Ver tallas bebé
                    </summary>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {BABY_SIZES.map((size) => {
                        const selected = activeModalModel.sizes.includes(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => toggleSize(activeModalModel.key, size)}
                            className={`rounded-full border px-3 py-2 text-[10px] font-black ${
                              selected
                                ? "border-[#5a8b86] bg-[#5a8b86] text-white"
                                : "border-[#eaded3] bg-white text-[#6f655e]"
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </details>

                  <div className="mt-4 flex gap-2">
                    <input
                      value={customSizes[activeModalModel.key] ?? ""}
                      onChange={(event) =>
                        setCustomSizes((current) => ({
                          ...current,
                          [activeModalModel.key]: event.target.value,
                        }))
                      }
                      placeholder="Otra talla"
                      className="ti-input"
                    />
                    <button
                      type="button"
                      onClick={() => addCustomSize(activeModalModel.key)}
                      className="grid min-w-12 place-items-center rounded-[16px] bg-[#f4faf8] text-[#42746e]"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black">Colores comprados</p>
                      <p className="mt-1 text-[9px] text-[#8b8078]">
                        Un mismo código puede tener varios colores; Tendencias los podrá surtir.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addColor(activeModalModel.key)}
                      className="inline-flex items-center gap-1 rounded-full bg-[#fff6e9] px-3 py-2 text-[9px] font-black text-[#9b6510]"
                    >
                      <Plus size={12} />
                      Otro color
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {activeModalModel.colors.map((color, colorIndex) => (
                      <div
                        key={color.key}
                        className="grid grid-cols-[1fr_110px_auto] gap-2 rounded-[15px] border border-[#eaded3] p-2.5"
                      >
                        <input
                          value={color.name}
                          onChange={(event) =>
                            updateColor(activeModalModel.key, color.key, {
                              name: event.target.value,
                            })
                          }
                          placeholder={`Color ${colorIndex + 1}`}
                          className="h-10 min-w-0 rounded-[12px] border border-[#eaded3] px-3 text-xs font-black outline-none"
                        />

                        <NumberField
                          value={color.qty}
                          onChange={(value) =>
                            updateColor(activeModalModel.key, color.key, {
                              qty: value,
                            })
                          }
                          placeholder="Series"
                        />

                        <button
                          type="button"
                          disabled={activeModalModel.colors.length === 1}
                          onClick={() => removeColor(activeModalModel.key, color.key)}
                          className="grid size-10 place-items-center rounded-full bg-[#fff0eb] text-[#b63a2c] disabled:opacity-25"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {activeModalModel.totalSeries > 0 && (
                    <div className="mt-3 rounded-[16px] bg-[#edf7f5] px-4 py-3 text-sm font-black text-[#42746e]">
                      {activeModalModel.totalSeries} series · {activeModalModel.totalPieces} prendas
                    </div>
                  )}
                </div>

                <div className="mt-5 rounded-[20px] bg-[#fff7f1] p-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label={`Costo proveedor / prenda ${currency}`}>
                      <NumberField
                        value={activeModalModel.supplier_cost_piece_original}
                        onChange={(value) =>
                          updateModel(activeModalModel.key, {
                            supplier_cost_piece_original: value,
                          })
                        }
                        placeholder="Ej. 8.00"
                      />
                    </Field>

                    <Field label="Utilidad preventa %">
                      <NumberField
                        value={activeModalModel.preorder_margin_pct}
                        onChange={(value) =>
                          updateModel(activeModalModel.key, {
                            preorder_margin_pct: value,
                            preorder_price_is_manual: false,
                          })
                        }
                        placeholder="20"
                      />
                      <p className="mt-1 text-[8px] text-[#8b8078]">Mínimo 20%</p>
                    </Field>

                    <Field label="Utilidad stock %">
                      <NumberField
                        value={activeModalModel.stock_margin_pct}
                        onChange={(value) =>
                          updateModel(activeModalModel.key, {
                            stock_margin_pct: value,
                            stock_price_is_manual: false,
                          })
                        }
                        placeholder="30"
                      />
                      <p className="mt-1 text-[8px] text-[#8b8078]">Mínimo 20%</p>
                    </Field>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <InfoBox
                      label="Costo final / prenda"
                      value={
                        activeModalModel.finalPiecePen > 0
                          ? pen(activeModalModel.finalPiecePen)
                          : "Se calcula con todos los gastos"
                      }
                    />

                    <InfoBox
                      label="Preventa sugerida / serie"
                      value={
                        activeModalModel.suggestedPreorder > 0
                          ? pen(activeModalModel.suggestedPreorder)
                          : "Pendiente"
                      }
                    />

                    <Field label="Precio stock final / serie">
                      <NumberField
                        value={
                          activeModalModel.stock_price_is_manual
                            ? activeModalModel.stock_price
                            : activeModalModel.suggestedStock > 0
                              ? activeModalModel.suggestedStock.toFixed(2)
                              : ""
                        }
                        onChange={(value) =>
                          updateModel(activeModalModel.key, {
                            stock_price: value,
                            stock_price_is_manual: true,
                          })
                        }
                        placeholder="Se sugiere automáticamente"
                      />
                    </Field>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModelModalKey(null)}
                  className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-[17px] bg-[#b63a2c] px-5 text-sm font-black text-white"
                >
                  <Save size={15} />
                  Guardar este código en la tabla
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <SectionTitle
        eyebrow="Gastos adicionales"
        title="Canal rojo, etiquetas, aduanas, transporte y más"
        description="Puedes registrar gastos en soles, dólares o yuanes. Todos se convierten a soles y se reparten entre todas las prendas de la carga."
        action={
          <button
            type="button"
            onClick={() => setExpenses((current) => [...current, newExpense()])}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#fff6e9] px-4 text-xs font-black text-[#9b6510]"
          >
            <Plus size={14} />
            Agregar gasto
          </button>
        }
      />

      {expenses.length === 0 ? (
        <button
          type="button"
          onClick={() => setExpenses([newExpense()])}
          className="flex min-h-24 w-full items-center justify-center gap-2 rounded-[22px] border border-dashed border-[#d9c8bb] bg-white text-xs font-black text-[#8b8078]"
        >
          <ReceiptText size={16} />
          Agregar primer gasto
        </button>
      ) : (
        <div className="space-y-3">
          {expenseSummary.map((expense, index) => (
            <article
              key={expense.key}
              className="rounded-[22px] border border-[#eaded3] bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black">Gasto {index + 1}</p>
                <button
                  type="button"
                  onClick={() =>
                    setExpenses((current) => current.filter((item) => item.key !== expense.key))
                  }
                  className="grid size-9 place-items-center rounded-full bg-[#fff0eb] text-[#b63a2c]"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <input
                  type="date"
                  value={expense.expense_date}
                  onChange={(event) =>
                    updateExpense(expense.key, { expense_date: event.target.value })
                  }
                  className="ti-input"
                />

                <select
                  value={expense.category}
                  onChange={(event) => {
                    const label = EXPENSE_CATEGORIES.find(
                      ([value]) => value === event.target.value,
                    )?.[1];
                    updateExpense(expense.key, {
                      category: event.target.value,
                      concept: label ?? expense.concept,
                    });
                  }}
                  className="ti-input"
                >
                  {EXPENSE_CATEGORIES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <input
                  value={expense.concept}
                  onChange={(event) =>
                    updateExpense(expense.key, { concept: event.target.value })
                  }
                  placeholder="Concepto"
                  className="ti-input"
                />

                <select
                  value={expense.currency}
                  onChange={(event) =>
                    updateExpense(expense.key, {
                      currency: event.target.value as Currency,
                      exchange_rate: event.target.value === "PEN" ? "" : expense.exchange_rate,
                    })
                  }
                  className="ti-input"
                >
                  <option value="PEN">PEN</option>
                  <option value="USD">USD</option>
                  <option value="CNY">CNY</option>
                </select>

                <NumberField
                  value={expense.amount}
                  onChange={(value) => updateExpense(expense.key, { amount: value })}
                  placeholder="Monto"
                />

                {expense.currency === "PEN" ? (
                  <input
                    value={expense.reference}
                    onChange={(event) =>
                      updateExpense(expense.key, { reference: event.target.value })
                    }
                    placeholder="Referencia"
                    className="ti-input"
                  />
                ) : (
                  <NumberField
                    value={expense.exchange_rate}
                    onChange={(value) =>
                      updateExpense(expense.key, { exchange_rate: value })
                    }
                    placeholder="Tipo de cambio"
                  />
                )}
              </div>

              {expense.currency !== "PEN" && (
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    value={expense.reference}
                    onChange={(event) =>
                      updateExpense(expense.key, { reference: event.target.value })
                    }
                    placeholder="Referencia"
                    className="ti-input"
                  />
                  {expense.amountNumber > 0 && expense.rate > 0 && (
                    <div className="rounded-[14px] bg-[#fff8e9] px-4 py-3 text-right">
                      <p className="text-[8px] font-black uppercase text-[#9b6510]">Convertido</p>
                      <p className="mt-1 text-xs font-black text-[#9b6510]">
                        {pen(expense.amountPen)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {totalPieces > 0 && effectiveGarmentRate > 0 && (
        <section className="space-y-4">
          <div className="rounded-[28px] bg-[#8f3a2e] p-5 text-white shadow-sm">
            <div className="flex items-start gap-3">
              <WalletCards size={20} />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.16em] text-white/70">
                  Resumen de la carga
                </p>
                <h2 className="mt-1 text-2xl font-black">Costo final puesto en San Ramón</h2>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
              <SummaryCard label="Series" value={String(totalSeries)} />
              <SummaryCard label="Prendas" value={String(totalPieces)} />
              <SummaryCard
                label="Mercadería"
                value={original(supplierTotalOriginal, currency)}
                detail={pen(supplierTotalOriginal * effectiveGarmentRate)}
              />
              <SummaryCard
                label="Gastos distribuibles"
                value={pen(distributableCostsPen)}
                detail={`${pen(extraPerPiecePen)} / prenda`}
              />
              <SummaryCard
                label="Pagado hasta hoy"
                value={pen(totalDepositedPen)}
                detail={`TC prendas ${effectiveGarmentRate.toFixed(4)}`}
              />
              <SummaryCard
                label="Costo total carga"
                value={pen(purchaseCostPen)}
                strong
              />
            </div>

            <div className="mt-3 rounded-[16px] bg-white/10 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[9px] font-black uppercase text-white/70">
                  Saldo de prendas con proveedor
                </span>
                <b className="text-sm">{original(supplierBalance, currency)}</b>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#5a8b86]">
              Resultado por modelo
            </p>
            <h2 className="mt-1 text-2xl font-black">Costo real y precios sugeridos</h2>
            <p className="mt-1 text-xs leading-5 text-[#7f746c]">
              Aquí recién se muestran los cálculos. El margen mínimo es 20% por prenda y puedes subirlo para preventa o stock.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {detailedModels.map((model, index) => (
              <article
                key={model.key}
                className="rounded-[24px] border border-[#eaded3] bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="size-16 shrink-0 overflow-hidden rounded-[14px] bg-[#f1e9e1]">
                    {model.cover_url ? (
                      <img
                        src={model.cover_url}
                        alt={model.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center">
                        <ImagePlus size={18} className="text-[#bda99b]" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase text-[#5a8b86]">
                      {model.mode === "EXISTING"
                        ? model.existing?.code
                        : `Código automático ${index + 1}`}
                    </p>
                    <h3 className="mt-1 truncate font-black">
                      {model.name || model.existing?.name || "Modelo"}
                    </h3>
                    <p className="mt-1 text-[9px] text-[#8b8078]">
                      {model.totalSeries} series · {model.totalPieces} prendas
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <CostBox
                    label="Proveedor / prenda"
                    value={original(model.supplierPieceOriginal, currency)}
                    detail={pen(model.supplierPiecePen)}
                  />
                  <CostBox
                    label="Gasto extra / prenda"
                    value={pen(extraPerPiecePen)}
                    accent="gold"
                  />
                  <CostBox
                    label="Costo final / prenda"
                    value={pen(model.finalPiecePen)}
                    accent="teal"
                  />
                  <CostBox
                    label="Costo final / serie"
                    value={pen(model.finalSeriesPen)}
                    accent="teal"
                  />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <PriceEditor
                    title="Preventa"
                    margin={model.preorderMargin}
                    onMargin={(value) =>
                      updateModel(model.key, {
                        preorder_margin_pct: value,
                        preorder_price_is_manual: false,
                      })
                    }
                    value={
                      model.preorder_price_is_manual
                        ? model.preorder_price
                        : model.suggestedPreorder.toFixed(2)
                    }
                    onPrice={(value) =>
                      updateModel(model.key, {
                        preorder_price: value,
                        preorder_price_is_manual: true,
                      })
                    }
                    profitPiece={model.preorderProfitPiece}
                    realMargin={model.preorderRealMargin}
                    valid={model.preorderRealMargin + 0.01 >= model.preorderMargin}
                    tone="gold"
                  />

                  <PriceEditor
                    title="Stock"
                    margin={model.stockMargin}
                    onMargin={(value) =>
                      updateModel(model.key, {
                        stock_margin_pct: value,
                        stock_price_is_manual: false,
                      })
                    }
                    value={
                      model.stock_price_is_manual
                        ? model.stock_price
                        : model.suggestedStock.toFixed(2)
                    }
                    onPrice={(value) =>
                      updateModel(model.key, {
                        stock_price: value,
                        stock_price_is_manual: true,
                      })
                    }
                    profitPiece={model.stockProfitPiece}
                    realMargin={model.stockRealMargin}
                    valid={model.stockRealMargin + 0.01 >= model.stockMargin}
                    tone="red"
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-[22px] border border-[#eaded3] bg-white p-4">
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Observaciones generales de la compra..."
          className="ti-input min-h-20 py-3"
        />
      </section>

      {!pricesValid && totalPieces > 0 && (
        <div className="rounded-[18px] bg-[#fff0eb] p-4 text-xs font-bold text-[#a33d31]">
          Hay un precio por debajo del margen mínimo elegido. Sube el precio o reduce el margen, pero nunca por debajo de 20%.
        </div>
      )}

      <div className="sticky bottom-3 z-30 rounded-[22px] border border-[#eaded3] bg-white/95 p-3 shadow-[0_16px_40px_rgba(72,48,34,.14)] backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[.12em] text-[#8b8078]">
              Costo total estimado
            </p>
            <p className="mt-1 truncate text-lg font-black text-[#8f3a2e]">
              {pen(purchaseCostPen)}
            </p>
          </div>

          <button
            disabled={!canSubmit}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-[16px] bg-[#b63a2c] px-5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40 sm:px-7 sm:text-sm"
          >
            <Save size={17} />
            Guardar toda la compra
          </button>
        </div>
      </div>
    </form>
  );
}


function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[16px] border border-[#eaded3] bg-white p-3">
      <p className="text-[8px] font-black uppercase tracking-[.06em] text-[#8b8078]">
        {label}
      </p>
      <p className="mt-1 text-[11px] font-black text-[#2c2825]">{value}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[.08em] text-[#6d625b]">
        {label}
      </span>
      {children}
    </label>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#5a8b86]">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-black">{title}</h2>
        <p className="mt-1 max-w-3xl text-xs leading-5 text-[#7f746c]">{description}</p>
      </div>
      {action}
    </div>
  );
}

function SummaryCard({
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
    <div className={`rounded-[16px] p-3 ${strong ? "bg-white text-[#8f3a2e]" : "bg-white/10"}`}>
      <p className={`text-[8px] font-black uppercase ${strong ? "text-[#8f3a2e]/70" : "text-white/70"}`}>
        {label}
      </p>
      <p className="mt-1 text-sm font-black">{value}</p>
      {detail && <p className="mt-1 text-[9px] opacity-80">{detail}</p>}
    </div>
  );
}

function CostBox({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail?: string;
  accent?: "gold" | "teal";
}) {
  const classes =
    accent === "gold"
      ? "bg-[#fff8e9] text-[#9b6510]"
      : accent === "teal"
        ? "bg-[#edf7f5] text-[#42746e]"
        : "bg-[#f8f4f0] text-[#4f4742]";

  return (
    <div className={`rounded-[14px] p-3 ${classes}`}>
      <p className="text-[7px] font-black uppercase opacity-75">{label}</p>
      <p className="mt-1 text-xs font-black">{value}</p>
      {detail && <p className="mt-1 text-[9px] opacity-75">{detail}</p>}
    </div>
  );
}

function PriceEditor({
  title,
  margin,
  onMargin,
  value,
  onPrice,
  profitPiece,
  realMargin,
  valid,
  tone,
}: {
  title: string;
  margin: number;
  onMargin: (value: string) => void;
  value: string;
  onPrice: (value: string) => void;
  profitPiece: number;
  realMargin: number;
  valid: boolean;
  tone: "gold" | "red";
}) {
  const box =
    tone === "gold"
      ? "border-[#f0d9a8] bg-[#fffaf0]"
      : "border-[#f2cfc4] bg-[#fff4ef]";

  const ink = tone === "gold" ? "text-[#9b6510]" : "text-[#9b382b]";

  return (
    <div className={`rounded-[16px] border p-3 ${box}`}>
      <div className="flex items-center justify-between gap-2">
        <p className={`text-[9px] font-black uppercase ${ink}`}>{title}</p>
        <span className="rounded-full bg-white px-2 py-1 text-[8px] font-black text-[#7f746c]">
          mín. 20%
        </span>
      </div>

      <div className="mt-3 grid grid-cols-[90px_1fr] gap-2">
        <div>
          <p className="mb-1 text-[7px] font-black uppercase text-[#8b8078]">Margen</p>
          <NumberField
            value={String(margin)}
            onChange={(next) => onMargin(String(Math.max(20, num(next) || 20)))}
            placeholder="20"
          />
        </div>

        <div>
          <p className="mb-1 text-[7px] font-black uppercase text-[#8b8078]">Precio / serie</p>
          <NumberField
            value={value}
            onChange={onPrice}
            placeholder="Precio"
            className={!valid ? "border-red-300 bg-red-50" : ""}
          />
        </div>
      </div>

      <p className={`mt-2 text-[8px] font-bold ${valid ? "text-[#7f746c]" : "text-red-600"}`}>
        Utilidad/prenda {pen(profitPiece)} · margen real {realMargin.toFixed(1)}%
      </p>
    </div>
  );
}
