import {
  Instagram,
  MapPin,
  MessageCircle,
  Music2,
} from "lucide-react";

const TIKTOK_URL =
  "https://www.tiktok.com/@tendenciasimport.pe?_r=1&_t=ZS-99qKLYz7t2b";

const INSTAGRAM_URL =
  "https://www.instagram.com/tendenciasshein.pe?stkn=MXQweTRtNjJ3dThk";

export function Footer() {
  const whatsapp =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";

  const whatsappUrl = whatsapp
    ? `https://wa.me/${whatsapp}`
    : "#";

  return (
    <footer
      id="contacto"
      className="mt-14 border-t border-white/10 bg-[#292521] text-white"
    >
      <div className="ti-container py-7 sm:py-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xl font-black tracking-[-.02em] sm:text-2xl">
            Tendencias Import Perú
          </p>

          <p className="mt-1 text-[9px] font-black uppercase tracking-[.24em] text-white/55">
            Mayorista · Perú
          </p>

          <p className="mx-auto mt-3 max-w-xl text-[11px] leading-5 text-white/60 sm:text-xs">
            Pacas en preventa, Series Kids y atención mayorista.
          </p>

          <div className="mt-5 flex items-center justify-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[.04] px-3.5 text-[10px] font-black !text-white"
            >
              <MessageCircle size={14} />
              WhatsApp
            </a>

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[.04] px-3.5 text-[10px] font-black !text-white"
            >
              <Instagram size={14} />
              Instagram
            </a>

            <a
              href={TIKTOK_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[.04] px-3.5 text-[10px] font-black !text-white"
            >
              <Music2 size={14} />
              TikTok
            </a>
          </div>

          <div className="mt-5 flex flex-col items-center justify-center gap-1.5 text-[10px] text-white/55 sm:flex-row sm:gap-4">
            <p className="font-black text-white/75">
              TENDENCIAS IMPORT S.A.C.
            </p>

            <span className="hidden text-white/20 sm:inline">•</span>

            <p>
              RUC 20612187003
            </p>

            <span className="hidden text-white/20 sm:inline">•</span>

            <p className="inline-flex items-center gap-1">
              <MapPin size={11} />
              San Borja, Lima
            </p>
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-[9px] text-white/35">
              © Tendencias Import S.A.C. · Todos los derechos reservados
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
