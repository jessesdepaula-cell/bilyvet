import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenantApi, isTenantError } from "@/lib/tenant";

export async function POST(req: Request) {
  const ctx = await requireTenantApi();
  if (isTenantError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const b = await req.json();
  const appt = await prisma.appointment.findFirst({ where: { id: b.appointmentId, unit: { tenantId: ctx.tenantId } } });
  if (!appt || !appt.petId) return NextResponse.json({ error: "Atendimento invalido" }, { status: 400 });

  // Peso informado na consulta: normaliza e sincroniza com a ficha do animal
  const weightKg = b.weightKg !== undefined && b.weightKg !== null && `${b.weightKg}`.trim() !== ""
    ? Number(b.weightKg)
    : null;
  const hasValidWeight = weightKg !== null && !Number.isNaN(weightKg) && weightKg > 0;

  async function syncWeight() {
    if (!hasValidWeight) return;
    const current = await prisma.pet.findUnique({ where: { id: appt!.petId! }, select: { weightKg: true } });
    if (current?.weightKg === weightKg) return;
    await prisma.pet.update({ where: { id: appt!.petId! }, data: { weightKg } });
    await prisma.weightRecord.create({
      data: { petId: appt!.petId!, weightKg: weightKg as number, source: "ATENDIMENTO", appointmentId: appt!.id },
    });
  }

  const existing = await prisma.medicalRecord.findUnique({ where: { appointmentId: b.appointmentId } });
  if (existing) {
    const upd = await prisma.medicalRecord.update({
      where: { id: existing.id },
      data: {
        complaint: b.complaint, anamnesis: b.anamnesis, physicalExam: b.physicalExam,
        weightKg: hasValidWeight ? weightKg : existing.weightKg,
        diagnosis: b.diagnosis, conduct: b.conduct, procedures: b.procedures,
        observations: b.observations,
        prescriptionText: b.prescriptionText !== undefined ? (b.prescriptionText || null) : existing.prescriptionText,
        signerName: b.signerName !== undefined ? (b.signerName?.trim() || null) : existing.signerName,
        signerCrmv: b.signerCrmv !== undefined ? (b.signerCrmv?.trim() || null) : existing.signerCrmv,
        recommendReturn: b.recommendReturn ? new Date(b.recommendReturn) : null,
      },
    });
    if (Array.isArray(b.prescriptions)) {
      await prisma.prescription.deleteMany({ where: { medicalRecordId: upd.id } });
      for (const p of b.prescriptions) if (p.medication) await prisma.prescription.create({ data: { medicalRecordId: upd.id, ...p } });
    }
    await syncWeight();
    return NextResponse.json(upd);
  }
  const m = await prisma.medicalRecord.create({
    data: {
      appointmentId: b.appointmentId, petId: appt.petId, vetId: ctx.session.id,
      complaint: b.complaint, anamnesis: b.anamnesis, physicalExam: b.physicalExam,
      weightKg: hasValidWeight ? weightKg : null,
      diagnosis: b.diagnosis, conduct: b.conduct, procedures: b.procedures,
      observations: b.observations,
      prescriptionText: b.prescriptionText || null,
      signerName: b.signerName?.trim() || null,
      signerCrmv: b.signerCrmv?.trim() || null,
      recommendReturn: b.recommendReturn ? new Date(b.recommendReturn) : null,
      prescriptions: { create: (b.prescriptions ?? []).filter((p: any) => p.medication) },
    },
  });
  await syncWeight();
  await prisma.auditLog.create({ data: { tenantId: ctx.tenantId, userId: ctx.session.id, action: "CREATE", entity: "MedicalRecord", entityId: m.id } });
  return NextResponse.json(m);
}
