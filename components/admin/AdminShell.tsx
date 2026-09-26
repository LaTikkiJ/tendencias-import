"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Banknote,
  Boxes,
  ChevronRight,
  ClipboardList,
  Globe2,
  Images,
  LayoutDashboard,
  Layers3,
  LogOut,
  PackageCheck,
  Ship,
  ShoppingBag,
} from "lucide-react";

import { logout } from "@/app/admin/actions";

type PacaSection = {
  id: string;
  name: string;
  slug: string;
};

function NavLink({
  href,
  label,
  icon: Icon,
  compact = false,
}: {
  href: string;
  label: string;
  icon?: any;
  compact?: boolean;
}) {
  const pathname = usePathname();

  const pureHref = href.split("?")[0].split("#")[0];
  const active =
    pathname === pureHref ||
    (pureHref !== "/admin" && pathname.startsWith(pureHref));

  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-[18px] transition-all ${
        compact ? "px-3 py-2.5" : "px-4 py-3.5"
      } ${
        active
          ? "bg-[#c8a089] text-white shadow-[0_10px_18px_rgba(0,0,0,.10)]"
          : "text-[#fff7f1] hover:bg-white/10"
      }`}
    >
      {Icon ? (
        <span
          className={`grid place-items-center rounded-full ${
            compact ? "size-8" : "size-10"
          } ${
            active ? "bg-white/12" : "bg-white/8 group-hover:bg-white/12"
          }`}
        >
          <Icon size={compact ? 14 : 18} />
        </span>
      ) : (
        <span className="ml-2 size-1.5 rounded-full bg-white/65" />
      )}

      <span className={compact ? "text-[13px] font-black" : "text-[15px] font-black"}>
        {label}
      </span>

      {compact && (
        <ChevronRight
          size={13}
          className="ml-auto opacity-45 transition group-hover:translate-x-0.5"
        />
      )}
    </Link>
  );
}

export function AdminShell({
  children,
  pacaSections,
}: {
  children: React.ReactNode;
  pacaSections: PacaSection[];
}) {
  return (
    <div className="min-h-screen bg-[#f7f1ea] md:grid md:grid-cols-[320px_1fr]">
      <aside className="relative overflow-hidden bg-gradient-to-b from-[#8f3a2e] via-[#9f4434] to-[#7f3227] text-white">
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[#d39218]/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-52 w-52 rounded-full bg-[#5a8b86]/10 blur-3xl" />

        <div className="relative flex h-full min-h-screen flex-col px-5 pb-6 pt-6">
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[250px] rounded-[28px] bg-[#fff8f1] px-5 py-5 shadow-[0_12px_30px_rgba(0,0,0,.14)]">
              <Image
                src="/logo-tendencias.png"
                alt="Tendencias Import Perú"
                width={220}
                height={120}
                className="mx-auto h-auto w-[180px] object-contain"
                priority
              />
            </div>

            <p className="mt-5 text-center text-[12px] font-black uppercase tracking-[.22em] text-[#f6e6d8]">
              Administración Tendencias
            </p>
          </div>

          <div className="mt-6 border-t border-white/15" />

          <nav className="mt-5 space-y-2">
            <NavLink
              href="/admin"
              label="Panel"
              icon={LayoutDashboard}
            />

            <div className="pt-2">
              <p className="px-4 pb-2 text-[9px] font-black uppercase tracking-[.2em] text-[#f0c86a]">
                Web Pacas
              </p>

              <div className="space-y-1">
                <NavLink
                  href="/admin/pacas#portada"
                  label="Inicio web"
                  icon={Globe2}
                  compact
                />

                <NavLink
                  href="/admin/pacas#secciones"
                  label="Secciones"
                  icon={Layers3}
                  compact
                />

                <NavLink
                  href="/admin/pacas#categorias"
                  label="Categorías"
                  icon={Boxes}
                  compact
                />

                <NavLink
                  href="/admin/pacas/contenido"
                  label="Subir contenido"
                  icon={Images}
                  compact
                />

                <div className="ml-4 border-l border-white/20 pl-2">
                  {pacaSections.map((section) => (
                    <NavLink
                      key={section.id}
                      href={`/admin/pacas/seccion/${section.slug}`}
                      label={section.name}
                      compact
                    />
                  ))}
                </div>

                <NavLink
                  href="/admin/pacas/solicitudes"
                  label="Solicitudes Pacas"
                  icon={ClipboardList}
                  compact
                />
              </div>
            </div>

            <div className="pt-3">
              <p className="px-4 pb-2 text-[9px] font-black uppercase tracking-[.2em] text-[#f0c86a]">
                Operaciones
              </p>

              <div className="space-y-1">
                <NavLink
                  href="/admin/series/compras"
                  label="Compras China"
                  icon={Ship}
                  compact
                />

                <NavLink
                  href="/admin/series"
                  label="Inventario Series"
                  icon={PackageCheck}
                  compact
                />

                <NavLink
                  href="/admin/pedidos"
                  label="Pedidos"
                  icon={ShoppingBag}
                  compact
                />

                <NavLink
                  href="/admin/configuracion"
                  label="Cuentas de pago"
                  icon={Banknote}
                  compact
                />
              </div>
            </div>
          </nav>

          <div className="mt-auto pt-8" />

          <div className="rounded-t-[24px] bg-[#7a3428]/80 px-4 pb-2 pt-4 backdrop-blur-sm">
            <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-black uppercase tracking-[.16em] text-[#f0c86a]">
                Panel Administrativo
              </p>

              <p className="mt-3 text-xs text-[#f2d6c6]">
                Tendencias Import S.A.C.
              </p>
            </div>

            <form action={logout} className="mt-4">
              <button className="flex w-full items-center gap-3 rounded-[20px] bg-[#fff8f1] px-4 py-3.5 font-black text-[#8f3a2e] shadow-sm">
                <span className="grid size-10 place-items-center rounded-full bg-[#f8ece2]">
                  <LogOut size={18} />
                </span>

                <span className="text-[15px]">
                  Cerrar sesión
                </span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="min-w-0 bg-[#f7f1ea] p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
