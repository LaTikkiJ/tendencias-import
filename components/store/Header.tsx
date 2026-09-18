"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#eaded3]/80 bg-[#fffaf6]/95 backdrop-blur-xl">
      <div className="ti-container flex h-[74px] items-center justify-between gap-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-tendencias.png"
            alt="Tendencias Import Perú"
            width={210}
            height={110}
            className="h-[54px] w-auto object-contain sm:h-[60px]"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-black text-[#3a332e] md:flex">
          <Link href="/pacas" className="transition hover:text-[#b63a2c]">
            Pacas
          </Link>

          <Link href="/series" className="transition hover:text-[#b63a2c]">
            Series Kids
          </Link>

          <a href="/#como-comprar" className="transition hover:text-[#b63a2c]">
            Cómo comprar
          </a>
        </nav>

        <Link
          href="/series"
          className="hidden min-h-11 items-center gap-2 rounded-full bg-[#b63a2c] px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(182,58,44,.18)] transition hover:-translate-y-0.5 md:inline-flex"
        >
          <ShoppingBag size={17} />
          Armar carrito
        </Link>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="grid size-11 place-items-center rounded-full border border-[#eaded3] bg-white text-[#8f3a2e] shadow-sm md:hidden"
          aria-label="Abrir menú"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[#eaded3] bg-[#fffaf6] px-3 pb-4 pt-3 md:hidden">
          <div className="ti-container grid gap-2">
            <Link
              href="/pacas"
              onClick={() => setOpen(false)}
              className="rounded-[18px] bg-white px-4 py-3.5 text-sm font-black text-[#2c2825]"
            >
              Pacas
            </Link>

            <Link
              href="/series"
              onClick={() => setOpen(false)}
              className="rounded-[18px] bg-white px-4 py-3.5 text-sm font-black text-[#2c2825]"
            >
              Series Kids
            </Link>

            <a
              href="/#como-comprar"
              onClick={() => setOpen(false)}
              className="rounded-[18px] bg-white px-4 py-3.5 text-sm font-black text-[#2c2825]"
            >
              Cómo comprar
            </a>

            <Link
              href="/series"
              onClick={() => setOpen(false)}
              className="mt-1 flex min-h-12 items-center justify-center gap-2 rounded-[18px] bg-[#b63a2c] text-sm font-black text-white"
            >
              <ShoppingBag size={17} />
              Armar carrito
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
