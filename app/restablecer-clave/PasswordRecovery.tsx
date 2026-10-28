"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default function PasswordRecovery() {
  const [ready, setReady] = useState(false);
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.slice(1));
      if (params.get("error") || hash.get("error")) {
        if (active) setMessage("El enlace expiró o no es válido. Solicita uno nuevo desde aquí.");
      } else if (params.get("token_hash") && params.get("type") === "recovery") {
        const { error } = await supabase.auth.verifyOtp({ token_hash: params.get("token_hash")!, type: "recovery" });
        if (active) { setVerified(!error); if(error) setMessage("El enlace expiró o ya se utilizó. Solicita uno nuevo."); }
      } else if (hash.get("access_token") && hash.get("refresh_token")) {
        const { error } = await supabase.auth.setSession({ access_token: hash.get("access_token")!, refresh_token: hash.get("refresh_token")! });
        if (active) { setVerified(!error); if(error) setMessage("No se pudo validar el enlace. Solicita uno nuevo."); }
      }
      // Remove recovery tokens from the address bar immediately after processing.
      window.history.replaceState(null, "", "/restablecer-clave");
      if (active) setReady(true);
    }
    load();
    return () => {active = false;};
  }, []);

  async function requestReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(
  email.trim(),
  {
    redirectTo: `${window.location.origin}/restablecer-clave`,
  }
);
    setMessage(error ? "No se pudo enviar el correo. Comprueba el correo e inténtalo de nuevo." : "Si el correo está registrado, recibirás un enlace para crear una nueva contraseña. Revisa también spam.");
    setBusy(false);
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < 10) { setMessage("Utiliza al menos 10 caracteres."); return; }
    if (password !== confirm) { setMessage("Las contraseñas no coinciden."); return; }
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setMessage("No se pudo guardar la contraseña. Solicita un enlace nuevo si expiró.");
    else { await supabase.auth.signOut(); setComplete(true); }
    setBusy(false);
  }

  return <main className="grid min-h-screen place-items-center bg-[#fff8f1] p-4"><div className="ti-card w-full max-w-md p-7">
    <div className="text-center"><p className="text-xs font-black tracking-[0.18em] text-[#5a8b86]">TENDENCIAS IMPORT</p><h1 className="mt-3 text-3xl font-black">Recuperar contraseña</h1><p className="mt-2 text-sm text-[#7f746c]">Acceso exclusivo para administradores.</p></div>
    {!ready ? <p className="mt-6 text-center">Verificando enlace…</p> : complete ? <div className="mt-6 text-center"><p className="font-bold text-green-800">Tu contraseña se actualizó correctamente.</p><Link className="ti-button ti-button-primary mt-5 inline-block" href="/login-admin?restored=1">Ir al inicio de sesión</Link></div> : verified ?
      <form onSubmit={changePassword} className="mt-6 space-y-3"><label className="block text-sm font-bold">Nueva contraseña</label><input className="ti-input" type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} minLength={10} required /><label className="block text-sm font-bold">Confirmar contraseña</label><input className="ti-input" type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} minLength={10} required /><button disabled={busy} className="ti-button ti-button-primary w-full">{busy ? "Guardando…" : "Guardar nueva contraseña"}</button></form> :
      <form onSubmit={requestReset} className="mt-6 space-y-3"><p className="text-sm text-[#7f746c]">Escribe el correo de tu cuenta administradora para recibir un nuevo enlace.</p><label className="block text-sm font-bold">Correo electrónico</label><input className="ti-input" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required /><button disabled={busy} className="ti-button ti-button-primary w-full">{busy ? "Enviando…" : "Enviar correo de recuperación"}</button></form>}
    {message && <p role="status" className="mt-4 rounded-xl bg-[#f9eded] p-3 text-sm text-[#802c27]">{message}</p>}
    <p className="mt-6 text-center text-sm"><Link href="/login-admin" className="underline">Volver al ingreso</Link></p>
  </div></main>;
}
