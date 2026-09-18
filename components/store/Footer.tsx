import Image from "next/image";
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

  const whatsappUrl = whatsapp ? `https://wa.me/${whatsapp}` : "#";

  return (
    <footer
      id="contacto"
      className="mt-16 overflow-hidden border-t border-[#3a3531] bg-[radial-gradient(circle_at_top,#4f3a31_0%,#2c2623_55%,#211d1b_100%)] text-white"
    >
      <div className="ti-container py-10 sm:py-14">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto flex w-fit items-center justify-center rounded-[24px] bg-white/95 p-4 shadow-[0_18px_45px_rgba(0,0,0,.18)]">
            <Image
              src="/logo-tendencias.png"
              alt="Tendencias Import Perú"
              width={170}
              height={90}
              className="h-14 w-auto object-contain sm:h-16"
            />
          </div>

          <p className="mt-5 text-3xl font-black tracking-[-.03em] text-white sm:text-5xl">
            Tendencias Import Perú
          </p>

          <p className="mt-2 text-[11px] font-black uppercase tracking-[.28em] text-[#eadfd6]">
            Mayorista · Perú
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-[13px] leading-7 text-white/72 sm:text-[15px]">
            Pacas a pedido, Series Kids y atención mayorista para
            emprendimientos.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/8 px-5 text-[12px] font-black text-white transition hover:bg-white/12"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/8 px-5 text-[12px] font-black text-white transition hover:bg-white/12"
            >
              <Instagram size={16} />
              Instagram
            </a>

            <a
              href={TIKTOK_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/8 px-5 text-[12px] font-black text-white transition hover:bg-white/12"
            >
              <Music2 size={16} />
              TikTok
            </a>
          </div>

          <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
            <div className="rounded-[26px] border border-white/12 bg-white/[.06] p-5 text-center backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-[.24em] text-[#e1b24e]">
                Empresa
              </p>

              <p className="mt-3 text-[14px] font-black text-white sm:text-[18px]">
                TENDENCIAS IMPORT S.A.C.
              </p>

              <p className="mt-1 text-[12px] text-white/68 sm:text-[14px]">
                RUC 20612187003
              </p>
            </div>

            <div className="rounded-[26px] border border-white/12 bg-white/[.06] p-5 text-center backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-[.24em] text-[#82b5b0]">
                Almacén
              </p>

              <p className="mt-3 flex items-center justify-center gap-2 text-[14px] font-black text-white sm:text-[18px]">
                <MapPin size={16} />
                San Borja, Lima
              </p>

              <p className="mt-1 text-[12px] text-white/68 sm:text-[14px]">
                Atención por WhatsApp
              </p>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-3xl border-t border-white/12 pt-5 text-center">
            <p className="text-[11px] text-white/48 sm:text-[12px]">
              © Tendencias Import S.A.C. · Todos los derechos reservados
            </p>

            <p className="mt-2 text-[11px] text-white/42 sm:text-[12px]">
              RUC 20612187003 · San Borja, Lima
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
