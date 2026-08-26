import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenantApi, isTenantError } from "@/lib/tenant";
import { ALL_MODULE_SLUGS } from "@/lib/permissions";

const ALLOWED_ROLES = ["ADMIN", "GESTOR", "VETERINARIO", "RECEPCAO", "FINANCEIRO", "ESTOQUE", "BANHO_TOSA", "VENDEDOR"];

function sanitizePermissions(raw: unknown): string[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) return null;
  const valid = raw.filter((x: any): x is string => typeof x === "string" && ALL_MODULE_SLUGS.includes(x));
  return Array.from(new Set(valid));
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireTenantApi();
  if (isTenantError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!["ADMIN", "GESTOR"].includes(ctx.session.role)) {
    return NextResponse.json({ error: "Apenas ADMIN/GESTOR podem editar usuarios" }, { status: 403 });
  }
  const owned = await prisma.user.findFirst({ where: { id: params.id, tenantId: ctx.tenantId } });
  if (!owned) return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });

  const b = await req.json();
  const data: any = {};
  if (b.name !== undefined) data.name = String(b.name).trim();
  if (b.role !== undefined) {
    if (!ALLOWED_ROLES.includes(b.role)) return NextResponse.json({ error: "Perfil invalido" }, { status: 400 });
    data.role = b.role;
  }
  if (b.unitId !== undefined) {
    if (b.unitId) {
      const unit = await prisma.unit.findFirst({ where: { id: b.unitId, tenantId: ctx.tenantId } });
      if (!unit) return NextResponse.json({ error: "Unidade invalida" }, { status: 400 });
    }
    data.unitId = b.unitId || null;
  }
  if (b.isActive !== undefined) data.isActive = !!b.isActive;
  if (b.crmv !== undefined) data.crmv = String(b.crmv ?? "").trim() || null;
  if (b.permissions !== undefined) {
    // null/[] = usar padrao do role; array com slugs = override
    if (b.permissions === null) {
      data.permissions = null;
    } else {
      const sane = sanitizePermissions(b.permissions);
      data.permissions = sane && sane.length > 0 ? JSON.stringify(sane) : null;
    }
  }

  const u = await prisma.user.update({ where: { id: params.id }, data });
  await prisma.auditLog.create({ data: { tenantId: ctx.tenantId, userId: ctx.session.id, action: "UPDATE", entity: "User", entityId: u.id, details: u.email } });
  return NextResponse.json(u);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireTenantApi();
  if (isTenantError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!["ADMIN", "GESTOR"].includes(ctx.session.role)) {
    return NextResponse.json({ error: "Apenas ADMIN/GESTOR podem desativar usuarios" }, { status: 403 });
  }
  const owned = await prisma.user.findFirst({ where: { id: params.id, tenantId: ctx.tenantId } });
  if (!owned) return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
  if (owned.id === ctx.session.id) {
    return NextResponse.json({ error: "Voce nao pode desativar a si mesmo" }, { status: 400 });
  }
  const u = await prisma.user.update({ where: { id: params.id }, data: { isActive: false } });
  await prisma.auditLog.create({ data: { tenantId: ctx.tenantId, userId: ctx.session.id, action: "DEACTIVATE", entity: "User", entityId: u.id, details: u.email } });
  return NextResponse.json({ ok: true });
}
