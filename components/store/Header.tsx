import Image from "next/image";
import Link from "next/link";
import { Menu, ShoppingBag } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#eaded3]/80 bg-[#fff8f1]/90 backdrop-blur-xl">
      <div className="ti-container flex h-[78px] items-center justify-between gap-5">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-tendencias.png"
            alt="Tendencias Import Perú"
            width={190}
            height={90}
            className="h-14 w-auto object-contain"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-extrabold md:flex">
          <Link href="/pacas">Pacas</Link>
          <Link href="/series">Series Kids</Link>
          <a href="#como-comprar">Cómo comprar</a>
          <a href="#contacto">Contacto</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/series" className="ti-button ti-button-soft hidden sm:inline-flex">
            <ShoppingBag size={18} />
            Ver series
          </Link>
          <button className="grid size-11 place-items-center rounded-full border border-[#eaded3] bg-white md:hidden">
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
