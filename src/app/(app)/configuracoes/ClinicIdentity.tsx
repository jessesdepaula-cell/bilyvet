"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUp, Trash2 } from "lucide-react";

export type Clinic = {
  companyName: string;
  tradeName: string | null;
  cnpj: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  logoUrl: string | null;
};

const LOGO_MAX_PX = 480; // reduz antes de virar base64 - logo de receita nao precisa de mais

/** Redimensiona no browser e devolve um data URI PNG. */
function fileToLogoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Nao foi possivel ler o arquivo"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Arquivo nao e uma imagem valida"));
      img.onload = () => {
        const scale = Math.min(1, LOGO_MAX_PX / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Navegador sem suporte a canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function ClinicIdentity({ initial }: { initial: Clinic }) {
  const router = useRouter();
  const [c, setC] = useState<Clinic>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function u<K extends keyof Clinic>(k: K, v: Clinic[K]) {
    setC((p) => ({ ...p, [k]: v }));
    setMsg(null);
  }

  async function pickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      setError("Envie a logo em PNG ou JPG.");
      return;
    }
    try {
      const dataUrl = await fileToLogoDataUrl(file);
      if (dataUrl.length > 1_500_000) {
        setError("Logo muito pesada mesmo apos reduzir. Use uma imagem mais simples.");
        return;
      }
      u("logoUrl", dataUrl);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function save() {
    setBusy(true); setError(null); setMsg(null);
    try {
      const res = await fetch("/api/tenant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Falha ao salvar");
      setMsg("Dados da clinica salvos. As proximas receitas ja saem com eles.");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card card-pad space-y-5">
      <div>
        <h3 className="font-semibold text-slate-800">Identidade da clinica</h3>
        <p className="text-xs text-slate-500 mt-1">
          Esses dados formam o cabecalho de toda receita, atestado e documento impresso da sua clinica.
        </p>
      </div>

      {/* Logo */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="h-24 w-24 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
          {c.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.logoUrl} alt="Logo da clinica" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-[10px] text-slate-400 text-center px-2">sem logo</span>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex gap-2">
            <button type="button" className="btn-outline text-sm" onClick={() => fileRef.current?.click()}>
              <ImageUp className="h-4 w-4" /> {c.logoUrl ? "Trocar logo" : "Enviar logo"}
            </button>
            {c.logoUrl && (
              <button type="button" className="btn-ghost text-sm text-red-600" onClick={() => u("logoUrl", null)}>
                <Trash2 className="h-4 w-4" /> Remover
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">PNG ou JPG. Fundo transparente fica melhor na receita.</p>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={pickLogo} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Nome fantasia (aparece na receita)</label>
          <input className="input" value={c.tradeName ?? ""} onChange={(e) => u("tradeName", e.target.value)} placeholder="Ex: VETZ" />
        </div>
        <div>
          <label className="label">Razao social *</label>
          <input className="input" value={c.companyName} onChange={(e) => u("companyName", e.target.value)} />
        </div>
        <div>
          <label className="label">CNPJ</label>
          <input className="input" value={c.cnpj ?? ""} onChange={(e) => u("cnpj", e.target.value)} placeholder="00.000.000/0001-00" />
        </div>
        <div>
          <label className="label">Telefone * <span className="text-slate-400 font-normal">(exigido na receita)</span></label>
          <input className="input" value={c.phone ?? ""} onChange={(e) => u("phone", e.target.value)} placeholder="(21) 98186-1032" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Endereco * <span className="text-slate-400 font-normal">(exigido na receita)</span></label>
          <input className="input" value={c.address ?? ""} onChange={(e) => u("address", e.target.value)} placeholder="Estrada Cachamorra 350, bloco 3, loja 133" />
        </div>
        <div>
          <label className="label">Cidade</label>
          <input className="input" value={c.city ?? ""} onChange={(e) => u("city", e.target.value)} placeholder="Rio de Janeiro" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">UF</label>
            <input className="input" maxLength={2} value={c.state ?? ""} onChange={(e) => u("state", e.target.value.toUpperCase())} placeholder="RJ" />
          </div>
          <div>
            <label className="label">CEP</label>
            <input className="input" value={c.zipCode ?? ""} onChange={(e) => u("zipCode", e.target.value)} placeholder="23040-150" />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="label">E-mail *</label>
          <input className="input" type="email" value={c.email} onChange={(e) => u("email", e.target.value)} />
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}
      {msg && <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-3 py-2">{msg}</div>}

      <div className="flex justify-end">
        <button onClick={save} disabled={busy} className="btn-primary">{busy ? "Salvando..." : "Salvar dados da clinica"}</button>
      </div>
    </div>
  );
}
