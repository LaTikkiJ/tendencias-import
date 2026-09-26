"use client";

import { useState } from "react";
import {
  KeyRound,
  Plus,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  changeStaffPasswordV22,
  createStaffUserV22,
  updateStaffUserV22,
} from "@/app/admin/administradores/actions-v22";

type StaffRow = {
  user_id: string;
  full_name: string | null;
  role: string;
  active: boolean;
  email: string;
};

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  ventas: "Ventas",
  contenido: "Contenido",
  inventario: "Inventario",
};

export default function StaffUsersManager({
  users,
}: {
  users: StaffRow[];
}) {
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-[#eaded3] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#5a8b86]">
              Equipo ERP
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-.04em]">
              Administradores y personal
            </h1>

            <p className="mt-2 max-w-2xl text-xs leading-5 text-[#7f746c]">
              Cada persona entra con su propio correo y contraseña. Puedes
              cambiar su rol o desactivar su acceso sin borrar su historial.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowNew((value) => !value)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#b63a2c] px-5 text-xs font-black !text-white shadow-sm"
          >
            <Plus size={15} />
            Agregar usuario
          </button>
        </div>
      </section>

      {showNew && (
        <section className="rounded-[26px] border border-[#eaded3] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="grid size-10 place-items-center rounded-full bg-[#fff0ea] text-[#b63a2c]">
              <UserRound size={17} />
            </span>

            <div>
              <p className="font-black">
                Nuevo usuario del ERP
              </p>
              <p className="text-[10px] text-[#7f746c]">
                Usa una contraseña temporal y luego pueden cambiarla.
              </p>
            </div>
          </div>

          <form
            action={createStaffUserV22}
            className="mt-5 grid gap-3 sm:grid-cols-2"
          >
            <input
              name="full_name"
              className="ti-input"
              placeholder="Nombre y apellido"
              required
            />

            <input
              name="email"
              type="email"
              className="ti-input"
              placeholder="correo@empresa.com"
              required
            />

            <select
              name="role"
              className="ti-input"
              defaultValue="contenido"
            >
              <option value="admin">Administrador</option>
              <option value="ventas">Ventas</option>
              <option value="contenido">Contenido</option>
              <option value="inventario">Inventario</option>
            </select>

            <input
              name="password"
              type="password"
              minLength={8}
              className="ti-input"
              placeholder="Contraseña temporal"
              required
            />

            <button className="sm:col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-[15px] bg-[#5a8b86] px-5 text-xs font-black !text-white">
              <ShieldCheck size={15} />
              Crear acceso
            </button>
          </form>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-2">
        {users.map((user) => (
          <article
            key={user.user_id}
            className="rounded-[24px] border border-[#eaded3] bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black">
                  {user.full_name || "Sin nombre"}
                </p>

                <p className="mt-1 text-[11px] text-[#7f746c]">
                  {user.email}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-[8px] font-black uppercase ${
                  user.active
                    ? "bg-[#edf7f5] text-[#42746e]"
                    : "bg-[#f2ece8] text-[#857970]"
                }`}
              >
                {user.active ? "Activo" : "Desactivado"}
              </span>
            </div>

            <form
              action={updateStaffUserV22}
              className="mt-4 grid gap-3"
            >
              <input
                type="hidden"
                name="user_id"
                value={user.user_id}
              />

              <input
                name="full_name"
                defaultValue={user.full_name ?? ""}
                className="ti-input"
                placeholder="Nombre"
              />

              <select
                name="role"
                defaultValue={user.role}
                className="ti-input"
              >
                <option value="admin">Administrador</option>
                <option value="ventas">Ventas</option>
                <option value="contenido">Contenido</option>
                <option value="inventario">Inventario</option>
              </select>

              <label className="flex items-center gap-2 rounded-[14px] border border-[#eaded3] bg-[#fffaf6] px-3 py-3 text-[10px] font-black">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={user.active}
                />
                Puede ingresar al ERP
              </label>

              <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[14px] bg-[#5a8b86] px-4 text-[10px] font-black !text-white">
                <Save size={13} />
                Guardar permisos
              </button>
            </form>

            <details className="mt-3 rounded-[16px] border border-[#eaded3] bg-[#fffaf7]">
              <summary className="cursor-pointer list-none px-4 py-3 text-[10px] font-black text-[#8f3a2e]">
                Cambiar contraseña
              </summary>

              <form
                action={changeStaffPasswordV22}
                className="grid gap-2 border-t border-[#eaded3] p-3"
              >
                <input
                  type="hidden"
                  name="user_id"
                  value={user.user_id}
                />

                <input
                  name="new_password"
                  type="password"
                  minLength={8}
                  className="ti-input"
                  placeholder="Nueva contraseña"
                  required
                />

                <button className="inline-flex min-h-9 items-center justify-center gap-2 rounded-[13px] bg-[#8f3a2e] px-4 text-[9px] font-black !text-white">
                  <KeyRound size={12} />
                  Cambiar contraseña
                </button>
              </form>
            </details>

            <p className="mt-3 text-[9px] text-[#958980]">
              Rol actual: {roleLabels[user.role] ?? user.role}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
