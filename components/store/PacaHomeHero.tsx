"use client";

import { useEffect, useState } from "react";

type Banner = {
  id: string;
  image_url: string;
  eyebrow: string | null;
  title: string | null;
  highlight_text: string | null;
  subtitle: string | null;
};

const cooperStyle = {
  fontFamily: '"Cooper Black", "Cooper Std Black", Georgia, serif',
};

export default function PacaHomeHero({
  banners,
}: {
  banners: Banner[];
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % banners.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) {
    return (
      <section className="w-full">
        <div className="relative min-h-[320px] bg-[linear-gradient(135deg,#b63a2c,#c78316)] text-white sm:min-h-[430px] lg:min-h-[520px]">
          <div className="mx-auto flex min-h-[320px] max-w-[1400px] items-end px-6 py-10 sm:min-h-[430px] sm:px-10 sm:py-14 lg:min-h-[520px] lg:px-16 lg:py-20">
            <div className="max-w-3xl">
              <p className="text-[10px] font-black uppercase tracking-[.25em] text-white/75">
                Tendencias Import Perú
              </p>

              <h1
                className="mt-3 text-4xl leading-[.95] sm:text-6xl lg:text-7xl"
                style={cooperStyle}
              >
                Moda mayorista
                <span className="block text-[#ffd47b]">
                  para hacer crecer tu negocio
                </span>
              </h1>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <div className="relative w-full overflow-hidden bg-[#eadfd5]">
        <div className="relative min-h-[320px] sm:min-h-[430px] lg:min-h-[560px]">
          {banners.map((banner, currentIndex) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-700 ${
                currentIndex === index
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              }`}
            >
              <img
                src={banner.image_url}
                alt={banner.title ?? "Tendencias Import Perú"}
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-[#1f1713]/72 via-[#1f1713]/28 to-transparent" />

              <div className="absolute inset-0">
                <div className="mx-auto flex h-full max-w-[1400px] items-end px-6 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-20">
                  <div className="max-w-3xl text-white">
                    {banner.eyebrow && (
                      <p className="text-[9px] font-black uppercase tracking-[.24em] text-[#ffd47b] sm:text-[11px]">
                        {banner.eyebrow}
                      </p>
                    )}

                    {banner.title && (
                      <h1
                        className="mt-2 text-4xl leading-[.92] tracking-[-.035em] sm:text-6xl lg:text-7xl"
                        style={cooperStyle}
                      >
                        {banner.title}
                      </h1>
                    )}

                    {banner.highlight_text && (
                      <p
                        className="mt-1 text-4xl leading-[.92] tracking-[-.035em] text-[#ef7458] sm:text-6xl lg:text-7xl"
                        style={cooperStyle}
                      >
                        {banner.highlight_text}
                      </p>
                    )}

                    {banner.subtitle && (
                      <p className="mt-4 max-w-xl text-xs leading-6 text-white/86 sm:text-sm lg:text-base">
                        {banner.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/20 px-3 py-2 backdrop-blur">
            {banners.map((banner, currentIndex) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => setIndex(currentIndex)}
                className={`h-2 rounded-full transition-all ${
                  currentIndex === index ? "w-7 bg-white" : "w-2 bg-white/60"
                }`}
                aria-label={`Banner ${currentIndex + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}