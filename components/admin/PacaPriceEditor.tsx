"use client";

import { Save, Sparkles } from "lucide-react";

import { savePacaPricesV13 } from "@/app/admin/pacas/actions-v13";

type PriceRow = {
  quantity: number;
  price_pen: number;
};

function findPrice(rows: PriceRow[], quantity: number) {
  return Number(
    rows.find((item) => Number(item.quantity) === quantity)?.price_pen ?? 0,
  );
}

export default function PacaPriceEditor({
  categoryId,
  slug,
  initialPrices,
}: {
  categoryId: string;
  slug: string;
  initialPrices: PriceRow[];
}) {
  return (
    <section className="rounded-[30px] border border-[#eaded3] bg-white p-5 shadow-[0_10px_30px_rgba(100,70,40,0.05)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[#5a8b86]">
            <Sparkles size={15} />
            <p className="text-[10px] font-black uppercase tracking-[.14em]">
              Pacas a pedido
            </p>
          </div>

          <h2 className="mt-2 text-2xl font-black tracking-[-.03em]">
            Precios por cantidad
          </h2>

          <p className="mt-2 max-w-2xl text-xs leading-5 text-[#7f746c]">
            Sofía trabaja únicamente con 25, 50 y 100 prendas. Cada cantidad
            puede tener un precio diferente y cualquier cambio se refleja
            automáticamente en la web.
          </p>
        </div>

        <span className="rounded-full bg-[#fff3e8] px-3 py-2 text-[9px] font-black uppercase tracking-[.08em] text-[#9b6510]">
          Todo es a pedido
        </span>
      </div>

      <form action={savePacaPricesV13} className="mt-5">
        <input type="hidden" name="category_id" value={categoryId} />
        <input type="hidden" name="slug" value={slug} />

        <div className="grid gap-3 sm:grid-cols-3">
          {[25, 50, 100].map((quantity) => (
            <label
              key={quantity}
              className="rounded-[20px] border border-[#eaded3] bg-[#fffaf6] p-4"
            >
              <span className="text-xs font-black">
                {quantity} prendas
              </span>

              <span className="mt-1 block text-[9px] text-[#8b8078]">
                Precio total de la paca
              </span>

              <div className="mt-3 flex items-center rounded-[15px] border border-[#eaded3] bg-white px-3">
                <span className="text-sm font-black text-[#9b382b]">
                  S/
                </span>

                <input
                  type="number"
                  name={`price_${quantity}`}
                  min="0"
                  step="0.01"
                  defaultValue={
                    findPrice(initialPrices, quantity) || ""
                  }
                  placeholder="0.00"
                  className="h-12 min-w-0 flex-1 bg-transparent px-2 text-base font-black outline-none"
                />
              </div>
            </label>
          ))}
        </div>

        <button className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[17px] bg-[#b63a2c] px-5 text-sm font-black !text-white sm:w-auto">
          <Save size={16} />
          Guardar precios
        </button>
      </form>
    </section>
  );
}
