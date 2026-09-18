export function Footer() {
  return (
    <footer
      id="contacto"
      className="mt-20 bg-[#2c2825] py-10 text-white sm:py-12"
    >
      <div className="ti-container grid gap-8 md:grid-cols-3">
        <div>
          <p className="text-xl font-black">
            Tendencias Import Perú
          </p>

          <p className="mt-2 max-w-sm text-sm leading-6 text-white/65">
            Pacas a pedido, Series Kids y atención mayorista.
          </p>
        </div>

        <div>
          <p className="font-extrabold">
            Empresa
          </p>

          <p className="mt-2 text-sm leading-6 text-white/65">
            TENDENCIAS IMPORT S.A.C.
          </p>

          <p className="text-sm leading-6 text-white/65">
            RUC 20612187003
          </p>
        </div>

        <div>
          <p className="font-extrabold">
            Atención
          </p>

          <p className="mt-2 text-sm leading-6 text-white/65">
            Almacén en San Borja, Lima
          </p>

          <p className="text-sm leading-6 text-white/65">
            Pedidos y consultas por WhatsApp.
          </p>
        </div>
      </div>

      <div className="ti-container mt-8 border-t border-white/10 pt-5">
        <p className="text-center text-[10px] text-white/45">
          © Tendencias Import S.A.C. · Todos los derechos reservados
        </p>
      </div>
    </footer>
  );
}
