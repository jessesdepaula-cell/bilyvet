"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { gerarReceitaPDF, type ReceitaClinica, type ReceitaPaciente, type ReceitaTutor, type ReceitaVet } from "@/lib/receita-pdf";

type Prescription = { medication: string; dosage: string; frequency: string; duration: string; guidelines?: string | null };
type MR = {
  id?: string;
  complaint?: string | null; anamnesis?: string | null; physicalExam?: string | null;
  weightKg?: number | string | null;
  diagnosis?: string | null; conduct?: string | null; procedures?: string | null;
  observations?: string | null; recommendReturn?: Date | string | null;
  prescriptions?: Prescription[];
};

type Props = {
  appointmentId: string;
  initial: any | null;
  clinic: ReceitaClinica;
  pet: ReceitaPaciente | null;
  tutor: ReceitaTutor;
  vet: ReceitaVet;
  printedBy: string;
};

export function MedicalRecordForm({ appointmentId, initial, clinic, pet, tutor, vet, printedBy }: Props) {
  const router = useRouter();
  const [m, setM] = useState<MR>(initial ?? {});
  const [rx, setRx] = useState<Prescription[]>(initial?.prescriptions ?? [{ medication: "", dosage: "", frequency: "", duration: "" }]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function u<K extends keyof MR>(k: K, v: any) { setM((p) => ({ ...p, [k]: v })); }
  function updateRx(i: number, k: keyof Prescription, v: string) { setRx((p) => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r)); }
  function addRx() { setRx((p) => [...p, { medication: "", dosage: "", frequency: "", duration: "" }]); }
  function delRx(i: number) { setRx((p) => p.filter((_, idx) => idx !== i)); }

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const body = { appointmentId, ...m, prescriptions: rx.filter((r) => r.medication.trim()) };
      const res = await fetch("/api/medical-records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Falha ao salvar");
      setMsg("Ficha salva com sucesso");
      router.refresh();
    } catch (e: any) { setMsg(e.message); } finally { setSaving(false); }
  }

  function pdf() {
    const itens = rx.filter((r) => r.medication.trim());
    if (itens.length === 0) { setMsg("Adicione ao menos um medicamento antes de gerar a receita."); return; }
    gerarReceitaPDF({
      clinic,
      pet: pet ?? { name: "-" },
      tutor,
      vet,
      printedBy,
      items: itens,
      weightKg: m.weightKg ?? null,
      // Conduta e observacoes viram o bloco de orientacoes gerais da receita
      observations: [m.conduct, m.observations].map((v) => (v || "").trim()).filter(Boolean).join("\n"),
      recommendReturn: m.recommendReturn ?? null,
    });
  }

  return (
    <div className="card card-pad space-y-4">
      <h2 className="font-semibold">Ficha de atendimento</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><label className="label">Queixa principal</label><textarea className="input" rows={2} value={m.complaint ?? ""} onChange={(e) => u("complaint", e.target.value)} /></div>
        <div><label className="label">Anamnese</label><textarea className="input" rows={3} value={m.anamnesis ?? ""} onChange={(e) => u("anamnesis", e.target.value)} /></div>
        <div><label className="label">Exame fisico</label><textarea className="input" rows={3} value={m.physicalExam ?? ""} onChange={(e) => u("physicalExam", e.target.value)} /></div>
        <div className="sm:col-span-2"><label className="label">Peso (kg)</label><input className="input" type="number" step="0.01" min="0" placeholder="Ex: 8.5 — atualiza o peso na ficha do animal" value={m.weightKg ?? ""} onChange={(e) => u("weightKg", e.target.value)} /></div>
        <div><label className="label">Diagnostico</label><textarea className="input" rows={2} value={m.diagnosis ?? ""} onChange={(e) => u("diagnosis", e.target.value)} /></div>
        <div><label className="label">Conduta</label><textarea className="input" rows={2} value={m.conduct ?? ""} onChange={(e) => u("conduct", e.target.value)} /></div>
        <div><label className="label">Procedimentos realizados</label><textarea className="input" rows={2} value={m.procedures ?? ""} onChange={(e) => u("procedures", e.target.value)} /></div>
        <div><label className="label">Observacoes</label><textarea className="input" rows={2} value={m.observations ?? ""} onChange={(e) => u("observations", e.target.value)} /></div>
        <div><label className="label">Retorno recomendado</label><input className="input" type="date" value={m.recommendReturn ? new Date(m.recommendReturn).toISOString().slice(0,10) : ""} onChange={(e) => u("recommendReturn", e.target.value)} /></div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Receituario interno</h3>
          <button className="btn-outline text-xs" onClick={addRx} type="button">+ medicamento</button>
        </div>
        <div className="space-y-2">
          {rx.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <input className="input col-span-3" placeholder="Medicamento" value={r.medication} onChange={(e) => updateRx(i, "medication", e.target.value)} />
              <input className="input col-span-2" placeholder="Dosagem" value={r.dosage} onChange={(e) => updateRx(i, "dosage", e.target.value)} />
              <input className="input col-span-2" placeholder="Frequencia" value={r.frequency} onChange={(e) => updateRx(i, "frequency", e.target.value)} />
              <input className="input col-span-2" placeholder="Duracao" value={r.duration} onChange={(e) => updateRx(i, "duration", e.target.value)} />
              <input className="input col-span-2" placeholder="Orientacoes" value={r.guidelines ?? ""} onChange={(e) => updateRx(i, "guidelines", e.target.value)} />
              <button type="button" onClick={() => delRx(i)} className="btn-ghost text-red-600 col-span-1">x</button>
            </div>
          ))}
        </div>
      </div>

      {msg && <div className="text-sm text-emerald-700">{msg}</div>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="btn-primary">{saving ? "Salvando..." : "Salvar ficha"}</button>
        <button onClick={pdf} type="button" className="btn-outline">Gerar receita (PDF)</button>
      </div>
    </div>
  );
}
