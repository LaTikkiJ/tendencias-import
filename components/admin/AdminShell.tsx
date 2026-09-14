"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Boxes,
  LayoutDashboard,
  LogOut,
  PackageCheck,
} from "lucide-react";

import { logout } from "@/app/admin/actions";

const navItems = [
  {
    href: "/admin",
    label: "Panel",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/pacas",
    label: "Pacas",
    icon: Boxes,
  },
  {
    href: "/admin/series",
    label: "Series",
    icon: PackageCheck,
  },
];

export function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f7f1ea] md:grid md:grid-cols-[320px_1fr]">
      {/* SIDEBAR */}
      <aside className="relative overflow-hidden bg-gradient-to-b from-[#8f3a2e] via-[#9f4434] to-[#7f3227] text-white">
        {/* decorativos */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-52 w-52 rounded-full bg-[#d39218]/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-52 w-52 rounded-full bg-[#5a8b86]/10 blur-3xl" />

        <div className="relative flex h-full flex-col px-5 pb-6 pt-6">
          {/* LOGO */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[250px] rounded-[28px] bg-[#fff8f1] px-5 py-5 shadow-[0_12px_30px_rgba(0,0,0,0.14)]">
              <Image
                src="/logo-tendencias.png"
                alt="Tendencias Import Perú"
                width={220}
                height={120}
                className="mx-auto h-auto w-[180px] object-contain"
                priority
              />
            </div>

            <p className="mt-5 text-center text-[12px] font-black uppercase tracking-[0.22em] text-[#f6e6d8]">
              Administración Tendencias
            </p>
          </div>

          {/* separador */}
          <div className="mt-6 border-t border-white/15" />

          {/* MENÚ */}
          <nav className="mt-5 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                (item.href !== "/admin" &&
                  pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-[22px] px-4 py-3.5 transition-all ${
                    active
                      ? "bg-[#c8a089] text-white shadow-[0_12px_20px_rgba(0,0,0,0.10)]"
                      : "text-[#fff7f1] hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`grid size-10 place-items-center rounded-full transition ${
                      active
                        ? "bg-white/12"
                        : "bg-white/8 group-hover:bg-white/12"
                    }`}
                  >
                    <Icon size={18} />
                  </span>

                  <span className="text-[16px] font-black">
                    {item.label}
                  </span>

                  {active && (
                    <span className="ml-auto size-2 rounded-full bg-white" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* EMPUJADOR */}
          <div className="mt-auto" />

          {/* BLOQUE INFERIOR */}
          <div className="rounded-t-[24px] bg-[#7a3428]/80 px-4 pb-2 pt-4 backdrop-blur-sm">
            <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-black uppercase tracking-[.16em] text-[#f0c86a]">
                Panel Administrativo
              </p>

              <p className="mt-4 text-xs text-[#f2d6c6]">
                admin@tendenciasimport.pe
              </p>
            </div>

            <form action={logout} className="mt-4">
              <button className="flex w-full items-center gap-3 rounded-[20px] bg-[#fff8f1] px-4 py-3.5 font-black text-[#8f3a2e] shadow-sm transition hover:bg-[#fff1e7]">
                <span className="grid size-10 place-items-center rounded-full bg-[#f8ece2] text-[#8f3a2e]">
                  <LogOut size={18} />
                </span>

                <span className="text-[16px]">Cerrar sesión</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="min-w-0 bg-[#f7f1ea] p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}