"use client";

import { useState } from "react";
import { ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { deletePaymentAccount, savePaymentAccount } from "@/app/admin/configuracion/pagos/actions";

type Account = {
  id: string;
  method: string;
  label: string;
  holder: string | null;
  account_number: string | null;
  cci: string | null;
  qr_url: string | null;
  instructions: string | null;
  active: boolean;
  sort_order: number;
};

export function PaymentAccountsEditor({ accounts }: { accounts: Account[] }) {
  const supabase = createClient();
  const [adding, setAdding] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  async function uploadQr(file: File, accountId: string, inputId: string) {
    setUploadingId(accountId);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `payment-accounts/${accountId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("catalog-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("catalog-media").getPublicUrl(path);
      const input = document.getElementById(inputId) as HTMLInputElement | null;
      if (input) input.value = data.publicUrl;
      alert("QR subido. Ahora pulsa Guardar.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo subir el QR.");
    } finally {
      setUploadingId(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar esta cuenta de pago?")) return;
    await deletePaymentAccount(id);
  }

  return (
    <div className="space-y-4">
      {accounts.map((account, index) => {
        const inputId = `qr-${account.id}`;
        return (
          <form key={account.id} action={savePaymentAccount} className="rounded-[24px] border border-[#eaded3] bg-white p-5 shadow-sm">
            <input type="hidden" name="id" value={account.id} />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div><label className="mb-2 block text-xs font-black">Método</label><input name="method" defaultValue={account.method} className="ti-input" /></div>
              <div><label className="mb-2 block text-xs font-black">Nombre visible</label><input name="label" defaultValue={account.label} className="ti-input" /></div>
              <div><label className="mb-2 block text-xs font-black">Titular</label><input name="holder" defaultValue={account.holder ?? ""} className="ti-input" /></div>
              <div><label className="mb-2 block text-xs font-black">Orden</label><input name="sort_order" type="number" defaultValue={account.sort_order ?? index} className="ti-input" /></div>
              <div><label className="mb-2 block text-xs font-black">Número / cuenta</label><input name="account_number" defaultValue={account.account_number ?? ""} className="ti-input" /></div>
              <div><label className="mb-2 block text-xs font-black">CCI</label><input name="cci" defaultValue={account.cci ?? ""} className="ti-input" /></div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-black">QR URL</label>
                <input id={inputId} name="qr_url" defaultValue={account.qr_url ?? ""} className="ti-input" />
                <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#f4faf8] px-3 py-2 text-[10px] font-black text-[#42746e]">
                  <ImagePlus size={13} /> {uploadingId === account.id ? "Subiendo..." : "Subir QR"}
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingId === account.id} onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadQr(file, account.id, inputId); }} />
                </label>
              </div>
              <div className="md:col-span-2 xl:col-span-4"><label className="mb-2 block text-xs font-black">Instrucciones</label><textarea name="instructions" defaultValue={account.instructions ?? ""} className="ti-input min-h-20 py-3" /></div>
              <label className="flex items-center gap-3"><input type="checkbox" name="active" defaultChecked={account.active} /><span className="text-sm font-black">Mostrar en checkout</span></label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#b63a2c] px-4 text-xs font-black text-white"><Save size={14} /> Guardar</button>
              <button type="button" onClick={() => remove(account.id)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#fff0eb] px-4 text-xs font-black text-[#a33d31]"><Trash2 size={14} /> Eliminar</button>
            </div>
          </form>
        );
      })}

      {adding ? (
        <form action={savePaymentAccount} className="rounded-[24px] border border-dashed border-[#d7c7bb] bg-white p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <input name="method" className="ti-input" placeholder="Método: YAPE" required />
            <input name="label" className="ti-input" placeholder="Nombre visible: Yape" required />
            <input name="holder" className="ti-input" placeholder="Titular" />
            <input name="account_number" className="ti-input" placeholder="Número / cuenta" />
            <input name="cci" className="ti-input" placeholder="CCI" />
            <input name="qr_url" className="ti-input" placeholder="QR URL opcional" />
            <input name="sort_order" type="number" defaultValue={accounts.length} className="ti-input" />
            <label className="flex items-center gap-3"><input type="checkbox" name="active" defaultChecked /><span className="text-sm font-black">Activa</span></label>
            <textarea name="instructions" className="ti-input min-h-20 py-3 md:col-span-2" placeholder="Instrucciones..." />
          </div>
          <div className="mt-4 flex gap-2">
            <button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#b63a2c] px-4 text-xs font-black text-white"><Save size={14} /> Crear cuenta</button>
            <button type="button" onClick={() => setAdding(false)} className="rounded-full border border-[#eaded3] px-4 text-xs font-black">Cancelar</button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#fff0e9] px-4 text-xs font-black text-[#9b382b]"><Plus size={14} /> Agregar cuenta</button>
      )}
    </div>
  );
}
