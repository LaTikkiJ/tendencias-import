import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Suggestion = {
  id: string;
  slug: string;
  name: string;
  audience: string;
  imageUrl: string | null;
};

export function PacaCategorySuggestions({
  items,
}: {
  items: Suggestion[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mt-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#5a8b86]">
            Sigue explorando
          </p>

          <h2 className="ti-brand-section-title mt-1">
            También te puede interesar
          </h2>
        </div>

        <Link
          href="/pacas"
          className="hidden text-xs font-black text-[#9b382b] sm:inline"
        >
          Ver todas
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/pacas/${item.slug}`}
            className="group overflow-hidden rounded-[20px] border border-[#eaded3] bg-white shadow-sm"
          >
            <div className="aspect-square overflow-hidden bg-[#eee3d9]">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="grid h-full place-items-center px-4 text-center text-xs font-black text-[#9f8f84]">
                  Tendencias Import
                </div>
              )}
            </div>

            <div className="p-3">
              <p className="text-[8px] font-black uppercase tracking-[.08em] text-[#5a8b86]">
                {item.audience}
              </p>

              <p className="mt-1 truncate text-sm font-black">
                {item.name}
              </p>

              <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-black text-[#9b382b]">
                Ver categoría
                <ArrowRight size={11} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
