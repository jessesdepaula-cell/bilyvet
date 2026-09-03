"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { PetForm } from "../PetForm";
import { fmtDate, fmtDateTime, ageFromBirth, cn } from "@/lib/utils";
import {
  Syringe,
  FlaskConical,
  BedDouble,
  Stethoscope,
  Paperclip,
  Trash2,
  Plus,
  Calendar,
  AlertTriangle,
  FileText,
  User,
  HeartCrack,
  Download,
  Eye,
  Check,
  X,
  Cross,
  Weight,
  Activity,
  FileCheck,
  Camera,
  Droplets,
  FileSignature,
  MessageCircle,
  Hospital,
  History,
  Scissors,
} from "lucide-react";

type TutorOpt = { id: string; name: string };
type ProtocolTemplate = {
  id: string;
  name: string;
  type: string;
  notes: string | null;
  doses: { name: string; daysOffset: number }[];
};

type PetProfileClientProps = {
  pet: any;
  tutors: TutorOpt[];
  protocolTemplates: ProtocolTemplate[];
  statuses: any[];
  auditLogs?: any[];
  isBlobConfigured?: boolean;
};

export function PetProfileClient({ pet: initialPet, tutors, protocolTemplates, statuses, auditLogs = [], isBlobConfigured = false }: PetProfileClientProps) {
  const router = useRouter();
  const [pet, setPet] = useState(initialPet);
  const [activeTab, setActiveTab] = useState("ficha");
  const [obitoLoading, setObitoLoading] = useState(false);

  // Attachments state
  const [attachments, setAttachments] = useState<any[]>(initialPet.attachments || []);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Protocols state
  const [protocols, setProtocols] = useState<any[]>(initialPet.protocols || []);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [protocolStartDate, setProtocolStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [protocolBatch, setProtocolBatch] = useState("");
  const [protocolLaboratory, setProtocolLaboratory] = useState("");
  const [protocolNotes, setProtocolNotes] = useState("");
  const [protocolLoading, setProtocolLoading] = useState(false);
  const [protocolError, setProtocolError] = useState<string | null>(null);
  const [showNewProtocol, setShowNewProtocol] = useState(false);

  // Doses updating
  const [doseActionLoading, setDoseActionLoading] = useState<string | null>(null);

  // Vaccine modal & state
  const [vaccines, setVaccines] = useState<any[]>(initialPet.vaccines || []);
  const [showVaccineModal, setShowVaccineModal] = useState(false);
  const [vacName, setVacName] = useState("");
  const [vacAppliedAt, setVacAppliedAt] = useState(new Date().toISOString().slice(0, 10));
  const [vacNextDose, setVacNextDose] = useState("");
  const [vacBatch, setVacBatch] = useState("");
  const [vacLaboratory, setVacLaboratory] = useState("");
  const [vacNotes, setVacNotes] = useState("");
  const [savingVaccine, setSavingVaccine] = useState(false);

  // Applying dose modal state
  const [applyingDoseModal, setApplyingDoseModal] = useState<{ protocolId: string; doseId: string; doseName: string } | null>(null);
  const [doseBatch, setDoseBatch] = useState("");
  const [doseLaboratory, setDoseLaboratory] = useState("");

  // Acoes rapidas (cards coloridos)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightValue, setWeightValue] = useState(pet.weightKg?.toString() ?? "");
  const [savingWeight, setSavingWeight] = useState(false);

  useEffect(() => {
    if (!pendingAction) return;
    if (pendingAction === "open-upload" && activeTab === "exames") {
      const t = setTimeout(() => fileInputRef.current?.click(), 200);
      return () => { clearTimeout(t); setPendingAction(null); };
    }
    setPendingAction(null);
  }, [pendingAction, activeTab]);

  async function handleSaveWeight() {
    if (!weightValue.trim()) return;
    setSavingWeight(true);
    try {
      const res = await fetch(`/api/pets/${pet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightKg: parseFloat(weightValue) }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPet((p: any) => ({ ...p, weightKg: updated.weightKg }));
        setShowWeightModal(false);
        router.refresh();
      }
    } catch (err) {
      alert("Erro ao salvar peso");
    } finally {
      setSavingWeight(false);
    }
  }

  async function handleRegisterObito() {
    if (!confirm("ATENCAO: Registrar obito para este animal? Esta acao alterara o status do animal e impedira novos agendamentos sem confirmacao. Tem certeza?")) return;
    setObitoLoading(true);
    try {
      const res = await fetch(`/api/pets/${pet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deceased: true, deceasedAt: new Date().toISOString() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPet((p: any) => ({ ...p, deceased: true, deceasedAt: updated.deceasedAt }));
        router.refresh();
      }
    } catch (err) {
      alert("Erro ao registrar obito");
    } finally {
      setObitoLoading(false);
    }
  }

  async function handleSaveVaccine(e: React.FormEvent) {
    e.preventDefault();
    if (!vacName.trim()) return;
    setSavingVaccine(true);
    try {
      const res = await fetch("/api/vaccines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petId: pet.id,
          name: vacName.trim(),
          appliedAt: vacAppliedAt,
          nextDose: vacNextDose || null,
          batch: vacBatch.trim() || null,
          laboratory: vacLaboratory.trim() || null,
          notes: vacNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha ao salvar vacina");
      }
      const newVac = await res.json();
      setVaccines((prev) => [newVac, ...prev]);
      setShowVaccineModal(false);
      setVacName("");
      setVacBatch("");
      setVacLaboratory("");
      setVacNotes("");
      setVacNextDose("");
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar vacina");
    } finally {
      setSavingVaccine(false);
    }
  }

  async function handleDeleteVaccine(id: string) {
    if (!confirm("Excluir este registro de vacina?")) return;
    try {
      const res = await fetch(`/api/vaccines?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setVaccines((prev) => prev.filter((v) => v.id !== id));
        router.refresh();
      }
    } catch (err) {
      alert("Erro ao excluir vacina");
    }
  }

  async function handleConfirmApplyDose() {
    if (!applyingDoseModal) return;
    setDoseActionLoading(applyingDoseModal.doseId);
    try {
      const res = await fetch(`/api/protocols/${applyingDoseModal.protocolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_dose",
          doseId: applyingDoseModal.doseId,
          appliedAt: new Date().toISOString(),
          batch: doseBatch.trim() || null,
          laboratory: doseLaboratory.trim() || null,
        }),
      });

      if (res.ok) {
        const protocol = protocols.find((p) => p.id === applyingDoseModal.protocolId);
        if (protocol && (protocol.type === "Vacina" || protocol.name.toLowerCase().includes("vacina"))) {
          await fetch("/api/vaccines", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              petId: pet.id,
              name: `${protocol.name} (${applyingDoseModal.doseName})`,
              appliedAt: new Date().toISOString(),
              batch: doseBatch.trim() || null,
              laboratory: doseLaboratory.trim() || null,
            }),
          });
          const vRes = await fetch(`/api/vaccines?petId=${pet.id}`);
          if (vRes.ok) {
            const vData = await vRes.json();
            setVaccines(vData);
          }
        }

        const pRes = await fetch(`/api/protocols?petId=${pet.id}`);
        if (pRes.ok) {
          const data = await pRes.json();
          setProtocols(data);
        }
        setApplyingDoseModal(null);
        setDoseBatch("");
        setDoseLaboratory("");
        router.refresh();
      }
    } catch (err) {
      alert("Erro ao aplicar dose");
    } finally {
      setDoseActionLoading(null);
    }
  }

  // Attachment upload (Vercel Blob client-direct upload, ate 50MB)
  async function reloadAttachments() {
    const attRes = await fetch(`/api/pets/${pet.id}/attachments`, { cache: "no-store" });
    if (attRes.ok) {
      const list = await attRes.json();
      setAttachments(list);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
      setUploadError("Arquivo muito grande (maximo 50MB). Comprima o PDF ou divida em partes.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const displayName = (fileName || file.name).trim();

      if (isBlobConfigured) {
        // Fluxo Vercel Blob (direct client upload)
        await upload(file.name, file, {
          access: "public",
          handleUploadUrl: `/api/pets/${pet.id}/attachments`,
          clientPayload: JSON.stringify({
            name: displayName,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
          }),
        });

        // onUploadCompleted no servidor persiste o anexo de forma assincrona.
        // Aguarda + 2 retries pra cobrir a janela de propagacao.
        await new Promise((r) => setTimeout(r, 800));
        await reloadAttachments();
        for (let i = 0; i < 3; i++) {
          await new Promise((r) => setTimeout(r, 1200));
          await reloadAttachments();
        }
      } else {
        // Fallback: POST multipart/form-data direto pro banco (base64)
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", displayName);

        const res = await fetch(`/api/pets/${pet.id}/attachments`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Falha ao enviar arquivo no servidor");
        }

        // O salvamento no banco e sincrono, recarrega imediatamente
        await reloadAttachments();
      }

      setFileName("");
      e.target.value = "";
    } catch (err: any) {
      setUploadError(err.message || "Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteAttachment(attachmentId: string) {
    if (!confirm("Excluir este anexo?")) return;
    try {
      const res = await fetch(`/api/pets/${pet.id}/attachments/${attachmentId}`, { method: "DELETE" });
      if (res.ok) {
        setAttachments((prev) => prev.filter((x) => x.id !== attachmentId));
      }
    } catch (err) {
      alert("Erro ao excluir");
    }
  }

  // Protocol creation
  async function handleStartProtocol(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTemplateId) return;
    setProtocolLoading(true);
    setProtocolError(null);

    const template = protocolTemplates.find((t) => t.id === selectedTemplateId);
    if (!template) return;

    try {
      const res = await fetch("/api/protocols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petId: pet.id,
          templateId: selectedTemplateId,
          name: template.name,
          type: template.type,
          startDate: protocolStartDate,
          batch: protocolBatch.trim() || null,
          laboratory: protocolLaboratory.trim() || null,
          notes: protocolNotes,
        }),
      });

      if (!res.ok) throw new Error("Falha ao criar protocolo");

      // Reload protocols
      const pRes = await fetch(`/api/protocols?petId=${pet.id}`);
      if (pRes.ok) {
        const data = await pRes.json();
        setProtocols(data);
      }

      setShowNewProtocol(false);
      setSelectedTemplateId("");
      setProtocolBatch("");
      setProtocolLaboratory("");
      setProtocolNotes("");
    } catch (err: any) {
      setProtocolError(err.message);
    } finally {
      setProtocolLoading(false);
    }
  }

  // Dose application toggle
  async function handleToggleDose(protocolId: string, doseId: string, currentlyApplied: boolean) {
    setDoseActionLoading(doseId);
    try {
      const appliedAt = currentlyApplied ? null : new Date().toISOString();
      const res = await fetch(`/api/protocols/${protocolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_dose",
          doseId,
          appliedAt,
        }),
      });

      if (res.ok) {
        // Reload protocols
        const pRes = await fetch(`/api/protocols?petId=${pet.id}`);
        if (pRes.ok) {
          const data = await pRes.json();
          setProtocols(data);
        }
      }
    } catch (err) {
      alert("Erro ao atualizar dose");
    } finally {
      setDoseActionLoading(null);
    }
  }

  const tabs = [
    { id: "ficha", label: "Ficha Geral", icon: FileText },
    { id: "historico", label: "Historico", icon: History },
    { id: "prontuario", label: "Prontuario", icon: Stethoscope },
    { id: "protocolos", label: "Vacinas & Protocolos", icon: Syringe },
    { id: "exames", label: "Exames & Anexos", icon: FlaskConical },
    { id: "internacoes", label: "Internacoes", icon: BedDouble },
  ];

  // Historico unificado: agrega tudo que aconteceu com o animal (agendamentos,
  // banho & tosa, consultas, vacinas, exames, internacoes e registros de peso).
  const timeline = useMemo(() => {
    const events: {
      key: string;
      date: Date;
      icon: any;
      color: string;
      title: string;
      badge?: string;
      details?: string;
      href?: string;
    }[] = [];

    const apptTypeLabel: Record<string, string> = {
      CONSULTA: "Consulta",
      RETORNO: "Retorno",
      BANHO_TOSA: "Banho & Tosa",
      EXAME: "Exame",
      PROCEDIMENTO: "Procedimento",
    };

    for (const a of pet.appointments ?? []) {
      const isGrooming = a.type === "BANHO_TOSA";
      const services = (a.services ?? []).map((s: any) => s.service?.name).filter(Boolean);
      events.push({
        key: `appt-${a.id}`,
        date: new Date(a.scheduledAt),
        icon: isGrooming ? Scissors : Calendar,
        color: isGrooming ? "bg-teal-500" : "bg-blue-500",
        title: `Agendamento — ${apptTypeLabel[a.type] ?? a.type}`,
        badge: a.status?.replace(/_/g, " ").toLowerCase(),
        details: [
          services.length ? `Servicos: ${services.join(", ")}` : "",
          a.vet?.name ? `Profissional: ${a.vet.name}` : "",
          a.notes ? `Obs: ${a.notes}` : "",
        ].filter(Boolean).join(" • "),
        href: `/atendimento/${a.id}`,
      });
    }

    for (const m of pet.medicalRecords ?? []) {
      events.push({
        key: `mr-${m.id}`,
        date: new Date(m.createdAt),
        icon: Stethoscope,
        color: "bg-brand-500",
        title: "Prontuario clinico registrado",
        details: [
          m.weightKg ? `Peso: ${m.weightKg} kg` : "",
          m.complaint ? `Queixa: ${m.complaint}` : "",
          m.diagnosis ? `Diagnostico: ${m.diagnosis}` : "",
          m.conduct ? `Conduta: ${m.conduct}` : "",
          m.vet?.name ? `Vet: ${m.vet.name}` : "",
        ].filter(Boolean).join(" • "),
        href: m.appointmentId ? `/atendimento/${m.appointmentId}` : undefined,
      });
    }

    for (const v of pet.vaccines ?? []) {
      events.push({
        key: `vac-${v.id}`,
        date: new Date(v.appliedAt),
        icon: Syringe,
        color: "bg-amber-500",
        title: `Vacina aplicada: ${v.name}`,
        details: [v.batch ? `Lote: ${v.batch}` : "", v.nextDose ? `Proxima dose: ${fmtDate(v.nextDose)}` : ""].filter(Boolean).join(" • "),
      });
    }

    for (const e of pet.exams ?? []) {
      events.push({
        key: `exam-${e.id}`,
        date: new Date(e.requestedAt),
        icon: FlaskConical,
        color: "bg-rose-500",
        title: `Exame: ${e.name}`,
        badge: e.status?.toLowerCase().replace(/_/g, " "),
        details: e.result ? `Resultado: ${e.result}` : "",
        href: "/exames",
      });
    }

    for (const h of pet.hospitalizations ?? []) {
      events.push({
        key: `hosp-${h.id}`,
        date: new Date(h.admittedAt),
        icon: BedDouble,
        color: "bg-emerald-600",
        title: "Internacao",
        badge: h.status?.toLowerCase(),
        details: [h.reason ? `Motivo: ${h.reason}` : "", h.vet?.name ? `Vet: ${h.vet.name}` : ""].filter(Boolean).join(" • "),
        href: `/internacao/${h.id}`,
      });
    }

    for (const w of pet.weightRecords ?? []) {
      events.push({
        key: `weight-${w.id}`,
        date: new Date(w.createdAt),
        icon: Weight,
        color: "bg-yellow-600",
        title: `Peso registrado: ${w.weightKg} kg`,
        details: w.source === "ATENDIMENTO" ? "Registrado durante atendimento" : "Registro manual",
      });
    }

    // Alteracoes na ficha do animal (cadastro/edicoes registradas no audit log)
    const auditActionLabel: Record<string, string> = {
      UPDATE: "Ficha do animal atualizada",
      CREATE: "Animal cadastrado",
      DELETE_LOGIC: "Animal desativado",
      DELETE: "Registro removido",
    };
    for (const l of auditLogs ?? []) {
      const isOldLog = l.details === pet.name;
      const detailsParts = [];
      if (l.user?.name) {
        detailsParts.push(`Por: ${l.user.name}`);
      }
      if (l.details && !isOldLog) {
        detailsParts.push(l.details);
      }
      events.push({
        key: `audit-${l.id}`,
        date: new Date(l.createdAt),
        icon: FileText,
        color: "bg-slate-400",
        title: auditActionLabel[l.action] ?? "Alteracao na ficha",
        details: detailsParts.join(" • ") || undefined,
      });
    }

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [pet, auditLogs]);

  return (
    <>
      {/* Profile Header */}
      <div className="card bg-white p-5 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-4 mb-5 shadow-soft">
        <div className="flex items-center gap-4">
          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold ${pet.deceased ? "bg-red-500" : "bg-brand-600"}`}>
            {pet.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">{pet.name}</h1>
              {pet.deceased ? (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                  <HeartCrack className="h-3 w-3" /> Obito
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Ativo
                </span>
              )}
            </div>
            <div className="text-sm text-slate-500 mt-1">
              {pet.species} {pet.breed ? ` - ${pet.breed}` : ""} • Sexo: {pet.sex || "-"} • Idade: {ageFromBirth(pet.birthDate)} {pet.microchip ? ` • Microchip: ${pet.microchip}` : ""}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Tutor: <span className="text-brand-600 font-medium">{pet.tutor.name}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {!pet.deceased && (
            <button
              onClick={handleRegisterObito}
              disabled={obitoLoading}
              className="btn-outline border-red-300 text-red-600 hover:bg-red-50 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors"
            >
              <HeartCrack className="h-4 w-4" />
              {obitoLoading ? "Registrando..." : "Registrar Obito"}
            </button>
          )}
        </div>
      </div>

      {pet.medicalAlert && (
        <div className="card bg-red-50 border-red-200 px-4 py-3 mb-4 text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          <div>
            <b>Alerta medico:</b> {pet.medicalAlert}
          </div>
        </div>
      )}

      {/* Acoes rapidas - cards coloridos */}
      <div className="space-y-3 mb-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Adicionar</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[
            { label: "Atendimento", icon: Cross,         color: "bg-blue-500",    hover: "hover:bg-blue-600",    actionKey: "atendimento" },
            { label: "Peso",        icon: Weight,        color: "bg-yellow-600",  hover: "hover:bg-yellow-700",  actionKey: "peso" },
            { label: "Patologia",   icon: Activity,      color: "bg-purple-700",  hover: "hover:bg-purple-800",  actionKey: "prontuario" },
            { label: "Documento",   icon: FileCheck,     color: "bg-green-500",   hover: "hover:bg-green-600",   actionKey: "upload" },
            { label: "Exame",       icon: FlaskConical,  color: "bg-rose-400",    hover: "hover:bg-rose-500",    actionKey: "upload" },
            { label: "Fotos",       icon: Camera,        color: "bg-teal-600",    hover: "hover:bg-teal-700",    actionKey: "upload" },
            { label: "Vacina",      icon: Droplets,      color: "bg-amber-500",   hover: "hover:bg-amber-600",   actionKey: "vacina" },
            { label: "Receita",     icon: FileSignature, color: "bg-purple-500",  hover: "hover:bg-purple-600",  actionKey: "prontuario" },
            { label: "Observacoes", icon: MessageCircle, color: "bg-gray-500",    hover: "hover:bg-gray-600",    actionKey: "cadastro" },
            { label: "Internacao",  icon: Hospital,      color: "bg-emerald-600", hover: "hover:bg-emerald-700", actionKey: "internacao" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  switch (item.actionKey) {
                    case "atendimento":
                      router.push(`/agenda/novo?date=${new Date().toISOString().slice(0, 10)}&petId=${pet.id}&tutorId=${pet.tutorId}`);
                      break;
                    case "peso":
                      setShowWeightModal(true);
                      break;
                    case "prontuario":
                      setActiveTab("prontuario");
                      break;
                    case "upload":
                      setActiveTab("exames");
                      setPendingAction("open-upload");
                      break;
                    case "vacina":
                      setShowVaccineModal(true);
                      break;
                    case "cadastro":
                      setActiveTab("ficha");
                      break;
                    case "internacao":
                      router.push(`/internacao/nova?petId=${pet.id}`);
                      break;
                  }
                }}
                className={cn(
                  item.color,
                  item.hover,
                  "text-white rounded-xl px-4 py-5 flex flex-col items-center justify-center gap-2.5",
                  "shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5",
                  "focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-slate-50",
                  "active:scale-95"
                )}
              >
                <Icon className="h-7 w-7 drop-shadow" />
                <span className="text-sm font-semibold tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal de Registro de Peso */}
      {showWeightModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowWeightModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Weight className="h-5 w-5 text-yellow-600" /> Registrar Peso
            </h3>
            <p className="text-xs text-slate-500">Registre o peso atual de <strong>{pet.name}</strong>.</p>
            <div>
              <label className="label">Peso (kg)</label>
              <input
                className="input text-lg font-semibold"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 8.5"
                value={weightValue}
                onChange={(e) => setWeightValue(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveWeight} disabled={savingWeight || !weightValue.trim()} className="btn-primary flex-1">
                {savingWeight ? "Salvando..." : "Salvar Peso"}
              </button>
              <button onClick={() => setShowWeightModal(false)} className="btn-outline">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Input file invisivel usado pelos cards Documento/Exame/Fotos */}
      <input ref={fileInputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFileUpload} />

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 mb-6 gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                active
                  ? "border-b-2 border-brand-600 text-brand-600 bg-brand-50/50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab contents */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {activeTab === "ficha" && (
            <PetForm initial={{ ...pet, birthDate: pet.birthDate ?? null }} tutors={tutors} />
          )}

          {activeTab === "historico" && (
            <div className="card card-pad bg-white">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <History className="h-4 w-4 text-brand-500" /> Historico Completo do Animal
                </h2>
                <span className="text-[10px] text-slate-400 font-medium">{timeline.length} registro(s)</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Tudo que aconteceu com {pet.name}: agendamentos, banho &amp; tosa, consultas, vacinas, exames, internacoes e pesos — em ordem cronologica.
              </p>
              {timeline.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">Nenhum registro no historico ainda.</p>
              ) : (
                <div className="relative border-l-2 border-slate-200 pl-4 ml-2 space-y-4">
                  {timeline.map((ev) => {
                    const Icon = ev.icon;
                    const clickable = !!ev.href;
                    return (
                      <div key={ev.key} className="relative">
                        <div className={cn("absolute -left-[26px] top-1 h-5 w-5 rounded-full flex items-center justify-center border-2 border-white shadow-soft text-white", ev.color)}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <div
                          onClick={clickable ? () => router.push(ev.href!) : undefined}
                          className={cn(
                            "bg-slate-50 border border-slate-200 rounded-xl p-3 transition-colors",
                            clickable && "cursor-pointer hover:bg-brand-50/40 hover:border-brand-200"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                              {ev.title}
                              {clickable && <Eye className="h-3 w-3 text-brand-500" />}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              {ev.badge && (
                                <span className="badge-gray text-[9px] uppercase font-bold">{ev.badge}</span>
                              )}
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {fmtDateTime(ev.date)}
                              </span>
                            </div>
                          </div>
                          {ev.details && <p className="text-xs text-slate-600 mt-1">{ev.details}</p>}
                          {clickable && <p className="text-[10px] text-brand-600 font-medium mt-1.5">Clique para ver detalhes →</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "prontuario" && (
            <div className="space-y-4">
              <div className="card card-pad bg-white">
                <h2 className="font-semibold mb-4 text-slate-800 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-brand-500" /> Prontuario Clinico Completo
                </h2>
                {pet.medicalRecords.length === 0 ? (
                  <p className="text-sm text-slate-500 py-6 text-center">Sem fichas clinicas registradas.</p>
                ) : (
                  <div className="relative border-l-2 border-slate-200 pl-4 ml-2 space-y-6">
                    {pet.medicalRecords.map((m: any) => (
                      <div key={m.id} className="relative">
                        <div className="absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full bg-brand-500 border-2 border-white shadow-soft" />
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                          <div className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-200 pb-1.5 mb-2">
                            <span className="font-semibold flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {fmtDateTime(m.createdAt)}
                            </span>
                            <span className="flex items-center gap-1 font-medium text-brand-600">
                              <User className="h-3 w-3" /> Vet: {m.signerName || m.vet?.name || "Veterinário"}{m.signerCrmv ? ` (${m.signerCrmv})` : ""}
                            </span>
                          </div>
                          {m.complaint && (
                            <div className="text-sm text-slate-700">
                              <b className="text-slate-800">Queixa principal:</b> {m.complaint}
                            </div>
                          )}
                          {m.anamnesis && (
                            <div className="text-sm text-slate-700">
                              <b className="text-slate-800">Anamnese:</b> {m.anamnesis}
                            </div>
                          )}
                          {m.physicalExam && (
                            <div className="text-sm text-slate-700">
                              <b className="text-slate-800">Exame Fisico:</b> {m.physicalExam}
                            </div>
                          )}
                          {m.diagnosis && (
                            <div className="text-sm text-slate-700 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                              <b className="text-emerald-900">Diagnostico:</b> {m.diagnosis}
                            </div>
                          )}
                          {m.conduct && (
                            <div className="text-sm text-slate-700">
                              <b className="text-slate-800">Conduta:</b> {m.conduct}
                            </div>
                          )}
                          {(m.prescriptionText || (m.prescriptions && m.prescriptions.length > 0)) && (
                            <div className="bg-brand-50/50 p-3 rounded-lg border border-brand-100 mt-2">
                              <b className="text-xs text-brand-800 block mb-1">Receita Médica:</b>
                              {m.prescriptionText ? (
                                <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">{m.prescriptionText}</p>
                              ) : (
                                <ul className="text-xs space-y-1 text-slate-700 list-disc list-inside">
                                  {m.prescriptions.map((r: any) => (
                                    <li key={r.id}>
                                      <strong className="text-slate-800">{r.medication}</strong> • {r.dosage} • {r.frequency} ({r.duration})
                                      {r.guidelines && <span className="text-slate-500 block pl-4">Obs: {r.guidelines}</span>}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "protocolos" && (
            <div className="space-y-4">
              {/* Active Protocols list */}
              <div className="card card-pad bg-white">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2 flex-wrap gap-2">
                  <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Syringe className="h-4 w-4 text-brand-600" /> Protocolos Ativos e Previstos
                  </h2>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowVaccineModal(true)}
                      className="btn-outline text-xs flex items-center gap-1 border-amber-300 bg-amber-50/50 text-amber-800 hover:bg-amber-100"
                    >
                      <Plus className="h-3.5 w-3.5" /> Registrar Vacina Avulsa
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewProtocol(true)}
                      className="btn-primary text-xs flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Iniciar Protocolo
                    </button>
                  </div>
                </div>

                {showNewProtocol && (
                  <form onSubmit={handleStartProtocol} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 mb-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <h4 className="font-medium text-sm text-slate-700">Iniciar Novo Protocolo</h4>
                      <button type="button" onClick={() => setShowNewProtocol(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label text-xs">Modelo de Protocolo *</label>
                        <select className="input text-xs" required value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
                          <option value="">Selecione um modelo...</option>
                          {protocolTemplates.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.type})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label text-xs">Data de Inicio *</label>
                        <input className="input text-xs" type="date" required value={protocolStartDate} onChange={(e) => setProtocolStartDate(e.target.value)} />
                      </div>

                      <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 sm:col-span-2 grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="label text-xs font-semibold text-amber-900">Lote da Vacina (Rastreio)</label>
                          <input className="input text-xs bg-white" placeholder="Ex: LT-2024-998" value={protocolBatch} onChange={(e) => setProtocolBatch(e.target.value)} />
                        </div>
                        <div>
                          <label className="label text-xs font-semibold text-amber-900">Laboratorio Fabricante</label>
                          <input className="input text-xs bg-white" placeholder="Ex: Zoetis, MSD, Boehringer" value={protocolLaboratory} onChange={(e) => setProtocolLaboratory(e.target.value)} />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="label text-xs">Observacoes Adicionais</label>
                        <textarea className="input text-xs" rows={2} value={protocolNotes} onChange={(e) => setProtocolNotes(e.target.value)} />
                      </div>
                    </div>

                    {protocolError && <div className="text-red-600 text-xs mt-1">{protocolError}</div>}

                    <div className="flex gap-2 justify-end">
                      <button className="btn-primary text-xs" disabled={protocolLoading}>
                        {protocolLoading ? "Iniciando..." : "Confirmar e Iniciar"}
                      </button>
                      <button type="button" className="btn-outline text-xs" onClick={() => setShowNewProtocol(false)}>
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}

                {protocols.length === 0 ? (
                  <p className="text-sm text-slate-500 py-6 text-center">Nenhum protocolo ativo para este pet.</p>
                ) : (
                  <div className="space-y-4">
                    {protocols.map((pr) => (
                      <div key={pr.id} className="border border-slate-200 rounded-xl p-4 bg-slate-55">
                        <div className="flex justify-between items-start border-b border-slate-200 pb-2 mb-3">
                          <div>
                            <span className="bg-brand-100 text-brand-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mb-1 inline-block">
                              {pr.type}
                            </span>
                            <h3 className="font-semibold text-slate-800 text-sm">{pr.name}</h3>
                            <div className="text-[10px] text-slate-500">Inicio: {fmtDate(pr.startDate)}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pr.status === "CONCLUIDO" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {pr.status}
                          </span>
                        </div>

                        {pr.notes && <p className="text-xs text-slate-500 mb-3 bg-white p-2 rounded border border-slate-100">Obs: {pr.notes}</p>}

                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-slate-700">Doses / Aplicacoes:</h4>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {pr.doses.map((dose: any) => {
                              const isApplied = dose.status === "APLICADO";
                              const isLate = !isApplied && new Date(dose.dueDate) < new Date();
                              return (
                                <div key={dose.id} className={`flex items-center justify-between border rounded-lg p-2 text-xs bg-white ${
                                  isApplied ? "border-emerald-200 bg-emerald-50/20" : isLate ? "border-red-200 bg-red-50/20" : "border-slate-200"
                                }`}>
                                  <div>
                                    <div className="font-semibold text-slate-800">{dose.notes || "Dose"}</div>
                                    <div className="text-[10px] text-slate-500">Previsao: {fmtDate(dose.dueDate)}</div>
                                    {isApplied && dose.appliedAt && (
                                      <div className="text-[9px] text-emerald-700 font-semibold">
                                        Aplicado em: {fmtDate(dose.appliedAt)}
                                        {(dose.batch || dose.laboratory) && (
                                          <span className="block text-slate-600 font-normal mt-0.5">
                                            {dose.batch ? `Lote: ${dose.batch}` : ""} {dose.laboratory ? ` • Lab: ${dose.laboratory}` : ""}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {isLate && (
                                      <div className="text-[9px] text-red-600 font-semibold flex items-center gap-0.5">
                                        <AlertTriangle className="h-2.5 w-2.5" /> Atrasada!
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (isApplied) {
                                        handleToggleDose(pr.id, dose.id, true);
                                      } else {
                                        setDoseBatch("");
                                        setDoseLaboratory("");
                                        setApplyingDoseModal({ protocolId: pr.id, doseId: dose.id, doseName: dose.notes || "Dose" });
                                      }
                                    }}
                                    disabled={doseActionLoading === dose.id}
                                    className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
                                      isApplied
                                        ? "bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200"
                                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                    }`}
                                  >
                                    {isApplied ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                                    <span>{isApplied ? "Aplicada" : "Aplicar"}</span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "exames" && (
            <div className="space-y-4">
              {/* Exames List */}
              <div className="card card-pad bg-white">
                <h2 className="font-semibold mb-4 text-slate-800 flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-brand-500" /> Solicitacoes de Exames
                </h2>
                <div className="overflow-x-auto">
                  <table className="bp-table text-xs">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Exame</th>
                        <th>Status</th>
                        <th>Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pet.exams.map((e: any) => (
                        <tr key={e.id}>
                          <td>{fmtDate(e.requestedAt)}</td>
                          <td className="font-medium">{e.name}</td>
                          <td>
                            <span className="badge-gray">{e.status.toLowerCase().replace(/_/g, " ")}</span>
                          </td>
                          <td>
                            {e.result ? (
                              <span className="text-slate-600 truncate max-w-xs inline-block" title={e.result}>
                                {e.result.slice(0, 50)}
                                {e.result.length > 50 ? "..." : ""}
                              </span>
                            ) : (
                              <span className="text-slate-400">Pendente</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {pet.exams.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-4 text-slate-500">
                            Nenhum exame solicitado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="card card-pad bg-white">
                <h2 className="font-semibold mb-3 text-slate-800 flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-brand-600" /> Documentos e Anexos
                </h2>
                <p className="text-xs text-slate-500 mb-4">
                  Anexe radiografias, laudos de exames externos, termos de internacao assinados, receitas ou fotos clinicas.
                </p>

                {/* Upload form */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                  <h4 className="font-semibold text-xs text-slate-700 mb-2">Anexar Novo Arquivo</h4>
                  <div className="grid sm:grid-cols-2 gap-3 items-end">
                    <div>
                      <label className="label text-[10px]">Apelido do Arquivo (opcional)</label>
                      <input className="input text-xs" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="Ex: Termo Internação" />
                    </div>
                    <div>
                      <label className="label text-[10px]">Selecionar Arquivo</label>
                      <input type="file" accept="application/pdf,image/*" onChange={handleFileUpload} disabled={uploading} className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 file:cursor-pointer hover:file:bg-brand-100" />
                      <p className="text-[10px] text-slate-400 mt-1">PDF ou imagem ate 50MB.</p>
                    </div>
                  </div>
                  {uploading && <p className="text-xs text-brand-600 font-semibold mt-2 animate-pulse">Enviando arquivo... aguarde, anexos grandes podem demorar.</p>}
                  {uploadError && <p className="text-xs text-red-600 font-semibold mt-2">{uploadError}</p>}
                </div>

                {/* Attachments grid */}
                <div className="grid sm:grid-cols-2 gap-2">
                  {attachments.map((att) => (
                    <div key={att.id} className="border border-slate-200 rounded-xl p-3 bg-white flex items-center justify-between text-xs hover:border-brand-200 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 truncate max-w-[150px]" title={att.name}>
                            {att.name}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {(att.sizeBytes / 1024).toFixed(1)} KB • {fmtDate(att.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <a
                          href={`/api/pets/${pet.id}/attachments/${att.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-500 hover:text-brand-600 bg-slate-50 hover:bg-brand-50 rounded-lg border border-slate-200 transition-colors"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {attachments.length === 0 && <p className="text-xs text-slate-500 py-3 col-span-2 text-center bg-slate-50 rounded-lg">Nenhum anexo cadastrado.</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === "internacoes" && (
            <div className="card card-pad bg-white">
              <h2 className="font-semibold mb-4 text-slate-800 flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-brand-500" /> Historico de Internacao
              </h2>
              {pet.hospitalizations.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">Nunca internado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="bp-table text-xs">
                    <thead>
                      <tr>
                        <th>Admitido em</th>
                        <th>Motivo</th>
                        <th>Status</th>
                        <th>Veterinario</th>
                        <th>Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pet.hospitalizations.map((h: any) => (
                        <tr key={h.id}>
                          <td>{fmtDateTime(h.admittedAt)}</td>
                          <td className="font-medium">{h.reason}</td>
                          <td>
                            <span className={`badge-gray ${h.status === "ATIVA" ? "bg-orange-100 text-orange-800 font-bold" : ""}`}>
                              {h.status.toLowerCase()}
                            </span>
                          </td>
                          <td>{h.vet.name}</td>
                          <td className="max-w-xs truncate">{h.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Info Summary */}
        <div className="space-y-5">
          <div className="card card-pad bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2 text-slate-800">
                <Syringe className="h-4 w-4 text-amber-500" /> Vacinas Aplicadas
              </h3>
              <button
                type="button"
                onClick={() => setShowVaccineModal(true)}
                className="btn-outline text-[10px] py-0.5 px-2 flex items-center gap-1 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
              >
                <Plus className="h-3 w-3" /> Aplicar
              </button>
            </div>
            {vaccines.length === 0 ? (
              <p className="text-xs text-slate-500">Sem vacinas registradas.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {vaccines.map((v: any) => (
                  <li key={v.id} className="flex flex-col border-b border-slate-100 pb-2 last:border-0">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-slate-800">{v.name}</span>
                      <button onClick={() => handleDeleteVaccine(v.id)} className="text-slate-400 hover:text-red-600 text-[10px] p-0.5" title="Excluir vacina">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 flex justify-between mt-0.5">
                      <span>Aplicada: {fmtDate(v.appliedAt)}</span>
                      {v.nextDose && <span className="font-medium text-brand-600">Proxima: {fmtDate(v.nextDose)}</span>}
                    </span>
                    {(v.batch || v.laboratory) && (
                      <div className="text-[10px] text-slate-600 flex flex-wrap gap-x-3 mt-1 bg-amber-50/50 p-1.5 rounded border border-amber-100">
                        {v.batch && <span><strong>Lote:</strong> {v.batch}</span>}
                        {v.laboratory && <span><strong>Laboratorio:</strong> {v.laboratory}</span>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card card-pad bg-white">
            <h3 className="font-semibold mb-3">Atendimentos Agendados</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {pet.appointments.slice(0, 10).map((a: any) => (
                <div key={a.id} className="border border-slate-100 rounded-lg p-2 text-xs hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-center font-medium">
                    <span>{fmtDate(a.scheduledAt)} - {new Date(a.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] text-white font-bold uppercase shrink-0"
                      style={{ backgroundColor: statuses.find((s) => s.name === a.status)?.color ?? "#94a3b8" }}
                    >
                      {a.status.replace(/_/g, " ").toLowerCase()}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Tipo: {a.type} • Vet: {a.vet?.name ?? "-"}
                  </div>
                </div>
              ))}
              {pet.appointments.length === 0 && <p className="text-xs text-slate-500">Sem registros.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Aplicacao de Vacina (Lote & Laboratorio) */}
      {showVaccineModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowVaccineModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Syringe className="h-5 w-5 text-amber-500" /> Registrar Aplicacao de Vacina
              </h3>
              <button type="button" onClick={() => setShowVaccineModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveVaccine} className="space-y-3">
              <div>
                <label className="label text-xs">Nome da Vacina *</label>
                <input
                  className="input text-sm"
                  required
                  placeholder="Ex: V10, Antirrabica, Giardia, V8"
                  value={vacName}
                  onChange={(e) => setVacName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Data da Aplicacao *</label>
                  <input
                    className="input text-xs"
                    type="date"
                    required
                    value={vacAppliedAt}
                    onChange={(e) => setVacAppliedAt(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label text-xs">Proxima Dose (Revacinacao)</label>
                  <input
                    className="input text-xs"
                    type="date"
                    value={vacNextDose}
                    onChange={(e) => setVacNextDose(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
                <div>
                  <label className="label text-xs text-amber-900 font-semibold">Lote (Rastreio)</label>
                  <input
                    className="input text-xs bg-white"
                    placeholder="Ex: LT-2024-998"
                    value={vacBatch}
                    onChange={(e) => setVacBatch(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label text-xs text-amber-900 font-semibold">Laboratorio</label>
                  <input
                    className="input text-xs bg-white"
                    placeholder="Ex: Zoetis, MSD, Boehringer"
                    value={vacLaboratory}
                    onChange={(e) => setVacLaboratory(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label text-xs">Observacoes</label>
                <textarea
                  className="input text-xs"
                  rows={2}
                  placeholder="Observacoes clinicas, via de aplicacao, reacoes..."
                  value={vacNotes}
                  onChange={(e) => setVacNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={savingVaccine || !vacName.trim()} className="btn-primary flex-1">
                  {savingVaccine ? "Salvando..." : "Salvar Vacina"}
                </button>
                <button type="button" onClick={() => setShowVaccineModal(false)} className="btn-outline">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmacao de Aplicacao de Dose com Lote & Laboratorio */}
      {applyingDoseModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setApplyingDoseModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-600" /> Confirmar Aplicacao: {applyingDoseModal.doseName}
              </h3>
              <button type="button" onClick={() => setApplyingDoseModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Informe o lote e o laboratorio para garantir a rastreabilidade da aplicacao desta dose.
              </p>
              <div className="grid grid-cols-2 gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/60">
                <div>
                  <label className="label text-xs text-emerald-900 font-semibold">Lote</label>
                  <input
                    className="input text-xs bg-white"
                    placeholder="Ex: LT-8847"
                    value={doseBatch}
                    onChange={(e) => setDoseBatch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label text-xs text-emerald-900 font-semibold">Laboratorio</label>
                  <input
                    className="input text-xs bg-white"
                    placeholder="Ex: Zoetis, MSD..."
                    value={doseLaboratory}
                    onChange={(e) => setDoseLaboratory(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmApplyDose}
                  disabled={doseActionLoading === applyingDoseModal.doseId}
                  className="btn-primary flex-1"
                >
                  {doseActionLoading === applyingDoseModal.doseId ? "Aplicando..." : "Confirmar Aplicacao"}
                </button>
                <button type="button" onClick={() => setApplyingDoseModal(null)} className="btn-outline">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
