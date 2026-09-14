import Image from "next/image";
import { login } from "./actions";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-[#fff8f1] p-4">
      <div className="ti-card w-full max-w-md p-7">
        <Image
            src="/logo-tendencias.png"
            alt="Tendencias Import Perú"
            width={240}
            height={120}
            className="mx-auto h-auto w-[180px] object-contain"
            priority
        />

        <div className="mt-4 text-center">
          <p className="text-xs font-black tracking-[0.18em] text-[#5a8b86]">
            TENDENCIAS IMPORT
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Panel administrativo
          </h1>

          <p className="mt-2 text-sm text-[#7f746c]">
            Ingresa para administrar pacas, series, fotos y videos.
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 p-3 text-center text-sm font-bold text-red-700">
            Correo o contraseña incorrectos.
          </div>
        )}

        <form action={login} className="mt-6 space-y-3">
          <div>
            <label className="mb-2 block text-sm font-bold">
              Correo
            </label>

            <input
              className="ti-input"
              type="email"
              name="email"
              placeholder="correo@tendenciasimport.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">
              Contraseña
            </label>

            <input
              className="ti-input"
              type="password"
              name="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button className="ti-button ti-button-primary mt-2 w-full">
            Ingresar
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-[#9b8e84]">
          Acceso exclusivo para personal autorizado.
        </p>
      </div>
    </main>
  );
}