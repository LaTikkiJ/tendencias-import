import Image from "next/image";
import Link from "next/link";
import {
  Menu,
  ShoppingBag,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await createClient();

  const { data: sections } = await supabase
    .from("paca_sections")
    .select("id,name,slug,sort_order")
    .eq("active", true)
    .order("sort_order")
    .order("name");

  return (
    <header className="sticky top-0 z-40 border-b border-[#eaded3]/80 bg-[#fff8f1]/95 backdrop-blur-xl">
      <div className="ti-container flex h-[78px] items-center justify-between gap-4">
        <Link
          href="/"
          className="flex shrink-0 items-center"
        >
          <Image
            src="/logo-tendencias.png"
            alt="Tendencias Import Perú"
            width={190}
            height={90}
            className="h-12 w-auto object-contain sm:h-14"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-5 text-[12px] font-extrabold lg:flex xl:gap-7 xl:text-sm">
          {(sections ?? []).map((section) => (
            <Link
              key={section.id}
              href={`/pacas?section=${section.slug}`}
              className="whitespace-nowrap transition hover:text-[#b63a2c]"
            >
              Pacas {section.name}
            </Link>
          ))}

          <Link
            href="/series"
            className="whitespace-nowrap transition hover:text-[#b63a2c]"
          >
            Series
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/series"
            className="ti-button ti-button-primary hidden sm:inline-flex"
          >
            <ShoppingBag size={18} />
            Comprar
          </Link>

          <details className="relative lg:hidden">
            <summary className="grid size-11 cursor-pointer list-none place-items-center rounded-full border border-[#eaded3] bg-white text-[#8f3a2e] shadow-sm">
              <Menu size={20} />
            </summary>

            <div className="absolute right-0 top-[54px] w-[230px] overflow-hidden rounded-[20px] border border-[#eaded3] bg-white p-2 shadow-[0_18px_45px_rgba(61,43,32,.16)]">
              {(sections ?? []).map((section) => (
                <Link
                  key={section.id}
                  href={`/pacas?section=${section.slug}`}
                  className="block rounded-[13px] px-3 py-3 text-sm font-black hover:bg-[#fff4ec]"
                >
                  Pacas {section.name}
                </Link>
              ))}

              <Link
                href="/series"
                className="block rounded-[13px] px-3 py-3 text-sm font-black hover:bg-[#fff4ec]"
              >
                Series
              </Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
