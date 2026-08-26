import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireModule } from "@/lib/tenant";
import { PageHeader } from "@/components/layout/PageHeader";
import { fmtDateTime } from "@/lib/utils";
import { MedicalRecordForm } from "./MedicalRecordForm";
import { PipelineSelect } from "./PipelineSelect";
import { AtendimentoActions } from "./AtendimentoActions";

export const dynamic = "force-dynamic";

export default async function AtendimentoDetailPage({ params }: { params: { id: string } }) {
  const { tenantId, session } = await requireModule("atendimento");

  const a = await prisma.appointment.findFirst({
    where: { id: params.id, unit: { tenantId } },
    include: {
      tutor: true,
      pet: {
        include: {
          protocols: { where: { status: "ATIVO" }, include: { doses: { orderBy: { dueDate: "asc" } } } },
          medicalRecords: { orderBy: { createdAt: "desc" }, include: { vet: true, prescriptions: true } },
          vaccines: { orderBy: { appliedAt: "desc" } },
          exams: { orderBy: { requestedAt: "desc" } },
          hospitalizations: { orderBy: { admittedAt: "desc" }, include: { vet: true } }
        }
      },
      vet: true,
      services: { include: { service: true } },
      medicalRecord: { include: { prescriptions: true, vet: true } },
      collaborators: { include: { collaborator: true } },
    },
  });

  if (!a) return notFound();

  // Cabecalho da receita: dados da clinica do assinante + quem assina
  const [clinic, signer] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        companyName: true, tradeName: true, cnpj: true, phone: true,
        address: true, city: true, state: true, zipCode: true, logoUrl: true,
      },
    }),
    prisma.user.findUnique({ where: { id: session.id }, select: { name: true, crmv: true } }),
  ]);

  const vetAssinante = a.medicalRecord?.vet ?? a.vet ?? signer ?? { name: session.name, crmv: null };

  // Busca os status de agendamento do tenant
  let statuses = await prisma.appointmentStatus.findMany({
    where: { tenantId },
    orderBy: { position: "asc" },
  });

  if (statuses.length === 0) {
    const defaults = [
      { tenantId, name: "AGENDADO", color: "#3b82f6", position: 0 },
      { tenantId, name: "CONFIRMADO", color: "#10b981", position: 1 },
      { tenantId, name: "EM_ATENDIMENTO", color: "#f59e0b", position: 2 },
      { tenantId, name: "FINALIZADO", color: "#22c55e", position: 3 },
      { tenantId, name: "CANCELADO", color: "#ef4444", position: 4 },
      { tenantId, name: "NAO_COMPARECEU", color: "#64748b", position: 5 },
    ];
    await prisma.appointmentStatus.createMany({ data: defaults });
    statuses = await prisma.appointmentStatus.findMany({
      where: { tenantId },
      orderBy: { position: "asc" },
    });
  }

  return (
    <>
      <PageHeader
        title={`Atendimento - ${a.pet?.name ?? "Sem pet"}`}
        description={`${fmtDateTime(a.scheduledAt)} - Tutor: ${a.tutor.name}`}
      />

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card card-pad bg-white">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
              <h2 className="font-semibold text-slate-800">Resumo do Agendamento</h2>
              <PipelineSelect id={a.id} currentStatus={a.status} statuses={statuses} />
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 font-medium block mb-0.5">Pet / Especie</span>
                <strong className="text-slate-800 text-sm">{a.pet?.name ?? "-"}</strong> 
                <span className="text-slate-500 ml-1">({a.pet?.species})</span>
              </div>
              
              <div>
                <span className="text-slate-500 font-medium block mb-0.5">Tutor</span>
                <strong className="text-slate-800 text-sm">{a.tutor.name}</strong>
              </div>
              
              <div>
                <span className="text-slate-500 font-medium block mb-0.5">Tipo</span>
                <span className="text-slate-700 font-medium">{a.type}</span>
              </div>
              
              <div>
                <span className="text-slate-500 font-medium block mb-0.5">Profissionais Responsaveis</span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {a.collaborators.map((c) => (
                    <span key={c.id} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-200">
                      {c.collaborator.name}
                    </span>
                  ))}
                  {a.collaborators.length === 0 && <span className="text-slate-400">-</span>}
                </div>
              </div>
              
              <div className="sm:col-span-2">
                <span className="text-slate-500 font-medium block mb-0.5">Servicos Contratados</span>
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {a.services.map((s) => (
                    <span key={s.id} className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded text-[10px] font-medium border border-brand-100">
                      {s.service.name}
                    </span>
                  ))}
                  {a.services.length === 0 && <span className="text-slate-400">-</span>}
                </div>
              </div>
              
              {a.notes && (
                <div className="sm:col-span-2 bg-slate-50 p-2 rounded-lg border border-slate-150">
                  <span className="text-slate-500 font-medium block mb-0.5">Observacoes</span>
                  <p className="text-slate-700 leading-relaxed">{a.notes}</p>
                </div>
              )}
              
              {a.pet?.medicalAlert && (
                <div className="sm:col-span-2 text-red-700 bg-red-50/50 p-2 rounded-lg border border-red-150 font-semibold">
                  Alerta medico: {a.pet.medicalAlert}
                </div>
              )}
            </div>
          </div>

          <MedicalRecordForm
                appointmentId={a.id}
                initial={a.medicalRecord ?? null}
                clinic={{
                  name: clinic?.tradeName || clinic?.companyName || "Clinica",
                  address: clinic?.address ?? null,
                  city: clinic?.city ?? null,
                  state: clinic?.state ?? null,
                  zipCode: clinic?.zipCode ?? null,
                  phone: clinic?.phone ?? null,
                  cnpj: clinic?.cnpj ?? null,
                  logoUrl: clinic?.logoUrl ?? null,
                }}
                pet={a.pet ? {
                  name: a.pet.name,
                  species: a.pet.species,
                  breed: a.pet.breed,
                  sex: a.pet.sex,
                  color: a.pet.color,
                  microchip: a.pet.microchip,
                  birthDate: a.pet.birthDate ? a.pet.birthDate.toISOString() : null,
                  weightKg: a.pet.weightKg,
                } : null}
                tutor={{
                  name: a.tutor.name,
                  document: a.tutor.document,
                  address: a.tutor.address,
                  phone: a.tutor.phone,
                }}
                vet={{ name: vetAssinante.name, crmv: (vetAssinante as any).crmv ?? null }}
                printedBy={session.name}
              />
        </div>

        <div className="space-y-5">
          {/* Actions & Protocols Alerts Panel */}
          <AtendimentoActions
            appointmentId={a.id}
            currentScheduledAt={a.scheduledAt.toISOString()}
            pet={a.pet}
          />
          
          <div className="card card-pad text-xs text-slate-500 bg-white border border-slate-200">
            <b>Status atual:</b> {a.status.replace(/_/g, " ").toLowerCase()}<br />
            <b>Ultima atualizacao em:</b> {fmtDateTime(a.updatedAt)}
          </div>
        </div>
      </div>
    </>
  );
}
