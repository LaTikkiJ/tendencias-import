"use client";

import { useEffect, useState } from "react";

type Banner = {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
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
    }, 6000);

    return () => window.clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) {
    return (
      <section className="ti-container pt-5">
        <div className="grid min-h-[330px] place-items-center overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#b63a2c,#c78316)] px-6 text-center text-white sm:min-h-[430px]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.25em] text-white/70">
              Tendencias Import Perú
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">
              Moda mayorista para tu negocio
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/80">
              Pacas en preventa y Series Kids.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="ti-container pt-5">
      <div className="relative overflow-hidden rounded-[28px] bg-[#eadfd5] shadow-[0_14px_38px_rgba(70,45,35,.10)]">
        <div className="relative aspect-[16/7] min-h-[300px] sm:min-h-[410px]">
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

              {(banner.title || banner.subtitle) && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent">
                  <div className="flex h-full max-w-2xl flex-col justify-end p-6 text-white sm:p-10">
                    {banner.title && (
                      <h1 className="text-4xl font-black leading-[.95] tracking-[-.05em] sm:text-6xl">
                        {banner.title}
                      </h1>
                    )}

                    {banner.subtitle && (
                      <p className="mt-3 max-w-lg text-sm leading-6 text-white/85 sm:text-base">
                        {banner.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              )}
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
                  currentIndex === index
                    ? "w-7 bg-white"
                    : "w-2 bg-white/60"
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
