"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import {
  Boxes,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  Ship,
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
    href: "/admin/series/compras",
    label: "Compras China",
    icon: Ship,
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
  const pathname =
    usePathname();

  function isActive(
    href: string
  ) {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    if (
      href === "/admin/series"
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

  return (
    <div className="min-h-screen bg-[#f7f1ea] md:grid md:grid-cols-[300px_1fr]">
      <aside className="relative overflow-hidden bg-gradient-to-b from-[#8f3a2e] via-[#9f4434] to-[#7f3227] text-white">
        <div className="relative flex h-full flex-col px-5 pb-6 pt-6">
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[240px] rounded-[26px] bg-[#fff8f1] px-5 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.14)]">
              <Image
                src="/logo-tendencias.png"
                alt="Tendencias Import Perú"
                width={220}
                height={120}
                className="mx-auto h-auto w-[175px] object-contain"
                priority
              />
            </div>

            <p className="mt-5 text-center text-[11px] font-black uppercase tracking-[0.22em] text-[#f6e6d8]">
              Administración Tendencias
            </p>
          </div>

          <div className="mt-6 border-t border-white/15" />

          <nav className="mt-5 space-y-2">
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
                    className={`group flex items-center gap-3 rounded-[20px] px-4 py-3 transition-all ${
                      active
                        ? "bg-[#c8a089] text-white shadow-[0_12px_20px_rgba(0,0,0,0.10)]"
                        : "text-[#fff7f1] hover:bg-white/10"
                    }`}
                  >
                    <span className="grid size-9 place-items-center rounded-full bg-white/10">
                      <Icon
                        size={
                          17
                        }
                      />
                    </span>

                    <span className="text-[15px] font-black">
                      {
                        item.label
                      }
                    </span>
                  </Link>
                );
              }
            )}
          </nav>

          <div className="mt-auto" />

          <form
            action={logout}
            className="mt-5"
          >
            <button className="flex w-full items-center gap-3 rounded-[20px] bg-[#fff8f1] px-4 py-3 font-black text-[#8f3a2e]">
              <LogOut
                size={17}
              />

              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 bg-[#f7f1ea] p-4 md:p-7">
        {children}
      </main>
    </div>
  );
}
