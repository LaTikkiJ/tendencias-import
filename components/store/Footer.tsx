import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 bg-[#8f3a2e] py-10 text-white">
      <div className="ti-container grid gap-7 md:grid-cols-3">
        <div>
          <div className="inline-flex rounded-[20px] bg-[#fffaf6] px-4 py-3">
            <Image
              src="/logo-tendencias.png"
              alt="Tendencias Import Perú"
              width={180}
              height={90}
              className="h-12 w-auto object-contain"
            />
          </div>

          <p className="mt-4 max-w-sm text-xs leading-6 text-white/70">
            Pacas Kids, Damas y Series Kids para hacer crecer tu negocio.
          </p>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[.15em] text-[#f0c86a]">
            Comprar
          </p>

          <div className="mt-3 grid gap-2 text-sm font-bold text-white/80">
            <Link href="/pacas">Pacas</Link>
            <Link href="/series">Series Kids</Link>
          </div>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[.15em] text-[#f0c86a]">
            Atención
          </p>

          <p className="mt-3 text-xs leading-6 text-white/70">
            Confirma tu pedido y disponibilidad directamente por WhatsApp.
          </p>
        </div>
      </div>
    </footer>
  );
}
