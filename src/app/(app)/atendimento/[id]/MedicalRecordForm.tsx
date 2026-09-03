"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { gerarReceitaPDF, type ReceitaClinica, type ReceitaPaciente, type ReceitaTutor, type ReceitaVet } from "@/lib/receita-pdf";

type MR = {
  id?: string;
  complaint?: string | null; anamnesis?: string | null; physicalExam?: string | null;
  weightKg?: number | string | null;
  diagnosis?: string | null; conduct?: string | null; procedures?: string | null;
  observations?: string | null; recommendReturn?: Date | string | null;
  prescriptionText?: string | null;
  signerName?: string | null;
  signerCrmv?: string | null;
  prescriptions?: any[];
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

function parseInitialPrescription(initial: any): string {
  if (initial?.prescriptionText) return initial.prescriptionText;
  if (Array.isArray(initial?.prescriptions) && initial.prescriptions.length > 0) {
    return initial.prescriptions
      .map((r: any, idx: number) => {
        const title = `${idx + 1}) ${r.medication || ""}`.trim();
        const details = [r.dosage, r.frequency, r.duration].filter(Boolean).join(" - ");
        const parts = [title];
        if (details) parts.push(`   ${details}`);
        if (r.guidelines) parts.push(`   Obs: ${r.guidelines}`);
        return parts.join("\n");
      })
      .join("\n\n");
  }
  return "";
}

export function MedicalRecordForm({ appointmentId, initial, clinic, pet, tutor, vet, printedBy }: Props) {
  const router = useRouter();
  const [m, setM] = useState<MR>(initial ?? {});
  const [prescriptionText, setPrescriptionText] = useState<string>(() => parseInitialPrescription(initial));
  // Inicia sem o nome já preenchido por padrão, permitindo que especialistas volantes
  // coloquem seu próprio nome/CRMV ou que a receita saia com linha limpa para carimbo físico.
  const [signerName, setSignerName] = useState<string>(initial?.signerName ?? "");
  const [signerCrmv, setSignerCrmv] = useState<string>(initial?.signerCrmv ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function u<K extends keyof MR>(k: K, v: any) { setM((p) => ({ ...p, [k]: v })); }

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const body = {
        appointmentId,
        ...m,
        prescriptionText: prescriptionText.trim() || null,
        signerName: signerName.trim() || null,
        signerCrmv: signerCrmv.trim() || null,
      };
      const res = await fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Falha ao salvar");
      setMsg("Ficha salva com sucesso");
      router.refresh();
    } catch (e: any) { setMsg(e.message); } finally { setSaving(false); }
  }

  // Endereco e telefone identificam a clinica no cabecalho: sem eles a receita
  // nao serve como documento. Sao pedidos JUNTOS, para o veterinario nao voltar
  // duas vezes em Configuracoes. A logo e desejavel, mas nao impede a emissao.
  const dadosFaltando = ([
    [!(clinic.address ?? "").trim(), "o endereco"],
    [!(clinic.phone ?? "").trim(), "o telefone"],
  ] as const)
    .filter(([falta]) => falta)
    .map(([, rotulo]) => rotulo);
  const faltaCadastro = dadosFaltando.length > 0;
  const listaFaltando = dadosFaltando.join(" e ");
  const faltaLogo = !(clinic.logoUrl ?? "").trim();

  function pdf() {
    // Receita sem identificacao da clinica nao serve como documento: o endereco
    // e obrigatorio no cabecalho. Bloqueia aqui e diz onde resolver, em vez de
    // emitir um PDF incompleto que o tutor so vai descobrir na farmacia.
    if (faltaCadastro) {
      setMsg(
        `Cadastre ${listaFaltando} da clinica em Configuracoes > Identidade da clinica para gerar a ` +
          "receita. Esses dados aparecem no cabecalho do documento."
      );
      return;
    }
    const textoReceita = prescriptionText.trim();
    if (!textoReceita) {
      setMsg("Digite ao menos uma medicação no campo de receituário antes de gerar a receita.");
      return;
    }
    gerarReceitaPDF({
      clinic,
      pet: pet ?? { name: "-" },
      tutor,
      vet: {
        name: signerName.trim() || null,
        crmv: signerCrmv.trim() || null,
      },
      printedBy,
      prescriptionText: textoReceita,
      items: [],
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

      {/* Espaço Único e Amplo para Medicações */}
      <div className="border-t border-slate-100 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-slate-800">Prescrição e Medicações (Receituário)</h3>
            <p className="text-xs text-slate-500">
              Digite todas as medicações, posologias e orientações livremente. O texto sairá formatado na receita em PDF.
            </p>
          </div>
        </div>

        <div>
          <textarea
            className="input w-full font-sans text-sm leading-relaxed"
            rows={8}
            placeholder={`Digite as medicações e posologias aqui sem restrição. Exemplo:\n\n1) Amoxicilina + Clavulanato 250mg\n   Administrar 1 comprimido a cada 12 horas por 10 dias via oral.\n\n2) Meloxicam 0,5mg\n   Administrar 1 comprimido a cada 24 horas por 3 dias junto à alimentação.`}
            value={prescriptionText}
            onChange={(e) => setPrescriptionText(e.target.value)}
          />
        </div>

        {/* Bloco de Assinatura da Receita */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Assinatura da Receita</span>
              <span className="text-[11px] text-slate-500">
                Insira o nome e CRMV de quem assina (útil para veterinários especialistas/volantes), ou deixe em branco para carimbar à mão.
              </span>
            </div>
            {vet?.name && (
              <button
                type="button"
                className="text-[11px] text-brand-600 hover:text-brand-800 underline font-medium"
                onClick={() => {
                  if (signerName || signerCrmv) {
                    setSignerName("");
                    setSignerCrmv("");
                  } else {
                    setSignerName(vet.name || "");
                    setSignerCrmv(vet.crmv || "");
                  }
                }}
              >
                {signerName || signerCrmv ? "Limpar assinatura" : `Preencher com meus dados (${vet.name})`}
              </button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="label text-xs">Nome do(a) Veterinário(a)</label>
              <input
                className="input text-sm"
                placeholder="Ex: Dr. Carlos Silva (ou deixe em branco)"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
              />
            </div>
            <div>
              <label className="label text-xs">CRMV</label>
              <input
                className="input text-sm"
                placeholder="Ex: RJ 17.412"
                value={signerCrmv}
                onChange={(e) => setSignerCrmv(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {(faltaCadastro || faltaLogo) && (
        <div className={`text-sm rounded-xl px-3 py-2 border ${faltaCadastro ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
          {faltaCadastro ? (
            <>
              <strong>Falta {listaFaltando} da clinica para emitir receita.</strong> Esses dados entram no
              cabecalho do documento. Preencha em{" "}
              <a href="/configuracoes" className="underline font-medium">Configuracoes &gt; Identidade da clinica</a>.
              {faltaLogo ? " Aproveite e envie a logo por la." : null}
            </>
          ) : (
            <>
              A receita vai sair sem logo. Envie a imagem em{" "}
              <a href="/configuracoes" className="underline font-medium">Configuracoes &gt; Identidade da clinica</a>{" "}
              se quiser o cabecalho completo.
            </>
          )}
        </div>
      )}

      {msg && <div className={`text-sm ${faltaCadastro ? "text-amber-700" : "text-emerald-700"}`}>{msg}</div>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="btn-primary">{saving ? "Salvando..." : "Salvar ficha"}</button>
        <button
          onClick={pdf}
          type="button"
          className="btn-outline"
          title={faltaCadastro ? `Cadastre ${listaFaltando} da clinica para liberar a receita` : undefined}
        >
          Gerar receita (PDF)
        </button>
      </div>
    </div>
  );
}
