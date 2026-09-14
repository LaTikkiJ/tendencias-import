export function Footer() {
  return (
    <footer id="contacto" className="mt-20 bg-[#2c2825] py-12 text-white">
      <div className="ti-container grid gap-8 md:grid-cols-3">
        <div>
          <p className="text-xl font-black">Tendencias Import Perú</p>
          <p className="mt-2 max-w-sm text-sm text-white/65">
            Pacas Kids, Damas y series Kids con una experiencia de compra clara,
            visual y rápida.
          </p>
        </div>
        <div>
          <p className="font-extrabold">Compra</p>
          <p className="mt-2 text-sm text-white/65">Pacas Kids · Pacas Damas · Series Kids</p>
        </div>
        <div>
          <p className="font-extrabold">Atención</p>
          <p className="mt-2 text-sm text-white/65">Pedidos y consultas por WhatsApp.</p>
        </div>
      </div>
    </footer>
  );
}
