"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  Boxes,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  Ship,
  X,
} from "lucide-react";

import {
  logout,
} from "@/app/admin/actions";

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
    href: "/admin/series/compras",
    label: "Compras China",
    icon: Ship,
  },
  {
    href: "/admin/series",
    label: "Inventario Series",
    icon: PackageCheck,
  },
  {
    href: "/admin/pedidos",
    label: "Pedidos",
    icon: ClipboardList,
  },
  {
    href: "/admin/configuracion/pagos",
    label: "Cuentas de pago",
    icon: CreditCard,
  },
];

export function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname =
    usePathname();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  function isActive(
    href: string
  ) {
    if (
      href === "/admin"
    ) {
      return pathname ===
        "/admin";
    }

    if (
      href ===
      "/admin/series"
    ) {
      return (
        pathname ===
          "/admin/series" ||
        (
          pathname.startsWith(
            "/admin/series/"
          ) &&
          !pathname.startsWith(
            "/admin/series/compras"
          )
        )
      );
    }

    return pathname.startsWith(
      href
    );
  }

  const navigation = (
    <nav className="space-y-2">
      {navItems.map(
        (item) => {
          const Icon =
            item.icon;

          const active =
            isActive(
              item.href
            );

          return (
            <Link
              key={
                item.href
              }
              href={
                item.href
              }
              onClick={() =>
                setMobileOpen(
                  false
                )
              }
              className={`group flex items-center gap-3 rounded-[18px] px-4 py-3 transition-all ${
                active
                  ? "bg-[#c8a089] text-white shadow-sm"
                  : "text-[#fff7f1] hover:bg-white/10"
              }`}
            >
              <span className="grid size-8 place-items-center rounded-full bg-white/10">
                <Icon
                  size={
                    16
                  }
                />
              </span>

              <span className="text-sm font-black">
                {
                  item.label
                }
              </span>
            </Link>
          );
        }
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f7f1ea] md:grid md:grid-cols-[285px_1fr]">
      {/* MOBILE TOP BAR */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[#7a3328] bg-[#8f3a2e] px-4 text-white md:hidden">
        <div className="rounded-[12px] bg-[#fff8f1] px-3 py-1.5">
          <Image
            src="/logo-tendencias.png"
            alt="Tendencias Import"
            width={120}
            height={60}
            className="h-9 w-auto object-contain"
          />
        </div>

        <button
          type="button"
          onClick={() =>
            setMobileOpen(
              (
                value
              ) =>
                !value
            )
          }
          className="grid size-10 place-items-center rounded-full bg-white/10"
        >
          {mobileOpen ? (
            <X
              size={19}
            />
          ) : (
            <Menu
              size={19}
            />
          )}
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-x-0 top-16 z-40 border-b border-[#7a3328] bg-[#8f3a2e] p-4 shadow-xl md:hidden">
          {navigation}

          <form
            action={logout}
            className="mt-4"
          >
            <button className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[16px] bg-[#fff8f1] text-sm font-black text-[#8f3a2e]">
              <LogOut
                size={
                  15
                }
              />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden min-h-screen bg-gradient-to-b from-[#8f3a2e] via-[#9f4434] to-[#7f3227] text-white md:block">
        <div className="sticky top-0 flex h-screen flex-col px-5 pb-6 pt-6">
          <div className="rounded-[24px] bg-[#fff8f1] px-5 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.14)]">
            <Image
              src="/logo-tendencias.png"
              alt="Tendencias Import Perú"
              width={220}
              height={120}
              className="mx-auto h-auto w-[170px] object-contain"
              priority
            />
          </div>

          <p className="mt-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-[#f6e6d8]">
            Administración Tendencias
          </p>

          <div className="mt-5 border-t border-white/15" />

          <div className="mt-5">
            {navigation}
          </div>

          <div className="mt-auto" />

          <form
            action={logout}
            className="mt-5"
          >
            <button className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-[#fff8f1] px-4 py-3 text-sm font-black text-[#8f3a2e]">
              <LogOut
                size={
                  16
                }
              />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 p-3 sm:p-4 md:p-7">
        {children}
      </main>
    </div>
  );
}
