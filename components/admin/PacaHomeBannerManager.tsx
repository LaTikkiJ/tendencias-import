"use client";

import { useState } from "react";
import {
  ImagePlus,
  Save,
  Trash2,
} from "lucide-react";

import {
  createPacaHomeBannerV17,
  deletePacaHomeBannerV17,
  updatePacaHomeBannerV17,
} from "@/app/admin/pacas/home-actions-v17";
import CatalogImageUploader from "@/components/admin/CatalogImageUploader";

type Banner = {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  sort_order: number;
  active: boolean;
};

export default function PacaHomeBannerManager({
  banners,
}: {
  banners: Banner[];
}) {
  const [newImage, setNewImage] = useState("");

  return (
    <section className="rounded-[30px] border border-[#eaded3] bg-white p-5 shadow-[0_10px_30px_rgba(100,70,40,.05)] sm:p-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#5a8b86]">
          Portada de la tienda
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-[-.03em]">
          Banners principales
        </h2>

        <p className="mt-2 max-w-2xl text-xs leading-5 text-[#7f746c]">
          Sube las imágenes que quieras mostrar al inicio. Tendencias puede
          cambiarlas cuando llegue mercadería nueva o una campaña distinta.
        </p>
      </div>

      <details className="mt-5 rounded-[22px] border border-[#eaded3] bg-[#fffaf6] p-4">
        <summary className="cursor-pointer list-none text-sm font-black">
          + Agregar nuevo banner
        </summary>

        <form
          action={createPacaHomeBannerV17}
          className="mt-4 grid gap-4"
        >
          <CatalogImageUploader
            value={newImage}
            onChange={setNewImage}
            folder="tendencias/home-banners"
            aspect="wide"
            label="Subir banner"
          />

          <input
            type="hidden"
            name="image_url"
            value={newImage}
          />

          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_110px]">
            <input
              name="title"
              className="ti-input"
              placeholder="Título opcional"
            />

            <input
              name="subtitle"
              className="ti-input"
              placeholder="Texto opcional"
            />

            <input
              name="sort_order"
              type="number"
              defaultValue="10"
              className="ti-input"
              placeholder="Orden"
            />
          </div>

          <button
            disabled={!newImage}
            className="ti-button ti-button-primary disabled:opacity-40"
          >
            <ImagePlus size={16} />
            Guardar banner
          </button>
        </form>
      </details>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {banners.map((banner) => (
          <BannerEditor
            key={banner.id}
            banner={banner}
          />
        ))}
      </div>
    </section>
  );
}

function BannerEditor({
  banner,
}: {
  banner: Banner;
}) {
  const [imageUrl, setImageUrl] = useState(banner.image_url);

  return (
    <div className="rounded-[22px] border border-[#eaded3] bg-[#fffdfb] p-4">
      <form action={updatePacaHomeBannerV17}>
        <input type="hidden" name="id" value={banner.id} />
        <input type="hidden" name="image_url" value={imageUrl} />

        <CatalogImageUploader
          value={imageUrl}
          onChange={setImageUrl}
          folder="tendencias/home-banners"
          aspect="wide"
          label="Cambiar banner"
        />

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            name="title"
            defaultValue={banner.title ?? ""}
            className="ti-input"
            placeholder="Título opcional"
          />

          <input
            name="subtitle"
            defaultValue={banner.subtitle ?? ""}
            className="ti-input"
            placeholder="Texto opcional"
          />

          <input
            type="number"
            name="sort_order"
            defaultValue={banner.sort_order}
            className="ti-input"
          />

          <label className="flex items-center gap-2 rounded-[14px] border border-[#eaded3] bg-white px-3 text-[10px] font-black">
            <input
              type="checkbox"
              name="active"
              defaultChecked={banner.active}
            />
            Mostrar en la web
          </label>
        </div>

        <button className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[14px] bg-[#5a8b86] px-4 text-[10px] font-black !text-white">
          <Save size={13} />
          Guardar cambios
        </button>
      </form>

      <form
        action={deletePacaHomeBannerV17}
        className="mt-2"
      >
        <input type="hidden" name="id" value={banner.id} />

        <button className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-[13px] bg-[#fff0eb] px-4 text-[9px] font-black text-[#b63a2c]">
          <Trash2 size={12} />
          Eliminar banner
        </button>
      </form>
    </div>
  );
}
