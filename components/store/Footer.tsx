import Image from "next/image";
import {
  Instagram,
  MessageCircle,
  Music2,
  MapPin,
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
      className="mt-16 border-t border-[#3a3531] bg-[#272421] text-white"
    >
      <div className="ti-container py-8 sm:py-10">
        <div className="grid gap-7 lg:grid-cols-[1.15fr_.85fr] lg:items-start">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-[16px] bg-[#fff8f1] px-3 py-2">
                <Image
                  src="/logo-tendencias.png"
                  alt="Tendencias Import Perú"
                  width={135}
                  height={70}
                  className="h-11 w-auto object-contain"
                />
              </div>

              <div>
                <p className="text-lg font-black">
                  Tendencias Import Perú
                </p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#d6c7bb]">
                  Mayorista · Perú
                </p>
              </div>
            </div>

            <p className="mt-4 max-w-xl text-[12px] leading-6 text-white/65">
              Pacas a pedido, Series Kids y atención mayorista para
              emprendimientos.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <a
                href={TIKTOK_URL}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-[14px] border border-white/10 bg-white/[.06] px-2 text-[10px] font-black !text-white transition hover:bg-white/[.11]"
              >
                <Music2 size={15} />
                TikTok
              </a>

              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-[14px] border border-white/10 bg-white/[.06] px-2 text-[10px] font-black !text-white transition hover:bg-white/[.11]"
              >
                <Instagram size={15} />
                Instagram
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-[14px] bg-[#25D366] px-2 text-[10px] font-black !text-white"
              >
                <MessageCircle size={15} />
                WhatsApp
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-[20px] border border-white/10 bg-white/[.035] p-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.12em] text-[#d39218]">
                Empresa
              </p>

              <p className="mt-2 text-[12px] font-black text-white">
                TENDENCIAS IMPORT S.A.C.
              </p>

              <p className="mt-1 text-[11px] text-white/60">
                RUC 20612187003
              </p>
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[.12em] text-[#5fa19b]">
                Almacén
              </p>

              <p className="mt-2 flex items-start gap-1.5 text-[12px] font-black text-white">
                <MapPin
                  size={13}
                  className="mt-0.5 shrink-0"
                />
                San Borja, Lima
              </p>

              <p className="mt-1 text-[11px] text-white/60">
                Atención por WhatsApp
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-2 border-t border-white/10 pt-4 text-[9px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © Tendencias Import S.A.C. · Todos los derechos reservados
          </p>

          <p>
            RUC 20612187003 · San Borja, Lima
          </p>
        </div>
      </div>
    </footer>
  );
}
